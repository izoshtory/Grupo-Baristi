/* app.js
   Screen navigation, language state, translation lookup, and wiring
   for the welcome, cart and thank-you screens. Category + product
   rendering lives in menu.js; cart line rendering lives in cart.js. */

const App = (() => {
  let lang = Storage.getLang();

  const STRINGS = {
    en: {
      start_order: 'Start Order',
      welcome_title_line1: 'Handcrafted',
      welcome_title_line2: 'coffee, made slow.',
      welcome_sub: 'Artisanal coffee, tónicos and after-hours drinks — roasted and poured the Baristi way.',
      items: 'items',
      items_in_category: 'items in this category',
      search_placeholder: 'Search the menu…',
      no_results: 'Nothing matches that search.',
      from: 'from',
      size: 'Size', temperature: 'Temperature', hot: 'Hot', iced: 'Iced',
      notes: 'Notes', notes_placeholder: 'Anything we should know? (optional)',
      quantity: 'Quantity',
      add_to_order: 'Add to Order',
      added_to_cart: 'Added to your order',
      age_gate_notice: 'This menu contains alcoholic beverages. Valid ID required at pickup — 18+ only.',
      your_order: 'Your Order', cart_empty_title: 'Your cart is empty',
      cart_empty_sub: 'Add something delicious to get started.',
      browse_menu: 'Browse Menu',
      subtotal: 'Subtotal', tax: 'Estimated tax', total: 'Total',
      checkout: 'Checkout',
      remove: 'Remove',
      decrease_qty: 'Decrease quantity', increase_qty: 'Increase quantity',
      order_confirmed: 'Order Confirmed', thank_you_sub: "We're on it — thanks for ordering with Baristi.",
      order_number: 'Order Number', prep_time: 'Ready In',
      new_order: 'New Order',
      categories_title: 'What are you craving?',
      categories_sub: 'Choose a category to get started.',
      minutes: 'min'
    },
    es: {
      start_order: 'Iniciar Pedido',
      welcome_title_line1: 'Café artesanal,',
      welcome_title_line2: 'hecho con calma.',
      welcome_sub: 'Café artesanal, tónicos y bebidas after-hours — tostado y servido al estilo Baristi.',
      items: 'artículos',
      items_in_category: 'artículos en esta categoría',
      search_placeholder: 'Buscar en el menú…',
      no_results: 'No hay resultados para esa búsqueda.',
      from: 'desde',
      size: 'Tamaño', temperature: 'Temperatura', hot: 'Caliente', iced: 'Frío',
      notes: 'Notas', notes_placeholder: '¿Algo que debamos saber? (opcional)',
      quantity: 'Cantidad',
      add_to_order: 'Agregar al Pedido',
      added_to_cart: 'Agregado a tu pedido',
      age_gate_notice: 'Este menú contiene bebidas alcohólicas. Se requiere identificación al recoger — solo 18+.',
      your_order: 'Tu Pedido', cart_empty_title: 'Tu carrito está vacío',
      cart_empty_sub: 'Agrega algo delicioso para comenzar.',
      browse_menu: 'Ver Menú',
      subtotal: 'Subtotal', tax: 'Impuesto estimado', total: 'Total',
      checkout: 'Pagar',
      remove: 'Quitar',
      decrease_qty: 'Disminuir cantidad', increase_qty: 'Aumentar cantidad',
      order_confirmed: 'Pedido Confirmado', thank_you_sub: 'Ya lo estamos preparando — gracias por tu pedido en Baristi.',
      order_number: 'Número de Pedido', prep_time: 'Listo En',
      new_order: 'Nuevo Pedido',
      categories_title: '¿Qué se te antoja?',
      categories_sub: 'Elige una categoría para comenzar.',
      minutes: 'min'
    }
  };

  function t(key) { return (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.en[key] || key; }

  function setLang(newLang) {
    lang = newLang;
    Storage.setLang(lang);
    document.documentElement.lang = lang;
    refreshStaticText();
    // Re-render whatever screen is currently active with the new language
    if (MenuModule.data) {
      MenuModule.renderCategories(lang, t);
      if (MenuModule.activeCategory) MenuModule.renderProducts(lang, t);
    }
    Cart.render(lang, t);
    document.querySelectorAll('.lang-toggle button, .welcome__lang button').forEach(b => {
      b.classList.toggle('is-active', b.dataset.lang === lang);
    });
  }

  function refreshStaticText() {
    document.querySelectorAll('[data-t]').forEach(el => {
      el.textContent = t(el.dataset.t);
    });
    document.querySelectorAll('[data-t-placeholder]').forEach(el => {
      el.placeholder = t(el.dataset.tPlaceholder);
    });
  }

  /* ---------------- Screen navigation ---------------- */
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.getElementById(id).scrollTop = 0;
  }

  function goToWelcome() { showScreen('screen-welcome'); }
  function goToCategories() { showScreen('screen-categories'); MenuModule.renderCategories(lang, t); }
  function goToMenu(categoryId) {
    MenuModule.activeCategory = categoryId;
    showScreen('screen-menu');
    document.getElementById('menuSearch').value = '';
    MenuModule.setSearch('', lang, t);
  }
  function goToCart() { showScreen('screen-cart'); Cart.render(lang, t); }
  function goToThankYou() {
    const orderNum = Math.floor(100 + Math.random() * 899);
    const prepTime = 4 + Math.floor(Math.random() * 6);
    document.getElementById('orderNumber').textContent = `#${orderNum}`;
    document.getElementById('prepTime').textContent = `${prepTime} ${t('minutes')}`;
    Cart.clear();
    Cart.render(lang, t);
    showScreen('screen-thankyou');
  }

  /* ---------------- Toast ---------------- */
  let toastTimer = null;
  function showToast(message) {
    const el = document.getElementById('toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  /* ---------------- Init ---------------- */
  async function init() {
    document.documentElement.lang = lang;
    await MenuModule.load();
    refreshStaticText();
    Cart.renderBadge();

    document.querySelectorAll('.lang-toggle button, .welcome__lang button').forEach(b => {
      b.classList.toggle('is-active', b.dataset.lang === lang);
      b.addEventListener('click', () => setLang(b.dataset.lang));
    });

    document.getElementById('btnStartOrder').addEventListener('click', goToCategories);
    document.querySelectorAll('[data-nav-back]').forEach(btn => {
      btn.addEventListener('click', () => showScreen(btn.dataset.navBack));
    });
    document.querySelectorAll('[data-nav-cart]').forEach(btn => {
      btn.addEventListener('click', goToCart);
    });
    document.getElementById('btnBrowseMenu').addEventListener('click', goToCategories);

    document.getElementById('menuSearch').addEventListener('input', (e) => {
      MenuModule.setSearch(e.target.value, lang, t);
    });

    document.getElementById('sheetClose').addEventListener('click', MenuModule.closeCustomization);
    document.getElementById('customizeOverlay').addEventListener('click', (e) => {
      if (e.target.id === 'customizeOverlay') MenuModule.closeCustomization();
    });
    document.getElementById('btnAddOrder').addEventListener('click', () => MenuModule.confirmAdd(lang, t));

    document.getElementById('btnCheckout').addEventListener('click', goToThankYou);
    document.getElementById('btnNewOrder').addEventListener('click', goToWelcome);

    goToWelcome();
  }

  return { init, showScreen, goToWelcome, goToCategories, goToMenu, goToCart, goToThankYou, showToast, t: () => t, getLang: () => lang };
})();

document.addEventListener('DOMContentLoaded', App.init);
