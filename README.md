<p align="center">
  <img src="https://github.com/ljlm0402/vuex-state-storage-sync/raw/images/logo.jpg" alt="logo" width="600" />
</p>

<h2 align="center">Vuex State & Storage Synchronization</h2>
<p align="center">
  <b>
    Minimal, Fast, and Flexible Vuex State <br>
    Persistence & Synchronization with Local/Session Storage
  </b>
</p>

<p align ="center">
    <a href="https://nodei.co/npm/vuex-state-storage-sync" target="_blank">
      <img src="https://nodei.co/npm/vuex-state-storage-sync.png" alt="npm Info" />
  </a>
</p>

<p align="center">
    <a href="http://npm.im/vuex-state-storage-sync" target="_blank">
      <img src="https://img.shields.io/npm/v/vuex-state-storage-sync.svg" alt="npm Version" />
    </a>
    <a href="http://npm.im/vuex-state-storage-sync" target="_blank">
      <img src="https://img.shields.io/github/v/release/ljlm0402/vuex-state-storage-sync" alt="npm Release Version" />
    </a>
    <a href="http://npm.im/vuex-state-storage-sync" target="_blank">
      <img src="https://img.shields.io/npm/dm/vuex-state-storage-sync.svg" alt="npm Downloads" />
    </a>
    <a href="http://npm.im/vuex-state-storage-sync" target="_blank">
      <img src="https://img.shields.io/npm/l/vuex-state-storage-sync.svg" alt="npm Package License" />
    </a>
</p>

<p align="center">
  <a href="https://github.com/ljlm0402/vuex-state-storage-sync/stargazers" target="_blank">
    <img src="https://img.shields.io/github/stars/ljlm0402/vuex-state-storage-sync" alt="github Stars" />
  </a>
  <a href="https://github.com/ljlm0402/vuex-state-storage-sync/network/members" target="_blank">
    <img src="https://img.shields.io/github/forks/ljlm0402/vuex-state-storage-sync" alt="github Forks" />
  </a>
  <a href="https://github.com/ljlm0402/vuex-state-storage-sync/stargazers" target="_blank">
    <img src="https://img.shields.io/github/contributors/ljlm0402/vuex-state-storage-sync" alt="github Contributors" />
  </a>
  <a href="https://github.com/ljlm0402/vuex-state-storage-sync/issues" target="_blank">
    <img src="https://img.shields.io/github/issues/ljlm0402/vuex-state-storage-sync" alt="github Issues" />
  </a>
</p>

<p align="center">
  <strong>· English <a href="./README.ko.md">· Korean</a></strong>
</p>

---

## 🖲 Install

```bash
npm install --save vuex-state-storage-sync
```

## 🕹 Usage

### For Vue 3 + Vuex 4

```js
import { createStore } from "vuex";
import syncStateStorage from "vuex-state-storage-sync";

export default createStore({
  // ... your store options
  plugins: [
    syncStateStorage({
      storage: window.localStorage, // or window.sessionStorage
      key: "my-app", // Storage key name
      paths: ["user", "settings"], // State paths to sync
    }),
  ],
});
```

### For Vue 2 + Vuex 3

```js
import Vue from "vue";
import Vuex from "vuex";
import syncStateStorage from "vuex-state-storage-sync";

Vue.use(Vuex);

export default new Vuex.Store({
  // ... your store options
  plugins: [
    syncStateStorage({
      storage: window.sessionStorage,
      key: "legacy-app",
      paths: ["auth.token"],
    }),
  ],
});
```

## ⚙️ Options

| Option                     | Type      | Default      | Description                                              |
| :------------------------- | :-------- | :----------- | :------------------------------------------------------- |
| `storage`                  | Storage   | localStorage | Storage engine (localStorage, sessionStorage, or custom) |
| `key`                      | string    | "store"      | Storage key name                                         |
| `paths`                    | string\[] | undefined    | Array of state paths to persist                          |
| `overwrite`                | boolean   | false        | If true, state is overwritten on rehydration             |
| `fetchBeforeUse`           | boolean   | false        | Load from storage before plugin install                  |
| `getState`                 | Function  | internal     | Custom get state from storage                            |
| `setState`                 | Function  | internal     | Custom set state to storage                              |
| `removeState`              | Function  | internal     | Custom remove state from storage                         |
| `reducer`                  | Function  | internal     | Custom reducer to select part of state                   |
| `filter`                   | Function  | internal     | Mutation filter                                          |
| `subscriber`               | Function  | internal     | Custom subscribe implementation                          |
| `rehydrated`               | Function  | internal     | Callback after rehydration                               |
| `merge`                    | Function  | deepmerge    | Custom merge function                                    |
| `arrayMerge`/`arrayMerger` | Function  | overwrite    | Custom array merge logic                                 |
| `assertStorage`            | Function  | internal     | Storage validation on start                              |

## 🛡 TypeScript Support

Type definitions are included, and all options are fully type-safe for use with TypeScript.

## 💡 Advanced Usage

### Custom Remove (e.g., remove state on logout)

```js
const plugin = syncStateStorage({
  // ...options
});

store.subscribeAction({
  after: (action) => {
    if (action.type === "user/logout") {
      plugin.removeState("my-app", window.localStorage);
    }
  },
});
```

### Custom Storage (e.g., cookies, IndexedDB)

```js
const customStorage = {
  getItem: (key) => /* ... */,
  setItem: (key, value) => /* ... */,
  removeItem: (key) => /* ... */
};

syncStateStorage({
  storage: customStorage,
  // ...
});
```

## 🤝 Contributing

Contributions are always welcome! Please feel free to open an issue or submit a pull request.

## 💳 License

[MIT](LICENSE)

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/ljlm0402">AGUMON</a> 🦖
</p>
