/* ── Shared Font Awesome star glyph (fa-star solid), used anywhere a
   rating is rendered via JS so it matches the FA icons used in markup ── */
const ND_STAR_ICON = '<svg viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg" style="width:0.85em;height:0.85em;display:inline-block;vertical-align:-0.1em" fill="currentColor"><path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"></path></svg>';

/* ── Pill toggles ── */
document.querySelectorAll('.pill-toggles').forEach(g => {
  g.querySelectorAll('.pill').forEach(p => {
    p.addEventListener('click', () => {
      g.querySelectorAll('.pill').forEach(x => x.classList.remove('active'));
      p.classList.add('active');
    });
  });
});

/* ── Occupancy chart-controls pills ── */
document.querySelectorAll('.chart-controls .pill').forEach(p => {
  p.addEventListener('click', () => {
    p.closest('.chart-controls').querySelectorAll('.pill').forEach(x => x.classList.remove('active'));
    p.classList.add('active');
  });
});

/* ── Date pills ── */
document.querySelectorAll('.date-strip').forEach(s => {
  s.querySelectorAll('.date-pill').forEach(p => {
    p.addEventListener('click', () => {
      s.querySelectorAll('.date-pill').forEach(x => x.classList.remove('active'));
      p.classList.add('active');
    });
  });
});

/* ── Metric cards ── */
document.querySelectorAll('.metric-card').forEach(c => {
  c.addEventListener('click', () => {
    c.closest('.metric-grid').querySelectorAll('.metric-card').forEach(x => x.classList.remove('selected'));
    c.classList.add('selected');
  });
});

/* ── Competitor Calendar: Host vs. Guest price display, as a single
   dropdown button (matching desktop's own "Host Prices ▾" control)
   rather than a two-pill toggle. Host prices are the base nightly rate
   set by the host (what's already in the markup); Guest prices layer on
   an estimated PMS markup + fee. The host value is captured lazily from
   each cell's own text the first time it's needed, so no separate
   dataset has to be hand-maintained per cell. ── */
let ccPriceMode = 'host';
let ccView = 'table';
let ccLos = 2;
let ccSelDay = 0;
function ccSetPriceMode(mode) {
  ccPriceMode = mode;
  ccSyncPickers();
  ndCloseSheet('bs-cc-price-mode');
  document.getElementById('cc-price-pill').firstChild.textContent = mode === 'guest' ? 'Guest Prices' : 'Host Prices';
  document.getElementById('cc-los-pill').style.display = mode === 'guest' ? '' : 'none';
  document.getElementById('cc-guest-info').style.display = mode === 'guest' ? '' : 'none';
  const note = document.getElementById('cc-price-footnote');
  if (note) {
    note.textContent = mode === 'guest'
      ? 'Average nightly rates including fee and PMS markups. Multiply by the selected LOS for the total guest price.'
      : 'Nightly rates before adding fee or taxes; base amount set by the host.';
  }
  ccRender();
}
/* Pickers always open showing the current state (Host Prices is the
   default) — the radio selection is synced from ccPriceMode / ccLos on
   every open rather than trusting whatever was last tapped. */
function ccSyncPickers() {
  document.querySelectorAll('#cc-price-mode-options .bs-radio').forEach(r => r.classList.toggle('selected', r.dataset.mode === ccPriceMode));
  document.querySelectorAll('#cc-los-options .bs-radio').forEach(r => r.classList.toggle('selected', parseInt(r.dataset.los, 10) === ccLos));
}
function ccOpenPicker(id) {
  ccSyncPickers();
  ndOpenSheet(id);
}
function ccSetLos(n) {
  ccLos = n;
  ndCloseSheet('bs-cc-los');
  document.getElementById('cc-los-pill').firstChild.textContent = n + ' Night' + (n > 1 ? 's' : '');
  ccRender();
}
function ccSetView(view) {
  ccView = view;
  document.querySelectorAll('#cc-view-toggle .pill').forEach(p => p.classList.toggle('active', p.dataset.view === view));
  document.getElementById('cc-table-view').style.display = view === 'table' ? '' : 'none';
  document.getElementById('cc-date-view').style.display = view === 'date' ? '' : 'none';
  /* N/A · N/B · booked · min-stay legend applies to both views. */
  document.getElementById('cc-table-legend').style.display = '';
  ccRender();
}

/* ── Competitor Calendar data. Your listing's nightly rate is the real
   listingPrice from REAL_DAILY; competitors are priced off that same
   day's listing price × a per-listing factor (a close-match compset), with a deterministic
   per-cell jitter so booked dates, min-stays and N/A/N/B cells stay
   stable across re-renders. ── */
const CC_DAYS = 30;
const CC_MOON = '<svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
const CC_YOUR_FEE = 35;
const CC_COMPS = {
  'Luxe King Suite':       { br: '1 BR', rating: '4.98', reviews: 112, dist: '0.3 mi', factor: 1.18, minStay: 2, fee: 45 },
  'New! 1 Bed Hideaway':   { br: '1 BR', rating: null,   reviews: 0,   dist: '0.4 mi', factor: 1.02, minStay: 1, fee: 30 },
  'Modern Studio Apt':     { br: 'Studio', rating: '4.85', reviews: 64, dist: '0.5 mi', factor: 0.86, minStay: 3, fee: 25 },
  'Sunny 2BR Condo':       { br: '2 BR', rating: '4.91', reviews: 38,  dist: '0.6 mi', factor: 1.40, minStay: 2, fee: 50 },
  'Charming 1BR Loft':     { br: '1 BR', rating: '4.76', reviews: 21,  dist: '0.7 mi', factor: 1.08, minStay: 2, fee: 35 },
  'Trendy East Austin':    { br: '1 BR', rating: '4.88', reviews: 57,  dist: '0.8 mi', factor: 1.16, minStay: 1, fee: 35 },
  'Quiet Garden Studio':   { br: 'Studio', rating: '4.70', reviews: 12, dist: '0.9 mi', factor: 0.78, minStay: 2, fee: 20 },
  'Central 2BR Flat':      { br: '2 BR', rating: '4.82', reviews: 45,  dist: '1.0 mi', factor: 1.31, minStay: 1, fee: 45 },
  'Bright Corner 1BR':     { br: '1 BR', rating: '4.65', reviews: 9,   dist: '1.1 mi', factor: 0.94, minStay: 3, fee: 30 },
  'Riverside 1BR Retreat': { br: '1 BR', rating: '4.90', reviews: 73,  dist: '1.2 mi', factor: 1.12, minStay: 2, fee: 40 },
  'Downtown Rooftop 2BR':  { br: '2 BR', rating: '4.94', reviews: 88,  dist: '1.3 mi', factor: 1.52, minStay: 2, fee: 55 },
  'Cozy Backyard Studio':  { br: 'Studio', rating: '4.60', reviews: 6, dist: '1.4 mi', factor: 0.74, minStay: 1, fee: 20 },
  'Historic 3BR House':    { br: '3 BR', rating: '4.87', reviews: 31,  dist: '1.5 mi', factor: 1.85, minStay: 3, fee: 70 }
};
function ccHash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 10000) / 10000;
}
function ccAddedNames() {
  return Array.from(document.querySelectorAll('#add-comp-current-list .comp-row')).map(r => r.dataset.name);
}
function ccCell(name, i) {
  const { date, row } = ndRealDay(i);
  const dow = date.getDay();
  const weekend = dow === 5 || dow === 6;
  if (name === '__yours__') {
    return { price: row[4], booked: !!row[10], minStay: 1, weekend: weekend };
  }
  const c = CC_COMPS[name] || { factor: 1, minStay: 2 };
  const r = ccHash(name + '|' + i);
  const jitter = 0.94 + ccHash(name + '#' + i) * 0.12;
  const price = Math.round(row[4] * c.factor * jitter * (weekend ? 1.08 : 1));
  let status = 'avail';
  if (r < 0.28) status = 'booked';
  else if (r < 0.31) status = 'na';
  else if (r < 0.34) status = 'nb';
  return { price: price, booked: status === 'booked', na: status === 'na', nb: status === 'nb', minStay: c.minStay, weekend: weekend };
}
function ccPrice(v) { return ccPriceMode === 'guest' ? Math.round(v * 1.13) : v; }
/* Mode-aware cell. Host: that night's base rate. Guest: the average
   nightly rate for a stay of ccLos nights checking in on day i,
   including the fee (spread across the stay) and PMS markup — N/B when
   the listing's min-stay is longer than the selected LOS, booked when
   any night of the stay is taken. */
