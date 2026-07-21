/* storage.js
   Thin wrapper around localStorage so the rest of the app never
   touches window.localStorage directly. Keeps cart, language and
   favorites persistent between kiosk sessions on the same device. */

const Storage = (() => {
  const KEYS = {
    CART: 'baristi_kiosk_cart',
    LANG: 'baristi_kiosk_lang',
    FAVORITES: 'baristi_kiosk_favorites'
  };

  function safeGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      console.warn('Storage read failed for', key, err);
      return fallback;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn('Storage write failed for', key, err);
      return false;
    }
  }

  return {
    getCart: () => safeGet(KEYS.CART, []),
    setCart: (cart) => safeSet(KEYS.CART, cart),
    clearCart: () => safeSet(KEYS.CART, []),

    getLang: () => safeGet(KEYS.LANG, 'en'),
    setLang: (lang) => safeSet(KEYS.LANG, lang),

    getFavorites: () => safeGet(KEYS.FAVORITES, []),
    setFavorites: (favs) => safeSet(KEYS.FAVORITES, favs)
  };
})();
