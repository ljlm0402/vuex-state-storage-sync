<img src='https://github.com/ljlm0402/vuex-state-storage-sync/raw/images/logo.jpg' border='0' alt='logo' />

[Vuex](https://vuex.vuejs.org/) State and Storage([local](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage), [session](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage)) Synchronization module

<img src="https://img.shields.io/npm/v/vuex-state-storage-sync.svg" alt="NPM Version" /> <img src="https://img.shields.io/npm/l/vuex-state-storage-sync.svg" alt="Package License" /> <img src="https://img.shields.io/github/v/release/ljlm0402/vuex-state-storage-sync" alt="Release Version" /> <img src="https://img.shields.io/npm/dm/vuex-state-storage-sync.svg" alt="NPM Downloads" />

<img src="https://img.shields.io/badge/node-12.16.0-brightgreen" alt="Node Verserion" /> <img src="https://img.shields.io/badge/npm-v6.14.4-blue" alt="NPM Verserion" />
<br />

## 🕹Guide

### Install

```js
$ npm install --save vuex-state-storage-sync
```

### Usage

```js
import Vue from 'vue';
import Vuex from 'vuex';
import syncStateStorage from 'vuex-state-storage-sync';

Vue.use(Vuex);

export default new Vuex.Store({
  // ... 
  plugins: [
    syncStateStorage()
  ]
});
```

### API

## 📬 Recommended Commit Message

|  When |  Commit Message  |
|:--------|:-----------|
| Add function | feat: ⚡️ Add function |
| Fix bug | fix: 🐞 Fix bug |
| Refactoring | refactor: 🛠 Refactoring |
| Add package | package: 📦 Add package |
| Fix readme | docs: 📚 Fix readme |
| Improvements style | style: 👁 Improvements style |

## 💳 License

[MIT](LICENSE)