function ccView_cell(name, i) {
  const base = ccCell(name, i);
  if (ccPriceMode !== 'guest' || base.na) return base;
  const c = name === '__yours__' ? { fee: CC_YOUR_FEE } : (CC_COMPS[name] || { fee: 0 });
  if (base.minStay > ccLos) return Object.assign({}, base, { nb: true });
  let sum = 0, booked = false;
  for (let k = 0; k < ccLos; k++) {
    const n = ccCell(name, Math.min(i + k, CC_DAYS + 6));
    if (n.booked || n.na) booked = true;
    sum += n.price;
  }
  /* Same math as the breakdown sheet (ccOpenBreakdown) so the cell and its explanation always agree. */
  const avg = Math.round((sum + Math.round(sum * 0.13) + (c.fee || 0)) / ccLos);
  return Object.assign({}, base, { price: avg, booked: booked, nb: false, raw: true });
}
function ccShown(cell) { return cell.raw ? cell.price : ccPrice(cell.price); }
function ccStayLabel(i) {
  const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const a = ndRealDay(i).date, b = ndRealDay(i + ccLos).date;
  return M[a.getMonth()] + ' ' + a.getDate() + ' – ' + M[b.getMonth()] + ' ' + b.getDate();
}
function ccRender() {
  const names = ccAddedNames();
  if (!names.length) return;
  if (ccView === 'date') { ccRenderDateView(names); return; }
  /* Table view mirrors the mobile Multi Calendar grid: grey header
     row with "29 Sep / Tue" date columns, a frozen listings column
     (small grey meta line over a bold 2-line name) that can be
     collapsed with the round chevron button on its edge, and roomy
     cells with the price in plain numbers (no currency). */
  const DAY = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const chevL = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 3.5 5.5 8l4.5 4.5"/></svg>';
  const collapsed = ccTableCollapsed;
  let html = '<div class="mc-grid' + (collapsed ? ' collapsed' : '') + '">';
  html += '<div class="mc-row mc-head"><div class="mc-c mc-name">' + (collapsed ? '' : 'Listings (' + (names.length + 1) + ')') + '<button class="mc-collapse" aria-label="' + (collapsed ? 'Expand' : 'Collapse') + ' listings column" onclick="ccToggleTableCollapse()">' + chevL + '</button></div><div class="mc-c mc-fee">Est.<br>Fee</div>';
  for (let i = 0; i < CC_DAYS; i++) {
    const d = ndRealDay(i).date, w = d.getDay() === 5 || d.getDay() === 6;
    html += '<div class="mc-c mc-date' + (w ? ' wknd' : '') + '"><span>' + String(d.getDate()).padStart(2, '0') + ' ' + MON[d.getMonth()] + '</span><span>' + DAY[d.getDay()] + '</span></div>';
  }
  html += '</div>';
  if (ccPriceMode === 'guest') {
    html += '<div class="mc-row mc-stay"><div class="mc-c mc-name">' + (collapsed ? 'Stay' : 'Stay dates (LOS)') + '</div><div class="mc-c mc-fee">–</div>';
    for (let i = 0; i < CC_DAYS; i++) {
      const w = [5, 6].indexOf(ndRealDay(i).date.getDay()) >= 0;
      html += '<div class="mc-c' + (w ? ' wknd' : '') + '">' + ccStayLabel(i).replace(' – ', ' –<br>') + '</div>';
    }
    html += '</div>';
  }
  const rowHtml = function (name) {
    const yours = name === '__yours__';
    const c = CC_COMPS[name] || {};
    let h = '<div class="mc-row' + (yours ? ' mc-yours' : '') + '"' + (yours ? '' : ' onclick="ccOpenCompetitor(\'' + name.replace(/'/g, "\\'") + '\')"') + '>';
    if (yours) {
      h += '<div class="mc-c mc-name">' + (collapsed ? '<span class="mc-you">You</span>' : '<span class="mc-title">Your Listing</span><a class="mc-link" href="#" onclick="event.preventDefault();event.stopPropagation();ndOpenSheet(\'bs-comp-set-edit\')">Edit Markup, Fees</a>') + '</div>';
      h += '<div class="mc-c mc-fee">' + ccPrice(CC_YOUR_FEE) + '</div>';
    } else {
      const rating = c.rating ? c.rating + ' ' + ND_STAR_ICON : 'New';
      h += '<div class="mc-c mc-name">' + (collapsed ? '<span class="mc-title mc-title-short">' + name + '</span>' : '<span class="mc-meta">' + c.br + ' · ' + rating + '</span><span class="mc-title">' + name + '</span>') + '</div>';
      h += '<div class="mc-c mc-fee">' + ccPrice(c.fee) + '</div>';
    }
    for (let i = 0; i < CC_DAYS; i++) {
      const cell = ccView_cell(name, i);
      let cls = 'mc-c mc-day' + (cell.weekend ? ' wknd' : '');
      let inner;
      if (cell.na) { inner = '<span class="mc-p">N/A</span>'; cls += ' muted'; }
      else if (cell.nb) { inner = '<span class="mc-p">N/B</span>'; cls += ' muted'; }
      else {
        if (cell.booked) cls += ' booked';
        inner = '<span class="mc-p">' + ccShown(cell) + '</span><span class="mc-ms">' + cell.minStay + ' ' + CC_MOON + '</span>';
      }
      const tap = ccPriceMode === 'guest' && !cell.na && !cell.nb
        ? ' onclick="event.stopPropagation();ccOpenBreakdown(\'' + name.replace(/'/g, "\\'") + '\',' + i + ')"' : '';
      h += '<div class="' + cls + (tap ? ' tappable' : '') + '"' + tap + '>' + inner + '</div>';
    }
    return h + '</div>';
  };
  html += rowHtml('__yours__');
  names.forEach(n => { html += rowHtml(n); });
  html += '</div>';
  document.getElementById('cc-table').innerHTML = html;
}
let ccTableCollapsed = false;
function ccToggleTableCollapse() {
  ccTableCollapsed = !ccTableCollapsed;
  ccRender();
}
/* ── "By Date" view: the app-friendly alternative to the dense grid.
   Modeled on how Apple Weather / Google Flights handle data-heavy
   comparisons on a phone — pick one date from a swipeable strip, get a
   plain-language summary with a range bar showing where you sit, then a
   ranked list with large, readable prices. Swipe the list sideways to
   step through dates. ── */
function ccRenderDateView(names) {
  const DAY = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const DAYL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const i = ccSelDay;
  const d = ndRealDay(i).date;
  const yours = ccView_cell('__yours__', i);
  const rows = names.map(n => ({ name: n, c: CC_COMPS[n] || {}, cell: ccView_cell(n, i) }));
  const avail = rows.filter(r => !r.cell.na && !r.cell.nb && !r.cell.booked);
  const prices = avail.map(r => ccShown(r.cell)).sort((a, b) => a - b);
  const you = ccShown(yours);
  const med = prices.length ? (prices.length % 2 ? prices[(prices.length - 1) / 2] : Math.round((prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2)) : null;

  let strip = '<div class="ccd-strip" id="ccd-strip">';
  for (let k = 0; k < CC_DAYS; k++) {
    const dk = ndRealDay(k).date;
    strip += '<button class="ccd-chip' + (k === i ? ' active' : '') + ([5, 6].indexOf(dk.getDay()) >= 0 ? ' wknd' : '') + '" onclick="ccSelectDay(' + k + ')"><span class="ccd-chip-dow">' + DAY[dk.getDay()] + '</span><span class="ccd-chip-num">' + dk.getDate() + '</span><span class="ccd-chip-mon">' + MON[dk.getMonth()] + '</span></button>';
  }
  strip += '</div>';

  let summary = '<div class="ccd-summary">';
  summary += '<div class="ccd-sum-head"><button class="ccd-nav" aria-label="Previous day" onclick="ccSelectDay(' + (i - 1) + ')"' + (i === 0 ? ' disabled' : '') + '>‹</button><div class="ccd-sum-date"><div class="ccd-sum-day">' + DAYL[d.getDay()] + ', ' + d.getDate() + ' ' + MON[d.getMonth()] + '</div>' +
    (ccPriceMode === 'guest' ? '<div class="ccd-sum-sub">' + ccLos + '-night stay · ' + ccStayLabel(i) + '</div>' : '<div class="ccd-sum-sub">Host nightly rate</div>') +
    '</div><button class="ccd-nav" aria-label="Next day" onclick="ccSelectDay(' + (i + 1) + ')"' + (i === CC_DAYS - 1 ? ' disabled' : '') + '>›</button></div>';
  summary += yours.booked
    ? '<div class="ccd-verdict"><span class="ccd-label">Your price</span><span class="ccd-big">Booked</span></div>'
    : '<div class="ccd-verdict"><span class="ccd-label">Your price</span><span class="ccd-big">' + you + '</span>' + (med !== null ? '<span class="ccd-label">Competitors ' + prices[0] + (prices.length > 1 ? '–' + prices[prices.length - 1] : '') + '</span>' : '') + '</div>';
  summary += '<div class="ccd-stats"><span><strong>' + avail.length + '</strong> of ' + rows.length + ' available</span><span><strong>' + rows.filter(r => r.cell.booked).length + '</strong> booked</span>' + (ccPriceMode === 'guest' ? '<span><strong>' + rows.filter(r => r.cell.nb).length + '</strong> not bookable</span>' : '') + '</div>';
  summary += '</div>';

  const all = [{ name: '__yours__', you: true, cell: yours }].concat(rows);
  const thumb = '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M2 11l3.5-3.5 3 3 2-2L14 12"/></svg>';
  let list = '<div class="ccd-list-head"><span>Competitors (' + rows.length + ')</span><span>' + (ccPriceMode === 'guest' ? 'Avg / night' : 'Per night') + '</span></div><div class="ccd-list" id="ccd-list">';
  all.forEach(r => {
    const cell = r.cell;
    let right;
    if (cell.na) right = '<span class="ccd-chip-status">N/A</span>';
    else if (cell.nb) right = '<span class="ccd-chip-status">N/B</span>';
    else if (cell.booked) right = '<span class="ccd-price booked">' + ccShown(cell) + '</span><span class="ccd-chip-status">Booked</span>';
    else {
      const v = ccShown(cell);
      right = '<span class="ccd-price">' + v + '</span>';
      if (!r.you && !yours.booked) {
        const dv = v - you;
        right += '<span class="ccd-vs ' + (dv > 0 ? 'up' : dv < 0 ? 'down' : '') + '">' + (dv === 0 ? 'Same as you' : (dv > 0 ? '+' : '−') + Math.abs(dv) + ' vs you') + '</span>';
      }
    }
    if (r.you) {
      const youTap = ccPriceMode === 'guest' && !cell.na && !cell.nb ? ' onclick="ccOpenBreakdown(\'__yours__\',' + i + ')" style="cursor:pointer"' : '';
      list += '<div class="ccd-row you"' + youTap + '><div class="ccd-thumb you">You</div><div class="ccd-body"><div class="ccd-name">Your Room Type</div><div class="ccd-meta">' + cell.minStay + '-night min · Fee ' + ccPrice(CC_YOUR_FEE) + ' · <a href="#" onclick="event.preventDefault();ndOpenSheet(\'bs-comp-set-edit\')">Edit markup &amp; fees</a></div></div><div class="ccd-right">' + right + '</div></div>';
    } else {
      const c = r.c;
      const rating = c.rating ? ND_STAR_ICON + ' ' + c.rating + ' (' + c.reviews + ')' : ND_STAR_ICON + ' New';
      const esc = r.name.replace(/'/g, "\\'");
      const rowTap = ccPriceMode === 'guest' && !cell.na && !cell.nb ? 'ccOpenBreakdown(\'' + esc + '\',' + i + ')' : 'ccOpenCompetitor(\'' + esc + '\')';
      list += '<div class="ccd-row" onclick="' + rowTap + '"><div class="ccd-thumb">' + thumb + '</div><div class="ccd-body"><div class="ccd-name">' + r.name + '</div><div class="ccd-meta">' + c.br + ' · ' + rating + ' · ' + c.dist + '</div><div class="ccd-meta">' + c.minStay + '-night min · Fee ' + ccPrice(c.fee) + '</div></div><div class="ccd-right">' + right + '</div><span class="ccd-chev">›</span></div>';
    }
  });
  list += '</div>';

  const root = document.getElementById('cc-date-view');
  const prevScroll = document.getElementById('ccd-strip') ? document.getElementById('ccd-strip').scrollLeft : null;
  root.innerHTML = strip + list;
  const st = document.getElementById('ccd-strip');
  const chip = st.children[i];
  if (prevScroll !== null) st.scrollLeft = prevScroll;
  const cl = chip.offsetLeft, cr = cl + chip.offsetWidth;
  if (cl < st.scrollLeft + 8 || cr > st.scrollLeft + st.clientWidth - 8) st.scrollLeft = cl - (st.clientWidth - chip.offsetWidth) / 2;
  ccAttachDaySwipe(document.getElementById('ccd-list'));
}
function ccSelectDay(k) {
  ccSelDay = Math.max(0, Math.min(CC_DAYS - 1, k));
  ccRender();
}
/* Horizontal swipe on the list steps a day; vertical movement is left
   to page scroll. */
function ccAttachDaySwipe(el) {
  let x0 = null, y0 = null;
  el.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  el.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    x0 = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) ccSelectDay(ccSelDay + (dx < 0 ? 1 : -1));
  }, { passive: true });
}
function ccOpenBreakdown(name, i) {
  const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const yours = name === '__yours__';
  const c = yours ? { fee: CC_YOUR_FEE } : (CC_COMPS[name] || { fee: 0 });
  const d = ndRealDay(i).date;
  let base = 0;
  for (let k = 0; k < ccLos; k++) base += ccCell(name, Math.min(i + k, CC_DAYS + 6)).price;
  const markup = Math.round(base * 0.13);
  const fee = c.fee || 0;
  const total = base + markup + fee;
  const avg = Math.round(total / ccLos);
  const nights = ccLos + ' Night' + (ccLos > 1 ? 's' : '');
  const row = (label, value, cls) => '<div class="ccb-row' + (cls ? ' ' + cls : '') + '"><span>' + label + '</span><span>' + value + '</span></div>';
  let html = row('Average Price for ' + nights + ' Stay', ccStayLabel(i).replace(' – ', ' - '), 'head');
  if (yours) {
    html += row('Total Guest Price for ' + nights + ' Stay', base + ' USD', 'sub');
    html += row('PMS Markup', '<em>+' + markup + '</em> | ' + (base + markup) + ' USD', 'sub');
    html += row('Cleaning Fee', '<em>+' + fee + '</em> | ' + total + ' USD', 'sub');
    html += row('Guest Price after all applicable fees', total + ' USD', 'total');
  } else {
    html += row('Total Guest Price for ' + nights + ' Stay', total + ' USD', 'sub');
  }
  html += row('Average Nightly Price', '<small>' + total + '/' + ccLos + 'N</small> | <strong>' + avg + ' USD</strong>', 'total');
  document.getElementById('ccb-date').textContent = MON[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  document.getElementById('ccb-name').textContent = yours ? 'Your Listing' : name;
  document.getElementById('ccb-table').innerHTML = html;
  const btn = document.getElementById('ccb-cal-btn');
  btn.style.display = yours ? 'none' : '';
  btn.onclick = function () { ndCloseSheet('bs-cc-breakdown'); ccOpenCompetitor(name); };
  ndOpenSheet('bs-cc-breakdown');
}
function ccOpenCompetitor(name) {
  const c = CC_COMPS[name] || {};
  openCompCalendar(name, c.rating || '—', c.br || '');
}

/* ── Competitor Calendar: add / remove flow (search + suggested list) ── */
function updateCompCounts() {
  const count = document.querySelectorAll('#add-comp-current-list .comp-row').length;
  document.querySelectorAll('.comp-count-badge').forEach(el => { el.textContent = count; });
  ccUpdateEmptyState();
  ccSyncTableRows();
}

/* ── Keep the Competitor Calendar table's rows in sync with whichever
   competitors are actually in the "current" (added) list — the table
   previously always showed every sample competitor regardless of the
   count badge, so e.g. adding 4 still showed all 9 rows. ── */
function ccSyncTableRows() {
  ccRender();
}

/* ── Competitor Calendar empty state: the section defaults to "no
   listings added" (matching a brand-new account) rather than starting
   pre-seeded with a comp set, revealing the populated table only once
   at least one competitor has actually been added. ── */
/* ── Competitor Calendar: a booked/unavailable date previously rendered
   as a bare "—" with line-through CSS on it — a strikethrough on a
   single dash reads as nothing, so it looked like those cells were just
   empty rather than "booked" specifically. Filling them with a plausible
   struck-through price (averaged from that row's nearest available
   neighbors) makes the strike visually mean something. ── */
function ccUpdateEmptyState() {
  const empty = document.getElementById('cc-empty-state');
  const populated = document.getElementById('cc-populated');
  if (!empty || !populated) return;
  const hasCompetitors = document.querySelectorAll('#add-comp-current-list .comp-row').length > 0;
  empty.style.display = hasCompetitors ? 'none' : '';
  const manage = document.getElementById('cc-manage-btn');
  if (manage) manage.style.display = hasCompetitors ? '' : 'none';
  populated.style.display = hasCompetitors ? '' : 'none';
}
function ccInitEmptyState() {
  const currentList = document.getElementById('add-comp-current-list');
  const suggestedList = document.getElementById('add-comp-suggested-list');
  if (!currentList || !suggestedList || currentList.dataset.ccInit) return;
  currentList.dataset.ccInit = '1';
  /* Move the pre-seeded sample competitors into "Suggested nearby" and
     flip their buttons back to "+ Add", simulating a fresh account that
     hasn't chosen a comp set yet — the Manage Competitors flow itself
     (add/remove, search) still works exactly the same either way. */
  Array.from(currentList.querySelectorAll('.comp-row')).forEach(row => {
    const btn = row.querySelector('.comp-row-btn');
    btn.textContent = '+ Add';
    btn.classList.remove('remove');
    btn.classList.add('add');
    btn.setAttribute('onclick', 'addCompetitorRow(this)');
    suggestedList.insertBefore(row, suggestedList.firstChild);
  });
  updateCompCounts();
}
/* "Auto-select Close Matches" (item: Change Compset empty state) — adds
   the first few suggested nearby listings in one tap rather than making
   the user add each one individually. */
function ccAutoSelectCloseMatches() {
  const suggested = document.querySelectorAll('#add-comp-suggested-list .comp-row-btn.add');
  Array.from(suggested).slice(0, 4).forEach(btn => addCompetitorRow(btn));
  ndCloseSheet('bs-add-competitors');
}
function addCompetitorRow(btn) {
  const row = btn.closest('.comp-row');
  const list = document.getElementById('add-comp-current-list');
  btn.textContent = '✕';
  btn.classList.remove('add');
  btn.classList.add('remove');
  btn.setAttribute('onclick', 'removeCompetitorRow(this)');
  list.insertBefore(row, list.firstChild);
  updateCompCounts();
}
function removeCompetitorRow(btn) {
  const row = btn.closest('.comp-row');
  const list = document.getElementById('add-comp-suggested-list');
  btn.textContent = '+ Add';
  btn.classList.remove('remove');
  btn.classList.add('add');
  btn.setAttribute('onclick', 'addCompetitorRow(this)');
  list.appendChild(row);
  updateCompCounts();
}
function filterCompSuggestions(query) {
  const q = query.trim().toLowerCase();
  document.querySelectorAll('#add-comp-current-list .comp-row, #add-comp-suggested-list .comp-row').forEach(row => {
    const name = (row.getAttribute('data-name') || '').toLowerCase();
    row.style.display = !q || name.includes(q) ? '' : 'none';
  });
}

/* ═══════════════════════════════════════════════════════════════
   Highcharts setup — trading-app style (Robinhood/Coinbase/Upstox-
   inspired): big price header, persistent date + price axes, tap-
   and-drag crosshair scrubbing that live-updates the header and a
   floating tooltip card with the market range at that point.
   ═══════════════════════════════════════════════════════════════ */

if (window.Highcharts) {
  Highcharts.setOptions({
    chart: { style: { fontFamily: "'IBM Plex Sans', sans-serif" } },
    credits: { enabled: false },
    title: { text: null },
    exporting: { enabled: false },
    /* Highcharts' default behavior dims every OTHER series to ~20%
       opacity the moment one is hovered/tapped, so the rest of the
       chart looks like it vanished — a legitimate desktop hover cue,
       but on a touch phone there's no mouseout to undo it, so a single
       tap on a line leaves the chart stuck half-invisible. Series
       visibility should only change through our own legend's explicit
       toggle (the .togglable click handler), never from just touching
       the plot area, so the inactive-on-hover dimming is turned off
       everywhere by default. */
    plotOptions: { series: { states: { inactive: { opacity: 1 } } } }
  });
}

/* ── seeded PRNG so data is stable across reloads/range switches ── */
function ndSeededRand(seed) {
  let s = seed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/* ── Real market data, replacing the earlier randomized generator ──
   Source: "Market KPI.csv" (monthly summary) and "Price Occ for
   408397.csv" (daily percentile/occupancy series), both supplied by
   the user. REAL_DAILY starts today (2026-09-24) and runs ~360 days
   ahead; REAL_HIST_MONTHS/REAL_HIST covers Sep 2025-Aug 2026 (y2026)
   vs. Sep 2024-Aug 2025 (y2025). ── */
const REAL_DAILY_START = "2026-09-24";
/* Row shape: [p25,p50,p75,p90,listingPrice,marketOcc,lyOccToday,lyOccFinal,pickup,pickupLY,unavailable(0/1),eventLabel,upcomingADR,lastYearADR,datesStly,yourBookedOcc]
   upcomingADR/lastYearADR are price values (same magnitude as the
   percentile columns, not small counts) — an earlier pass mislabeled
   them as booking counts before checking the actual numbers against the
   desktop reference tooltip, which shows this same data as "Last Year
   ADR: $X". datesStly is the same-calendar-date-last-year reference the
   real CSV carries for that day, used for the "(on <date>)" context. */
const REAL_DAILY = [
[102.0,137.0,175.0,207.0,53.0,44.9,52.7,55.7,17.0,20.6,0,"CF at Lincoln Fn Std",65.0,50.0,"Thu, Sep 25 2025",100.0],
[134.0,175.0,214.0,246.0,60.0,58.1,57.4,63.8,18.2,16.1,0,"CF at Lincoln Fn Std",65.0,50.0,"Fri, Sep 26 2025",100.0],
[128.0,157.0,192.0,245.0,60.0,55.6,62.4,70.0,16.7,14.0,0,"CF at Franklin Field",65.0,50.0,"Sat, Sep 27 2025",100.0],
[85.0,111.0,137.0,178.0,60.0,39.7,37.3,48.6,12.0,10.1,0,null,65.0,50.0,"Sun, Sep 28 2025",100.0],
[84.0,111.0,136.0,182.0,60.0,29.0,27.0,39.3,9.5,7.5,0,null,0.0,50.0,"Mon, Sep 29 2025",0.0],
[83.0,106.0,138.0,179.0,60.0,26.3,24.5,35.4,8.4,6.6,0,null,0.0,50.0,"Tue, Sep 30 2025",0.0],
[86.0,109.0,136.0,183.0,60.0,29.6,24.5,40.5,9.4,4.9,0,null,0.0,50.0,"Wed, Oct 01 2025",0.0],
[99.0,130.0,159.0,196.0,60.0,32.8,35.6,54.1,8.7,5.5,0,null,81.0,50.0,"Thu, Oct 02 2025",100.0],
[135.0,170.0,203.0,242.0,62.0,39.8,45.7,76.3,9.8,11.7,0,"Jonas Brothers",81.0,50.0,"Fri, Oct 03 2025",100.0],
[132.0,161.0,197.0,238.0,72.0,39.0,50.4,89.4,11.4,11.2,0,"Jonas Brothers",81.0,50.0,"Sat, Oct 04 2025",100.0],
[99.0,123.0,144.0,190.0,60.0,27.5,29.6,61.0,8.4,5.3,0,"NFL at Lncln Fn Stdm",0.0,50.0,"Sun, Oct 05 2025",0.0],
[86.0,107.0,133.0,186.0,60.0,23.3,20.9,51.0,6.7,2.9,0,null,0.0,50.0,"Mon, Oct 06 2025",0.0],
[86.0,110.0,132.0,170.0,60.0,20.1,15.9,43.6,5.7,1.9,0,null,0.0,50.0,"Tue, Oct 07 2025",0.0],
[90.0,114.0,133.0,177.0,60.0,17.1,19.7,49.1,4.1,1.8,0,null,0.0,50.0,"Wed, Oct 08 2025",0.0],
[105.0,137.0,172.0,217.0,60.0,20.2,27.1,56.7,4.7,3.6,0,null,0.0,50.0,"Thu, Oct 09 2025",0.0],
[139.0,185.0,232.0,262.0,86.0,37.4,43.9,85.1,6.3,8.2,0,"CF at Lincoln Fn Std",0.0,50.0,"Fri, Oct 10 2025",0.0],
[131.0,164.0,194.0,236.0,94.0,41.1,45.6,90.2,5.7,10.2,0,"CF at Lincoln Fn Std",0.0,50.0,"Sat, Oct 11 2025",0.0],
[93.0,120.0,146.0,200.0,60.0,24.0,31.0,65.0,4.2,4.9,0,"Columbus Day",0.0,50.0,"Sun, Oct 12 2025",0.0],
[87.0,109.0,134.0,186.0,60.0,18.3,18.0,53.8,4.6,3.0,0,null,0.0,50.0,"Mon, Oct 13 2025",0.0],
[87.0,109.0,141.0,183.0,60.0,18.4,13.5,43.4,5.1,4.5,0,null,0.0,75.0,"Tue, Oct 14 2025",0.0],
[104.0,133.0,162.0,202.0,60.0,15.9,15.0,43.5,4.1,4.6,0,null,0.0,75.0,"Wed, Oct 15 2025",0.0],
[114.0,162.0,210.0,249.0,78.0,17.9,20.0,46.4,5.2,7.6,0,"CF at Franklin Field",0.0,55.0,"Thu, Oct 16 2025",0.0],
[136.0,188.0,237.0,266.0,87.0,25.0,30.4,63.5,7.7,8.2,0,"CF at Lincoln Fn Std",0.0,89.0,"Fri, Oct 17 2025",0.0],
[132.0,167.0,205.0,241.0,87.0,26.0,32.1,72.6,7.2,9.2,0,"CF at Lincoln Fn Std",0.0,89.0,"Sat, Oct 18 2025",0.0],
[98.0,119.0,147.0,201.0,69.0,18.5,23.9,62.9,5.7,5.9,0,"NFL at Lncln Fn Stdm",0.0,54.0,"Sun, Oct 19 2025",0.0],
[81.0,102.0,139.0,200.0,60.0,9.8,11.1,46.4,4.2,1.8,0,null,0.0,54.0,"Mon, Oct 20 2025",0.0],
[82.0,102.0,147.0,200.0,60.0,8.7,10.3,50.3,3.6,2.1,0,null,0.0,0.0,"Tue, Oct 21 2025",0.0],
[106.0,136.0,166.0,208.0,60.0,8.1,13.8,54.2,3.6,2.6,0,null,0.0,0.0,"Wed, Oct 22 2025",0.0],
[120.0,183.0,216.0,260.0,77.0,11.7,17.8,62.5,4.6,3.9,0,"CF at Franklin Field",0.0,108.0,"Thu, Oct 23 2025",0.0],
[140.0,193.0,245.0,288.0,86.0,19.9,29.2,76.0,5.6,7.3,0,"CF at Franklin Field",0.0,108.0,"Fri, Oct 24 2025",0.0],
[134.0,181.0,229.0,262.0,75.0,23.6,29.8,88.3,5.1,9.0,0,"NFL at Lncln Fn Stdm",0.0,108.0,"Sat, Oct 25 2025",0.0],
[113.0,145.0,177.0,211.0,72.0,17.0,14.0,56.3,3.6,1.9,0,"NFL at Lncln Fn Stdm",0.0,65.0,"Sun, Oct 26 2025",0.0],
[106.0,126.0,149.0,205.0,72.0,13.8,7.8,40.6,3.1,1.1,0,"NFL at Lncln Fn Stdm",0.0,68.0,"Mon, Oct 27 2025",0.0],
[88.0,110.0,144.0,203.0,72.0,9.7,7.0,45.4,3.0,0.0,0,null,0.0,68.0,"Tue, Oct 28 2025",0.0],
[92.0,114.0,149.0,203.0,72.0,8.1,9.4,48.0,2.5,1.1,0,null,0.0,0.0,"Wed, Oct 29 2025",0.0],
[113.0,142.0,177.0,229.0,72.0,11.7,10.5,56.5,2.5,1.0,0,null,0.0,100.0,"Thu, Oct 30 2025",0.0],
[137.0,183.0,225.0,273.0,94.0,15.7,14.1,65.7,2.5,3.9,0,"CF at Lincoln Fn Std",0.0,100.0,"Fri, Oct 31 2025",0.0],
[129.0,157.0,185.0,248.0,95.0,18.3,11.5,57.3,2.5,3.2,0,"Halloween",0.0,100.0,"Sat, Nov 01 2025",0.0],
[91.0,114.0,142.0,201.0,72.0,11.3,6.7,43.4,2.6,0.0,0,null,0.0,100.0,"Sun, Nov 02 2025",0.0],
[88.0,116.0,143.0,201.0,72.0,5.7,3.7,44.7,1.5,0.0,0,null,0.0,86.0,"Mon, Nov 03 2025",0.0],
[89.0,117.0,143.0,201.0,72.0,5.7,3.6,44.9,0.5,0.0,0,null,0.0,86.0,"Tue, Nov 04 2025",0.0],
[96.0,119.0,149.0,204.0,72.0,5.2,4.6,49.7,0.5,0.9,0,null,0.0,86.0,"Wed, Nov 05 2025",0.0],
[112.0,148.0,178.0,222.0,72.0,7.2,5.4,57.6,1.0,1.7,0,null,0.0,86.0,"Thu, Nov 06 2025",0.0],
[134.0,183.0,220.0,254.0,81.0,10.8,9.8,75.7,1.0,4.4,0,"NFL at Lncln Fn Stdm",0.0,86.0,"Fri, Nov 07 2025",0.0],
[131.0,165.0,193.0,236.0,87.0,11.3,9.4,79.9,1.5,3.4,0,"NFL at Lncln Fn Stdm",0.0,86.0,"Sat, Nov 08 2025",0.0],
[106.0,129.0,161.0,212.0,74.0,10.2,4.2,62.1,1.5,1.8,0,"NFL at Lncln Fn Stdm",0.0,86.0,"Sun, Nov 09 2025",0.0],
[98.0,123.0,178.0,254.0,104.0,4.7,3.4,50.2,0.5,1.8,0,null,0.0,86.0,"Mon, Nov 10 2025",0.0],
[104.0,132.0,192.0,332.0,104.0,4.1,2.7,52.0,0.5,1.9,0,"Veterans Day",0.0,86.0,"Tue, Nov 11 2025",0.0],
[109.0,142.0,193.0,332.0,104.0,4.2,3.5,40.2,0.5,1.8,0,"Veterans Day",0.0,86.0,"Wed, Nov 12 2025",0.0],
[114.0,181.0,259.0,350.0,104.0,6.8,5.2,51.3,0.0,2.6,0,"Veterans Day",0.0,86.0,"Thu, Nov 13 2025",0.0],
[142.0,217.0,310.0,391.0,121.0,12.0,6.1,63.9,1.1,2.6,0,"CF at Franklin Field",0.0,86.0,"Fri, Nov 14 2025",0.0],
[138.0,190.0,248.0,298.0,120.0,12.0,5.5,77.2,1.1,2.7,0,"CF at Lincoln Fn Std",0.0,86.0,"Sat, Nov 15 2025",0.0],
[109.0,129.0,161.0,224.0,104.0,8.3,6.5,59.9,0.5,1.7,0,null,0.0,86.0,"Sun, Nov 16 2025",0.0],
[109.0,128.0,155.0,226.0,104.0,4.2,1.6,43.0,0.0,0.8,0,null,0.0,86.0,"Mon, Nov 17 2025",0.0],
[107.0,141.0,249.0,341.0,104.0,4.7,2.5,47.1,0.0,0.0,0,null,0.0,86.0,"Tue, Nov 18 2025",0.0],
[119.0,174.0,316.0,541.0,80.0,7.7,6.2,40.8,0.0,0.8,0,"CF at Lincoln Fn Std",0.0,86.0,"Wed, Nov 19 2025",0.0],
[123.0,197.0,400.0,576.0,121.0,15.1,8.4,54.4,1.0,0.0,0,"CF at Lincoln Fn Std",0.0,86.0,"Thu, Nov 20 2025",0.0],
[161.0,271.0,508.0,593.0,199.0,32.2,28.6,85.8,1.1,1.9,0,"NFL at Lncln Fn Stdm",0.0,159.0,"Fri, Nov 21 2025",0.0],
[148.0,251.0,450.0,591.0,216.0,40.4,37.1,89.9,1.6,4.3,0,"NFL at Lncln Fn Stdm",0.0,159.0,"Sat, Nov 22 2025",0.0],
[124.0,200.0,314.0,399.0,164.0,19.2,16.5,60.1,0.5,1.8,0,"NFL at Lncln Fn Stdm",0.0,0.0,"Sun, Nov 23 2025",0.0],
[117.0,143.0,192.0,220.0,94.0,7.3,8.5,41.8,1.1,0.9,0,null,0.0,0.0,"Mon, Nov 24 2025",0.0],
[118.0,145.0,190.0,216.0,94.0,8.4,6.6,49.4,1.0,0.0,0,null,0.0,0.0,"Tue, Nov 25 2025",0.0],
[129.0,171.0,198.0,239.0,80.0,13.7,13.0,63.9,2.1,3.2,0,"Thanksgiving",0.0,0.0,"Wed, Nov 26 2025",0.0],
[133.0,182.0,225.0,256.0,85.0,12.2,16.5,69.9,1.6,4.0,0,"Thanksgiving",0.0,0.0,"Thu, Nov 27 2025",0.0],
[144.0,197.0,247.0,287.0,113.0,13.2,13.2,61.0,1.6,2.9,0,"Thanksgiving",0.0,0.0,"Fri, Nov 28 2025",0.0],
[134.0,162.0,197.0,246.0,126.0,10.0,8.5,50.5,1.0,1.7,0,"Thanksgiving",0.0,105.0,"Sat, Nov 29 2025",0.0],
[99.0,122.0,146.0,200.0,72.0,3.7,3.3,35.7,0.0,0.8,0,null,0.0,0.0,"Sun, Nov 30 2025",0.0],
[99.0,124.0,149.0,204.0,84.0,2.1,1.6,34.5,0.0,0.0,0,null,0.0,70.0,"Mon, Dec 01 2025",0.0],
[115.0,142.0,217.0,315.0,84.0,1.6,0.8,32.3,0.0,0.0,0,null,0.0,70.0,"Tue, Dec 02 2025",0.0],
[123.0,200.0,311.0,507.0,94.0,3.1,1.6,29.7,0.0,0.0,0,null,0.0,70.0,"Wed, Dec 03 2025",0.0],
[130.0,230.0,445.0,596.0,204.0,9.4,1.6,36.4,0.0,0.0,0,"PAX Unplugged",0.0,70.0,"Thu, Dec 04 2025",0.0],
[148.0,255.0,442.0,586.0,211.0,11.4,3.2,43.1,0.5,0.0,0,"PAX Unplugged",0.0,142.0,"Fri, Dec 05 2025",0.0],
[146.0,223.0,320.0,381.0,215.0,12.0,3.2,49.6,0.5,0.0,0,"PAX Unplugged",0.0,142.0,"Sat, Dec 06 2025",0.0],
[107.0,127.0,156.0,202.0,109.0,4.8,4.4,41.5,0.0,0.0,0,null,0.0,0.0,"Sun, Dec 07 2025",0.0],
[97.0,123.0,150.0,200.0,84.0,2.7,2.4,34.9,0.0,0.0,0,null,0.0,0.0,"Mon, Dec 08 2025",0.0],
[99.0,123.0,152.0,203.0,84.0,2.7,2.3,32.7,0.0,0.0,0,null,0.0,0.0,"Tue, Dec 09 2025",0.0],
[106.0,125.0,158.0,215.0,99.0,3.3,2.5,42.4,0.6,0.0,0,null,0.0,90.0,"Wed, Dec 10 2025",0.0],
[119.0,159.0,195.0,239.0,99.0,3.3,2.6,47.9,0.6,1.1,0,null,0.0,90.0,"Thu, Dec 11 2025",0.0],
[140.0,193.0,248.0,284.0,90.0,3.8,1.5,49.8,0.6,1.0,0,"NFL at Lncln Fn Stdm",0.0,90.0,"Fri, Dec 12 2025",0.0],
[135.0,182.0,217.0,264.0,103.0,6.0,1.6,58.1,0.6,1.0,0,"NFL at Lncln Fn Stdm",0.0,90.0,"Sat, Dec 13 2025",0.0],
[115.0,138.0,172.0,211.0,87.0,2.7,1.7,47.3,0.6,0.0,0,"NFL at Lncln Fn Stdm",0.0,90.0,"Sun, Dec 14 2025",0.0],
[105.0,125.0,161.0,204.0,72.0,1.6,0.8,41.6,0.6,0.0,0,null,0.0,0.0,"Mon, Dec 15 2025",0.0],
[108.0,128.0,169.0,216.0,111.0,2.7,1.8,41.4,0.6,0.0,0,null,0.0,0.0,"Tue, Dec 16 2025",0.0],
[117.0,139.0,182.0,226.0,110.0,2.2,2.5,37.9,0.0,0.0,0,null,0.0,0.0,"Wed, Dec 17 2025",0.0],
[126.0,184.0,222.0,274.0,94.0,2.8,2.5,44.6,0.6,0.0,0,"NFL at Lncln Fn Stdm",0.0,0.0,"Thu, Dec 18 2025",0.0],
[147.0,209.0,259.0,323.0,100.0,4.4,3.2,50.5,0.6,0.8,0,"NFL at Lncln Fn Stdm",0.0,142.0,"Fri, Dec 19 2025",0.0],
[144.0,196.0,266.0,334.0,108.0,4.4,4.3,54.5,0.0,0.8,0,"NFL at Lncln Fn Stdm",0.0,142.0,"Sat, Dec 20 2025",0.0],
[123.0,182.0,263.0,325.0,131.0,2.8,4.3,53.8,0.0,0.8,0,null,0.0,0.0,"Sun, Dec 21 2025",0.0],
[129.0,189.0,265.0,334.0,92.0,2.8,5.5,53.6,0.0,0.9,0,"Pre Christmas Season",0.0,0.0,"Mon, Dec 22 2025",0.0],
[128.0,191.0,289.0,365.0,79.0,4.4,6.0,55.2,0.5,0.8,0,"NFL at Lncln Fn Stdm",0.0,92.0,"Tue, Dec 23 2025",0.0],
[130.0,197.0,294.0,405.0,118.0,8.1,7.1,67.6,0.5,0.9,0,"NFL at Lncln Fn Stdm",0.0,92.0,"Wed, Dec 24 2025",0.0],
[146.0,221.0,314.0,414.0,148.0,9.9,8.3,72.2,1.1,0.0,0,"NFL at Lncln Fn Stdm",0.0,92.0,"Thu, Dec 25 2025",0.0],
[150.0,238.0,355.0,412.0,117.0,9.8,7.3,77.1,1.1,0.0,0,"Christmas",0.0,127.0,"Fri, Dec 26 2025",0.0],
[146.0,235.0,348.0,420.0,123.0,11.0,4.4,82.0,1.1,0.0,0,"Christmas",0.0,127.0,"Sat, Dec 27 2025",0.0],
[125.0,211.0,368.0,449.0,184.0,8.9,2.7,81.3,1.1,0.0,0,"Holiday Season",0.0,127.0,"Sun, Dec 28 2025",0.0],
[126.0,207.0,394.0,455.0,153.0,6.2,1.6,63.4,1.2,0.0,0,"Holiday Season",0.0,127.0,"Mon, Dec 29 2025",0.0],
[125.0,216.0,397.0,453.0,122.0,6.2,1.7,58.2,0.6,0.0,0,"Holiday Season",0.0,0.0,"Tue, Dec 30 2025",0.0],
[131.0,230.0,403.0,488.0,137.0,6.3,1.7,72.3,1.7,0.0,0,"New Years Day",0.0,126.0,"Wed, Dec 31 2025",0.0],
[152.0,233.0,448.0,487.0,166.0,6.3,1.8,63.7,1.7,0.0,0,"New Years Day",0.0,126.0,"Thu, Jan 01 2026",0.0],
[149.0,229.0,391.0,533.0,166.0,5.0,0.8,53.6,1.6,0.0,0,"New Years Day",0.0,0.0,"Fri, Jan 02 2026",0.0],
[140.0,198.0,312.0,343.0,173.0,3.3,0.8,47.0,1.6,0.0,0,"New Years Day",0.0,0.0,"Sat, Jan 03 2026",0.0],
[107.0,129.0,161.0,213.0,109.0,2.7,0.8,40.2,1.6,0.0,0,null,0.0,82.0,"Sun, Jan 04 2026",0.0],
[106.0,128.0,156.0,205.0,109.0,2.8,0.8,39.9,1.1,0.0,0,null,0.0,82.0,"Mon, Jan 05 2026",0.0],
[107.0,126.0,156.0,205.0,99.0,2.3,0.8,36.6,1.1,0.0,0,null,0.0,82.0,"Tue, Jan 06 2026",0.0],
[110.0,126.0,157.0,202.0,109.0,2.3,0.0,36.4,1.1,0.0,0,null,0.0,82.0,"Wed, Jan 07 2026",0.0],
[115.0,147.0,170.0,216.0,109.0,1.7,0.0,35.9,1.1,0.0,0,null,0.0,82.0,"Thu, Jan 08 2026",0.0],
[131.0,164.0,192.0,236.0,99.0,1.7,0.0,39.5,1.1,0.0,0,null,0.0,82.0,"Fri, Jan 09 2026",0.0],
[126.0,150.0,172.0,230.0,103.0,0.6,1.7,43.5,0.0,0.9,0,null,0.0,82.0,"Sat, Jan 10 2026",0.0],
[104.0,123.0,152.0,197.0,101.0,0.6,0.9,39.1,0.0,0.0,0,null,0.0,82.0,"Sun, Jan 11 2026",0.0],
[103.0,123.0,156.0,198.0,97.0,0.6,0.0,36.7,0.0,0.0,0,null,0.0,82.0,"Mon, Jan 12 2026",0.0],
[106.0,123.0,157.0,202.0,97.0,0.6,0.0,38.4,0.0,0.0,0,null,0.0,82.0,"Tue, Jan 13 2026",0.0],
[110.0,127.0,159.0,210.0,97.0,0.6,0.0,44.7,0.0,0.0,0,null,0.0,82.0,"Wed, Jan 14 2026",0.0],
[120.0,154.0,178.0,221.0,97.0,1.7,0.0,50.0,0.6,0.0,0,null,0.0,82.0,"Thu, Jan 15 2026",0.0],
[136.0,175.0,207.0,250.0,88.0,2.3,0.0,52.8,0.6,0.0,0,"MLK Day",0.0,0.0,"Fri, Jan 16 2026",0.0],
[133.0,167.0,198.0,246.0,110.0,2.3,0.0,64.2,0.6,0.0,0,"MLK Day",0.0,91.0,"Sat, Jan 17 2026",0.0],
[116.0,141.0,169.0,207.0,110.0,0.6,0.0,50.4,0.6,0.0,0,"MLK Day",0.0,91.0,"Sun, Jan 18 2026",0.0],
[104.0,124.0,157.0,197.0,90.0,0.0,0.0,41.7,0.0,0.0,0,null,0.0,73.0,"Mon, Jan 19 2026",0.0],
[106.0,124.0,156.0,195.0,90.0,0.0,0.0,46.2,0.0,0.0,0,null,0.0,73.0,"Tue, Jan 20 2026",0.0],
[111.0,125.0,157.0,207.0,90.0,0.0,0.0,44.8,0.0,0.0,0,null,0.0,73.0,"Wed, Jan 21 2026",0.0],
[119.0,149.0,170.0,216.0,90.0,0.0,0.8,44.8,0.0,0.0,0,null,0.0,73.0,"Thu, Jan 22 2026",0.0],
[135.0,169.0,197.0,238.0,85.0,0.0,0.9,49.3,0.0,0.0,0,null,0.0,0.0,"Fri, Jan 23 2026",0.0],
[128.0,151.0,174.0,235.0,90.0,0.0,0.9,53.2,0.0,0.0,0,null,0.0,71.0,"Sat, Jan 24 2026",0.0],
[108.0,124.0,153.0,195.0,90.0,0.0,0.9,48.8,0.0,0.0,0,null,0.0,71.0,"Sun, Jan 25 2026",0.0],
[103.0,123.0,152.0,194.0,86.0,0.5,0.0,39.9,0.5,0.0,0,null,0.0,71.0,"Mon, Jan 26 2026",0.0],
[106.0,123.0,152.0,195.0,86.0,0.5,0.0,40.3,0.5,0.0,0,null,0.0,71.0,"Tue, Jan 27 2026",0.0],
[111.0,127.0,157.0,207.0,86.0,0.5,0.0,40.3,0.5,0.0,0,null,0.0,71.0,"Wed, Jan 28 2026",0.0],
[119.0,150.0,172.0,220.0,86.0,0.5,0.0,46.1,0.5,0.0,0,null,0.0,71.0,"Thu, Jan 29 2026",0.0],
[136.0,172.0,200.0,242.0,88.0,0.5,0.0,51.2,0.5,0.0,0,null,0.0,71.0,"Fri, Jan 30 2026",0.0],
[130.0,154.0,181.0,237.0,87.0,0.5,0.0,51.6,0.5,0.0,0,null,0.0,71.0,"Sat, Jan 31 2026",0.0],
[110.0,126.0,153.0,212.0,87.0,0.5,0.0,35.9,0.5,0.0,0,null,0.0,71.0,"Sun, Feb 01 2026",0.0],
[107.0,124.0,151.0,211.0,87.0,0.0,0.0,37.7,0.0,0.0,0,null,0.0,71.0,"Mon, Feb 02 2026",0.0],
[109.0,124.0,152.0,210.0,85.0,0.0,0.0,36.6,0.0,0.0,0,null,0.0,0.0,"Tue, Feb 03 2026",0.0],
[113.0,130.0,158.0,215.0,72.0,0.0,0.0,38.3,0.0,0.0,0,null,0.0,0.0,"Wed, Feb 04 2026",0.0],
[122.0,152.0,181.0,222.0,72.0,0.6,0.0,38.1,0.6,0.0,0,null,0.0,0.0,"Thu, Feb 05 2026",0.0],
[139.0,172.0,200.0,256.0,98.0,0.6,0.0,51.3,0.6,0.0,0,null,0.0,76.0,"Fri, Feb 06 2026",0.0],
[128.0,154.0,181.0,249.0,98.0,1.6,0.0,51.6,0.6,0.0,0,null,0.0,76.0,"Sat, Feb 07 2026",0.0],
[109.0,127.0,155.0,213.0,83.0,1.0,0.0,42.9,0.0,0.0,0,null,0.0,76.0,"Sun, Feb 08 2026",0.0],
[103.0,122.0,151.0,210.0,86.0,0.0,0.0,40.4,0.0,0.0,0,null,0.0,76.0,"Mon, Feb 09 2026",0.0],
[106.0,124.0,151.0,211.0,72.0,0.0,0.0,48.5,0.0,0.0,0,null,0.0,0.0,"Tue, Feb 10 2026",0.0],
[113.0,130.0,162.0,221.0,72.0,0.6,0.0,49.2,0.0,0.0,0,null,0.0,45.0,"Wed, Feb 11 2026",0.0],
[124.0,169.0,208.0,259.0,72.0,0.6,0.0,49.3,0.0,0.0,0,null,0.0,45.0,"Thu, Feb 12 2026",0.0],
[146.0,206.0,251.0,312.0,131.0,0.6,0.8,67.3,0.0,0.8,0,"Presidents Day",0.0,108.0,"Fri, Feb 13 2026",0.0],
[139.0,195.0,243.0,288.0,131.0,0.6,1.6,84.2,0.0,0.8,0,"Presidents Day",0.0,108.0,"Sat, Feb 14 2026",0.0],
[119.0,164.0,188.0,224.0,105.0,0.6,0.7,58.9,0.0,0.0,0,"Presidents Day",0.0,46.0,"Sun, Feb 15 2026",0.0],
[108.0,123.0,153.0,210.0,72.0,0.0,0.7,51.0,0.0,0.0,0,null,0.0,58.0,"Mon, Feb 16 2026",0.0],
[106.0,122.0,154.0,211.0,72.0,0.0,0.7,45.2,0.0,0.0,0,null,0.0,58.0,"Tue, Feb 17 2026",0.0],
[112.0,128.0,155.0,214.0,72.0,0.0,0.0,46.1,0.0,0.0,0,null,0.0,58.0,"Wed, Feb 18 2026",0.0],
[120.0,153.0,180.0,223.0,72.0,0.0,0.0,44.6,0.0,0.0,0,null,0.0,58.0,"Thu, Feb 19 2026",0.0],
[140.0,172.0,203.0,250.0,125.0,0.0,0.0,55.7,0.0,0.0,0,null,0.0,101.0,"Fri, Feb 20 2026",0.0],
[129.0,154.0,180.0,243.0,125.0,0.0,0.0,57.4,0.0,0.0,0,null,0.0,101.0,"Sat, Feb 21 2026",0.0],
[108.0,123.0,152.0,213.0,72.0,0.0,0.0,45.7,0.0,0.0,0,null,0.0,45.0,"Sun, Feb 22 2026",0.0],
[104.0,120.0,151.0,213.0,72.0,0.0,0.0,42.0,0.0,0.0,0,null,0.0,45.0,"Mon, Feb 23 2026",0.0],
[107.0,121.0,151.0,213.0,72.0,0.0,0.0,42.3,0.0,0.0,0,null,0.0,45.0,"Tue, Feb 24 2026",0.0],
[113.0,127.0,154.0,215.0,72.0,0.0,0.0,39.4,0.0,0.0,0,null,0.0,45.0,"Wed, Feb 25 2026",0.0],
[119.0,150.0,176.0,221.0,72.0,0.0,0.8,48.9,0.0,0.0,0,null,0.0,45.0,"Thu, Feb 26 2026",0.0],
[138.0,172.0,198.0,250.0,99.0,0.0,0.8,59.6,0.0,0.0,0,null,0.0,0.0,"Fri, Feb 27 2026",0.0],
[131.0,154.0,179.0,244.0,99.0,0.0,0.8,77.3,0.0,0.0,0,null,0.0,0.0,"Sat, Feb 28 2026",0.0],
[110.0,125.0,155.0,208.0,72.0,0.6,0.8,57.1,0.0,0.0,0,null,0.0,0.0,"Sun, Mar 01 2026",0.0],
[108.0,123.0,153.0,212.0,72.0,1.2,0.0,57.0,0.0,0.0,0,null,0.0,0.0,"Mon, Mar 02 2026",0.0],
[108.0,125.0,153.0,209.0,72.0,0.6,0.0,47.9,0.0,0.0,0,null,0.0,0.0,"Tue, Mar 03 2026",0.0],
[111.0,126.0,157.0,221.0,72.0,0.6,0.0,49.9,0.0,0.0,0,null,0.0,0.0,"Wed, Mar 04 2026",0.0],
[119.0,154.0,180.0,232.0,72.0,0.6,0.0,55.9,0.0,0.0,0,null,0.0,47.0,"Thu, Mar 05 2026",0.0],
[143.0,176.0,212.0,256.0,107.0,1.2,0.0,70.8,0.0,0.0,0,null,0.0,63.0,"Fri, Mar 06 2026",0.0],
[132.0,159.0,183.0,255.0,107.0,1.2,0.0,72.7,0.6,0.0,0,null,0.0,63.0,"Sat, Mar 07 2026",0.0],
[109.0,123.0,153.0,213.0,97.0,1.2,0.0,60.1,0.6,0.0,0,null,0.0,71.0,"Sun, Mar 08 2026",0.0],
[106.0,124.0,152.0,212.0,97.0,1.2,0.0,51.2,0.6,0.0,0,null,0.0,71.0,"Mon, Mar 09 2026",0.0],
[107.0,125.0,152.0,214.0,115.0,1.2,0.0,46.8,0.6,0.0,0,null,0.0,0.0,"Tue, Mar 10 2026",0.0],
[113.0,130.0,161.0,224.0,95.0,1.2,0.0,50.5,0.6,0.0,0,null,0.0,67.0,"Wed, Mar 11 2026",0.0],
[124.0,162.0,191.0,240.0,83.0,1.2,0.0,55.9,0.6,0.0,0,null,0.0,67.0,"Thu, Mar 12 2026",0.0],
[145.0,183.0,228.0,273.0,140.0,2.2,0.0,66.6,0.6,0.0,0,null,0.0,127.0,"Fri, Mar 13 2026",0.0],
[135.0,162.0,201.0,261.0,140.0,2.2,0.0,66.0,0.6,0.0,0,null,0.0,127.0,"Sat, Mar 14 2026",0.0],
[109.0,128.0,158.0,218.0,104.0,0.6,0.0,49.0,0.0,0.0,0,null,0.0,96.0,"Sun, Mar 15 2026",0.0],
[108.0,134.0,166.0,224.0,104.0,1.2,0.0,43.8,0.6,0.0,0,null,0.0,96.0,"Mon, Mar 16 2026",0.0],
[109.0,149.0,185.0,224.0,153.0,1.2,0.0,46.7,0.6,0.0,0,"St. Patricks Day",0.0,96.0,"Tue, Mar 17 2026",0.0],
[115.0,156.0,191.0,238.0,153.0,0.6,0.0,51.0,0.6,0.0,0,"St. Patricks Day",0.0,96.0,"Wed, Mar 18 2026",0.0],
[128.0,171.0,207.0,253.0,115.0,0.6,0.8,59.1,0.0,0.0,0,"St. Patricks Day",0.0,96.0,"Thu, Mar 19 2026",0.0],
[145.0,189.0,238.0,284.0,148.0,0.6,0.0,75.3,0.0,0.0,0,null,0.0,136.0,"Fri, Mar 20 2026",0.0],
[140.0,167.0,209.0,270.0,148.0,0.6,0.0,73.6,0.0,0.0,0,null,0.0,136.0,"Sat, Mar 21 2026",0.0],
[113.0,129.0,159.0,224.0,97.0,0.0,0.0,52.1,0.0,0.0,0,null,0.0,75.0,"Sun, Mar 22 2026",0.0],
[108.0,122.0,155.0,218.0,103.0,0.0,0.0,42.5,0.0,0.0,0,null,0.0,75.0,"Mon, Mar 23 2026",0.0],
[110.0,126.0,156.0,220.0,103.0,0.0,0.0,47.1,0.0,0.0,0,null,0.0,75.0,"Tue, Mar 24 2026",0.0],
[115.0,136.0,166.0,229.0,101.0,0.0,0.0,51.4,0.0,0.0,0,null,0.0,75.0,"Wed, Mar 25 2026",0.0],
[125.0,172.0,208.0,250.0,101.0,0.6,0.0,58.7,0.0,0.0,0,null,0.0,75.0,"Thu, Mar 26 2026",0.0],
[146.0,206.0,253.0,293.0,109.0,1.3,0.0,69.9,0.0,0.0,0,"Easter",0.0,79.0,"Fri, Mar 27 2026",0.0],
[138.0,183.0,227.0,270.0,115.0,1.3,0.0,81.7,0.0,0.0,0,"Easter",0.0,79.0,"Sat, Mar 28 2026",0.0],
[118.0,145.0,179.0,223.0,105.0,1.3,0.0,53.1,0.0,0.0,0,"Easter",0.0,79.0,"Sun, Mar 29 2026",0.0],
[110.0,133.0,157.0,221.0,113.0,0.7,0.0,50.4,0.0,0.0,0,null,0.0,106.0,"Mon, Mar 30 2026",0.0],
[111.0,136.0,162.0,222.0,113.0,0.0,0.0,52.1,0.0,0.0,0,null,0.0,106.0,"Tue, Mar 31 2026",0.0],
[117.0,151.0,167.0,241.0,85.0,0.7,0.0,46.6,0.0,0.0,0,null,0.0,0.0,"Wed, Apr 01 2026",0.0],
[127.0,169.0,200.0,253.0,90.0,1.3,0.0,51.6,0.0,0.0,0,null,0.0,0.0,"Thu, Apr 02 2026",0.0],
[143.0,191.0,233.0,276.0,113.0,1.3,0.0,58.5,0.0,0.0,0,null,0.0,74.0,"Fri, Apr 03 2026",0.0],
[132.0,175.0,199.0,259.0,121.0,1.3,0.0,52.4,0.0,0.0,0,null,0.0,74.0,"Sat, Apr 04 2026",0.0],
[111.0,136.0,156.0,222.0,97.0,1.3,0.0,47.8,0.0,0.0,0,null,0.0,74.0,"Sun, Apr 05 2026",0.0],
[106.0,133.0,156.0,221.0,105.0,0.7,0.0,40.6,0.0,0.0,0,null,0.0,74.0,"Mon, Apr 06 2026",0.0],
[111.0,134.0,157.0,227.0,101.0,0.7,0.0,40.9,0.0,0.0,0,null,0.0,0.0,"Tue, Apr 07 2026",0.0],
[116.0,147.0,165.0,236.0,77.0,0.7,0.0,41.3,0.0,0.0,0,null,0.0,66.0,"Wed, Apr 08 2026",0.0],
[125.0,170.0,194.0,245.0,79.0,0.7,0.0,47.7,0.0,0.0,0,null,0.0,66.0,"Thu, Apr 09 2026",0.0],
[141.0,186.0,227.0,275.0,130.0,0.7,0.0,56.6,0.0,0.0,0,null,0.0,101.0,"Fri, Apr 10 2026",0.0],
[129.0,170.0,197.0,256.0,130.0,0.6,0.0,59.3,0.0,0.0,0,null,0.0,101.0,"Sat, Apr 11 2026",0.0],
[112.0,132.0,158.0,217.0,105.0,0.6,0.0,42.3,0.0,0.0,0,null,0.0,101.0,"Sun, Apr 12 2026",0.0],
[108.0,129.0,159.0,217.0,81.0,0.6,0.0,42.9,0.0,0.0,0,null,0.0,0.0,"Mon, Apr 13 2026",0.0],
[112.0,133.0,159.0,220.0,74.0,0.7,0.0,37.6,0.0,0.0,0,null,0.0,62.0,"Tue, Apr 14 2026",0.0],
[116.0,151.0,173.0,240.0,75.0,0.7,0.0,42.5,0.0,0.0,0,null,0.0,62.0,"Wed, Apr 15 2026",0.0],
[129.0,183.0,216.0,271.0,88.0,1.3,0.0,47.2,0.0,0.0,0,null,0.0,0.0,"Thu, Apr 16 2026",0.0],
[144.0,203.0,254.0,309.0,171.0,2.0,0.0,68.1,0.7,0.0,0,null,0.0,164.0,"Fri, Apr 17 2026",0.0],
[133.0,182.0,207.0,270.0,171.0,1.3,0.0,72.1,0.7,0.0,0,null,0.0,164.0,"Sat, Apr 18 2026",0.0],
[114.0,135.0,165.0,225.0,93.0,1.4,0.0,55.4,0.7,0.0,0,null,0.0,61.0,"Sun, Apr 19 2026",0.0],
[114.0,135.0,169.0,225.0,79.0,1.4,0.0,54.8,0.7,0.0,0,null,0.0,61.0,"Mon, Apr 20 2026",0.0],
[116.0,143.0,175.0,230.0,76.0,1.4,0.0,53.3,0.7,0.0,0,null,0.0,61.0,"Tue, Apr 21 2026",0.0],
[121.0,155.0,188.0,245.0,76.0,1.3,0.0,53.9,0.6,0.0,0,null,0.0,61.0,"Wed, Apr 22 2026",0.0],
[134.0,191.0,238.0,297.0,89.0,1.3,0.0,60.0,0.6,0.0,0,null,0.0,61.0,"Thu, Apr 23 2026",0.0],
[144.0,227.0,278.0,335.0,157.0,2.0,0.0,68.2,0.6,0.0,0,"Luke combs",0.0,116.0,"Fri, Apr 24 2026",0.0],
[136.0,194.0,241.0,290.0,164.0,2.1,0.0,74.6,0.7,0.0,0,"Luke combs",0.0,116.0,"Sat, Apr 25 2026",0.0],
[116.0,145.0,179.0,227.0,85.0,1.4,0.0,46.4,0.0,0.0,0,null,0.0,0.0,"Sun, Apr 26 2026",0.0],
[109.0,137.0,163.0,223.0,84.0,0.7,0.0,39.0,0.0,0.0,0,null,0.0,71.0,"Mon, Apr 27 2026",0.0],
[115.0,139.0,176.0,230.0,80.0,0.7,0.0,38.5,0.0,0.0,0,null,0.0,71.0,"Tue, Apr 28 2026",0.0],
[124.0,156.0,191.0,251.0,80.0,1.9,0.7,47.3,0.6,0.7,0,null,0.0,71.0,"Wed, Apr 29 2026",0.0],
[135.0,187.0,224.0,297.0,98.0,2.6,2.2,53.3,0.6,1.4,0,null,0.0,71.0,"Thu, Apr 30 2026",0.0],
[145.0,221.0,254.0,323.0,129.0,4.6,3.0,67.4,0.6,1.5,0,null,0.0,71.0,"Fri, May 01 2026",0.0],
[141.0,193.0,235.0,287.0,141.0,4.6,3.0,72.2,0.6,1.5,0,null,0.0,71.0,"Sat, May 02 2026",0.0],
[117.0,153.0,188.0,231.0,103.0,4.6,3.0,60.3,0.6,1.5,0,null,0.0,71.0,"Sun, May 03 2026",0.0],
[121.0,156.0,188.0,245.0,84.0,2.7,0.0,43.8,0.0,0.0,0,null,0.0,71.0,"Mon, May 04 2026",0.0],
[123.0,160.0,197.0,252.0,72.0,2.0,0.0,46.8,0.0,0.0,0,"TU - Spring Com",0.0,57.0,"Tue, May 05 2026",0.0],
[128.0,175.0,214.0,287.0,81.0,2.0,0.0,44.6,0.0,0.0,0,"TU - Spring Com",0.0,57.0,"Wed, May 06 2026",0.0],
[136.0,209.0,254.0,316.0,111.0,3.3,0.0,49.6,0.0,0.0,0,"TU - Spring Com",0.0,0.0,"Thu, May 07 2026",0.0],
[149.0,231.0,284.0,363.0,141.0,4.0,0.0,52.4,0.0,0.0,0,null,0.0,96.0,"Fri, May 08 2026",0.0],
[143.0,206.0,247.0,311.0,147.0,2.7,0.0,56.1,0.0,0.0,0,null,0.0,96.0,"Sat, May 09 2026",0.0],
[122.0,155.0,189.0,234.0,104.0,1.4,0.0,40.9,0.0,0.0,0,null,0.0,96.0,"Sun, May 10 2026",0.0],
[118.0,147.0,179.0,237.0,87.0,1.4,0.8,42.5,0.0,0.0,0,null,0.0,57.0,"Mon, May 11 2026",0.0],
[122.0,161.0,206.0,256.0,72.0,0.7,0.7,43.8,0.0,0.0,0,null,0.0,57.0,"Tue, May 12 2026",0.0],
[132.0,181.0,225.0,314.0,72.0,0.7,1.4,54.9,0.0,0.0,0,null,0.0,57.0,"Wed, May 13 2026",0.0],
[137.0,211.0,260.0,364.0,188.0,2.0,2.1,65.8,0.0,0.0,0,null,0.0,157.0,"Thu, May 14 2026",0.0],
[149.0,238.0,296.0,403.0,159.0,2.0,3.0,77.0,0.0,0.8,0,null,0.0,157.0,"Fri, May 15 2026",0.0],
[146.0,212.0,267.0,342.0,188.0,1.4,2.9,81.9,0.0,0.8,0,null,0.0,157.0,"Sat, May 16 2026",0.0],
[125.0,164.0,208.0,258.0,112.0,0.0,1.4,57.2,0.0,0.0,0,null,0.0,0.0,"Sun, May 17 2026",0.0],
[121.0,150.0,199.0,265.0,72.0,0.0,2.1,55.1,0.0,0.0,0,null,0.0,57.0,"Mon, May 18 2026",0.0],
[125.0,177.0,220.0,267.0,72.0,0.7,1.4,55.0,0.0,0.0,0,null,0.0,0.0,"Tue, May 19 2026",0.0],
[133.0,212.0,266.0,339.0,78.0,0.7,0.7,46.6,0.0,0.0,0,null,0.0,70.0,"Wed, May 20 2026",0.0],
[137.0,267.0,361.0,464.0,209.0,0.6,0.7,52.0,0.0,0.0,0,null,0.0,0.0,"Thu, May 21 2026",0.0],
[160.0,321.0,459.0,570.0,256.0,1.3,1.4,57.6,0.7,0.0,0,"UoP - Spring Com",0.0,0.0,"Fri, May 22 2026",0.0],
[157.0,318.0,445.0,534.0,262.0,0.7,1.4,61.7,0.7,0.0,0,"UoP - Spring Com",0.0,0.0,"Sat, May 23 2026",0.0],
[138.0,250.0,356.0,445.0,227.0,0.0,0.7,50.7,0.0,0.0,0,"UoP - Spring Com",0.0,57.0,"Sun, May 24 2026",0.0],
[137.0,227.0,322.0,420.0,181.0,0.0,0.7,32.8,0.0,0.0,0,"UoP - Spring Com",0.0,57.0,"Mon, May 25 2026",0.0],
[131.0,204.0,245.0,378.0,153.0,0.0,0.0,31.8,0.0,0.0,0,"UoP - Spring Com",0.0,57.0,"Tue, May 26 2026",0.0],
[131.0,171.0,217.0,289.0,75.0,0.0,0.0,35.1,0.0,0.0,0,null,0.0,57.0,"Wed, May 27 2026",0.0],
[136.0,219.0,280.0,374.0,203.0,0.7,0.0,36.5,0.0,0.0,0,null,0.0,190.0,"Thu, May 28 2026",0.0],
[153.0,282.0,357.0,489.0,203.0,2.6,0.0,72.6,0.7,0.0,0,"Memorial Day",0.0,190.0,"Fri, May 29 2026",0.0],
[147.0,269.0,341.0,448.0,240.0,2.6,0.0,90.6,0.7,0.0,0,"Memorial Day",0.0,190.0,"Sat, May 30 2026",0.0],
[124.0,212.0,262.0,338.0,199.0,1.9,0.0,76.0,0.0,0.0,0,"Memorial Day",0.0,190.0,"Sun, May 31 2026",0.0],
[124.0,182.0,215.0,279.0,125.0,0.7,0.0,36.8,0.0,0.0,0,null,0.0,57.0,"Mon, Jun 01 2026",0.0],
[126.0,177.0,204.0,272.0,72.0,0.7,0.0,39.1,0.0,0.0,0,null,0.0,57.0,"Tue, Jun 02 2026",0.0],
[127.0,197.0,230.0,287.0,124.0,1.3,0.0,39.8,0.0,0.0,0,null,0.0,0.0,"Wed, Jun 03 2026",0.0],
[131.0,224.0,265.0,334.0,168.0,1.3,0.0,42.5,0.0,0.0,0,null,0.0,137.0,"Thu, Jun 04 2026",0.0],
[151.0,257.0,313.0,433.0,177.0,1.3,0.0,53.3,0.0,0.0,0,null,0.0,137.0,"Fri, Jun 05 2026",0.0],
[149.0,237.0,288.0,409.0,212.0,0.7,0.0,58.2,0.0,0.0,0,null,0.0,137.0,"Sat, Jun 06 2026",0.0],
[124.0,177.0,226.0,294.0,173.0,0.7,0.0,43.3,0.0,0.0,0,null,0.0,57.0,"Sun, Jun 07 2026",0.0],
[122.0,158.0,199.0,274.0,140.0,1.3,0.0,43.2,0.0,0.0,0,null,0.0,57.0,"Mon, Jun 08 2026",0.0],
[124.0,168.0,240.0,294.0,100.0,0.7,0.0,41.5,0.0,0.0,0,null,0.0,57.0,"Tue, Jun 09 2026",0.0],
[124.0,186.0,285.0,335.0,93.0,1.3,0.0,43.3,0.7,0.0,0,"DreU - Spring Com",0.0,57.0,"Wed, Jun 10 2026",0.0],
[132.0,235.0,342.0,371.0,129.0,1.3,0.0,43.4,0.7,0.0,0,"DreU - Spring Com",0.0,96.0,"Thu, Jun 11 2026",0.0],
[154.0,277.0,367.0,443.0,204.0,1.4,0.0,47.4,0.7,0.0,0,"Flag Day",0.0,96.0,"Fri, Jun 12 2026",0.0],
[151.0,250.0,342.0,424.0,195.0,0.7,0.0,58.9,0.7,0.0,0,"Flag Day",0.0,96.0,"Sat, Jun 13 2026",0.0],
[129.0,211.0,270.0,364.0,182.0,0.7,0.0,56.1,0.7,0.0,0,"Flag Day",0.0,96.0,"Sun, Jun 14 2026",0.0],
[125.0,178.0,225.0,304.0,100.0,0.7,0.0,32.6,0.7,0.0,0,null,0.0,96.0,"Mon, Jun 15 2026",0.0],
[124.0,194.0,230.0,383.0,77.0,0.0,0.0,30.2,0.0,0.0,0,null,0.0,57.0,"Tue, Jun 16 2026",0.0],
[126.0,205.0,330.0,513.0,147.0,0.7,0.6,37.0,0.0,0.0,0,null,0.0,57.0,"Wed, Jun 17 2026",0.0],
[130.0,229.0,490.0,607.0,277.0,0.8,1.2,47.9,0.0,0.0,0,"Juneteenth",0.0,147.0,"Thu, Jun 18 2026",0.0],
[146.0,256.0,490.0,639.0,278.0,0.8,2.2,74.7,0.0,0.0,0,"Juneteenth",0.0,147.0,"Fri, Jun 19 2026",0.0],
[138.0,234.0,421.0,522.0,282.0,0.8,1.3,62.7,0.0,0.0,0,"Juneteenth",0.0,147.0,"Sat, Jun 20 2026",0.0],
[118.0,193.0,268.0,330.0,157.0,0.9,0.6,49.5,0.0,0.0,0,null,0.0,69.0,"Sun, Jun 21 2026",0.0],
[117.0,176.0,253.0,333.0,97.0,0.0,0.0,49.3,0.0,0.0,0,null,0.0,69.0,"Mon, Jun 22 2026",0.0],
[118.0,181.0,265.0,375.0,98.0,1.0,0.0,37.0,0.0,0.0,0,null,0.0,69.0,"Tue, Jun 23 2026",0.0],
[116.0,200.0,287.0,415.0,111.0,1.0,1.3,42.9,0.0,0.0,0,null,0.0,69.0,"Wed, Jun 24 2026",0.0],
[119.0,207.0,375.0,481.0,166.0,1.0,1.2,45.8,0.0,0.0,0,null,0.0,91.0,"Thu, Jun 25 2026",0.0],
[134.0,235.0,414.0,518.0,212.0,1.0,1.2,60.1,0.0,0.0,0,null,0.0,91.0,"Fri, Jun 26 2026",0.0],
[134.0,225.0,349.0,472.0,218.0,0.0,1.3,63.9,0.0,0.0,0,null,0.0,91.0,"Sat, Jun 27 2026",0.0],
[118.0,173.0,242.0,301.0,127.0,0.0,0.7,42.0,0.0,0.0,0,null,0.0,57.0,"Sun, Jun 28 2026",0.0],
[116.0,163.0,238.0,310.0,92.0,0.0,0.6,36.5,0.0,0.0,0,null,0.0,57.0,"Mon, Jun 29 2026",0.0],
[116.0,172.0,247.0,359.0,72.0,0.0,0.6,34.2,0.0,0.0,0,null,0.0,57.0,"Tue, Jun 30 2026",0.0],
[119.0,195.0,269.0,424.0,104.0,0.9,0.0,35.4,0.0,0.0,0,null,0.0,57.0,"Wed, Jul 01 2026",0.0],
[125.0,213.0,367.0,472.0,138.0,0.9,0.6,45.7,0.0,0.0,0,null,0.0,129.0,"Thu, Jul 02 2026",0.0],
[138.0,240.0,452.0,539.0,224.0,0.9,0.6,61.4,0.0,0.0,0,"Independence Day",0.0,129.0,"Fri, Jul 03 2026",0.0],
[132.0,238.0,408.0,525.0,233.0,0.9,0.6,71.4,0.0,0.0,0,"Independence Day",0.0,129.0,"Sat, Jul 04 2026",0.0],
[117.0,198.0,289.0,390.0,225.0,0.9,1.1,48.1,0.0,0.0,0,"Independence Day",0.0,57.0,"Sun, Jul 05 2026",0.0],
[117.0,156.0,214.0,287.0,97.0,0.9,0.5,36.4,0.0,0.0,0,null,0.0,57.0,"Mon, Jul 06 2026",0.0],
[117.0,153.0,210.0,291.0,72.0,0.0,0.5,34.9,0.0,0.0,0,null,0.0,57.0,"Tue, Jul 07 2026",0.0],
[116.0,172.0,217.0,287.0,82.0,0.0,0.6,37.3,0.0,0.0,0,null,0.0,75.0,"Wed, Jul 08 2026",0.0],
[121.0,194.0,249.0,311.0,100.0,0.0,0.0,42.9,0.0,0.0,0,null,0.0,75.0,"Thu, Jul 09 2026",0.0],
[134.0,214.0,282.0,361.0,109.0,0.0,0.0,55.2,0.0,0.0,0,null,0.0,75.0,"Fri, Jul 10 2026",0.0],
[131.0,195.0,255.0,324.0,123.0,0.0,0.0,70.8,0.0,0.0,0,null,0.0,75.0,"Sat, Jul 11 2026",0.0],
[115.0,156.0,205.0,263.0,96.0,0.0,0.0,56.1,0.0,0.0,0,null,0.0,75.0,"Sun, Jul 12 2026",0.0],
[111.0,146.0,197.0,262.0,86.0,1.0,0.0,51.1,0.0,0.0,0,null,0.0,75.0,"Mon, Jul 13 2026",0.0],
[115.0,147.0,208.0,269.0,72.0,1.0,0.0,49.4,0.0,0.0,0,null,0.0,57.0,"Tue, Jul 14 2026",0.0],
[116.0,160.0,214.0,286.0,90.0,1.0,0.0,50.0,0.0,0.0,0,null,0.0,57.0,"Wed, Jul 15 2026",0.0],
[122.0,189.0,231.0,300.0,98.0,1.0,0.0,52.9,0.0,0.0,0,null,0.0,61.0,"Thu, Jul 16 2026",0.0],
[132.0,208.0,269.0,344.0,116.0,0.0,0.0,57.6,0.0,0.0,0,null,0.0,61.0,"Fri, Jul 17 2026",0.0],
[129.0,185.0,245.0,298.0,125.0,0.0,0.0,58.0,0.0,0.0,0,null,0.0,61.0,"Sat, Jul 18 2026",0.0],
[114.0,148.0,191.0,241.0,91.0,0.0,0.0,50.4,0.0,0.0,0,null,0.0,61.0,"Sun, Jul 19 2026",0.0],
[111.0,142.0,182.0,243.0,81.0,0.0,0.0,50.2,0.0,0.0,0,null,0.0,0.0,"Mon, Jul 20 2026",0.0],
[113.0,147.0,192.0,262.0,72.0,0.0,0.0,45.8,0.0,0.0,0,null,0.0,57.0,"Tue, Jul 21 2026",0.0],
[116.0,172.0,214.0,316.0,121.0,0.0,0.0,49.1,0.0,0.0,0,null,0.0,128.0,"Wed, Jul 22 2026",0.0],
[123.0,192.0,260.0,350.0,145.0,1.0,0.0,56.3,0.0,0.0,0,null,0.0,128.0,"Thu, Jul 23 2026",0.0],
[135.0,214.0,306.0,403.0,160.0,1.0,0.0,71.9,0.0,0.0,0,null,0.0,128.0,"Fri, Jul 24 2026",0.0],
[133.0,191.0,266.0,342.0,172.0,1.0,0.0,72.9,0.0,0.0,0,null,0.0,128.0,"Sat, Jul 25 2026",0.0],
[117.0,156.0,199.0,248.0,102.0,1.0,0.0,56.4,0.0,0.0,0,null,0.0,58.0,"Sun, Jul 26 2026",0.0],
[117.0,151.0,188.0,248.0,83.0,0.0,0.0,42.6,0.0,0.0,0,null,0.0,58.0,"Mon, Jul 27 2026",0.0],
[118.0,153.0,196.0,267.0,77.0,0.0,0.0,47.2,0.0,0.0,0,null,0.0,58.0,"Tue, Jul 28 2026",0.0],
[118.0,174.0,217.0,325.0,104.0,0.0,0.0,50.6,0.0,0.0,0,null,0.0,58.0,"Wed, Jul 29 2026",0.0],
[120.0,201.0,264.0,360.0,163.0,0.9,0.0,59.2,0.0,0.0,0,null,0.0,155.0,"Thu, Jul 30 2026",0.0],
[137.0,222.0,314.0,408.0,169.0,0.9,0.0,80.3,0.0,0.0,0,null,0.0,155.0,"Fri, Jul 31 2026",0.0],
[131.0,194.0,281.0,339.0,180.0,0.9,0.0,86.5,0.0,0.0,0,null,0.0,155.0,"Sat, Aug 01 2026",0.0],
[117.0,159.0,198.0,244.0,100.0,0.0,0.0,55.1,0.0,0.0,0,null,0.0,85.0,"Sun, Aug 02 2026",0.0],
[112.0,147.0,185.0,244.0,95.0,0.0,0.0,51.8,0.0,0.0,0,null,0.0,85.0,"Mon, Aug 03 2026",0.0],
[112.0,149.0,194.0,256.0,95.0,0.0,0.0,48.5,0.0,0.0,0,null,0.0,85.0,"Tue, Aug 04 2026",0.0],
[117.0,162.0,207.0,305.0,85.0,0.0,0.0,44.2,0.0,0.0,0,null,0.0,0.0,"Wed, Aug 05 2026",0.0],
[120.0,195.0,245.0,324.0,125.0,0.0,0.0,52.6,0.0,0.0,0,null,0.0,83.0,"Thu, Aug 06 2026",0.0],
[135.0,210.0,289.0,368.0,146.0,0.0,0.0,53.8,0.0,0.0,0,null,0.0,83.0,"Fri, Aug 07 2026",0.0],
[132.0,189.0,258.0,317.0,156.0,0.0,0.0,55.5,0.0,0.0,0,null,0.0,83.0,"Sat, Aug 08 2026",0.0],
[114.0,155.0,191.0,251.0,108.0,0.0,0.0,46.9,0.0,0.0,0,null,0.0,83.0,"Sun, Aug 09 2026",0.0],
[112.0,146.0,176.0,245.0,108.0,0.0,0.0,38.6,0.0,0.0,0,null,0.0,83.0,"Mon, Aug 10 2026",0.0],
[112.0,146.0,177.0,252.0,99.0,0.0,0.0,34.0,0.0,0.0,0,null,0.0,83.0,"Tue, Aug 11 2026",0.0],
[117.0,154.0,188.0,262.0,98.0,0.0,0.0,31.6,0.0,0.0,0,null,0.0,83.0,"Wed, Aug 12 2026",0.0],
[118.0,175.0,218.0,277.0,120.0,0.0,0.0,42.6,0.0,0.0,0,null,0.0,114.0,"Thu, Aug 13 2026",0.0],
[133.0,193.0,251.0,305.0,120.0,0.0,0.0,48.8,0.0,0.0,0,null,0.0,114.0,"Fri, Aug 14 2026",0.0],
[133.0,177.0,228.0,284.0,120.0,0.0,0.0,53.1,0.0,0.0,0,null,0.0,114.0,"Sat, Aug 15 2026",0.0],
[113.0,152.0,178.0,257.0,126.0,0.0,0.0,39.1,0.0,0.0,0,null,0.0,114.0,"Sun, Aug 16 2026",0.0],
[112.0,144.0,179.0,245.0,126.0,0.0,0.0,35.8,0.0,0.0,0,null,0.0,114.0,"Mon, Aug 17 2026",0.0],
[113.0,148.0,176.0,244.0,101.0,0.0,0.0,41.0,0.0,0.0,0,null,0.0,78.0,"Tue, Aug 18 2026",0.0],
[119.0,155.0,198.0,302.0,101.0,0.0,0.0,40.6,0.0,0.0,0,null,0.0,78.0,"Wed, Aug 19 2026",0.0],
[125.0,187.0,257.0,335.0,97.0,0.0,0.0,41.8,0.0,0.0,0,null,0.0,73.0,"Thu, Aug 20 2026",0.0],
[140.0,219.0,324.0,422.0,166.0,0.0,0.0,50.0,0.0,0.0,0,"NCAAF Game Hold",0.0,73.0,"Fri, Aug 21 2026",0.0],
[134.0,190.0,277.0,331.0,173.0,0.0,0.0,50.9,0.0,0.0,0,"NCAAF Game Hold",0.0,73.0,"Sat, Aug 22 2026",0.0],
[115.0,148.0,177.0,250.0,117.0,0.0,0.0,38.8,0.0,0.0,0,null,0.0,100.0,"Sun, Aug 23 2026",0.0],
[113.0,142.0,174.0,245.0,113.0,0.0,0.0,35.9,0.0,0.0,0,null,0.0,100.0,"Mon, Aug 24 2026",0.0],
[117.0,146.0,179.0,245.0,105.0,0.0,0.0,33.2,0.0,0.0,0,null,0.0,100.0,"Tue, Aug 25 2026",0.0],
[119.0,155.0,199.0,306.0,105.0,0.0,0.0,35.3,0.0,0.0,0,null,0.0,100.0,"Wed, Aug 26 2026",0.0],
[125.0,188.0,259.0,332.0,92.0,0.0,0.0,40.7,0.0,0.0,0,null,0.0,70.0,"Thu, Aug 27 2026",0.0],
[140.0,221.0,323.0,426.0,178.0,1.0,0.0,51.7,0.0,0.0,0,"NCAAF Game Hold",0.0,70.0,"Fri, Aug 28 2026",0.0],
[135.0,194.0,276.0,350.0,192.0,2.1,0.0,54.7,0.0,0.0,0,"NCAAF Game Hold",0.0,70.0,"Sat, Aug 29 2026",0.0],
[116.0,148.0,182.0,235.0,99.0,1.1,0.0,44.2,0.0,0.0,0,null,0.0,70.0,"Sun, Aug 30 2026",0.0],
[112.0,142.0,180.0,242.0,82.0,1.0,0.0,39.9,0.0,0.0,0,null,0.0,55.0,"Mon, Aug 31 2026",0.0],
[116.0,145.0,176.0,249.0,82.0,1.0,0.0,41.9,0.0,0.0,0,null,0.0,55.0,"Tue, Sep 01 2026",0.0],
[119.0,153.0,198.0,293.0,82.0,0.0,0.0,45.2,0.0,0.0,0,null,0.0,55.0,"Wed, Sep 02 2026",0.0],
[124.0,194.0,261.0,338.0,107.0,0.0,0.0,53.2,0.0,0.0,0,null,0.0,99.0,"Thu, Sep 03 2026",0.0],
[136.0,223.0,322.0,424.0,169.0,0.0,0.0,64.4,0.0,0.0,0,"NCAAF Game Hold",0.0,99.0,"Fri, Sep 04 2026",0.0],
[135.0,204.0,294.0,358.0,173.0,0.0,0.0,66.3,0.0,0.0,0,"NCAAF Game Hold",0.0,99.0,"Sat, Sep 05 2026",0.0],
[119.0,161.0,207.0,258.0,119.0,0.0,0.0,61.1,0.0,0.0,0,"Labor Day",0.0,0.0,"Sun, Sep 06 2026",0.0],
[112.0,142.0,174.0,233.0,87.0,0.0,0.0,46.2,0.0,0.0,0,null,0.0,77.0,"Mon, Sep 07 2026",0.0],
[114.0,144.0,174.0,242.0,87.0,0.0,0.0,44.5,0.0,0.0,0,null,0.0,77.0,"Tue, Sep 08 2026",0.0],
[120.0,155.0,199.0,282.0,87.0,0.0,0.0,50.3,0.0,0.0,0,null,0.0,77.0,"Wed, Sep 09 2026",0.0],
[125.0,186.0,253.0,334.0,102.0,0.0,0.0,52.8,0.0,0.0,0,null,0.0,77.0,"Thu, Sep 10 2026",0.0],
[135.0,203.0,330.0,453.0,166.0,1.1,0.0,55.1,1.1,0.0,0,"NCAAF Game Hold",0.0,77.0,"Fri, Sep 11 2026",0.0],
[133.0,186.0,281.0,345.0,172.0,1.1,0.0,63.2,1.1,0.0,0,"NCAAF Game Hold",0.0,77.0,"Sat, Sep 12 2026",0.0],
[114.0,146.0,175.0,244.0,94.0,1.1,0.0,44.4,1.1,0.0,0,null,0.0,77.0,"Sun, Sep 13 2026",0.0],
[104.0,132.0,168.0,232.0,86.0,1.1,0.0,40.0,1.1,0.0,0,null,0.0,77.0,"Mon, Sep 14 2026",0.0],
[112.0,138.0,170.0,249.0,86.0,1.1,0.0,45.9,1.1,0.0,0,null,0.0,77.0,"Tue, Sep 15 2026",0.0],
[116.0,153.0,193.0,277.0,86.0,1.2,0.0,53.7,1.2,0.0,0,null,0.0,77.0,"Wed, Sep 16 2026",0.0],
[117.0,170.0,244.0,319.0,101.0,1.2,0.0,54.5,1.2,0.0,0,null,0.0,92.0,"Thu, Sep 17 2026",0.0],
[129.0,193.0,328.0,434.0,147.0,1.2,0.0,62.6,1.2,0.0,0,"NCAAF Game Hold",0.0,92.0,"Fri, Sep 18 2026",0.0],
[133.0,177.0,271.0,370.0,161.0,0.0,0.0,68.9,0.0,0.0,0,"NCAAF Game Hold",0.0,92.0,"Sat, Sep 19 2026",0.0]
];
const REAL_HIST_MONTHS = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
const REAL_HIST = {
  occ: { name: 'Market Occupancy', suffix: '%', y2026: [55.0,59.0,57.0,51.0,46.0,49.0,57.0,51.0,55.0,46.0,53.0,46.0], y2025: [64.0,65.0,62.0,59.0,45.0,54.0,57.0,58.0,68.0,69.0,60.0,66.0] },
  adr: { name: 'Market ADR', prefix: '$', y2026: [116.0,120.0,132.0,130.0,110.0,106.0,114.0,129.0,154.0,188.0,150.0,134.0], y2025: [123.0,118.0,124.0,120.0,104.0,101.0,106.0,118.0,130.0,126.0,123.0,131.0] },
  window: { name: 'Market Booking Window', suffix: ' days', y2026: [5.0,7.0,12.0,10.0,6.0,4.0,6.0,8.0,15.0,11.0,10.0,8.0], y2025: [21.0,16.0,17.0,15.0,8.0,6.0,8.0,15.0,27.0,15.0,9.0,12.0] },
  los: { name: 'Market Length of Stay', suffix: ' nights', y2026: [2.0,2.0,2.0,2.0,2.0,3.0,3.0,3.0,2.0,2.0,3.0,2.0], y2025: [2.0,3.0,2.0,2.0,2.0,2.0,3.0,2.0,3.0,3.0,2.0,2.0] }
};

/* ── shared axis config, reused by all three charts (Classic style).
   Y-axis sits on the LEFT, matching desktop's own chart convention
   (and every other chart library default) — it was previously on the
   right (Upstox-style) with 44px reserved for it, which left the plot
   area visibly narrower than the card while the right side sat empty.
   Left-aligned axis labels are narrower (2-4 digits) so the reserved
   margin can shrink too, giving the plot area most of the card width. ── */
const ND_CHART_SPACING = [12, 2, 22, 0];
/* Highcharts auto-reserves axis width beyond what the label text actually
   needs (measured ~71px total for 3-char "$350"-style labels when left
   to auto-calculate) — the gap between the plot area and the card's right
   edge that was flagged as wasted space. Setting marginLeft/marginRight
   explicitly overrides that auto-calculation so the plot area's edges
   line up with the section's own title/icon-button edges instead of
   sitting inset by the auto-reserved margin + default spacing. Highcharts
   silently ellipsis-crops a y-axis label ("$350" -> "$…", "100%" -> "10…")
   once its rendered width exceeds the reserved marginLeft — "100%" (a
   4th significant digit) needed more room than "$350"/"75%" did, so
   46px is used for enough safety margin to cover it. */
const ND_CHART_MARGIN_LEFT = 46;
const ND_CHART_MARGIN_RIGHT = 6;
function ndXAxisConfig(cats, step) {
  return {
    categories: cats, lineWidth: 1, lineColor: '#E0E0E0', tickLength: 0,
    labels: { enabled: true, style: { fontSize: '10px', color: '#7A7A7A' }, step: step },
    crosshair: { width: 1, color: '#CBD0D6', dashStyle: 'Dash', label: { enabled: true, backgroundColor: '#333333', style: { color: '#fff', fontSize: '10px' } } }
  };
}
/* The pinned info card above each chart is empty ("—") when the chart is
   created and only gets its real (often taller) content once the chart's
   own `load` event fires and calls fpUpdateInfoCard/occUpdateInfoCard —
   in the fullscreen sheet the card and chart share a flex column, so
   that content growth shrinks the chart's actual flex:1 box *after* its
   SVG was already sized to the pre-growth height, clipping whatever
   falls outside it (the x-axis labels along the bottom). chart.reflow()
   can't fix this because it skips dimensions that were explicitly passed
   in the chart options — so this re-measures the container's now-settled
   real height and forces the SVG to match via setSize() instead. */
function ndResyncChartHeight(chart) {
  const realHeight = chart.renderTo.clientHeight;
  if (realHeight && Math.abs(realHeight - chart.chartHeight) > 1) {
    chart.setSize(undefined, realHeight, false);
  }
}

/* ── Pinned info card: empty state until the user actually scrubs. It
   used to default to showing today's point the instant a chart loaded,
   which meant every chart displayed numbers before anyone had touched
   it — indistinguishable from "this is what today looks like" when it
   was really just an arbitrary default. Leaving it blank with a short
   instruction makes clear the numbers only appear once you long-press
   or two-finger drag (see attachScrub's gesture model). */
function ndShowInfoCardEmptyState(idPrefix) {
  const card = document.getElementById(idPrefix + '-info-card');
  if (!card) return;
  card.classList.add('nd-info-empty');
  const dateEl = document.getElementById(idPrefix + '-info-date');
  const priceEl = document.getElementById(idPrefix + '-info-price');
  const rowsEl = document.getElementById(idPrefix + '-info-rows');
  if (dateEl) dateEl.textContent = '';
  if (priceEl) priceEl.textContent = '';
  /* The fullscreen chart ('fs') drags immediately on a single touch (see
     attachScrub's immediate mode) since there's no page scroll to
     protect there — so it gets its own, simpler instruction instead of
     mentioning a gesture this view doesn't actually require. */
  const msg = idPrefix === 'fs' ? 'Drag on the chart to see details for a date' : 'Long-press or use two fingers to drag on the chart to see details for a date';
  if (rowsEl) rowsEl.innerHTML = '<div class="nd-info-empty-msg">' + msg + '</div>';
}
function ndYAxisConfig(opts) {
  opts = opts || {};
  const cfg = {
    title: { text: null }, opposite: false, gridLineWidth: 0, max: opts.max,
    /* Highcharts' default endOnTick/startOnTick extend the axis to the
       next "nice" round number beyond a configured max — e.g. an
       Occupancy max:110 silently became 125, both semantically wrong
       for a percentage and just wide enough to trip the axis label's
       own ellipsis-crop once it landed right at the container's top
       edge. Disabling both keeps the axis at exactly the configured
       bounds — but only actually works when tickAmount isn't ALSO
       forcing a fixed tick count, since Highcharts computes a tick
       interval to fit that exact count and re-expands min/max to match
       it regardless of endOnTick. So tickAmount is only applied when
       there's no hard max to respect (charts that just auto-range). */
    endOnTick: false, startOnTick: false,
    labels: { enabled: true, style: { fontSize: '10px', color: '#7A7A7A' }, formatter: opts.yFormatter },
    crosshair: { width: 1, color: '#CBD0D6', dashStyle: 'Dash', label: { enabled: true, backgroundColor: '#333333', format: opts.yCrosshairFormat || '{value:.0f}', style: { color: '#fff', fontSize: '10px' } } }
  };
  if (opts.max === undefined) cfg.tickAmount = 3;
  return cfg;
}

/* ── floating tooltip card: shown while scrubbing, positioned at the
   touch point, content passed in as an HTML string per chart ── */
function ndShowTooltip(wrapEl, chart, idx, html) {
  const tt = wrapEl.querySelector('.hc-tooltip');
  if (!tt) return;
  tt.innerHTML = html;
  tt.classList.add('visible');
  const px = chart.xAxis[0].toPixels(idx);
  const wrapW = wrapEl.offsetWidth;
  const ttW = tt.offsetWidth || 170;
  let left = px - ttW / 2;
  left = Math.max(4, Math.min(left, wrapW - ttW - 4));
  tt.style.left = left + 'px';
}
function ndHideTooltip(wrapEl) {
  const tt = wrapEl.querySelector('.hc-tooltip');
  if (tt) tt.classList.remove('visible');
}

/* ── Legend/tooltip swatches that actually render as a dashed or dotted
   line when the underlying series is — a plain solid block previously
   stood in for every line style, which misrepresented which lines were
   solid vs. dashed vs. dotted on the chart itself. ── */
function ndSwatchHTML(color, dashStyle, isBlock) {
  if (isBlock) {
    return '<div class="legend-swatch" style="background:' + color + ';height:8px;width:8px;border-radius:2px"></div>';
  }
  if (dashStyle === 'Dot' || dashStyle === 'ShortDot') {
    return '<div class="legend-swatch" style="height:2px;background-image:repeating-linear-gradient(to right,' + color + ' 0,' + color + ' 2px,transparent 2px,transparent 5px)"></div>';
  }
  if (dashStyle === 'Dash') {
    return '<div class="legend-swatch" style="height:2px;background-image:repeating-linear-gradient(to right,' + color + ' 0,' + color + ' 5px,transparent 5px,transparent 8px)"></div>';
  }
  return '<div class="legend-swatch" style="background:' + color + ';height:3px"></div>';
}
function ndDotHTML(color, dashStyle) {
  if (dashStyle === 'Dot' || dashStyle === 'ShortDot') {
    return '<span class="hc-tt-dot" style="width:10px;height:2px;border-radius:0;background-image:repeating-linear-gradient(to right,' + color + ' 0,' + color + ' 2px,transparent 2px,transparent 5px)"></span>';
  }
  if (dashStyle === 'Dash') {
    return '<span class="hc-tt-dot" style="width:10px;height:2px;border-radius:0;background-image:repeating-linear-gradient(to right,' + color + ' 0,' + color + ' 5px,transparent 5px,transparent 8px)"></span>';
  }
  return '<span class="hc-tt-dot" style="background:' + color + '"></span>';
}

/* ── One consistent row builder for every info-card row (percentiles,
   events, booking overlays, occupancy, history years). Grouping the dot
   and label inside their own wrapper — rather than leaving the dot,
   label text and value as three separate direct children of the row —
   matters once the row's layout switches to a narrow column (the
   fullscreen chart's info card): flex-direction:column stacks EVERY
   direct child onto its own line, so without this wrapper the dot ended
   up isolated on a line by itself, then the label alone, then the value
   alone, breaking the visual link between a swatch and what it labels. */
function ndTTRowHTML(color, label, value, dashStyle) {
  return '<div class="hc-tt-row"><span class="hc-tt-label">' + ndDotHTML(color, dashStyle) + label + ':</span><b>' + value + '</b></div>';
}

/* ── Events & Holidays row: always rendered (not just on dates that
   actually have one) whenever the "Show Events & Holidays" option is
   on, greyed out with a placeholder on dates without one. Making the
   row appear/disappear per-date was changing the info card's own height
   while a user was mid-drag, since a chart with a lot of muted purple
   bands could suddenly grow or shrink the card underneath their thumb;
   keeping the row's slot constant (just changing its content) removes
   that "moves under you while dragging" jank entirely. ── */
function ndEventsRowHTML(eventLabel) {
  if (eventLabel) return ndTTRowHTML('rgba(213,104,251,0.6)', 'Events & Holidays', eventLabel);
  return '<div class="hc-tt-row hc-tt-row-disabled"><span class="hc-tt-label"><span class="hc-tt-dot" style="background:#D8DCE2"></span>Events &amp; Holidays:</span><b>No events</b></div>';
}

/* ── Lookup a series by its explicit `id` rather than by position, so
   tooltip/hero code works the same whether the chart is showing its
   daily (line/arearange) or monthly (column) series set. ── */
function ndSeriesById(chart, id) {
  return chart.series.find(function (s) { return s.options.id === id; });
}

/* ── Legend click → show/hide that one series. This is now the ONLY way
   a series' visibility changes — the chart itself no longer dims other
   series on hover/tap (see the global states.inactive override above),
   so isolating one line is a deliberate legend tap, not an accidental
   side effect of touching the plot area. ── */
function ndToggleLegendSeries(el, chart, seriesId) {
  const series = chart && ndSeriesById(chart, seriesId);
  if (!series) return;
  const willShow = !series.visible;
  series.setVisible(willShow, true);
  el.classList.toggle('off', !willShow);
}

/* ── Events & Holidays rendered as purple baseline bands (matching
   desktop) rather than dots sitting on the price/occupancy line. ── */
function ndEventPlotBands(events, color) {
  color = color || 'rgba(213,104,251,0.16)';
  /* No explicit zIndex: Highcharts' own default already renders plot
     bands behind the series group. Setting zIndex:0 here previously
     pulled the band into the same z-ordering pass as the series and,
     on the column (monthly) charts, made it paint ON TOP of the bars
     instead of behind them. */
  return events.map(function (i) { return { from: i - 0.42, to: i + 0.42, color: color }; });
}

/* ── Real-data row lookup: REAL_DAILY is indexed from today
   (REAL_DAILY_START); i is clamped to the last real row rather than
   wrapping or going undefined once a request (e.g. a 90-day range near
   the end of the supplied ~360-day dataset) runs past what's there. */
function ndRealDay(i) {
  const d = new Date(REAL_DAILY_START + 'T00:00:00');
  d.setDate(d.getDate() + i);
  return { date: d, row: REAL_DAILY[Math.min(i, REAL_DAILY.length - 1)] };
}

/* ── Future Prices: build data for N days, at either daily or monthly
   granularity (independent of Occupancy's own toggle — each chart
   aggregates on its own, there's no shared/global setting). Daily mode
   renders as a line + percentile arearange bands; monthly mode renders
   as a Listing Price column plus percentile lines in a grey→red
   gradient, matching desktop's own monthly view. ── */
function fpBuildData(days, granularity) {
  const rows = [];
  for (let i = 0; i < days; i++) {
    const { date, row } = ndRealDay(i);
    rows.push({
      date: date,
      price: row[4],
      p25: row[0], p50: row[1], p75: row[2], p90: row[3],
      isEvent: !!row[11], eventLabel: row[11]
    });
  }
  const buckets = granularity === 'monthly' ? bucketByMonth(rows) : rows.map(r => [r]);
  const cats = [], listing = [], p25 = [], p50 = [], p75 = [], p90 = [];
  const band2550 = [], band5075 = [], band7590 = [], events = [];
  const eventLabels = {};
  buckets.forEach((rowsInBucket, i) => {
    const first = rowsInBucket[0];
    /* Monthly: the first bucket is the current month, which only has
       today-onward dates — flagged with "*" (footnote under the chart),
       matching desktop's "*Reflects future dates only". */
    cats.push(granularity === 'monthly'
      ? (i === 0 ? '*' : '') + first.date.toLocaleDateString('en-US', { month: 'short' })
      : first.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    const avg = key => Math.round(rowsInBucket.reduce((s, r) => s + r[key], 0) / rowsInBucket.length);
    listing.push(avg('price'));
    p25.push(avg('p25')); p50.push(avg('p50')); p75.push(avg('p75')); p90.push(avg('p90'));
    band2550.push([i, avg('p25'), avg('p50')]);
    band5075.push([i, avg('p50'), avg('p75')]);
    band7590.push([i, avg('p75'), avg('p90')]);
    /* Events are daily-only — once a month is averaged into one bucket
       (monthly view), a single day's holiday inside it no longer means
       anything at that scale, so no plotBand/legend/tooltip row for it. */
    if (granularity !== 'monthly') {
      const withEvent = rowsInBucket.find(r => r.isEvent);
      if (withEvent) {
        eventLabels[i] = withEvent.eventLabel;
        if (events.length < 5) events.push(i);
      }
    }
  });
  return { cats, listing, p25, p50, p75, p90, band2550, band5075, band7590, events, eventLabels };
}
function bucketByMonth(rows) {
  const buckets = [];
  let current = null, key = null;
  rows.forEach(r => {
    const k = r.date.getFullYear() + '-' + r.date.getMonth();
    if (k !== key) { current = []; buckets.push(current); key = k; }
    current.push(r);
  });
  return buckets;
}

let fpChart = null;
let fpDays = 30;
let fpGranularity = 'daily';
let fpEventsEnabled = true;
let fpLastScrubIndex = null;

/* Pure chart builder — renders into any container at any height, so the
   same code drives both the in-card chart and the fullscreen detail view
   (item 8) without duplicating the series/config logic. idPrefix selects
   which pinned info-card ('fp-info-*' or 'fs-info-*' for the fullscreen
   clone) gets updated as the user scrubs. */
function fpRenderChart(containerId, height, idPrefix) {
  idPrefix = idPrefix || 'fp';
  const el = document.getElementById(containerId);
  if (!el || !window.Highcharts) return null;
  const { cats, listing, p25, p50, p75, p90, band2550, band5075, band7590, events, eventLabels } = fpBuildData(fpDays, fpGranularity);
  const isMonthly = fpGranularity === 'monthly';
  const series = isMonthly ? [
    { type: 'column', id: 'fp-s-listing', name: 'Listing Price', data: listing, color: '#4A4A4A', zIndex: 3 },
    { type: 'line', id: 'fp-s-p25', name: '25th Percentile', data: p25, color: '#C8CDD3', lineWidth: 1.5, zIndex: 5 },
    { type: 'line', id: 'fp-s-p50', name: '50th Percentile', data: p50, color: '#F6B4B6', lineWidth: 1.5, zIndex: 5 },
    { type: 'line', id: 'fp-s-p75', name: '75th Percentile', data: p75, color: '#F37579', lineWidth: 1.5, zIndex: 5 },
    { type: 'line', id: 'fp-s-p90', name: '90th Percentile', data: p90, color: '#A15457', lineWidth: 1.5, zIndex: 5 }
  ] : [
    { type: 'line', id: 'fp-s-listing', name: 'Listing Price', data: listing, color: '#333333', lineWidth: 2.5, zIndex: 5 },
    { type: 'arearange', id: 'fp-s-5075', name: '50th–75th', data: band5075.map(p => [p[1], p[2]]), color: '#F69396', zIndex: 2 },
    { type: 'arearange', id: 'fp-s-7590', name: '75th–90th', data: band7590.map(p => [p[1], p[2]]), color: 'rgba(161,84,87,0.4)', zIndex: 1 },
    { type: 'arearange', id: 'fp-s-2550', name: '25th–50th', data: band2550.map(p => [p[1], p[2]]), color: '#FCDCDD', zIndex: 3 }
  ];
  /* Highcharts clips its SVG to the container's own CSS height (it sets
     overflow:hidden on the container) — a chart.height option alone
     doesn't grow the div to match, so a container shorter than the
     configured height silently crops the bottom of the plot (x-axis
     labels first). Setting it explicitly here keeps the two in sync
     regardless of what height gets passed in from any call site. */
  el.style.height = height + 'px';
  const chart = Highcharts.chart(containerId, {
    chart: {
      height: height,
      spacing: ND_CHART_SPACING,
      marginLeft: ND_CHART_MARGIN_LEFT,
      marginRight: ND_CHART_MARGIN_RIGHT,
      backgroundColor: 'transparent',
      zooming: { type: undefined },
      panning: { enabled: false },
      events: {
        /* The pinned info card is empty ("—") at chart-creation time and
           only gets its real (taller) content here, on load — in the
           fullscreen sheet that card sits above the chart inside a flex
           column, so its growth shrinks the chart's own flex:1 area
           *after* the SVG was already sized to the pre-growth height.
           reflow() re-measures the now-settled container and resizes the
           SVG to match, instead of leaving it clipped (hiding the x-axis
           labels along the bottom edge). */
        load: function () { ndShowInfoCardEmptyState(idPrefix); ndResyncChartHeight(this); }
      }
    },
    xAxis: Object.assign(ndXAxisConfig(cats, Math.max(1, Math.round(cats.length / 5))), { plotBands: fpEventsEnabled ? ndEventPlotBands(events) : [] }),
    yAxis: ndYAxisConfig({
      yFormatter: function () { return '$' + this.value; }
    }),
    tooltip: { enabled: false },
    legend: { enabled: false },
    plotOptions: {
      series: {
        marker: { enabled: false, states: { hover: { enabled: false } } },
        states: { hover: { enabled: false } },
        enableMouseTracking: true,
        animation: { duration: 300 }
      },
      arearange: { lineWidth: 0, fillOpacity: 1 },
      column: {
        borderWidth: 0, borderRadius: 2, pointPadding: 0.08, groupPadding: 0.06,
        dataLabels: isMonthly ? {
          enabled: true, formatter: function () { return '$' + this.y; },
          style: { fontSize: '9px', fontWeight: '700', color: 'var(--pl-text)', textOutline: 'none' }
        } : { enabled: false }
      }
    },
    series: series
  });
  chart.ndEventLabels = eventLabels;
  const wrap = el.closest('.hc-chart-wrap');
  attachScrub(chart, wrap, function (c, idx) { fpUpdateInfoCard(c, idx, idPrefix); }, null, idPrefix === 'fs');
  return chart;
}

/* Size the chart so one whole widget (header, toggles, info card, chart,
   legend) fits in the visible screen above the bottom nav, instead of a
   fixed 230px chart that left most of the viewport to the next widget.
   RESERVED is the measured height of everything in a widget except the
   chart itself (info card counted at its tallest, filled state) plus the
   ND header and bottom nav; clamped so small phones still get a usable
   chart and tall ones don't get an absurdly stretched one. */
function ndWidgetChartHeight() {
  const RESERVED = 84 + 97 + 54 + 42 + 126 + 56 + 24;
  return Math.max(220, Math.min(380, window.innerHeight - RESERVED));
}
function fpInitChart(days) {
  if (!document.getElementById('fp-hc-chart')) return;
  if (days) fpDays = Math.min(days, 90);
  if (fpChart) { fpChart.destroy(); fpChart = null; }
  fpChart = fpRenderChart('fp-hc-chart', ndWidgetChartHeight(), 'fp');
  fpRenderLegend();
}

/* ── Pinned drag-tooltip: populates the always-visible info card above
   the chart (date, headline price, and the full percentile/markup
   breakdown) from whichever point is currently scrubbed, or today's
   point by default. Replaces the old static hero number (ambiguous —
   unclear which date it described) and the floating tooltip (which a
   touch drag would cover with the user's own finger). ── */
function fpUpdateInfoCard(chart, index, idPrefix) {
  const listingS = ndSeriesById(chart, 'fp-s-listing');
  const points = listingS && listingS.points;
  if (!points || !points.length) return;
  const i = Math.max(0, Math.min(index, points.length - 1));
  const card = document.getElementById(idPrefix + '-info-card');
  if (card) card.classList.remove('nd-info-empty');
  const dateEl = document.getElementById(idPrefix + '-info-date');
  const priceEl = document.getElementById(idPrefix + '-info-price');
  const rowsEl = document.getElementById(idPrefix + '-info-rows');
  if (dateEl) dateEl.textContent = chart.xAxis[0].categories[i];
  if (priceEl) priceEl.textContent = '$' + points[i].y;
  if (!rowsEl) return;
  let rows = '';
  if (fpGranularity === 'monthly') {
    [['fp-s-p25', '25th'], ['fp-s-p50', '50th'], ['fp-s-p75', '75th'], ['fp-s-p90', '90th']].forEach(function (pair) {
      const s = ndSeriesById(chart, pair[0]);
      if (s) rows += ndTTRowHTML(s.color, 'Market ' + pair[1] + ' Percentile Price', '$' + s.points[i].y);
    });
  } else {
    const b2550 = ndSeriesById(chart, 'fp-s-2550').points[i];
    const b5075 = ndSeriesById(chart, 'fp-s-5075').points[i];
    const b7590 = ndSeriesById(chart, 'fp-s-7590').points[i];
    rows += ndTTRowHTML('#FCDCDD', 'Market 25th–50th Percentile Price', '$' + b2550.low + '–$' + b2550.high);
    rows += ndTTRowHTML('#F69396', 'Market 50th–75th Percentile Price', '$' + b5075.low + '–$' + b5075.high);
    rows += ndTTRowHTML('#A15457', 'Market 75th–90th Percentile Price', '$' + b7590.low + '–$' + b7590.high);
  }
  /* Events are daily-only (see fpBuildData) and only shown at all when
     the "Show Events & Holidays" chart option is on — but whenever they
     are, the row's slot is always there (see ndEventsRowHTML) so this
     card's height doesn't shift while dragging. */
  if (fpEventsEnabled && fpGranularity !== 'monthly') {
    rows += ndEventsRowHTML(chart.ndEventLabels && chart.ndEventLabels[i]);
  }
  fpLastScrubIndex = i;
  /* The Upcoming/Last Year Bookings overlays (toggled on from Chart
     Options) draw as short segments near the baseline — real, but with
     no value actually readable off the line itself. When one is turned
     on, the day it's currently scrubbed to gets its real ADR pulled
     straight from the same REAL_DAILY row the segment itself was built
     from — matching desktop's own tooltip, which pairs each active
     booking overlay with its ADR ("Last Year ADR (on <date>): $X") right
     here rather than leaving the overlay chart-only. The two Last Year
     rows both add the same-date-last-year context from the real
     dates_stly column, since that's what "on <date>" is referencing.
     Daily granularity only — REAL_DAILY is indexed by day, and the
     overlays themselves aren't offered in monthly view. */
  if (fpGranularity !== 'monthly') {
    const raw = ndRealDay(i).row;
    const stlyDate = raw[14];
    const overlayRow = (id, color, label, adr) => {
      const s = ndSeriesById(chart, id);
      /* Row slot stays while the overlay is on (value or "—"), so the
         card height doesn't change as you drag across dates without data. */
      if (s && s.visible) rows += ndTTRowHTML(color, label, adr ? '$' + adr : '—');
    };
    overlayRow('fp-overlay-upcoming', '#31C48D', 'Upcoming Booking ADR', raw[12]);
    overlayRow('fp-overlay-lastyear', '#274690', 'Last Year ADR' + (stlyDate ? ' (on ' + stlyDate + ')' : ''), raw[13]);
    overlayRow('fp-overlay-stly', '#D62828', 'Last Year ADR (Same Time)', raw[13]);
  }
  rowsEl.innerHTML = rows;
}

/* ── Legend rebuilt per-granularity since monthly (columns + percentile
   lines) and daily (line + arearange bands) show different series. ── */
/* ── Caps a legend row at maxRows lines, hiding overflow items and
   folding them into the "+N More" chip instead of letting the legend
   wrap to a third/fourth line under the chart. The full, uncapped list
   (every item, in its normal interactive form) is mirrored into
   fullLegendId — the chart's own Chart Options sheet, opened by tapping
   that same "+N More" chip — so nothing hidden here is actually lost,
   just moved somewhere with more room. ── */
function ndCapLegendRows(el, fullLegendId, maxRows) {
  const items = Array.from(el.querySelectorAll('.legend-item'));
  const moreItem = el.querySelector('.legend-more');
  const regularItems = items.filter(i => i !== moreItem);
  const fullEl = document.getElementById(fullLegendId);
  if (fullEl) fullEl.innerHTML = regularItems.map(i => i.outerHTML).join('');
  regularItems.forEach(i => { i.style.display = ''; });
  if (moreItem) { moreItem.textContent = '+ More'; moreItem.style.display = ''; }
  if (!moreItem || !regularItems.length) return;
  requestAnimationFrame(() => {
    const tops = regularItems.map(i => i.offsetTop);
    const rowTops = Array.from(new Set(tops)).sort((a, b) => a - b);
    if (rowTops.length <= maxRows) { moreItem.style.display = 'none'; return; }
    const cutoff = rowTops[maxRows - 1];
    let hidden = 0;
    regularItems.forEach((item, idx) => {
      if (tops[idx] > cutoff) { item.style.display = 'none'; hidden++; }
    });
    if (hidden > 0) moreItem.textContent = '+' + hidden + ' More';
    else moreItem.style.display = 'none';
  });
}
function fpRenderLegend() {
  const el = document.getElementById('fp-legend');
  if (!el) return;
  const li = (seriesId, swatchHtml, label) =>
    '<div class="legend-item togglable" onclick="ndToggleLegendSeries(this,fpChart,\'' + seriesId + '\')">' + swatchHtml + ' ' + label + '</div>';
  el.innerHTML = fpGranularity === 'monthly'
    ? li('fp-s-listing', '<div class="legend-swatch" style="background:#4A4A4A;height:8px;width:8px;border-radius:2px"></div>', 'Listing Price') +
      li('fp-s-p25', '<div class="legend-swatch" style="background:#C8CDD3;height:3px"></div>', 'Market 25th Percentile Price') +
      li('fp-s-p50', '<div class="legend-swatch" style="background:#F6B4B6;height:3px"></div>', 'Market 50th Percentile Price') +
      li('fp-s-p75', '<div class="legend-swatch" style="background:#F37579;height:3px"></div>', 'Market 75th Percentile Price') +
      li('fp-s-p90', '<div class="legend-swatch" style="background:#A15457;height:3px"></div>', 'Market 90th Percentile Price') +
      '<div class="legend-item legend-more" onclick="ndOpenSheet(\'bs-fp-legend\')">+ More</div>'
    : li('fp-s-listing', '<div class="legend-swatch" style="background:#333333;height:3px"></div>', 'Listing Price') +
      li('fp-s-2550', '<div class="legend-band" style="background:#FCDCDD"></div>', 'Market 25th–50th Percentile Price') +
      li('fp-s-5075', '<div class="legend-band" style="background:#F69396"></div>', 'Market 50th–75th Percentile Price') +
      li('fp-s-7590', '<div class="legend-band" style="background:#A15457;opacity:0.4"></div>', 'Market 75th–90th Percentile Price') +
      (fpEventsEnabled ? '<div class="legend-item"><span class="legend-band-event"></span> Events</div>' : '') +
      '<div class="legend-item legend-more" onclick="ndOpenSheet(\'bs-fp-legend\')">+ More</div>';
  ndCapLegendRows(el, 'fp-full-legend', 2);
  ndSyncMonthlyNotes('fp', fpGranularity === 'monthly');
}

/* ── "+ More" overlays: Upcoming Bookings / Last Year Bookings / Last
   Year Bookings (Same Time), shown as short horizontal "stay bar"
   segments near the chart's baseline — matching desktop's own booking
   overlay style and, being compact discrete marks rather than a second
   full-width line, much easier to read on a narrow mobile screen than a
   continuous line running through the whole price chart.

   These used to be pure random noise, unrelated to the real dataset
   wired in elsewhere — so a legend swatch like "Last Year Bookings"
   never lined up with anything a viewer could actually verify against
   the real percentile bands or occupancy next to it. REAL_DAILY carries
   real "Upcoming Booking" / "Last Year Booking" columns (indices 12/13)
   from the source CSV; segments are now the contiguous runs of days
   where that real column actually has a value, so what's drawn is at
   least grounded in the real per-day data instead of disconnected from
   it. Same-Time-Last-Year has no distinct column of its own in the
   supplied data, so it reuses the Last Year Booking column's runs,
   restricted to the longer ones — still real data, just a different
   (explicitly related, not fabricated-from-scratch) slice of it. ── */
function fpBookingSegments(days, fieldIdx, minLen) {
  minLen = minLen || 1;
  const segments = [];
  let start = null;
  for (let i = 0; i < days; i++) {
    const has = ndRealDay(i).row[fieldIdx] > 0;
    if (has && start === null) start = i;
    if (!has && start !== null) {
      if (i - 1 - start + 1 >= minLen) segments.push([start, i - 1]);
      start = null;
    }
  }
  if (start !== null && days - 1 - start + 1 >= minLen) segments.push([start, days - 1]);
  return segments;
}
function ndSegmentsToLineData(segments, y) {
  const data = [];
  segments.forEach(function (seg, idx) {
    if (idx > 0) data.push(null);
    data.push([seg[0], y]);
    data.push([seg[1], y]);
  });
  return data;
}
function fpToggleOverlay(el, kind) {
  el.classList.toggle('checked');
  const on = el.classList.contains('checked');
  if (!fpChart) return;
  const id = 'fp-overlay-' + kind;
  const existing = ndSeriesById(fpChart, id);
  if (!on) { if (existing) existing.remove(); return; }
  if (existing) return;
  const axisMin = fpChart.yAxis[0].min, axisMax = fpChart.yAxis[0].max;
  const range = axisMax - axisMin;
  const laneIndex = { upcoming: 0, lastyear: 1, stly: 2 }[kind];
  const laneY = Math.round(axisMin + range * (0.02 + laneIndex * 0.035));
  const meta = {
    upcoming: { name: 'Upcoming Bookings', color: '#31C48D' },
    lastyear: { name: 'Last Year Bookings', color: '#274690' },
    stly: { name: 'Last Year Bookings (Same Time)', color: '#D62828' }
  }[kind];
  const segments = kind === 'upcoming' ? fpBookingSegments(fpDays, 12)
    : kind === 'lastyear' ? fpBookingSegments(fpDays, 13)
    : fpBookingSegments(fpDays, 13, 3);
  const data = ndSegmentsToLineData(segments, laneY);
  fpChart.addSeries({
    id: id, type: 'line', name: meta.name, color: meta.color, data: data,
    lineWidth: 4, marker: { enabled: false }, enableMouseTracking: false,
    connectNulls: false, zIndex: 6
  }, true);
}

/* Switching to Monthly and staying at a 30-day range showed a chart with
   only one bucket (barely one bar) — Monthly reads as a "wider view", so
   its default window jumps to 90 days rather than keeping whatever the
   Daily range happened to be. Switching back to Daily is left alone
   (doesn't force it back to 30) since the user may have picked that
   range deliberately before switching. */
function fpToggleEventsOption(el) {
  el.classList.toggle('checked');
  fpEventsEnabled = el.classList.contains('checked');
  fpInitChart();
  /* Re-render whatever the card was already showing (a live scrub, or
     the empty state) rather than resetting it back to empty just
     because a chart option changed underneath it. */
  if (fpLastScrubIndex !== null && fpChart) fpUpdateInfoCard(fpChart, fpLastScrubIndex, 'fp');
}
function fpSetGranularity(el, mode) {
  el.closest('.pill-toggles').querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  fpGranularity = mode;
  if (mode === 'monthly') { fpDays = 90; ndSyncRangePillText('fp', 90); }
  fpInitChart();
}

/* ── Occupancy: matches desktop's own Occupancy chart — Market Occupancy
   (current), Last Year (Today) and Last Year (Final) as lines (daily) or
   grouped columns (monthly), plus an optional 7-day Market Pickup pacing
   overlay (toggled from Chart Options — item 4). Daily/Monthly is its
   own independent toggle — not tied to Future Prices' granularity. ── */
function occBuildData(days, granularity) {
  const rows = [];
  for (let i = 0; i < days; i++) {
    const { date, row } = ndRealDay(i);
    rows.push({
      date: date,
      market: row[5],
      lyToday: row[6],
      lyFinal: row[7],
      pickup: row[8],
      pickupLY: row[9],
      bookedOcc: row[15],
      isEvent: !!row[11], eventLabel: row[11]
    });
  }
  let buckets;
  if (granularity === 'monthly') {
    buckets = bucketByMonth(rows);
  } else {
    const points = Math.min(days, 30);
    const step = Math.max(1, Math.round(days / points));
    buckets = [];
    for (let i = 0; i < rows.length; i += step) buckets.push(rows.slice(i, i + 1));
  }
  const cats = [], market = [], lyToday = [], lyFinal = [], pickup = [], pickupLY = [], bookedOcc = [];
  const events = [], eventLabels = {};
  buckets.forEach((rowsInBucket, i) => {
    const first = rowsInBucket[0];
    /* Monthly: the first bucket is the current month, which only has
       today-onward dates — flagged with "*" (footnote under the chart),
       matching desktop's "*Reflects future dates only". */
    cats.push(granularity === 'monthly'
      ? (i === 0 ? '*' : '') + first.date.toLocaleDateString('en-US', { month: 'short' })
      : first.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    const avg = key => Math.round(rowsInBucket.reduce((s, r) => s + r[key], 0) / rowsInBucket.length);
    market.push(Math.min(100, avg('market')));
    lyToday.push(Math.min(100, avg('lyToday')));
    lyFinal.push(Math.min(100, avg('lyFinal')));
    pickup.push(avg('pickup'));
    pickupLY.push(avg('pickupLY'));
    bookedOcc.push(Math.min(100, avg('bookedOcc')));
    /* Events are daily-only (see fpBuildData's own note) — Occupancy's
       monthly view averages a whole month into one bar/point, so a
       single day's holiday no longer means anything at that scale. */
    if (granularity !== 'monthly') {
      const withEvent = rowsInBucket.find(r => r.isEvent);
      if (withEvent) { eventLabels[i] = withEvent.eventLabel; events.push(i); }
    }
  });
  return { cats, market, lyToday, lyFinal, pickup, pickupLY, bookedOcc, events, eventLabels };
}

let occChart = null;
let occDays = 30;
let occGranularity = 'daily';
let occPacingEnabled = false;
let occEventsEnabled = true;
let occLastScrubIndex = null;

function occRenderChart(containerId, height, idPrefix) {
  idPrefix = idPrefix || 'occ';
  const el = document.getElementById(containerId);
  if (!el || !window.Highcharts) return null;
  const { cats, market, lyToday, lyFinal, pickup, pickupLY, bookedOcc, events, eventLabels } = occBuildData(occDays, occGranularity);
  const isMonthly = occGranularity === 'monthly';
  /* "Your Booked Nights" — the real per-day occupancy of THIS listing
     (as opposed to every other series here, which is a market-wide
     figure) — drawn as a plain grey bar behind everything else, matching
     the reference desktop view where it anchors the other lines against
     what actually happened on your own calendar. */
  /* No per-series pointPadding/groupPadding override here — this used to
     have its own tighter values, which made its bars a different width
     than the other grouped columns next to it (they all share the same
     plotOptions.column padding now, so every bar in the group is the
     same width). */
  const bookedSeries = { type: 'column', id: 'occ-s-bookedocc', name: 'Booked Nights', data: bookedOcc, color: '#D8DCE2', zIndex: 0 };
  /* Monthly mirrors desktop: Market Occupancy + Last Year (Today/Final)
     columns in a red→pink ramp, plus optional pickup lines — no Booked
     Nights (a per-day metric that doesn't aggregate meaningfully). */
  const series = isMonthly ? [
    { type: 'column', id: 'occ-s-market', name: 'Market Occupancy', data: market, color: '#F37579', zIndex: 3 },
    { type: 'column', id: 'occ-s-lytoday', name: 'Last Year (Today)', data: lyToday, color: '#FBA3A5', zIndex: 2 },
    { type: 'column', id: 'occ-s-lyfinal', name: 'Last Year (Final)', data: lyFinal, color: '#F8C0C0', zIndex: 1 }
  ] : [
    bookedSeries,
    { type: 'line', id: 'occ-s-market', name: 'Market Occupancy', data: market, color: '#F37579', lineWidth: 2, zIndex: 5 },
    { type: 'line', id: 'occ-s-lytoday', name: 'Last Year (Today)', data: lyToday, color: '#B5B5B5', lineWidth: 1.5, zIndex: 4 },
    { type: 'line', id: 'occ-s-lyfinal', name: 'Last Year (Final)', data: lyFinal, color: '#B5B5B5', lineWidth: 1.5, dashStyle: 'Dot', zIndex: 4 }
  ];
  if (occPacingEnabled) {
    series.push({ type: 'line', id: 'occ-s-pickup', name: '7-day Market Pickup', data: pickup, color: '#31C48D', lineWidth: 1.5, zIndex: 6 });
    series.push({ type: 'line', id: 'occ-s-pickupLY', name: '7-day Market Pickup (LY)', data: pickupLY, color: '#31C48D', lineWidth: 1.5, dashStyle: 'Dot', zIndex: 6 });
  }
  el.style.height = height + 'px';
  const chart = Highcharts.chart(containerId, {
    chart: {
      height: height,
      spacing: ND_CHART_SPACING,
      marginLeft: ND_CHART_MARGIN_LEFT,
      marginRight: ND_CHART_MARGIN_RIGHT,
      backgroundColor: 'transparent',
      zooming: { type: undefined },
      panning: { enabled: false },
      events: { load: function () { ndShowInfoCardEmptyState(idPrefix); ndResyncChartHeight(this); } }
    },
    xAxis: Object.assign(ndXAxisConfig(cats, Math.max(1, Math.round(cats.length / 5))), { plotBands: occEventsEnabled ? ndEventPlotBands(events) : [] }),
    yAxis: ndYAxisConfig({
      max: 110,
      yFormatter: function () { return this.value + '%'; }
    }),
    tooltip: { enabled: false },
    legend: { enabled: false },
    plotOptions: {
      column: {
        pointPadding: 0.08, groupPadding: 0.1, borderWidth: 0, borderRadius: 2,
        dataLabels: isMonthly ? {
          enabled: true, formatter: function () { return this.y + '%'; },
          style: { fontSize: '9px', fontWeight: '700', color: 'var(--pl-text)', textOutline: 'none' }
        } : { enabled: false }
      },
      series: { marker: { enabled: false }, states: { hover: { enabled: false } } }
    },
    series: series
  });
  chart.ndEventLabels = eventLabels;
  const wrap = el.closest('.hc-chart-wrap');
  attachScrub(chart, wrap, function (c, idx) { occUpdateInfoCard(c, idx, idPrefix); }, null, idPrefix === 'fs');
  return chart;
}

function occInitChart(days) {
  if (!document.getElementById('occ-hc-chart')) return;
  if (days) occDays = Math.min(days, 90);
  if (occChart) { occChart.destroy(); occChart = null; }
  occChart = occRenderChart('occ-hc-chart', ndWidgetChartHeight(), 'occ');
  occRenderLegend();
}

/* ── Pinned drag-tooltip for Occupancy, same pattern as Future Prices'
   fpUpdateInfoCard: date + headline value in the card header, the rest
   of the series broken out as rows below. ── */
function occUpdateInfoCard(chart, index, idPrefix) {
  const marketS = ndSeriesById(chart, 'occ-s-market');
  if (!marketS || !marketS.points.length) return;
  const i = Math.max(0, Math.min(index, marketS.points.length - 1));
  const card = document.getElementById(idPrefix + '-info-card');
  if (card) card.classList.remove('nd-info-empty');
  const dateEl = document.getElementById(idPrefix + '-info-date');
  const priceEl = document.getElementById(idPrefix + '-info-price');
  const rowsEl = document.getElementById(idPrefix + '-info-rows');
  if (dateEl) dateEl.textContent = chart.xAxis[0].categories[i];
  if (priceEl) priceEl.textContent = marketS.points[i].y + '%';
  if (!rowsEl) return;
  const isMonthly = occGranularity === 'monthly';
  /* Full "Market Occupancy (Last Year Today/Final)" wording, matching
     desktop's own tooltip — the short "Last Year (Today)" read fine next
     to a "Market Occupancy" chart title, but on its own in a list of
     rows it wasn't clear which metric "Today"/"Final" belonged to. */
  const defs = [
    ['occ-s-bookedocc', '#D8DCE2', 'Booked Nights', null],
    ['occ-s-lytoday', isMonthly ? '#FBA3A5' : '#B5B5B5', 'Market Occupancy (Last Year Today)', null],
    ['occ-s-lyfinal', isMonthly ? '#F8C0C0' : '#B5B5B5', 'Market Occupancy (Last Year Final)', isMonthly ? null : 'Dot'],
    ['occ-s-pickup', '#31C48D', '7-day Market Pickup', null],
    ['occ-s-pickupLY', '#31C48D', '7-day Market Pickup (Last Year Today)', 'Dot']
  ];
  let rows = '';
  defs.forEach(function (d) {
    const s = ndSeriesById(chart, d[0]);
    if (!s || !s.visible) return;
    const pt = s.points[i];
    rows += ndTTRowHTML(d[1], d[2], pt && pt.y != null ? pt.y + '%' : '—', d[3]);
  });
  if (occEventsEnabled && !isMonthly) {
    rows += ndEventsRowHTML(chart.ndEventLabels && chart.ndEventLabels[i]);
  }
  occLastScrubIndex = i;
  rowsEl.innerHTML = rows;
}

/* ── Legend rebuilt per-granularity/pacing-state ── */
function occRenderLegend() {
  const el = document.getElementById('occ-legend');
  if (!el) return;
  const isMonthly = occGranularity === 'monthly';
  const li = (seriesId, swatchHtml, label) =>
    '<div class="legend-item togglable" onclick="ndToggleLegendSeries(this,occChart,\'' + seriesId + '\')">' + swatchHtml + ' ' + label + '</div>';
  let html =
    (isMonthly ? '' : li('occ-s-bookedocc', ndSwatchHTML('#D8DCE2', null, true), 'Booked Nights')) +
    li('occ-s-market', ndSwatchHTML('#F37579', null, isMonthly), 'Market Occupancy') +
    li('occ-s-lytoday', ndSwatchHTML(isMonthly ? '#FBA3A5' : '#B5B5B5', null, isMonthly), 'Last Year (Today)') +
    li('occ-s-lyfinal', ndSwatchHTML(isMonthly ? '#F8C0C0' : '#B5B5B5', isMonthly ? null : 'Dot', isMonthly), 'Last Year (Final)');
  if (occPacingEnabled) {
    html += li('occ-s-pickup', ndSwatchHTML('#31C48D', null, false), '7-day Pickup');
    html += li('occ-s-pickupLY', ndSwatchHTML('#31C48D', 'Dot', false), 'Pickup (LY)');
  }
  html += '<div class="legend-item legend-more" onclick="ndOpenSheet(\'bs-occ-legend\')">+ More</div>';
  el.innerHTML = html;
  ndCapLegendRows(el, 'occ-full-legend', 2);
  ndSyncMonthlyNotes('occ', isMonthly);
}

function occSetGranularity(el, mode) {
  el.closest('.pill-toggles').querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  occGranularity = mode;
  if (mode === 'monthly') { occDays = 90; ndSyncRangePillText('occ', 90); }
  occInitChart();
}
function occTogglePacing(el) {
  el.classList.toggle('checked');
  occPacingEnabled = el.classList.contains('checked');
  occInitChart();
}
function occToggleEventsOption(el) {
  el.classList.toggle('checked');
  occEventsEnabled = el.classList.contains('checked');
  occInitChart();
  if (occLastScrubIndex !== null && occChart) occUpdateInfoCard(occChart, occLastScrubIndex, 'occ');
}

/* ── Market History: column chart, swaps metric via metric-card tap.
   Shows year-over-year comparison bars (like desktop's own Market
   History widget) — "Last 1 year" shows just the current 12 months,
   "Last 2 year" shows this year alongside last year, paired per month,
   with a tap tooltip giving both years' values. ── */
/* Market History bars are colored by the calendar year each month
   falls in — the trailing-12-month window (Sep → Aug) spans two years,
   so e.g. in "Last 1 Year" Sep–Dec are 2025 and Jan–Aug are 2026, and
   "Last 2 Years" adds the prior window (2024/2025). Same palette as
   desktop. Values above the bars are plain numbers; the unit lives in
   the y-axis title. */
const HIST_YEAR_COLORS_1 = { 2025: '#F69396', 2026: '#F37579' };
const HIST_YEAR_COLORS_2 = { 2024: '#7A7A7A', 2025: '#F69396', 2026: '#FCDCDD' };
const HIST_COLOR_PREV = '#F69396';
const HIST_COLOR_CURRENT = '#F37579';
const HIST_AXIS_TITLES = { occ: 'Occupancy (%)', adr: 'ADR (USD)', window: 'Booking Window (days)', los: 'Length of Stay (nights)' };
const histMetricData = REAL_HIST;
let histChart = null;
let histCurrentKey = 'occ';
let histYears = 1;
const histMonths = REAL_HIST_MONTHS;
function histYearOf(windowEndYear, idx) { return idx < 4 ? windowEndYear - 1 : windowEndYear; }
function histColor(year) { return (histYears === 2 ? HIST_YEAR_COLORS_2 : HIST_YEAR_COLORS_1)[year]; }
function histInitChart(key) {
  const el = document.getElementById('hist-hc-chart');
  if (!el || !window.Highcharts) return;
  if (key) histCurrentKey = key;
  const m = histMetricData[histCurrentKey];
  if (histChart) { histChart.destroy(); histChart = null; }
  const pts = (arr, endYear) => arr.map((v, i) => ({ y: v, color: histColor(histYearOf(endYear, i)) }));
  const series = histYears === 2
    ? [
        { type: 'column', id: 'hist-s-2025', name: 'Prior 12 months', data: pts(m.y2025, 2025) },
        { type: 'column', id: 'hist-s-2026', name: 'Last 12 months', data: pts(m.y2026, 2026) }
      ]
    : [{ type: 'column', id: 'hist-s-2026', name: 'Last 12 months', data: pts(m.y2026, 2026) }];
  el.style.height = '220px';
  histChart = Highcharts.chart('hist-hc-chart', {
    chart: {
      height: 220, spacing: ND_CHART_SPACING, marginLeft: ND_CHART_MARGIN_LEFT + 14, marginRight: ND_CHART_MARGIN_RIGHT, backgroundColor: 'transparent',
      events: { load: function () { ndShowInfoCardEmptyState('hist'); } }
    },
    xAxis: {
      categories: histMonths, lineWidth: 1, lineColor: '#E0E0E0', tickLength: 0,
      labels: { style: { fontSize: '10px', color: '#7A7A7A' } },
      crosshair: { width: 1, color: '#CBD0D6', dashStyle: 'Dash' }
    },
    yAxis: Object.assign(ndYAxisConfig({
      yFormatter: function () { return this.value; }
    }), {
      maxPadding: 0.18,
      title: { text: HIST_AXIS_TITLES[histCurrentKey], margin: 6, style: { fontSize: '10px', fontWeight: '600', color: '#7A7A7A' } }
    }),
    tooltip: { enabled: false },
    legend: { enabled: false },
    plotOptions: {
      column: {
        borderWidth: 0, borderRadius: 3, pointPadding: 0.15, groupPadding: 0.08,
        dataLabels: { enabled: histYears !== 2, formatter: function () { return this.y; }, style: { fontSize: '10px', fontWeight: '600', color: 'var(--pl-text)', textOutline: 'none' } }
      },
      series: { marker: { enabled: false }, states: { hover: { enabled: false } }, animation: { duration: 250 } }
    },
    series: series
  });
  renderHistLegend();
  const histWrap = el.closest('.hc-chart-wrap');
  attachScrub(histChart, histWrap, function (chart, idx) { histUpdateInfoCard(chart, idx); });
}

/* ── Pinned drag-tooltip for Market History: one row per bar in the
   scrubbed month, labeled with that bar's own calendar year. ── */
function histUpdateInfoCard(chart, index) {
  const points = chart.series[0] && chart.series[0].points;
  if (!points || !points.length) return;
  const i = Math.max(0, Math.min(index, points.length - 1));
  const m = histMetricData[histCurrentKey];
  const fmt = v => (m.prefix || '') + v + (m.suffix || '');
  const card = document.getElementById('hist-info-card');
  if (card) card.classList.remove('nd-info-empty');
  const dateEl = document.getElementById('hist-info-date');
  const rowsEl = document.getElementById('hist-info-rows');
  if (dateEl) dateEl.textContent = histMonths[i];
  if (!rowsEl) return;
  const yNow = histYearOf(2026, i), yPrev = histYearOf(2025, i);
  rowsEl.innerHTML = (histYears === 2 ? ndTTRowHTML(histColor(yPrev), histMonths[i] + ' ' + yPrev, fmt(m.y2025[i])) : '') +
    ndTTRowHTML(histColor(yNow), histMonths[i] + ' ' + yNow, fmt(m.y2026[i]));
}

/* Legend lists the calendar years present (not the two series), since
   each series spans two years. */
function renderHistLegend() {
  const el = document.getElementById('hist-legend');
  if (!el) return;
  const years = histYears === 2 ? [2024, 2025, 2026] : [2025, 2026];
  el.innerHTML = years.map(y =>
    '<div class="legend-item"><div class="legend-swatch" style="background:' + histColor(y) + ';height:8px;width:8px;border-radius:2px"></div> ' + y + '</div>'
  ).join('');
}

function switchHistoryMetric(el, key) {
  histInitChart(key);
}

/* ── Market History summary tiles: the trailing-12-month average of
   each real metric (vs. the year before), replacing 4 numbers that used
   to be hand-typed and could drift from the chart's own (also real,
   as of this data pass) data underneath them. ── */
function ndRenderHistSummary() {
  const avg = arr => arr.reduce((s, v) => s + v, 0) / arr.length;
  const fmt1 = v => Math.round(v * 10) / 10;
  Object.keys(REAL_HIST).forEach(key => {
    const m = REAL_HIST[key];
    const cur = avg(m.y2026), prev = avg(m.y2025);
    const valueEl = document.getElementById('metric-value-' + key);
    const trendEl = document.getElementById('metric-trend-' + key);
    if (!valueEl) return;
    const curDisplay = key === 'los' ? fmt1(cur) : Math.round(cur);
    valueEl.textContent = (m.prefix || '') + curDisplay + (m.suffix || '');
    const diff = cur - prev;
    const up = diff >= 0;
    const diffDisplay = key === 'los' ? fmt1(Math.abs(diff)) : Math.round(Math.abs(diff));
    if (!trendEl) return;
    trendEl.classList.remove('up', 'down', 'flat');
    /* A change that rounds to zero reads as "no change", not a green up-arrow. */
    if (Number(diffDisplay) === 0) {
      trendEl.classList.add('flat');
      trendEl.textContent = 'No change vs. last year';
      return;
    }
    trendEl.classList.add(up ? 'up' : 'down');
    trendEl.textContent = (up ? '↑ ' : '↓ ') + (m.prefix || '') + diffDisplay + (m.suffix || '') + ' vs. last year';
  });
}
function histSetYears(el, years) {
  el.closest('.pill-toggles').querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  histYears = years;
  histInitChart();
}

/* ── Trading-app crosshair scrub: tap-and-drag updates the hero header live
   and shows a floating tooltip card with the market range at that point ── */
/* ── Scrub hint: a brief dark pill over the chart, shown when a single
   touch just swipes through it without long-pressing first — tells the
   user how to actually get at chart scrubbing instead of leaving them
   guessing why the chart "ate" their scroll (it no longer does, see
   attachScrub below, but a single accidental fast swipe can still land
   as a scroll past the long-press window). Google Maps' "use two
   fingers" toast and Robinhood/Coinbase's press-and-hold-to-scrub charts
   are the reference points here. */
function ndShowScrubHint(wrapEl) {
  if (!wrapEl) return;
  let hint = wrapEl.querySelector('.hc-scrub-hint');
  if (!hint) {
    hint = document.createElement('div');
    hint.className = 'hc-scrub-hint';
    hint.innerHTML = '<span>Long-press or use two fingers to explore the chart</span>';
    wrapEl.appendChild(hint);
  }
  clearTimeout(hint._hideTimer);
  hint.classList.add('visible');
  hint._hideTimer = setTimeout(() => hint.classList.remove('visible'), 1600);
}

/* ── Chart scrubbing: a single-finger touch used to start dragging (and
   preventDefault) the instant it landed on the chart, which silently
   swallowed the page's own vertical scroll any time a swipe happened to
   start over a chart — a real usability bug on a page that's mostly
   scrolled with one finger. Scrubbing now needs a deliberate gesture
   instead: a short long-press (matching the press-and-hold-to-scrub
   pattern common to trading-app charts) or a two-finger touch (which
   can't be a scroll gesture in the first place, so it's safe to claim
   immediately, mirroring how map apps reserve pinch/two-finger for the
   map and leave one finger for the page). A plain single-finger swipe
   is left completely alone — it's never intercepted — and a swipe that
   moves before the long-press fires shows a brief hint instead. ── */
function attachScrub(chart, wrapEl, updateFn, tooltipFn, immediate) {
  if (!chart || !chart.container) return;
  const container = chart.container;
  let dragging = false;
  let longPressTimer = null;
  let startX = 0, startY = 0;
  const MOVE_TOLERANCE = 10;
  const LONG_PRESS_MS = 350;

  function pointFromEvent(e) {
    const evt = chart.pointer.normalize(e);
    const xAxis = chart.xAxis[0];
    const x = xAxis.toValue(evt.chartX);
    const points = chart.series[0].points;
    let idx = Math.round(x);
    idx = Math.max(0, Math.min(idx, points.length - 1));
    return idx;
  }

  function moveTo(e) {
    const idx = pointFromEvent(e);
    chart.xAxis[0].drawCrosshair(null, chart.series[0].points[idx]);
    chart.tooltip && chart.tooltip.hide && chart.tooltip.hide();
    updateFn(chart, idx);
    if (wrapEl && tooltipFn) ndShowTooltip(wrapEl, chart, idx, tooltipFn(chart, idx));
  }
  function clearLongPress() {
    if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
  }
  function release() {
    dragging = false;
    clearLongPress();
    if (wrapEl) ndHideTooltip(wrapEl);
  }

  container.addEventListener('mousedown', e => { dragging = true; moveTo(e); });
  container.addEventListener('mousemove', e => { if (dragging) moveTo(e); });
  window.addEventListener('mouseup', release);

  container.addEventListener('touchstart', e => {
    /* The long-press/two-finger gesture exists purely to keep a swipe
       that starts over a chart from hijacking the page's own scroll.
       The fullscreen chart view has nothing to scroll around it — it's
       the entire screen — so there's no competing gesture to protect
       against, and a single-finger touch can just drag immediately,
       the way you'd expect any full-screen chart to work. */
    if (immediate) {
      dragging = true;
      moveTo(e.touches[0]);
      e.preventDefault();
      return;
    }
    if (e.touches.length >= 2) {
      // Two fingers can't be a scroll gesture — safe to claim right away.
      clearLongPress();
      dragging = true;
      moveTo(e.touches[0]);
      e.preventDefault();
      return;
    }
    const t = e.touches[0];
    startX = t.clientX; startY = t.clientY;
    clearLongPress();
    longPressTimer = setTimeout(() => {
      dragging = true;
      moveTo(t);
    }, LONG_PRESS_MS);
  }, { passive: !immediate });

  container.addEventListener('touchmove', e => {
    if (dragging) {
      moveTo(e.touches[0]);
      e.preventDefault();
      return;
    }
    if (longPressTimer && e.touches.length === 1) {
      const t = e.touches[0];
      if (Math.abs(t.clientX - startX) > MOVE_TOLERANCE || Math.abs(t.clientY - startY) > MOVE_TOLERANCE) {
        // Moved before the long-press fired — this is a scroll, not a
        // scrub attempt. Let it through untouched and just flag how to
        // actually reach the chart's interactive mode.
        clearLongPress();
        ndShowScrubHint(wrapEl);
      }
    }
  }, { passive: false });

  container.addEventListener('touchend', release);
  container.addEventListener('touchcancel', release);
}

/* ── Init all three charts once their containers exist in the DOM ── */
function ndInitCharts() {
  if (document.getElementById('fp-hc-chart') && !fpChart) fpInitChart();
  if (document.getElementById('occ-hc-chart') && !occChart) occInitChart();
  if (document.getElementById('hist-hc-chart') && !histChart) histInitChart();
  ndRenderHistSummary();
  ccInitEmptyState();
  ndRenderMarketOverview();
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ndInitCharts);
} else {
  ndInitCharts();
}

/* ── Competitor Calendar detail view: builds the day-grid + fees from
   THIS competitor's own price (previously always showed the first
   competitor's static hardcoded data, regardless of which tile was tapped) ── */
/* Month calendar for one competitor, built from the same ccCell data
   as the table/By Date views so the numbers always agree. Days before
   today or beyond the data range render as plain muted dates. */
let ccCalName = null, ccCalOffset = 0;
function ndBuildCompCalendar() {
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const start = new Date(REAL_DAILY_START + 'T00:00:00');
  const first = new Date(start.getFullYear(), start.getMonth() + ccCalOffset, 1);
  const dim = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  document.getElementById('cc-cal-month').textContent = MONTHS[first.getMonth()] + ' ' + first.getFullYear();
  document.getElementById('cc-cal-prev').disabled = ccCalOffset <= 0;
  document.getElementById('cc-cal-next').disabled = ccCalOffset >= 2;
  let html = '';
  for (let k = 0; k < first.getDay(); k++) html += '<div></div>';
  for (let d = 1; d <= dim; d++) {
    const date = new Date(first.getFullYear(), first.getMonth(), d);
    const i = Math.round((date - start) / 86400000);
    if (i < 0 || i >= REAL_DAILY.length) { html += '<div class="ccm-day past"><span class="ccm-num">' + d + '</span></div>'; continue; }
    const cell = ccView_cell(ccCalName, i);
    let cls = 'ccm-day' + (i === 0 ? ' today' : '');
    let body;
    if (cell.na) { cls += ' off'; body = '<span class="ccm-p">N/A</span>'; }
    else if (cell.nb) { cls += ' off'; body = '<span class="ccm-p">N/B</span>'; }
    else if (cell.booked) { cls += ' off'; body = '<span class="ccm-p">' + ccShown(cell) + '</span><span class="ccm-ms">–</span>'; }
    else body = '<span class="ccm-p">' + ccShown(cell) + '</span><span class="ccm-ms">' + cell.minStay + ' ' + CC_MOON + '</span>';
    html += '<div class="' + cls + '"><span class="ccm-num">' + d + '</span>' + body + '</div>';
  }
  document.getElementById('cc-grid').innerHTML = html;
  const c = CC_COMPS[ccCalName] || {};
  const fee = c.fee || 40;
  document.getElementById('cc-fee-cleaning').textContent = '$' + fee;
  document.getElementById('cc-fee-guest').textContent = '$' + (Math.round(fee * 0.3 / 5) * 5 || 5);
  document.getElementById('cc-fee-pet').textContent = '$' + (Math.round(fee * 0.6 / 5) * 5 || 10);
}
function ccCalMonth(step) {
  ccCalOffset = Math.max(0, Math.min(2, ccCalOffset + step));
  ndBuildCompCalendar();
}

function openCompCalendar(name, rating, type) {
  document.getElementById('cc-title').textContent = name;
  document.getElementById('cc-meta').innerHTML = ND_STAR_ICON + ' ' + rating + ' · ' + type;
  ccCalName = name;
  ccCalOffset = 0;
  ndBuildCompCalendar();
  ndOpenSheet('bs-comp-calendar');
}


/* ── Bottom Sheet ── */
/* ── V1/V2 prototype switcher: V1 is the same Neighborhood Data
   experience minus Competitor Calendar, V2 has it — a single build with
   a toggle instead of two separate deployments to keep in sync. ── */
function ndSetVersion(version, el) {
  el.closest('.nd-version-toggle').querySelectorAll('.nd-version-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  const cc = document.getElementById('sec-competitor-calendar');
  if (cc) cc.style.display = version === 'v1' ? 'none' : '';
}
/* Bottom sheets snap to one of two heights — 50% of the screen for
   short content, 90% when it wouldn't fit in half — measured from the
   content itself (handle + header + footer + the body's full scroll
   height), so the header and close button are always visible. */
function ndSizeSheet(overlay) {
  const sheet = overlay.querySelector('.bottom-sheet');
  if (!sheet) return;
  let natural = 0;
  Array.from(sheet.children).forEach(c => {
    natural += c.classList.contains('bs-body') ? c.scrollHeight : c.offsetHeight;
  });
  const tall = natural > overlay.clientHeight * 0.5;
  sheet.classList.toggle('bs-full', tall);
  sheet.classList.toggle('bs-half', !tall);
}
function ndOpenSheet(id) {
  const overlay = document.getElementById(id);
  overlay.classList.add('open');
  ndSizeSheet(overlay);
}
function ndCloseSheet(id) {
  document.getElementById(id).classList.remove('open');
}

/* ── Radio groups in bottom sheets ── */
function selectRadio(el) {
  el.closest('.bs-radio-group').querySelectorAll('.bs-radio').forEach(r => r.classList.remove('selected'));
  el.classList.add('selected');
}

/* ── Date range picker (Future Prices / Occupancy): a bottom sheet with
   full-width tappable rows, replacing an earlier small dropdown menu
   that was fiddly to tap accurately on a real phone. Shared between
   both charts — ndRangePickerTarget records which one opened it. ── */
function ndSyncRangePillText(prefix, days) {
  const pill = document.getElementById(prefix + '-range-pill');
  if (pill) pill.firstChild.textContent = 'Next ' + days + ' Days';
}
let ndRangePickerTarget = 'fp';
function ndOpenRangePicker(which) {
  ndRangePickerTarget = which;
  const currentDays = which === 'fp' ? fpDays : occDays;
  document.querySelectorAll('#range-picker-options .bs-radio').forEach(r => {
    r.classList.toggle('selected', parseInt(r.dataset.days, 10) === currentDays);
  });
  ndOpenSheet('bs-range-picker');
}
function ndSelectRangeOption(el, days) {
  selectRadio(el);
  ndSyncRangePillText(ndRangePickerTarget, days);
  if (ndRangePickerTarget === 'fp') fpInitChart(days); else occInitChart(days);
  ndCloseSheet('bs-range-picker');
}

/* ── Fullscreen chart detail view (item 8): a mobile-first push screen,
   reusing the same fp/occ chart-building functions at a larger size
   rather than a separate "zoomed" implementation. Forced into landscape:
   real orientation-lock only applies inside the true Fullscreen API,
   which this in-app "sheet" isn't, so the reliable cross-browser option
   is rotating the sheet itself 90° within the device frame — sized so
   the box is exactly the frame's own dimensions swapped, which after the
   rotation fills the frame edge-to-edge with a wide, landscape-shaped
   layout instead of a portrait one. ── */
let fsChart = null;
function ndApplyForceLandscape(el) {
  const frame = document.querySelector('.phone-frame');
  if (!frame) return;
  const w = frame.clientWidth, h = frame.clientHeight;
  el.classList.add('force-landscape');
  /* The extracted real-app stylesheet has `.chakra-modal__content` rules
     with `max-width: 100% !important` and (via .nd-fullscreen)
     `min-height: 100% !important` — both silently clamped this sheet
     back to the frame's own portrait box no matter what plain inline
     width/height were set. Inline !important (via setProperty) is the
     only thing that reliably outranks those regardless of selector
     specificity. */
  el.style.setProperty('width', h + 'px', 'important');
  el.style.setProperty('height', w + 'px', 'important');
  el.style.setProperty('max-width', h + 'px', 'important');
  el.style.setProperty('min-height', w + 'px', 'important');
  /* Position with plain pixel left/top rather than top:50%/left:50% plus
     a percentage translate — chaining a percentage translate() with a
     rotate() in the same transform list rotates the translate's own
     offset too (CSS applies transform functions right-to-left), which
     silently swapped/corrupted the centering. Pixel left/top plus a
     lone rotate() sidesteps that ordering trap entirely. */
  el.style.setProperty('left', ((w - h) / 2) + 'px', 'important');
  el.style.setProperty('top', ((h - w) / 2) + 'px', 'important');
  el.style.setProperty('right', 'auto', 'important');
  el.style.setProperty('bottom', 'auto', 'important');
  el.style.setProperty('transform', 'rotate(90deg)', 'important');
  return w;
}
function ndClearForceLandscape(el) {
  el.classList.remove('force-landscape');
  ['width', 'height', 'max-width', 'min-height', 'top', 'left', 'right', 'bottom', 'transform'].forEach(function (p) { el.style.removeProperty(p); });
}
function ndOpenChartFullscreen(which) {
  document.getElementById('fs-chart-title').textContent = which === 'fp' ? 'Future Prices' : 'Occupancy';
  const sheet = document.getElementById('sheet-chart-fullscreen');
  sheet.style.display = 'flex';
  sheet.dataset.chart = which;
  /* "Fullscreen" here means filling the device frame in landscape via
     the rotation trick below — not the real browser Fullscreen API,
     which would break out of the phone-frame mockup entirely rather
     than staying inside it. */
  ndApplyForceLandscape(sheet);
  if (fsChart) { fsChart.destroy(); fsChart = null; }
  setTimeout(function () {
    /* .hc-fullscreen-body .hc-chart has `height:100% !important` (needed
       so the chart fills the flex:1 area under the pinned info card at
       any rotated frame size) — that !important always wins over the
       plain inline pixel height fpRenderChart/occRenderChart set before
       creating the chart, so passing an estimated height here made the
       SVG's own size (from the chart.height option) disagree with the
       container's actual flex-derived box, and Highcharts clips
       whatever falls outside that box — including the x-axis labels.
       Reading the container's real, already-laid-out clientHeight keeps
       the two in sync. */
    const el = document.getElementById('fs-hc-chart');
    const chartHeight = Math.max(120, (el ? el.clientHeight : 0) || 180);
    fsChart = which === 'fp' ? fpRenderChart('fs-hc-chart', chartHeight, 'fs') : occRenderChart('fs-hc-chart', chartHeight, 'fs');
  }, 30);
}
function ndCloseChartFullscreen() {
  const sheet = document.getElementById('sheet-chart-fullscreen');
  sheet.style.display = 'none';
  ndClearForceLandscape(sheet);
  if (fsChart) { fsChart.destroy(); fsChart = null; }
}

/* ── Comp Set edit sheet: Bedrooms multi-select — each bedroom type is
   its own tappable tab (toggled directly, no dropdown to open first). ── */
function ndToggleBedroomTab(el, isSelectAll) {
  const tabs = Array.from(document.querySelectorAll('#bedroom-tabs .bedroom-tab:not([data-select-all])'));
  if (isSelectAll) {
    const allSelected = tabs.every(t => t.classList.contains('selected'));
    tabs.forEach(t => t.classList.toggle('selected', !allSelected));
  } else {
    el.classList.toggle('selected');
  }
}
/* ── Comp Set edit sheet: "Do you add markup for this listing on your
   PMS?" radio choice, matching desktop's own copy and flow — a plain
   toggle checkbox previously stood in for this. ── */
function ndSelectMarkupChoice(el, showFields) {
  const fields = document.getElementById('markup-fields');
  if (el) {
    el.closest('.bs-radio-group').querySelectorAll('.bs-radio').forEach(r => r.classList.remove('selected'));
    el.classList.add('selected');
  } else if (fields) {
    // "Remove Markup Details" — revert to the "I don't Add a Markup" radio.
    const group = fields.previousElementSibling;
    if (group && group.classList.contains('bs-radio-group')) {
      group.querySelectorAll('.bs-radio').forEach((r, i) => r.classList.toggle('selected', i === 0));
    }
  }
  if (fields) fields.classList.toggle('open', showFields);
}


/* ── Market Overview: one row per bedroom type on a SHARED price scale
   (so rows are comparable at a glance), showing the typical 25th–75th
   range, the 75th–90th higher end, the median tick, and — on your
   bedroom type — a marker for your own average price with a one-line
   plain-language read. Your type's percentiles and price are the real
   next-30-day averages from REAL_DAILY; the other types are scaled from
   it (sample data). ── */
function ndRenderMarketOverview() {
  const root = document.getElementById('mo-rows');
  if (!root) return;
  const days = 30;
  const avgCol = c => { let t = 0; for (let i = 0; i < days; i++) t += ndRealDay(i).row[c]; return Math.round(t / days); };
  const base = { p25: avgCol(0), p50: avgCol(1), p75: avgCol(2), p90: avgCol(3) };
  const yourPrice = avgCol(4);
  const types = [
    { name: 'Studio', count: 88, f: 0.82 },
    { name: '1 BR', count: 145, f: 1, you: true },
    { name: '2 BR', count: 98, f: 1.25 },
    { name: '3 BR', count: 42, f: 1.55 }
  ].map(t => Object.assign(t, { p25: Math.round(base.p25 * t.f), p50: Math.round(base.p50 * t.f), p75: Math.round(base.p75 * t.f), p90: Math.round(base.p90 * t.f) }));
  const lo = Math.floor(Math.min(yourPrice, ...types.map(t => t.p25)) * 0.9 / 10) * 10;
  const hi = Math.ceil(Math.max(...types.map(t => t.p90)) * 1.05 / 10) * 10;
  const pos = v => ((v - lo) / (hi - lo)) * 100;
  let html = '';
  types.forEach(t => {
    let note = '';
    if (t.you) {
      const where = yourPrice < t.p25 ? 'below the typical range'
        : yourPrice > t.p90 ? 'above the 90th percentile'
        : yourPrice > t.p75 ? 'at the higher end'
        : yourPrice >= t.p50 ? 'in the typical range, above the median'
        : 'in the typical range, below the median';
      note = '<div class="mo-note">Your average price <strong>$' + yourPrice + '</strong> is ' + where + '.</div>';
    }
    html += '<div class="mo-row' + (t.you ? ' you' : '') + '">' +
      '<div class="mo-head"><span class="mo-name">' + t.name + '</span>' + (t.you ? '<span class="mo-tag">Your type</span>' : '') + '<span class="mo-count">' + t.count + ' listings</span></div>' +
      '<div class="mo-track">' +
        '<div class="mo-seg typ" style="left:' + pos(t.p25) + '%;width:' + (pos(t.p75) - pos(t.p25)) + '%"></div>' +
        '<div class="mo-seg up" style="left:' + pos(t.p75) + '%;width:' + (pos(t.p90) - pos(t.p75)) + '%"></div>' +
        '<div class="mo-med" style="left:' + pos(t.p50) + '%"></div>' +
        (t.you ? '<div class="mo-me" style="left:' + pos(yourPrice) + '%"></div>' : '') +
      '</div>' +
      '<div class="mo-vals"><span>Typical <strong>$' + t.p25 + '–$' + t.p75 + '</strong></span><span>Median <strong>$' + t.p50 + '</strong></span><span>90th <strong>$' + t.p90 + '</strong></span></div>' +
      note + '</div>';
  });
  const mid = Math.round((lo + hi) / 2 / 10) * 10;
  html += '<div class="mo-axis"><span>$' + lo + '</span><span>$' + mid + '</span><span>$' + hi + '</span></div>';
  root.innerHTML = html;
}


/* Monthly-view notes ("Values shown are monthly averages" / "*Reflects
   future dates only") — shown on two lines under the chart and repeated
   at the bottom of that chart's "+ More" legend sheet. */
function ndSyncMonthlyNotes(prefix, isMonthly) {
  const note = document.getElementById(prefix + '-footnote');
  if (note) note.style.display = isMonthly ? '' : 'none';
  const sheetNote = document.getElementById(prefix + '-legend-note');
  if (sheetNote) sheetNote.style.display = isMonthly ? '' : 'none';
}
