// This file is intended to be preloaded with `--require` (or via NODE_OPTIONS)
// to guard against a non-browser `globalThis.localStorage` object that lacks
// the standard Web Storage API (getItem/setItem). Some Node runtimes or flags
// (e.g. --localstorage-file) may create an empty object which causes
// client-side checks like `typeof localStorage !== 'undefined'` to pass and
// then throw when code calls localStorage.getItem(...).

try {
  // Provide a safe stub implementation of localStorage on the server so
  // client-side libraries that check `typeof localStorage !== 'undefined'`
  // won't crash when calling getItem/setItem during SSR.
  const hasLocalStorage = Object.prototype.hasOwnProperty.call(globalThis, 'localStorage')
  const ls = hasLocalStorage ? globalThis.localStorage : undefined
  const invalid = !ls || typeof ls.getItem !== 'function' || typeof ls.setItem !== 'function'

  if (invalid) {
    // Replace with a minimal stub that implements the Web Storage API shape.
    // This avoids runtime errors during SSR while preserving expected behavior
    // (reads return null, writes are no-ops).
    try {
      globalThis.localStorage = {
        getItem: (key) => null,
        setItem: (key, value) => undefined,
        removeItem: (key) => undefined,
        clear: () => undefined,
      }
    } catch (e) {
      // If we can't assign for some reason, ignore — we must not crash startup.
    }
  }
} catch (err) {
  // Never crash startup because of this guard.
}
