/*****************************************************************
 * VUEX-STATE-STORAGE-SYNC - Minimal Persist/Synchronize State Plugin for Vuex
 * (c) 2024-present AGUMON (https://github.com/ljlm0402/vuex-state-storage-sync)
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the project root for more information.
 *
 * Made with ❤️ by AGUMON 🦖
 *****************************************************************/

import { Store, MutationPayload } from 'vuex';
import merge from 'deepmerge';
import * as shvl from 'shvl';

/**
 * Storage 인터페이스 정의
 * removeItem은 optional로 두어 다양한 storage 엔진을 지원
 */
interface Storage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem?: (key: string) => void;
}

type ArrayMergeFn = (storeArr: any[], savedArr: any[]) => any[];

interface Options<State> {
  key?: string; // 저장소 key명
  storage?: Storage; // 사용할 스토리지 엔진
  paths?: string[]; // 동기화할 state 경로
  overwrite?: boolean; // 복원시 기존 state 덮어쓰기 여부
  fetchBeforeUse?: boolean; // 플러그인 실행 전 저장소에서 미리 가져올지

  getState?: (key: string, storage: Storage) => any; // state 복원 함수
  setState?: (key: string, state: any, storage: Storage) => void; // state 저장 함수
  removeState?: (key: string, storage: Storage) => void; // state 삭제 함수

  reducer?: (state: State, paths?: string[]) => object; // 동기화 state 필터 함수
  filter?: (mutation: MutationPayload) => boolean; // 어떤 mutation에 반응할지

  merge?: (obj1: object | any[], obj2: object | any[], options: object) => object | any[]; // 병합 함수
  arrayMerge?: ArrayMergeFn; // 배열 병합 함수(공식 네이밍)
  arrayMerger?: ArrayMergeFn; // 배열 병합 함수(alias)

  rehydrated?: (store: Store<State>) => void; // 복원 완료시 콜백
  subscriber?: (store: Store<State>) => (handler: (mutation: any, state: State) => void) => void; // subscribe 커스터마이즈
  assertStorage?: (storage: Storage) => void | Error; // storage 유효성 체크 함수
}

/**
 * storage 유효성 기본 체크 함수
 * 스토리지 엔진이 정상 동작하는지 확인 (setItem/getItem/removeItem)
 */
function defaultAssertStorage(storage: Storage) {
  try {
    storage.setItem && storage.setItem('__test__', '1');
    storage.removeItem && storage.removeItem('__test__');
  } catch (e) {
    console.warn('[vuex-state-storage-sync] Storage is not usable:', e);
    throw new Error('Invalid storage engine');
  }
}

/**
 * 기본 state 복원 함수(getState)
 * - string이면 JSON 파싱
 * - object면 그대로 반환
 * - 예외시 undefined
 */
function defaultGetState<S>(key: string, storage: Storage): Partial<S> | undefined {
  try {
    const value = storage.getItem(key);
    return value ? (JSON.parse(value) as Partial<S>) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * 기본 state 저장 함수(setState)
 * - state를 JSON 문자열로 저장
 */
function defaultSetState<S>(key: string, state: Partial<S>, storage: Storage): void {
  try {
    storage.setItem(key, JSON.stringify(state));
  } catch {}
}

/**
 * 기본 state 삭제 함수(removeState)
 * - removeItem이 있으면 해당 함수 사용
 * - 없으면 setItem(key, undefined)로 대체
 */
function defaultRemoveState(key: string, storage: Storage): void {
  if (storage.removeItem) {
    try {
      storage.removeItem(key);
    } catch (err) {
      console.warn('[vuex-state-storage-sync] Failed to remove state:', err);
    }
  } else {
    storage.setItem(key, undefined as any);
  }
}

/**
 * 기본 reducer 함수
 * - paths가 있으면 해당 경로만 추출
 * - 없으면 전체 state 반환
 */
function defaultReducer<S extends object>(state: S, paths?: string[]): Partial<S> {
  return Array.isArray(paths) ? paths.reduce((substate, path) => shvl.set(substate, path, shvl.get(state, path)), {} as Partial<S>) : state;
}

/**
 * 기본 filter 함수
 * - 모든 mutation에 대해 저장하도록 true 반환
 */
function defaultFilter(_mutation: MutationPayload): boolean {
  return true;
}

/**
 * 기본 subscriber 함수
 * - store.subscribe로 mutation 감지
 */
function defaultSubscriber<State>(store: Store<State>) {
  return function (handler: (mutation: any, state: State) => void) {
    return store.subscribe(handler);
  };
}

/**
 * vuex-state-storage-sync 플러그인 메인 함수
 * @param options 사용자 지정 옵션
 */
export default function <State extends object = any>(options?: Options<State>): (store: Store<State>) => void {
  options = options || {};

  // 스토리지 엔진 지정(localStorage가 기본)
  const storage: Storage = options.storage || (window && window.localStorage);
  // 저장소 키명 기본값
  const key = options.key || 'store';

  // storage 유효성 체크 (문제 발생시 바로 throw)
  (options.assertStorage || defaultAssertStorage)(storage);

  // 병합 함수 (기본: deepmerge)
  const mergeFn = options.merge || merge;

  // 배열 병합 함수(arrayMerge/arrayMerger 둘 다 지원)
  const arrayMergeFn: ArrayMergeFn = options.arrayMerge || options.arrayMerger || ((_storeArr, savedArr) => savedArr);

  // 상태 get/set/remove/reducer/filter/subscriber 콜백 할당
  const getState = options.getState || defaultGetState;
  const setState = options.setState || defaultSetState;
  const removeState = options.removeState || defaultRemoveState;
  const reducer = options.reducer || defaultReducer;
  const filter = options.filter || defaultFilter;
  const subscriber = options.subscriber || defaultSubscriber;
  const rehydrated = options.rehydrated || (() => {});

  // 저장소에서 기존 state 가져오기
  const fetchSavedState = () => getState(key, storage);

  let savedState: Partial<State> | undefined;

  // fetchBeforeUse 옵션이 true면 먼저 state 복원
  if (options.fetchBeforeUse) {
    savedState = fetchSavedState();
  }

  // 실제 플러그인 함수(store에 연결됨)
  return function (store: Store<State>) {
    if (!options.fetchBeforeUse) {
      savedState = fetchSavedState();
    }

    // 저장된 state가 있으면 복원(merge 또는 overwrite)
    if (typeof savedState === 'object' && savedState !== null) {
      store.replaceState(
        options.overwrite
          ? (savedState as State)
          : (mergeFn(store.state as Partial<State> & object, savedState as Partial<State> & object, {
              arrayMerge: arrayMergeFn,
              clone: false,
            }) as State),
      );
      rehydrated(store);
    }

    // mutation 발생시 state 저장(subscribe)
    subscriber(store)((mutation, state) => {
      if (filter(mutation)) {
        setState(key, reducer(state, options.paths), storage);
      }
    });
  };
}
