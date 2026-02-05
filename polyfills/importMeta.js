
if (typeof globalThis.__import_meta__ === 'undefined') {
  globalThis.__import_meta__ = {
    env: { MODE: __DEV__ ? 'development' : 'production' },
    url: '',
  };
}
if (typeof globalThis.importMeta === 'undefined') {
  globalThis.importMeta = globalThis.__import_meta__;
}
