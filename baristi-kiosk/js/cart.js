/* cart.js
   Owns the in-memory + persisted cart array and everything needed
   to render the Cart screen and the cart badge in the top bar.
   A cart line looks like:
   {
     lineId, itemId, name_en, name_es, image,
     size, milk, sweetness, extras: [], notes,
     unitPrice, quantity
   }
*/

const Cart = (() => {
  let lines = Storage.getCart();

  function persist() { Storage.setCart(lines); }

  function addLine(line) {
    lines.push({ ...line, lineId: `l_${Date.now()}_${Math.floor(Math.random() * 9999)}` });
    persist();
    renderBadge();
  }

  function removeLine(lineId) {
    lines = lines.filter(l => l.lineId !== lineId);
    persist();
    renderBadge();
  }

  function setQuantity(lineId, qty) {
    const line = lines.find(l => l.lineId === lineId);
    if (!line) return;
    line.quantity = Math.max(1, qty);
    persist();
    renderBadge();
  }

  function clear() {
    lines = [];
    persist();
    renderBadge();
  }

  function getLines() { return lines; }

  function itemCount() {
    return lines.reduce((sum, l) => sum + l.quantity, 0);
  }

  function subtotal() {
    return lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  }

  function renderBadge() {
    const badges = document.querySelectorAll('.cart-pill__badge');
    const count = itemCount();
    badges.forEach(badge => {
      badge.textContent = count > 99 ? '99+' : String(count);
      badge.classList.toggle('show', count > 0);
      if (count > 0) {
        badge.classList.remove('bump');
        void badge.offsetWidth; // restart animation
        badge.classList.add('bump');
      }
    });
  }

  function modifierSummary(line, lang) {
    const parts = [];
    if (line.size) parts.push(line.size);
    if (line.milk && line.milk.name) parts.push(line.milk.name[lang] || line.milk.name.en);
    if (line.sweetness && line.sweetness.name) parts.push(line.sweetness.name[lang] || line.sweetness.name.en);
    if (line.temperature) parts.push(line.temperature[lang] || line.temperature.en);
    if (line.extras && line.extras.length) {
      parts.push(line.extras.map(e => e.name[lang] || e.name.en).join(', '));
    }
    return parts.join(' · ');
  }

  function render(lang, t) {
    const listEl = document.getElementById('cartList');
    const emptyEl = document.getElementById('cartEmpty');
    const summaryEl = document.getElementById('cartSummary');
    if (!listEl) return;

    if (lines.length === 0) {
      listEl.innerHTML = '';
      emptyEl.style.display = 'flex';
      summaryEl.style.display = 'none';
      return;
    }

    emptyEl.style.display = 'none';
    summaryEl.style.display = 'block';

    listEl.innerHTML = lines.map((line, i) => {
      const name = line.name[lang] || line.name.en;
      const meta = modifierSummary(line, lang);
      const lineTotal = (line.unitPrice * line.quantity).toFixed(0);
      const imgHtml = `
        <div class="cart-item__img">
          <img src="${line.image || ''}" alt="" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
          <div class="img-fallback" style="position:static;display:none;">${Icons.cup}</div>
        </div>`;
      return `
        <div class="cart-item" style="animation-delay:${i * 0.04}s">
          ${imgHtml}
          <div class="cart-item__info">
            <p class="cart-item__name">${name}</p>
            ${meta ? `<p class="cart-item__meta">${meta}</p>` : ''}
            ${line.notes ? `<p class="cart-item__meta">"${escapeHtml(line.notes)}"</p>` : ''}
            <div class="cart-item__row">
              <div class="cart-item__qty">
                <button aria-label="${t('decrease_qty')}" data-cart-dec="${line.lineId}">−</button>
                <span>${line.quantity}</span>
                <button aria-label="${t('increase_qty')}" data-cart-inc="${line.lineId}">+</button>
              </div>
              <span class="cart-item__price">$${lineTotal}</span>
            </div>
            <button class="cart-item__remove" data-cart-remove="${line.lineId}">${Icons.trashSmall} ${t('remove')}</button>
          </div>
        </div>
      `;
    }).join('');

    const sub = subtotal();
    const taxRate = window.MENU_DATA ? window.MENU_DATA.tax_rate : 0.16;
    const tax = sub * taxRate;
    const total = sub + tax;

    document.getElementById('sumSubtotal').textContent = `$${sub.toFixed(0)}`;
    document.getElementById('sumTax').textContent = `$${tax.toFixed(0)}`;
    document.getElementById('sumTotal').textContent = `$${total.toFixed(0)}`;

    listEl.querySelectorAll('[data-cart-inc]').forEach(btn => {
      btn.addEventListener('click', () => {
        const l = lines.find(x => x.lineId === btn.dataset.cartInc);
        setQuantity(l.lineId, l.quantity + 1);
        render(lang, t);
      });
    });
    listEl.querySelectorAll('[data-cart-dec]').forEach(btn => {
      btn.addEventListener('click', () => {
        const l = lines.find(x => x.lineId === btn.dataset.cartDec);
        if (l.quantity <= 1) { removeLine(l.lineId); } else { setQuantity(l.lineId, l.quantity - 1); }
        render(lang, t);
      });
    });
    listEl.querySelectorAll('[data-cart-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        removeLine(btn.dataset.cartRemove);
        render(lang, t);
      });
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return {
    addLine, removeLine, setQuantity, clear,
    getLines, itemCount, subtotal, render, renderBadge
  };
})();
