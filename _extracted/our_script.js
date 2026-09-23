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

/* ── Comp grid scroll → dots ── */
const compGrid = document.getElementById('comp-grid');
const compDots = document.getElementById('comp-dots');
if (compGrid && compDots) {
  compGrid.addEventListener('scroll', () => {
    const pageWidth = compGrid.offsetWidth;
    const pageIndex = Math.round(compGrid.scrollLeft / pageWidth);
    compDots.querySelectorAll('.dot').forEach((d, i) => {
      d.classList.toggle('active', i === pageIndex);
    });
  });
}

/* ── View all competitors toggle ── */
function toggleViewAll() {
  const list = document.getElementById('comp-all-list');
  const link = document.getElementById('comp-view-all');
  const grid = document.getElementById('comp-grid');
  const dots = document.getElementById('comp-dots');
  const isVisible = list.classList.contains('visible');
  if (isVisible) {
    list.classList.remove('visible');
    grid.style.display = '';
    dots.style.display = '';
    link.textContent = 'View all 9 competitors →';
  } else {
    list.classList.add('visible');
    grid.style.display = 'none';
    dots.style.display = 'none';
    link.textContent = '← Back to grid view';
  }
}

/* ── Competitor Calendar: Host vs. Guest price display. Host prices are
   the base nightly rate set by the host (what's already in the markup);
   Guest prices layer on an estimated PMS markup + fee, matching
   desktop's own "Host Prices"/"Guest Prices" toggle. The host value is
   captured lazily from each cell's own text the first time it's needed,
   so no separate dataset has to be hand-maintained per cell. ── */
let ccPriceMode = 'host';
function ccSetPriceMode(el, mode) {
  el.closest('.pill-toggles').querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  ccPriceMode = mode;
  document.querySelectorAll('#cc-view-table .comp-table-cell.price').forEach(function (cell) {
    if (cell.dataset.host === undefined) {
      const raw = cell.textContent.replace(/[^0-9.]/g, '');
      cell.dataset.host = raw;
    }
    if (!cell.dataset.host) return;
    const hostVal = parseFloat(cell.dataset.host);
    cell.textContent = '$' + (mode === 'guest' ? Math.round(hostVal * 1.13) : hostVal);
  });
  const note = document.getElementById('cc-price-footnote');
  if (note) {
    note.textContent = mode === 'guest'
      ? 'Nightly rates including fee and PMS markups.'
      : 'Nightly rates before adding fee or taxes; base amount set by the host.';
  }
}

/* ── Competitor Calendar: Calendar / Table / Map view toggle ── */
function ndSetCompView(el, mode) {
  el.closest('.comp-view-toggle').querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  const views = { calendar: 'cc-view-calendar', table: 'cc-view-table', map: 'cc-view-map' };
  Object.keys(views).forEach(key => {
    const view = document.getElementById(views[key]);
    if (view) view.style.display = key === mode ? '' : 'none';
  });
}

/* ── Competitor Calendar: add / remove flow (search + suggested list) ── */
function updateCompCounts() {
  const count = document.querySelectorAll('#add-comp-current-list .comp-row').length;
  document.querySelectorAll('.comp-count-badge').forEach(el => { el.textContent = count; });
  const link = document.getElementById('comp-view-all');
  if (link && !document.getElementById('comp-all-list').classList.contains('visible')) {
    link.textContent = 'View all ' + count + ' competitors →';
  }
  ccUpdateEmptyState();
}

/* ── Competitor Calendar empty state: the tab defaults to "no listings
   added" (matching a brand-new account) rather than starting pre-seeded
   with a comp set, with the populated calendar/table/map views revealed
   only once at least one competitor has actually been added. ── */
