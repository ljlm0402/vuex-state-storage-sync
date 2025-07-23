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

// --- Storage Interface ---
interface Storage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem?: (key: string) => void;
}

// --- Options Type ---
type ArrayMergeFn = (storeArr: any[], savedArr: any[]) => any[];

interface Options<State> {
  key?: string;
  storage?: Storage;
  paths?: string[];
  overwrite?: boolean;
  fetchBeforeUse?: boolean;

  getState?: (key: string, storage: Storage) => any;
  setState?: (key: string, state: any, storage: Storage) => void;
  removeState?: (key: string, storage: Storage) => void;

  reducer?: (state: State, paths?: string[]) => object;
  filter?: (mutation: MutationPayload) => boolean;

  merge?: (obj1: object | any[], obj2: object | any[], options: object) => object | any[];
  arrayMerge?: ArrayMergeFn;
  arrayMerger?: ArrayMergeFn;

  rehydrated?: (store: Store<State>) => void;
  subscriber?: (store: Store<State>) => (handler: (mutation: any, state: State) => void) => void;
  assertStorage?: (storage: Storage) => void | Error;
}

// --- Default Storage Assertion ---
function defaultAssertStorage(storage: Storage) {
  if (
    !storage ||
    typeof storage.getItem !== 'function' ||
    typeof storage.setItem !== 'function'
  ) {
    throw new Error('[vuex-state-storage-sync] Invalid storage engine: missing getItem/setItem');
  }
  try {
    storage.setItem('__vsss_test__', '1');
    if (typeof storage.removeItem === 'function') {
      storage.removeItem('__vsss_test__');
    } else {
      storage.setItem('__vsss_test__', '');
    }
  } catch (e) {
    console.warn('[vuex-state-storage-sync] Storage is not usable:', e);
    throw new Error('Invalid storage engine');
  }
}

// --- Default State Handlers ---
function defaultGetState<S>(key: string, storage: Storage): Partial<S> | undefined {
  try {
    const value = storage.getItem(key);
    return value ? (JSON.parse(value) as Partial<S>) : undefined;
  } catch {
    return undefined;
  }
}

function defaultSetState<S>(key: string, state: Partial<S>, storage: Storage): void {
  try {
    storage.setItem(key, JSON.stringify(state));
  } catch (e) {
    // storage full, quota exceeded, etc.
    // Optional: emit warning
  }
}

function defaultRemoveState(key: string, storage: Storage): void {
  if (typeof storage.removeItem === 'function') {
    try {
      storage.removeItem(key);
    } catch (err) {
      console.warn('[vuex-state-storage-sync] Failed to remove state:', err);
    }
  } else {
    // Remove by setting to empty string (safer than undefined)
    storage.setItem(key, '');
  }
}

// --- Default Reducer ---
function defaultReducer<S extends object>(state: S, paths?: string[]): Partial<S> {
  return Array.isArray(paths)
    ? paths.reduce(
        (substate, path) => shvl.set(substate, path, shvl.get(state, path)),
        {} as Partial<S>
      )
    : state;
}

// --- Default Filter: All Mutations ---
function defaultFilter(_mutation: MutationPayload): boolean {
  return true;
}

// --- Default Subscriber ---
function defaultSubscriber<State>(store: Store<State>) {
  return function (handler: (mutation: any, state: State) => void) {
    return store.subscribe(handler);
  };
}

// --- SSR Safe Storage Getter ---
function getDefaultStorage(): Storage | undefined {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return undefined;
}

// --- Main Plugin Export ---
export default function <State extends object = any>(options?: Options<State>): (store: Store<State>) => void {
  options = options || {};

  // SSR-safe storage fallback
  const storage: Storage | undefined =
    options.storage || getDefaultStorage();

  if (!storage) {
    throw new Error('[vuex-state-storage-sync] No storage engine available (is this SSR?)');
  }

  const key = options.key || 'store';

  // Storage assertion
  (options.assertStorage || defaultAssertStorage)(storage);

  const mergeFn = options.merge || merge;
  const arrayMergeFn: ArrayMergeFn =
    options.arrayMerge || options.arrayMerger || ((_storeArr, savedArr) => savedArr);

  const getState = options.getState || defaultGetState;
  const setState = options.setState || defaultSetState;
  const removeState = options.removeState || defaultRemoveState;
  const reducer = options.reducer || defaultReducer;
  const filter = options.filter || defaultFilter;
  const subscriber = options.subscriber || defaultSubscriber;
  const rehydrated =
    typeof options.rehydrated === 'function' ? options.rehydrated : () => {};

  // Load state (optionally before store creation)
  const fetchSavedState = () => getState(key, storage);

  let savedState: Partial<State> | undefined;

  if (options.fetchBeforeUse) {
    savedState = fetchSavedState();
  }

  return function (store: Store<State>) {
    if (!options.fetchBeforeUse) {
      savedState = fetchSavedState();
    }

    if (savedState && typeof savedState === 'object') {
      store.replaceState(
        options.overwrite
          ? (savedState as State)
          : (mergeFn(store.state as Partial<State> & object, savedState as Partial<State> & object, {
              arrayMerge: arrayMergeFn,
              clone: false,
            }) as State)
      );
      rehydrated(store);
    }

    // Subscribe to mutations and persist filtered state
    subscriber(store)((mutation, state) => {
      if (filter(mutation)) {
        setState(key, reducer(state, options.paths), storage);
      }
    });
  };
}
