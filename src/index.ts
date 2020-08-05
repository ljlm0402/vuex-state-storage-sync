import { Store, MutationPayload } from 'vuex';
import merge from 'deepmerge';
import * as shvl from 'shvl';

interface Storage {
  getItem: (key: string) => any;
  setItem: (key: string, value: any) => void;
}

interface Options<State> {
  storage?: Storage;
  key?: string;
  paths?: string[];
  overwrite?: boolean;
  fetchBeforeUse?: boolean;
  history?: boolean;

  getState?: (key: string, storage: Storage) => any;
  setState?: (key: string, state: any, storage: Storage) => void;

  setHistory?: (key: string, state: any, storage: Storage) => void;

  reducer?: (state: State, paths: string[]) => object;
  filter?: (mutation: MutationPayload) => boolean;

  merge?: (object1: Object | Array<any>, object2: Object | Array<any>, options: Object) => object | Array<any>;
  arrayMerge?: (state: any[], saved: any[]) => any;

  rehydrated?: (store: Store<State>) => void;
  subscriber?: (store: Store<State>) => (handler: (mutation: any, state: State) => void) => void;
}

export default function <State>(options?: Options<State>): (store: Store<State>) => void {
  options = options || {};

  const storage = options.storage || (window && window.localStorage);
  const key = options.key || 'store';

  const getState = (key: string, storage: Storage): any => {
    try {
      let value: string;
      return (value = storage.getItem(key)) && typeof value !== 'undefined' ? JSON.parse(value) : undefined;
    } catch (err) {
      return undefined;
    }
  }

  const setState = (key: string, state: any, storage: Storage): void => {
    return storage.setItem(key, JSON.stringify(state));
  }

  const setHistory = (key: string, storage: Storage): void => {
    const state = getState(key, storage);
    return storage.setItem('history', JSON.stringify(state));
  }

  const reducer = (state: any, paths: string[]): any => {
    return Array.isArray(paths)
      ? paths.reduce((substate, path) => shvl.set(substate, path, shvl.get(state, path)), {}) 
      : state;
  }

  const filter = (): boolean => {
    return true;
  }
  
  const subscriber = (store: any): any => {
    return function (handler: any) {
      return store.subscribe(handler);
    };
  }

  const fetchSavedState = (): any => (options.getState || getState)(key, storage);

  let savedState: any;

  if (options.fetchBeforeUse) {
    savedState = fetchSavedState();
  }

  return function (store: Store<State>) {
    if (!options.fetchBeforeUse) {
      savedState = fetchSavedState();
    }

    if (typeof savedState === 'object' && savedState !== null) {
      store.replaceState(
        options.overwrite
          ? savedState
          : (options.merge || merge)(store.state, savedState, {
              arrayMerge:
                options.arrayMerge ||
                function (store, saved) {
                  return saved;
                },
              clone: false,
            })
      );
      (options.rehydrated || function () {})(store);
      (options.history && setHistory(key, storage));
    }

    (options.subscriber || subscriber)(store)(function (mutation, state) {
      if ((options.filter || filter)(mutation)) {
        (options.setState || setState)(
          key,
          (options.reducer || reducer)(state, options.paths),
          storage
        );
      }
    });
  };
}