function ccUpdateEmptyState() {
  const empty = document.getElementById('cc-empty-state');
  const populated = document.getElementById('cc-populated');
  if (!empty || !populated) return;
  const hasCompetitors = document.querySelectorAll('#add-comp-current-list .comp-row').length > 0;
  empty.style.display = hasCompetitors ? 'none' : '';
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

/* ── Pill dropdown menu ── */
function togglePillMenu(id) {
  const dd = document.getElementById(id);
  dd.classList.toggle('open');
  // close on outside click
  if (dd.classList.contains('open')) {
    setTimeout(() => {
      document.addEventListener('click', function closer() {
        dd.classList.remove('open');
        document.removeEventListener('click', closer);
      }, { once: true });
    }, 0);
  }
}
function selectPillOption(item, pillId, label) {
  const pill = document.getElementById(pillId);
  // Update dropdown active state
  item.closest('.pill-dropdown').querySelectorAll('.dd-item').forEach(d => d.classList.remove('active'));
  item.classList.add('active');
  // Update pill text (keep the ▾ via CSS ::after)
  pill.childNodes[0].textContent = label;
  // Activate this pill in the toggle row (works for both .pill-toggles and .chart-controls)
  const container = pill.closest('.pill-toggles') || pill.closest('.chart-controls');
  if (container) {
    container.querySelectorAll('.pill').forEach(x => x.classList.remove('active'));
    pill.classList.add('active');
  }
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
    exporting: { enabled: false }
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

/* ── shared axis config, reused by all three charts (Classic style).
   Y-axis sits on the LEFT, matching desktop's own chart convention
   (and every other chart library default) — it was previously on the
   right (Upstox-style) with 44px reserved for it, which left the plot
   area visibly narrower than the card while the right side sat empty.
   Left-aligned axis labels are narrower (2-4 digits) so the reserved
   margin can shrink too, giving the plot area most of the card width. ── */
const ND_CHART_SPACING = [8, 2, 22, 0];
/* Highcharts auto-reserves axis width beyond what the label text actually
   needs (measured ~71px total for 3-char "$350"-style labels when left
   to auto-calculate) — the gap between the plot area and the card's right
   edge that was flagged as wasted space. Setting marginLeft/marginRight
   explicitly overrides that auto-calculation so the plot area's edges
   line up with the section's own title/icon-button edges instead of
   sitting inset by the auto-reserved margin + default spacing. Highcharts
   silently ellipsis-crops a y-axis label ("$350" -> "$…") once its
   rendered width exceeds the reserved marginLeft — measured the exact
   cutover for our 10px label font at 38px, so 40px is used with a small
   safety margin rather than the tighter (and broken) 30-36px tried
   earlier in this pass. */
const ND_CHART_MARGIN_LEFT = 40;
const ND_CHART_MARGIN_RIGHT = 6;
function ndXAxisConfig(cats, step) {
  return {
    categories: cats, lineWidth: 1, lineColor: '#E0E0E0', tickLength: 0,
    labels: { enabled: true, style: { fontSize: '10px', color: '#7A7A7A' }, step: step },
    crosshair: { width: 1, color: '#CBD0D6', dashStyle: 'Dash', label: { enabled: true, backgroundColor: '#333333', style: { color: '#fff', fontSize: '10px' } } }
  };
}
function ndYAxisConfig(opts) {
  opts = opts || {};
  return {
    title: { text: null }, opposite: false, gridLineWidth: 0, tickAmount: 3, max: opts.max,
    labels: { enabled: true, style: { fontSize: '10px', color: '#7A7A7A' }, formatter: opts.yFormatter },
    crosshair: { width: 1, color: '#CBD0D6', dashStyle: 'Dash', label: { enabled: true, backgroundColor: '#333333', format: opts.yCrosshairFormat || '{value:.0f}', style: { color: '#fff', fontSize: '10px' } } }
  };
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

/* ── Lookup a series by its explicit `id` rather than by position, so
   tooltip/hero code works the same whether the chart is showing its
   daily (line/arearange) or monthly (column) series set. ── */
function ndSeriesById(chart, id) {
  return chart.series.find(function (s) { return s.options.id === id; });
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

/* ── Future Prices: build data for N days, at either daily or monthly
   granularity (independent of Occupancy's own toggle — each chart
   aggregates on its own, there's no shared/global setting). Daily mode
   renders as a line + percentile arearange bands; monthly mode renders
   as columns (Listing Price / Listing Price with Markup) plus percentile
   lines in a grey→red gradient, matching desktop's own monthly view. ── */
function fpBuildData(days, granularity) {
  const rand = ndSeededRand(days * 7 + 1);
  const base = 228;
  const today = new Date(2026, 8, 22);
  const rows = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(today.getTime() + i * 86400000);
    const wobble = Math.sin(i / (days / 6 || 1)) * 22 + (rand() - 0.5) * 14;
    const price = Math.round(base + wobble - i * (10 / days));
    rows.push({
      date: d,
      price: price,
      p25: Math.round(price - 28 - rand() * 10),
      p50: Math.round(price - 8 - rand() * 6),
      p75: Math.round(price + 14 + rand() * 8),
      p90: Math.round(price + 40 + rand() * 14),
      isEvent: rand() < 0.07
    });
  }
  const buckets = granularity === 'monthly' ? bucketByMonth(rows) : rows.map(r => [r]);
  const cats = [], listing = [], markupCol = [], p25 = [], p50 = [], p75 = [], p90 = [];
  const band2550 = [], band5075 = [], band7590 = [], events = [];
  buckets.forEach((rowsInBucket, i) => {
    const first = rowsInBucket[0];
    cats.push(granularity === 'monthly'
      ? first.date.toLocaleDateString('en-US', { month: 'short' })
      : first.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    const avg = key => Math.round(rowsInBucket.reduce((s, r) => s + r[key], 0) / rowsInBucket.length);
    const priceAvg = avg('price');
    listing.push(priceAvg);
    markupCol.push(Math.round(priceAvg * 1.06));
    p25.push(avg('p25')); p50.push(avg('p50')); p75.push(avg('p75')); p90.push(avg('p90'));
    band2550.push([i, avg('p25'), avg('p50')]);
    band5075.push([i, avg('p50'), avg('p75')]);
    band7590.push([i, avg('p75'), avg('p90')]);
    if (rowsInBucket.some(r => r.isEvent) && events.length < 5) events.push(i);
  });
  return { cats, listing, markupCol, p25, p50, p75, p90, band2550, band5075, band7590, events };
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

/* Pure chart builder — renders into any container at any height, so the
   same code drives both the in-card chart and the fullscreen detail view
   (item 8) without duplicating the series/config logic. idPrefix selects
   which pinned info-card ('fp-info-*' or 'fs-info-*' for the fullscreen
   clone) gets updated as the user scrubs. */
function fpRenderChart(containerId, height, idPrefix) {
  idPrefix = idPrefix || 'fp';
  const el = document.getElementById(containerId);
  if (!el || !window.Highcharts) return null;
  const { cats, listing, markupCol, p25, p50, p75, p90, band2550, band5075, band7590, events } = fpBuildData(fpDays, fpGranularity);
  const isMonthly = fpGranularity === 'monthly';
  const series = isMonthly ? [
    { type: 'column', id: 'fp-s-listing', name: 'Listing Price', data: listing, color: '#4A4A4A', zIndex: 3 },
    { type: 'column', id: 'fp-s-markup', name: 'Listing Price with Markup', data: markupCol, color: '#C7C7C7', zIndex: 2 },
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
        load: function () { fpUpdateInfoCard(this, this.series[0].points.length - 1, idPrefix); }
      }
    },
    xAxis: Object.assign(ndXAxisConfig(cats, Math.max(1, Math.round(cats.length / 5))), { plotBands: ndEventPlotBands(events) }),
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
      column: { borderWidth: 0, borderRadius: 2, pointPadding: 0.08, groupPadding: 0.06 }
    },
    series: series
  });
  const wrap = el.closest('.hc-chart-wrap');
  attachScrub(chart, wrap, function (c, idx) { fpUpdateInfoCard(c, idx, idPrefix); });
  return chart;
}

function fpInitChart(days) {
  if (!document.getElementById('fp-hc-chart')) return;
  if (days) fpDays = Math.min(days, 90);
  if (fpChart) { fpChart.destroy(); fpChart = null; }
  fpChart = fpRenderChart('fp-hc-chart', 230, 'fp');
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
  const dateEl = document.getElementById(idPrefix + '-info-date');
  const priceEl = document.getElementById(idPrefix + '-info-price');
  const rowsEl = document.getElementById(idPrefix + '-info-rows');
  if (dateEl) dateEl.textContent = chart.xAxis[0].categories[i];
  if (priceEl) priceEl.textContent = '$' + points[i].y;
  if (!rowsEl) return;
  let rows = '';
  if (fpGranularity === 'monthly') {
    const markupS = ndSeriesById(chart, 'fp-s-markup');
    if (markupS) rows += '<div class="hc-tt-row"><span class="hc-tt-dot" style="background:#C7C7C7"></span>With Markup: <b>$' + markupS.points[i].y + '</b></div>';
    [['fp-s-p25', '25th'], ['fp-s-p50', '50th'], ['fp-s-p75', '75th'], ['fp-s-p90', '90th']].forEach(function (pair) {
      const s = ndSeriesById(chart, pair[0]);
      if (s) rows += '<div class="hc-tt-row"><span class="hc-tt-dot" style="background:' + s.color + '"></span>' + pair[1] + ' Percentile: <b>$' + s.points[i].y + '</b></div>';
    });
  } else {
    const b2550 = ndSeriesById(chart, 'fp-s-2550').points[i];
    const b5075 = ndSeriesById(chart, 'fp-s-5075').points[i];
    const b7590 = ndSeriesById(chart, 'fp-s-7590').points[i];
    rows += '<div class="hc-tt-row"><span class="hc-tt-dot" style="background:#FCDCDD"></span>25th–50th: <b>$' + b2550.low + '–$' + b2550.high + '</b></div>';
    rows += '<div class="hc-tt-row"><span class="hc-tt-dot" style="background:#F69396"></span>50th–75th: <b>$' + b5075.low + '–$' + b5075.high + '</b></div>';
    rows += '<div class="hc-tt-row"><span class="hc-tt-dot" style="background:#A15457"></span>75th–90th: <b>$' + b7590.low + '–$' + b7590.high + '</b></div>';
  }
  rowsEl.innerHTML = rows;
}

/* ── Legend rebuilt per-granularity since monthly (columns + percentile
   lines) and daily (line + arearange bands) show different series. ── */
function fpRenderLegend() {
  const el = document.getElementById('fp-legend');
  if (!el) return;
  el.innerHTML = fpGranularity === 'monthly'
    ? '<div class="legend-item"><div class="legend-swatch" style="background:#4A4A4A;height:8px;width:8px;border-radius:2px"></div> Listing Price</div>' +
      '<div class="legend-item"><div class="legend-swatch" style="background:#C7C7C7;height:8px;width:8px;border-radius:2px"></div> With Markup</div>' +
      '<div class="legend-item"><div class="legend-swatch" style="background:#C8CDD3;height:3px"></div> 25th</div>' +
      '<div class="legend-item"><div class="legend-swatch" style="background:#F6B4B6;height:3px"></div> 50th</div>' +
      '<div class="legend-item"><div class="legend-swatch" style="background:#F37579;height:3px"></div> 75th</div>' +
      '<div class="legend-item"><div class="legend-swatch" style="background:#A15457;height:3px"></div> 90th</div>' +
      '<div class="legend-item"><span class="legend-band-event"></span> Events</div>' +
      '<div class="legend-item legend-more" onclick="ndOpenSheet(\'bs-future-options\')">+ More</div>'
    : '<div class="legend-item"><div class="legend-swatch" style="background:#333333;height:3px"></div> Listing Price</div>' +
      '<div class="legend-item"><div class="legend-band" style="background:#FCDCDD"></div> 25th–50th</div>' +
      '<div class="legend-item"><div class="legend-band" style="background:#F69396"></div> 50th–75th</div>' +
      '<div class="legend-item"><div class="legend-band" style="background:#A15457;opacity:0.4"></div> 75th–90th</div>' +
      '<div class="legend-item"><span class="legend-band-event"></span> Events</div>' +
      '<div class="legend-item legend-more" onclick="ndOpenSheet(\'bs-future-options\')">+ More</div>';
}

/* ── "+ More" overlays: Upcoming Bookings / Last Year Bookings / Last
   Year Bookings (Same Time), shown as short horizontal "stay bar"
   segments near the chart's baseline — matching desktop's own booking
   overlay style and, being compact discrete marks rather than a second
   full-width line, much easier to read on a narrow mobile screen than a
   continuous line running through the whole price chart. ── */
function fpBookingSegments(rand, days, count) {
  const segments = [];
  let i = 0;
  while (i < days - 1 && segments.length < count) {
    if (rand() < 0.3) {
      const len = 1 + Math.floor(rand() * 3);
      const end = Math.min(days - 1, i + len);
      segments.push([i, end]);
      i = end + 2 + Math.floor(rand() * 3);
    } else {
      i++;
    }
  }
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
  const rand = ndSeededRand(fpDays * 11 + kind.length * 17 + 3);
  const axisMin = fpChart.yAxis[0].min, axisMax = fpChart.yAxis[0].max;
  const range = axisMax - axisMin;
  const laneIndex = { upcoming: 0, lastyear: 1, stly: 2 }[kind];
  const laneY = Math.round(axisMin + range * (0.02 + laneIndex * 0.035));
  const meta = {
    upcoming: { name: 'Upcoming Bookings', color: '#31C48D' },
    lastyear: { name: 'Last Year Bookings', color: '#274690' },
    stly: { name: 'Last Year Bookings (Same Time)', color: '#D62828' }
  }[kind];
  const segments = fpBookingSegments(rand, fpDays, kind === 'upcoming' ? 4 : 6);
  const data = ndSegmentsToLineData(segments, laneY);
  fpChart.addSeries({
    id: id, type: 'line', name: meta.name, color: meta.color, data: data,
    lineWidth: 4, marker: { enabled: false }, enableMouseTracking: false,
    connectNulls: false, zIndex: 6
  }, true);
}

function fpSetRange(el, days) {
  el.closest('.range-seg').querySelectorAll('.range-seg-item').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  fpInitChart(days);
}
function fpSetGranularity(el, mode) {
  el.closest('.pill-toggles').querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  fpGranularity = mode;
  fpInitChart();
}

/* ── Occupancy: matches desktop's own Occupancy chart — Market Occupancy
   (current), Last Year (Today) and Last Year (Final) as lines (daily) or
   grouped columns (monthly), plus an optional 7-day Market Pickup pacing
   overlay (toggled from Chart Options — item 4). Daily/Monthly is its
   own independent toggle — not tied to Future Prices' granularity. ── */
function occBuildData(days, granularity) {
  const rand = ndSeededRand(days * 3 + 5);
  const today = new Date(2026, 8, 22);
  const rows = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(today.getTime() + i * 86400000);
    const cur = Math.round(55 + Math.sin(i / 6) * 15 + rand() * 8);
    rows.push({
      date: d,
      market: cur,
      lyToday: Math.round(cur * 0.88 + (rand() - 0.5) * 6),
      lyFinal: Math.round(cur * 1.04 + (rand() - 0.5) * 6),
      pickup: Math.round(2 + rand() * 6),
      pickupLY: Math.round(1 + rand() * 5),
      isEvent: rand() < 0.06
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
  const cats = [], market = [], lyToday = [], lyFinal = [], pickup = [], pickupLY = [], events = [];
  buckets.forEach((rowsInBucket, i) => {
    const first = rowsInBucket[0];
    cats.push(granularity === 'monthly'
      ? first.date.toLocaleDateString('en-US', { month: 'short' })
      : first.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    const avg = key => Math.round(rowsInBucket.reduce((s, r) => s + r[key], 0) / rowsInBucket.length);
    market.push(Math.min(100, avg('market')));
    lyToday.push(Math.min(100, avg('lyToday')));
    lyFinal.push(Math.min(100, avg('lyFinal')));
    pickup.push(avg('pickup'));
    pickupLY.push(avg('pickupLY'));
    if (rowsInBucket.some(r => r.isEvent) && events.length < 5) events.push(i);
  });
  return { cats, market, lyToday, lyFinal, pickup, pickupLY, events };
}

let occChart = null;
let occDays = 30;
let occGranularity = 'daily';
let occPacingEnabled = false;

function occRenderChart(containerId, height, idPrefix) {
  idPrefix = idPrefix || 'occ';
  const el = document.getElementById(containerId);
  if (!el || !window.Highcharts) return null;
  const { cats, market, lyToday, lyFinal, pickup, pickupLY, events } = occBuildData(occDays, occGranularity);
  const isMonthly = occGranularity === 'monthly';
  const series = isMonthly ? [
    { type: 'column', id: 'occ-s-market', name: 'Market Occupancy', data: market, color: '#F37579', zIndex: 3 },
    { type: 'column', id: 'occ-s-lytoday', name: 'Last Year (Today)', data: lyToday, color: '#F8C6C8', zIndex: 2 },
    { type: 'column', id: 'occ-s-lyfinal', name: 'Last Year (Final)', data: lyFinal, color: '#FDE3E4', zIndex: 1 }
  ] : [
    { type: 'line', id: 'occ-s-market', name: 'Market Occupancy', data: market, color: '#F37579', lineWidth: 2, zIndex: 5 },
    { type: 'line', id: 'occ-s-lytoday', name: 'Last Year (Today)', data: lyToday, color: '#B5B5B5', lineWidth: 1.5, zIndex: 4 },
    { type: 'line', id: 'occ-s-lyfinal', name: 'Last Year (Final)', data: lyFinal, color: '#B5B5B5', lineWidth: 1.5, dashStyle: 'Dot', zIndex: 4 }
  ];
  if (occPacingEnabled) {
    series.push({ type: 'line', id: 'occ-s-pickup', name: '7-day Market Pickup', data: pickup, color: '#31C48D', lineWidth: 1.5, zIndex: 6 });
    series.push({ type: 'line', id: 'occ-s-pickupLY', name: '7-day Market Pickup (LY)', data: pickupLY, color: '#31C48D', lineWidth: 1.5, dashStyle: 'Dot', zIndex: 6 });
  }
  const chart = Highcharts.chart(containerId, {
    chart: {
      height: height,
      spacing: ND_CHART_SPACING,
      marginLeft: ND_CHART_MARGIN_LEFT,
      marginRight: ND_CHART_MARGIN_RIGHT,
      backgroundColor: 'transparent',
      zooming: { type: undefined },
      panning: { enabled: false },
      events: { load: function () { occUpdateInfoCard(this, this.series[0].points.length - 1, idPrefix); } }
    },
    xAxis: Object.assign(ndXAxisConfig(cats, Math.max(1, Math.round(cats.length / 5))), { plotBands: ndEventPlotBands(events) }),
    yAxis: ndYAxisConfig({
      max: 110,
      yFormatter: function () { return this.value + '%'; }
    }),
    tooltip: { enabled: false },
    legend: { enabled: false },
    plotOptions: {
      column: { pointPadding: 0.08, groupPadding: 0.1, borderWidth: 0, borderRadius: 2 },
      series: { marker: { enabled: false }, states: { hover: { enabled: false } } }
    },
    series: series
  });
  const wrap = el.closest('.hc-chart-wrap');
  attachScrub(chart, wrap, function (c, idx) { occUpdateInfoCard(c, idx, idPrefix); });
  return chart;
}

function occInitChart(days) {
  if (!document.getElementById('occ-hc-chart')) return;
  if (days) occDays = Math.min(days, 90);
  if (occChart) { occChart.destroy(); occChart = null; }
  occChart = occRenderChart('occ-hc-chart', 250, 'occ');
  occRenderLegend();
}

/* ── Pinned drag-tooltip for Occupancy, same pattern as Future Prices'
   fpUpdateInfoCard: date + headline value in the card header, the rest
   of the series broken out as rows below. ── */
function occUpdateInfoCard(chart, index, idPrefix) {
  const marketS = ndSeriesById(chart, 'occ-s-market');
  if (!marketS || !marketS.points.length) return;
  const i = Math.max(0, Math.min(index, marketS.points.length - 1));
  const dateEl = document.getElementById(idPrefix + '-info-date');
  const priceEl = document.getElementById(idPrefix + '-info-price');
  const rowsEl = document.getElementById(idPrefix + '-info-rows');
  if (dateEl) dateEl.textContent = chart.xAxis[0].categories[i];
  if (priceEl) priceEl.textContent = marketS.points[i].y + '%';
  if (!rowsEl) return;
  const defs = [
    ['occ-s-lytoday', '#B5B5B5', 'Last Year (Today)'],
    ['occ-s-lyfinal', '#B5B5B5', 'Last Year (Final)'],
    ['occ-s-pickup', '#31C48D', '7-day Pickup'],
    ['occ-s-pickupLY', '#31C48D', '7-day Pickup (LY)']
  ];
  let rows = '';
  defs.forEach(function (d) {
    const s = ndSeriesById(chart, d[0]);
    if (!s || !s.points[i]) return;
    rows += '<div class="hc-tt-row"><span class="hc-tt-dot" style="background:' + d[1] + '"></span>' + d[2] + ': <b>' + s.points[i].y + '%</b></div>';
  });
  rowsEl.innerHTML = rows;
}

/* ── Legend rebuilt per-granularity/pacing-state ── */
function occRenderLegend() {
  const el = document.getElementById('occ-legend');
  if (!el) return;
  const isMonthly = occGranularity === 'monthly';
  const sw = isMonthly ? 'height:8px;width:8px;border-radius:2px' : 'height:3px';
  let html =
    '<div class="legend-item"><div class="legend-swatch" style="background:#F37579;' + sw + '"></div> Market Occupancy</div>' +
    '<div class="legend-item"><div class="legend-swatch" style="background:' + (isMonthly ? '#F8C6C8' : '#B5B5B5') + ';' + sw + '"></div> Last Year (Today)</div>' +
    '<div class="legend-item"><div class="legend-swatch" style="background:' + (isMonthly ? '#FDE3E4' : '#B5B5B5') + ';' + sw + '"></div> Last Year (Final)</div>';
  if (occPacingEnabled) {
    html += '<div class="legend-item"><div class="legend-swatch" style="background:#31C48D;height:3px"></div> 7-day Pickup</div>';
    html += '<div class="legend-item"><div class="legend-swatch" style="background:#31C48D;height:3px;opacity:0.5"></div> Pickup (LY)</div>';
  }
  html += '<div class="legend-item"><span class="legend-band-event"></span> Events</div>';
  html += '<div class="legend-item legend-more" onclick="ndOpenSheet(\'bs-occ-options\')">+ More</div>';
  el.innerHTML = html;
}

function occSetRange(el, days) {
  el.closest('.range-seg').querySelectorAll('.range-seg-item').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  occInitChart(days);
}
function occSetGranularity(el, mode) {
  el.closest('.pill-toggles').querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  occGranularity = mode;
  occInitChart();
}
function occTogglePacing(el) {
  el.classList.toggle('checked');
  occPacingEnabled = el.classList.contains('checked');
  occInitChart();
}

/* ── Market History: column chart, swaps metric via metric-card tap.
   Shows year-over-year comparison bars (like desktop's own Market
   History widget) — "Last 1 year" shows just the current 12 months,
   "Last 2 year" shows this year alongside last year, paired per month,
   with a tap tooltip giving both years' values. ── */
const HIST_COLOR_PREV = '#F8C6C8';
const HIST_COLOR_CURRENT = '#F37579';
const histMetricData = {
  occ: { name: 'Market Occupancy', suffix: '%', y2026: [58, 61, 65, 70, 68, 72, 75, 74, 72, 69, 66, 72], y2025: [54, 56, 60, 64, 63, 66, 69, 68, 66, 64, 61, 66] },
  adr: { name: 'Market ADR', prefix: '$', y2026: [198, 205, 212, 220, 226, 231, 240, 238, 234, 228, 222, 234], y2025: [192, 199, 206, 213, 219, 224, 233, 231, 227, 221, 215, 227] },
  window: { name: 'Booking Window', suffix: ' days', y2026: [30, 29, 28, 27, 26, 25, 24, 25, 26, 27, 28, 26], y2025: [34, 33, 32, 31, 30, 29, 28, 29, 30, 31, 32, 30] },
  los: { name: 'Length of Stay', suffix: ' nights', y2026: [2.6, 2.7, 2.8, 2.9, 3.0, 3.1, 3.2, 3.1, 3.0, 2.9, 2.8, 3.0], y2025: [2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 3.0, 2.9, 2.8, 2.7, 2.6, 2.8] }
};
const histMonths = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];

let histChart = null;
let histCurrentKey = 'occ';
let histYears = 1;
function histInitChart(key) {
  const el = document.getElementById('hist-hc-chart');
  if (!el || !window.Highcharts) return;
  if (key) histCurrentKey = key;
  const m = histMetricData[histCurrentKey];
  const fmt = v => (m.prefix || '') + v + (m.suffix || '');
  if (histChart) { histChart.destroy(); histChart = null; }
  const series = histYears === 2
    ? [
        { type: 'column', name: '2025', data: m.y2025, color: HIST_COLOR_PREV },
        { type: 'column', name: '2026', data: m.y2026, color: HIST_COLOR_CURRENT }
      ]
    : [{ type: 'column', name: '2026', data: m.y2026, color: HIST_COLOR_CURRENT }];
  histChart = Highcharts.chart('hist-hc-chart', {
    chart: { height: 220, spacing: ND_CHART_SPACING, marginLeft: ND_CHART_MARGIN_LEFT, marginRight: ND_CHART_MARGIN_RIGHT, backgroundColor: 'transparent' },
    xAxis: {
      categories: histMonths, lineWidth: 1, lineColor: '#E0E0E0', tickLength: 0,
      labels: { style: { fontSize: '10px', color: '#7A7A7A' } },
      crosshair: { width: 1, color: '#CBD0D6', dashStyle: 'Dash' }
    },
    yAxis: Object.assign(ndYAxisConfig({
      yFormatter: function () { return (m.prefix || '') + this.value; }
    }), { maxPadding: 0.18 }),
    tooltip: { enabled: false },
    legend: { enabled: false },
    plotOptions: {
      column: {
        borderWidth: 0, borderRadius: 3, pointPadding: 0.15, groupPadding: 0.08,
        dataLabels: { enabled: true, formatter: function () { return fmt(this.y); }, style: { fontSize: '9px', fontWeight: '700', color: 'var(--pl-text)', textOutline: 'none' } }
      },
      series: { marker: { enabled: false }, states: { hover: { enabled: false } }, animation: { duration: 250 } }
    },
    series: series
  });
  renderHistLegend();
  const histWrap = el.closest('.hc-chart-wrap');
  attachScrub(histChart, histWrap, function () {}, function (chart, idx) {
    const month = histMonths[idx];
    let rows = '<div class="hc-tt-row"><span class="hc-tt-dot" style="background:' + HIST_COLOR_CURRENT + '"></span>2026: <b>' + fmt(m.y2026[idx]) + '</b></div>';
    if (histYears === 2) {
      rows += '<div class="hc-tt-row"><span class="hc-tt-dot" style="background:' + HIST_COLOR_PREV + '"></span>2025: <b>' + fmt(m.y2025[idx]) + '</b></div>';
    }
    return '<div class="hc-tt-date">' + month + '</div>' + rows;
  });
}

function renderHistLegend() {
  const el = document.getElementById('hist-legend');
  if (!el) return;
  el.innerHTML = histYears === 2
    ? '<div class="legend-item"><div class="legend-swatch" style="background:' + HIST_COLOR_PREV + ';height:8px;width:8px;border-radius:2px"></div> 2025</div>' +
      '<div class="legend-item"><div class="legend-swatch" style="background:' + HIST_COLOR_CURRENT + ';height:8px;width:8px;border-radius:2px"></div> 2026</div>'
    : '<div class="legend-item"><div class="legend-swatch" style="background:' + HIST_COLOR_CURRENT + ';height:8px;width:8px;border-radius:2px"></div> 2026</div>';
}

function switchHistoryMetric(el, key) {
  histInitChart(key);
}
function histSetYears(el, years) {
  el.closest('.pill-toggles').querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  histYears = years;
  histInitChart();
}

/* ── Trading-app crosshair scrub: tap-and-drag updates the hero header live
   and shows a floating tooltip card with the market range at that point ── */
function attachScrub(chart, wrapEl, updateFn, tooltipFn) {
  if (!chart || !chart.container) return;
  const container = chart.container;
  let dragging = false;

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
  function release() {
    dragging = false;
    if (wrapEl) ndHideTooltip(wrapEl);
  }

  container.addEventListener('mousedown', e => { dragging = true; moveTo(e); });
  container.addEventListener('mousemove', e => { if (dragging) moveTo(e); });
  window.addEventListener('mouseup', release);

  container.addEventListener('touchstart', e => { dragging = true; moveTo(e.touches[0]); }, { passive: true });
  container.addEventListener('touchmove', e => { if (dragging) { moveTo(e.touches[0]); e.preventDefault(); } }, { passive: false });
  container.addEventListener('touchend', release);
}

/* ── Init all three charts once their containers exist in the DOM ── */
function ndInitCharts() {
  if (document.getElementById('fp-hc-chart') && !fpChart) fpInitChart();
  if (document.getElementById('occ-hc-chart') && !occChart) occInitChart();
  if (document.getElementById('hist-hc-chart') && !histChart) histInitChart();
  ccInitEmptyState();
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ndInitCharts);
} else {
  ndInitCharts();
}

/* ── Competitor Calendar detail view: builds the day-grid + fees from
   THIS competitor's own price (previously always showed the first
   competitor's static hardcoded data, regardless of which tile was tapped) ── */
function ndBuildCompCalendar(basePrice, seed) {
  const rand = ndSeededRand(seed);
  const days = [18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
  let html = '';
  for (let i = 0; i < 5; i++) html += '<div style="padding:4px 1px"></div>';
  days.forEach(d => {
    const isToday = d === 18;
    const unavailable = !isToday && rand() < 0.15;
    const minstay = rand() < 0.5 ? '2n' : '3n';
    if (unavailable) {
      html += '<div style="padding:4px 1px;border-radius:var(--radius-base);background:var(--pl-surface-neutral);color:var(--pl-text-disabled)"><div>' + d + '</div><div style="font-size:8px">—</div><div style="font-size:7px">—</div></div>';
      return;
    }
    const wobble = Math.round((rand() - 0.5) * 24);
    const price = Math.max(20, basePrice + wobble);
    if (isToday) {
      html += '<div style="padding:4px 1px;border-radius:var(--radius-base);background:var(--pl-primary-light);color:var(--pl-primary);font-weight:600;border:1.5px solid var(--pl-primary)"><div>' + d + '</div><div style="font-size:8px;font-weight:700">$' + price + '</div><div style="font-size:7px;font-weight:400;opacity:0.8">' + minstay + '</div></div>';
    } else {
      html += '<div style="padding:4px 1px;border-radius:var(--radius-base);background:#2CAFFE;color:#fff;font-weight:600"><div>' + d + '</div><div style="font-size:8px;font-weight:700">$' + price + '</div><div style="font-size:7px;font-weight:400;opacity:0.85">' + minstay + '</div></div>';
    }
  });
  document.getElementById('cc-grid').innerHTML = html;
  document.getElementById('cc-fee-cleaning').textContent = '$' + (Math.round(basePrice * 0.42 / 5) * 5);
  document.getElementById('cc-fee-guest').textContent = '$' + (Math.round(basePrice * 0.13 / 5) * 5);
  document.getElementById('cc-fee-pet').textContent = '$' + (Math.round(basePrice * 0.25 / 5) * 5);
}

function openCompCalendar(name, rating, type, price, min, max) {
  document.getElementById('cc-title').textContent = name;
  document.getElementById('cc-meta').innerHTML = ND_STAR_ICON + ' ' + rating + ' · ' + type;
  const basePrice = parseInt(String(price).replace(/[^0-9]/g, ''), 10) || 150;
  let seed = 1;
  for (let i = 0; i < name.length; i++) seed += name.charCodeAt(i) * (i + 7);
  ndBuildCompCalendar(basePrice, seed);
  ndOpenSheet('bs-comp-calendar');
}

/* ── Competitor Map: tap a pin to reveal its info card (mobile-friendly
   in-place tap, not a hover tooltip) ── */
function ndShowMapPin(evt, name, rating, type, price, dist) {
  evt.stopPropagation();
  const container = evt.currentTarget.closest('.map-preview');
  if (!container) return;
  const rect = container.getBoundingClientRect();
  const pinRect = evt.currentTarget.getBoundingClientRect();
  const x = pinRect.left - rect.left + pinRect.width / 2;
  const y = pinRect.top - rect.top + pinRect.height / 2;
  let tip = container.querySelector('.map-pin-tip');
  if (!tip) {
    tip = document.createElement('div');
    tip.className = 'map-pin-tip';
    container.appendChild(tip);
  }
  tip.innerHTML =
    '<div class="map-pin-tip-name">' + name + '</div>' +
    '<div class="map-pin-tip-meta">' + ND_STAR_ICON + ' ' + rating + ' · ' + type + ' · ' + dist + '</div>' +
    '<div class="map-pin-tip-price">' + price + ' <span>/night</span></div>' +
    '<button class="map-pin-tip-btn" onclick="event.stopPropagation();ndOpenSheet(\'bs-add-competitors\')">+ Add to Comp Calendar</button>';
  tip.classList.add('visible');
  const tipW = 168, tipH = tip.offsetHeight || 120;
  let left = x - tipW / 2;
  left = Math.max(6, Math.min(left, rect.width - tipW - 6));
  let top = y - tipH - 14;
  if (top < 6) top = y + 16;
  tip.style.left = left + 'px';
  tip.style.top = top + 'px';
}
function ndCloseMapPin(container) {
  const tip = container.querySelector('.map-pin-tip');
  if (tip) tip.classList.remove('visible');
}
document.querySelectorAll('.map-preview').forEach(m => m.addEventListener('click', () => ndCloseMapPin(m)));

/* ── Bottom Sheet ── */
function ndOpenSheet(id) {
  document.getElementById(id).classList.add('open');
}
function ndCloseSheet(id) {
  document.getElementById(id).classList.remove('open');
}

/* ── Radio groups in bottom sheets ── */
function selectRadio(el) {
  el.closest('.bs-radio-group').querySelectorAll('.bs-radio').forEach(r => r.classList.remove('selected'));
  el.classList.add('selected');
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
  el.style.width = h + 'px';
  el.style.height = w + 'px';
  /* Position with plain pixel left/top rather than top:50%/left:50% plus
     a percentage translate — chaining a percentage translate() with a
     rotate() in the same transform list rotates the translate's own
     offset too (CSS applies transform functions right-to-left), which
     silently swapped/corrupted the centering. Pixel left/top plus a
     lone rotate() sidesteps that ordering trap entirely. */
  el.style.left = ((w - h) / 2) + 'px';
  el.style.top = ((h - w) / 2) + 'px';
  el.style.right = 'auto';
  el.style.bottom = 'auto';
  el.style.transform = 'rotate(90deg)';
  return w;
}
function ndClearForceLandscape(el) {
  el.classList.remove('force-landscape');
  ['width', 'height', 'top', 'left', 'right', 'bottom', 'transform'].forEach(function (p) { el.style[p] = ''; });
}
function ndOpenChartFullscreen(which) {
  document.getElementById('fs-chart-title').textContent = which === 'fp' ? 'Future Prices' : 'Occupancy';
  const sheet = document.getElementById('sheet-chart-fullscreen');
  sheet.style.display = 'flex';
  sheet.dataset.chart = which;
  const frameWidth = ndApplyForceLandscape(sheet);
  if (sheet.requestFullscreen) {
    sheet.requestFullscreen().then(function () {
      screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(function () {});
    }).catch(function () {});
  }
  if (fsChart) { fsChart.destroy(); fsChart = null; }
  setTimeout(function () {
    const chartHeight = Math.max(180, (frameWidth || 375) - 120);
    fsChart = which === 'fp' ? fpRenderChart('fs-hc-chart', chartHeight, 'fs') : occRenderChart('fs-hc-chart', chartHeight, 'fs');
  }, 30);
}
function ndCloseChartFullscreen() {
  const sheet = document.getElementById('sheet-chart-fullscreen');
  sheet.style.display = 'none';
  ndClearForceLandscape(sheet);
  if (document.fullscreenElement) { document.exitFullscreen().catch(function () {}); }
  if (fsChart) { fsChart.destroy(); fsChart = null; }
}

/* ── Bedroom multi-select chips (Comp Set edit sheet) ── */
function toggleBedroomChip(el) {
  el.classList.toggle('selected');
}

/* ── Markup toggle (Comp Set edit sheet): reveals name/type/amount fields,
   same "does your PMS add markup" flow shown in the desktop editor. ── */
function toggleMarkupFields(checkboxEl) {
  checkboxEl.classList.toggle('checked');
  const fields = document.getElementById('markup-fields');
  if (fields) fields.classList.toggle('open', checkboxEl.classList.contains('checked'));
}
function addMarkupRow() {
  const list = document.getElementById('markup-fields');
  if (!list) return;
  const row = document.createElement('div');
  row.className = 'markup-field-row';
  row.innerHTML =
    '<input type="text" placeholder="Name">' +
    '<select><option>Percent</option><option>Fixed</option></select>' +
    '<input type="text" placeholder="Amount">';
  const addBtn = list.querySelector('.markup-add-btn');
  list.insertBefore(row, addBtn);
  const removeBtn = document.createElement('button');
  removeBtn.className = 'markup-remove-btn';
  removeBtn.textContent = 'Remove Markup Details';
  removeBtn.onclick = function () { row.remove(); removeBtn.remove(); };
  list.insertBefore(removeBtn, addBtn);
}
