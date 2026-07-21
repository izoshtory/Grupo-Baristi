/* menu.js
   Loads data/menu.json once, then renders:
   - the category grid (screen 2)
   - the product grid for a chosen category (screen 3), with search + chip filter
   - the customization sheet (screen 4)
   Nothing here touches the cart directly except handing a finished
   line item to Cart.addLine().
*/

const MenuModule = (() => {
  let data = null;
  let activeCategory = null;
  let searchTerm = '';
  let currentProduct = null;
  let selection = null; // working selection state while the sheet is open

  async function load() {
    const res = await fetch('data/menu.json');
    data = await res.json();
    window.MENU_DATA = data;
    return data;
  }

  function categoryName(cat, lang) { return cat[`name_${lang}`] || cat.name_en; }
  function itemName(item, lang) { return item[`name_${lang}`] || item.name_en; }
  function itemDesc(item, lang) { return item[`description_${lang}`] || item.description_en; }

  function basePrice(item) {
    if (item.price != null) return item.price;
    if (item.sizes) {
      const vals = Object.values(item.sizes);
      return Math.min(...vals);
    }
    return 0;
  }

  function itemsForCategory(catId) {
    return data.items.filter(i => i.category === catId);
  }

  /* ---------------- Category grid ---------------- */
  function renderCategories(lang, t) {
    const grid = document.getElementById('categoryGrid');
    grid.innerHTML = data.categories.map((cat, i) => {
      const count = itemsForCategory(cat.id).length;
      const isAdult = !!cat.adult;
      return `
        <button class="category-card ${isAdult ? 'adult' : ''}" style="animation-delay:${i * 0.05}s" data-category="${cat.id}">
          <div class="category-card__img" style="background-color:${isAdult ? '#141414' : '#e9dfc6'}"></div>
          <div class="category-card__scrim"></div>
          ${isAdult ? `<span class="category-card__tag">21+</span>` : ''}
          <div class="category-card__label">
            <span class="name">${categoryName(cat, lang)}</span>
            <span class="count">${count} ${t('items')}</span>
          </div>
        </button>
      `;
    }).join('');

    grid.querySelectorAll('[data-category]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.category;
        searchTerm = '';
        App.goToMenu(activeCategory);
      });
    });
  }

  /* ---------------- Product grid ---------------- */
  function renderChips(lang) {
    const row = document.getElementById('chipRow');
    row.innerHTML = data.categories.map(cat => `
      <button class="chip ${cat.id === activeCategory ? 'is-active' : ''}" data-chip="${cat.id}">
        ${categoryName(cat, lang)}
      </button>
    `).join('');
    row.querySelectorAll('[data-chip]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.chip;
        App.goToMenu(activeCategory);
      });
    });
  }

  function renderProducts(lang, t) {
    const cat = data.categories.find(c => c.id === activeCategory);
    const isAfterHours = !!(cat && cat.adult);
    const screen = document.getElementById('screen-menu');
    screen.classList.toggle('mode-afterhours', isAfterHours);

    document.getElementById('menuTitle').textContent = cat ? categoryName(cat, lang) : '';
    document.getElementById('menuSub').textContent = cat
      ? `${itemsForCategory(cat.id).length} ${t('items_in_category')}`
      : '';

    const banner = document.getElementById('ageBanner');
    banner.style.display = isAfterHours ? 'flex' : 'none';
    if (isAfterHours) banner.textContent = t('age_gate_notice');

    renderChips(lang);

    let items = itemsForCategory(activeCategory);
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      items = items.filter(i =>
        itemName(i, lang).toLowerCase().includes(q) ||
        itemName(i, lang === 'en' ? 'es' : 'en').toLowerCase().includes(q)
      );
    }

    const grid = document.getElementById('menuGrid');
    if (items.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          ${Icons.search}
          <p>${t('no_results')}</p>
        </div>`;
      return;
    }

    grid.innerHTML = items.map((item, i) => {
      const price = basePrice(item);
      const priceLabel = item.sizes ? `${t('from')} $${price}` : `$${price}`;
      return `
        <button class="product-card" style="animation-delay:${i * 0.03}s" data-product="${item.id}">
          <div class="product-card__img">
            <img src="${item.image}" alt="" loading="lazy" onerror="this.style.display='none'; this.parentElement.classList.add('placeholder');">
            <div class="img-fallback">${Icons.cup}</div>
          </div>
          <div class="product-card__body">
            <p class="product-card__name">${itemName(item, lang)}</p>
            <p class="product-card__desc">${itemDesc(item, lang)}</p>
            <div class="product-card__foot">
              <span class="product-card__price">${priceLabel}</span>
              <span class="product-card__add" aria-hidden="true">+</span>
            </div>
          </div>
        </button>
      `;
    }).join('');

    grid.querySelectorAll('[data-product]').forEach(btn => {
      btn.addEventListener('click', () => openCustomization(Number(btn.dataset.product), lang, t));
    });
  }

  function setSearch(term, lang, t) {
    searchTerm = term;
    renderProducts(lang, t);
  }

  /* ---------------- Customization sheet ---------------- */
  function defaultSelection(item) {
    const sizes = item.sizes ? Object.keys(item.sizes) : null;
    return {
      size: sizes ? sizes[sizes.length - 1] : null, // default to largest
      temperature: null,
      milk: data.modifiers.milk.options[0],
      sweetness: data.modifiers.sweetness.options[2] || data.modifiers.sweetness.options[0],
      extras: [],
      notes: '',
      quantity: 1
    };
  }

  function computeUnitPrice(item) {
    let price = item.price != null ? item.price : (item.sizes[selection.size] || basePrice(item));
    if (selection.milk && selection.milk.price) price += selection.milk.price;
    selection.extras.forEach(ex => { price += ex.price; });
    return price;
  }

  function openCustomization(itemId, lang, t) {
    currentProduct = data.items.find(i => i.id === itemId);
    if (!currentProduct) return;
    selection = defaultSelection(currentProduct);
    const hero = document.getElementById('sheetHero');
    hero.classList.remove('placeholder');
    hero.innerHTML = `<img src="${currentProduct.image}" alt="" onerror="this.style.display='none'; this.parentElement.classList.add('placeholder');"><div class="img-fallback">${Icons.cup}</div>`;
    renderSheet(lang, t);
    document.getElementById('customizeOverlay').classList.add('open');
  }

  function closeCustomization() {
    document.getElementById('customizeOverlay').classList.remove('open');
  }

  function renderSheet(lang, t) {
    const item = currentProduct;
    const isCoffeeStyle = !!item.sizes; // items with size tiers get full customization; fixed cocktails/bakery get lighter form
    const mods = data.modifiers;

    document.getElementById('sheetTitle').textContent = itemName(item, lang);
    document.getElementById('sheetDesc').textContent = itemDesc(item, lang);

    let html = '';

    if (isCoffeeStyle) {
      const sizeKeys = Object.keys(item.sizes);
      html += `
        <div class="opt-group">
          <span class="opt-group__label">${t('size')}</span>
          <div class="opt-row" id="optSize">
            ${sizeKeys.map(sz => `
              <button class="opt-pill ${selection.size === sz ? 'is-selected' : ''}" data-size="${sz}">
                ${sz} <span class="plus">$${item.sizes[sz]}</span>
              </button>`).join('')}
          </div>
        </div>

        <div class="opt-group">
          <span class="opt-group__label">${t('temperature')}</span>
          <div class="opt-row" id="optTemp">
            <button class="opt-pill ${selection.temperature === null || selection.temperature.id === 'hot' ? 'is-selected' : ''}" data-temp="hot">${t('hot')}</button>
            <button class="opt-pill ${selection.temperature && selection.temperature.id === 'iced' ? 'is-selected' : ''}" data-temp="iced">${t('iced')}</button>
          </div>
        </div>

        <div class="opt-group">
          <span class="opt-group__label">${mods.milk[`label_${lang}`]}</span>
          <div class="opt-row" id="optMilk">
            ${mods.milk.options.map(o => `
              <button class="opt-pill ${selection.milk.id === o.id ? 'is-selected' : ''}" data-milk="${o.id}">
                ${o[`name_${lang}`]} ${o.price ? `<span class="plus">+$${o.price}</span>` : ''}
              </button>`).join('')}
          </div>
        </div>

        <div class="opt-group">
          <span class="opt-group__label">${mods.sweetness[`label_${lang}`]}</span>
          <div class="opt-row" id="optSweet">
            ${mods.sweetness.options.map(o => `
              <button class="opt-pill ${selection.sweetness.id === o.id ? 'is-selected' : ''}" data-sweet="${o.id}">
                ${o[`name_${lang}`]}
              </button>`).join('')}
          </div>
        </div>

        <div class="opt-group">
          <span class="opt-group__label">${mods.extras[`label_${lang}`]}</span>
          <div>
            ${mods.extras.options.map(o => `
              <div class="toggle-row">
                <div>
                  <span class="toggle-row__label">${o[`name_${lang}`]}</span>
                  <span class="toggle-row__price">+$${o.price}</span>
                </div>
                <button class="switch ${selection.extras.find(e => e.id === o.id) ? 'is-on' : ''}" data-extra="${o.id}"></button>
              </div>`).join('')}
          </div>
        </div>
      `;
    }

    html += `
      <div class="opt-group">
        <span class="opt-group__label">${t('notes')}</span>
        <textarea class="notes-input" id="optNotes" placeholder="${t('notes_placeholder')}">${selection.notes}</textarea>
      </div>

      <div class="opt-group">
        <span class="opt-group__label">${t('quantity')}</span>
        <div class="qty-row">
          <button class="qty-btn" id="qtyMinus">−</button>
          <span class="qty-value" id="qtyValue">${selection.quantity}</span>
          <button class="qty-btn" id="qtyPlus">+</button>
        </div>
      </div>
    `;

    document.getElementById('sheetOptions').innerHTML = html;
    updateAddButton(lang, t);
    wireSheetEvents(lang, t);
  }

  function wireSheetEvents(lang, t) {
    const q = (sel) => document.getElementById('sheetOptions').querySelector(sel);

    document.querySelectorAll('#optSize [data-size]').forEach(btn => {
      btn.addEventListener('click', () => { selection.size = btn.dataset.size; renderSheet(lang, t); });
    });
    document.querySelectorAll('#optTemp [data-temp]').forEach(btn => {
      btn.addEventListener('click', () => {
        selection.temperature = { id: btn.dataset.temp, en: btn.dataset.temp === 'hot' ? 'Hot' : 'Iced', es: btn.dataset.temp === 'hot' ? 'Caliente' : 'Frío' };
        renderSheet(lang, t);
      });
    });
    document.querySelectorAll('#optMilk [data-milk]').forEach(btn => {
      btn.addEventListener('click', () => {
        selection.milk = window.MENU_DATA.modifiers.milk.options.find(o => o.id === btn.dataset.milk);
        renderSheet(lang, t);
      });
    });
    document.querySelectorAll('#optSweet [data-sweet]').forEach(btn => {
      btn.addEventListener('click', () => {
        selection.sweetness = window.MENU_DATA.modifiers.sweetness.options.find(o => o.id === btn.dataset.sweet);
        renderSheet(lang, t);
      });
    });
    document.querySelectorAll('[data-extra]').forEach(btn => {
      btn.addEventListener('click', () => {
        const opt = window.MENU_DATA.modifiers.extras.options.find(o => o.id === btn.dataset.extra);
        const exists = selection.extras.find(e => e.id === opt.id);
        selection.extras = exists ? selection.extras.filter(e => e.id !== opt.id) : [...selection.extras, opt];
        renderSheet(lang, t);
      });
    });

    const notesEl = document.getElementById('optNotes');
    if (notesEl) notesEl.addEventListener('input', (e) => { selection.notes = e.target.value; updateAddButton(lang, t); });

    const minus = document.getElementById('qtyMinus');
    const plus = document.getElementById('qtyPlus');
    if (minus) minus.addEventListener('click', () => { selection.quantity = Math.max(1, selection.quantity - 1); document.getElementById('qtyValue').textContent = selection.quantity; updateAddButton(lang, t); });
    if (plus) plus.addEventListener('click', () => { selection.quantity += 1; document.getElementById('qtyValue').textContent = selection.quantity; updateAddButton(lang, t); });
  }

  function updateAddButton(lang, t) {
    const item = currentProduct;
    const unit = computeUnitPrice(item);
    const total = unit * selection.quantity;
    const btn = document.getElementById('btnAddOrder');
    btn.innerHTML = `<span>${t('add_to_order')}</span><span>$${total.toFixed(0)}</span>`;
  }

  function confirmAdd(lang, t) {
    const item = currentProduct;
    const unit = computeUnitPrice(item);
    Cart.addLine({
      itemId: item.id,
      name: { en: item.name_en, es: item.name_es },
      image: item.image,
      size: selection.size,
      temperature: selection.temperature,
      milk: item.sizes ? { name: { en: selection.milk.name_en, es: selection.milk.name_es } } : null,
      sweetness: item.sizes ? { name: { en: selection.sweetness.name_en, es: selection.sweetness.name_es } } : null,
      extras: selection.extras.map(e => ({ name: { en: e.name_en, es: e.name_es } })),
      notes: selection.notes,
      unitPrice: unit,
      quantity: selection.quantity
    });
    closeCustomization();
    App.showToast(t('added_to_cart'));
  }

  return {
    load, renderCategories, renderProducts, setSearch,
    openCustomization, closeCustomization, confirmAdd,
    get data() { return data; },
    get activeCategory() { return activeCategory; },
    set activeCategory(v) { activeCategory = v; }
  };
})();
