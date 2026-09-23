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
const ND_CHART_SPACING = [8, 8, 22, 34];
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

/* ── Future Prices: build arearange + line series for N days ── */
function fpBuildData(days) {
  const rand = ndSeededRand(days * 7 + 1);
  const base = 228;
  const cats = [];
  const listing = [], band2550 = [], band5075 = [], band7590 = [];
  const today = new Date(2026, 8, 22);
  for (let i = 0; i < days; i++) {
    const d = new Date(today.getTime() + i * 86400000);
    cats.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    const wobble = Math.sin(i / (days / 6 || 1)) * 22 + (rand() - 0.5) * 14;
    const price = Math.round(base + wobble - i * (10 / days));
    const p25 = Math.round(price - 28 - rand() * 10);
    const p50 = Math.round(price - 8 - rand() * 6);
    const p75 = Math.round(price + 14 + rand() * 8);
    const p90 = Math.round(price + 40 + rand() * 14);
    listing.push([i, price]);
    band2550.push([i, p25, p50]);
    band5075.push([i, p50, p75]);
    band7590.push([i, p75, p90]);
  }
  return { cats, listing, band2550, band5075, band7590 };
}

let fpChart = null;
let fpDays = 30;
function fpInitChart(days) {
  const el = document.getElementById('fp-hc-chart');
  if (!el || !window.Highcharts) return;
  if (days) fpDays = days;
  const { cats, listing, band2550, band5075, band7590 } = fpBuildData(fpDays);
  if (fpChart) { fpChart.destroy(); fpChart = null; }
  fpChart = Highcharts.chart('fp-hc-chart', {
    chart: {
      height: 200,
      spacing: ND_CHART_SPACING,
      backgroundColor: 'transparent',
      zooming: { type: undefined },
      panning: { enabled: false },
      events: {
        load: function () { fpUpdateHero(this, this.series[0].points.length - 1); }
      }
    },
    xAxis: ndXAxisConfig(cats, Math.max(1, Math.round(cats.length / 5))),
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
      arearange: { lineWidth: 0, fillOpacity: 1 }
    },
    series: [
      {
        type: 'line',
        name: 'Listing Price',
        data: listing.map(p => p[1]),
        color: '#333333',
        lineWidth: 2.5,
        zIndex: 5
      },
      {
        type: 'arearange',
        name: '50th–75th',
        data: band5075.map(p => [p[1], p[2]]),
        color: '#F69396',
        zIndex: 2
      },
      {
        type: 'arearange',
        name: '75th–90th',
        data: band7590.map(p => [p[1], p[2]]),
        color: 'rgba(161,84,87,0.4)',
        zIndex: 1
      },
      {
        type: 'arearange',
        name: '25th–50th',
        data: band2550.map(p => [p[1], p[2]]),
        color: '#FCDCDD',
        zIndex: 3
      }
    ]
  });
  const fpWrap = el.closest('.hc-chart-wrap');
  attachScrub(fpChart, fpWrap, fpUpdateHero, fpTooltipHtml);
}

function fpTooltipHtml(chart, idx) {
  const date = chart.xAxis[0].categories[idx];
  const price = chart.series[0].points[idx].y;
  const b2550 = chart.series[3].points[idx];
  const b5075 = chart.series[1].points[idx];
  const b7590 = chart.series[2].points[idx];
  return '' +
    '<div class="hc-tt-date">' + date + '</div>' +
    '<div class="hc-tt-row"><span class="hc-tt-dot" style="background:#333333"></span>Listing Price: <b>$' + price + '</b></div>' +
    '<div class="hc-tt-row"><span class="hc-tt-dot" style="background:#FCDCDD"></span>25th–50th: <b>$' + b2550.low + '–$' + b2550.high + '</b></div>' +
    '<div class="hc-tt-row"><span class="hc-tt-dot" style="background:#F69396"></span>50th–75th: <b>$' + b5075.low + '–$' + b5075.high + '</b></div>' +
    '<div class="hc-tt-row"><span class="hc-tt-dot" style="background:#A15457"></span>75th–90th: <b>$' + b7590.low + '–$' + b7590.high + '</b></div>';
}

function fpUpdateHero(chart, index) {
  const series = chart.series[0];
  const points = series.points;
  if (!points || !points.length) return;
  const i = Math.max(0, Math.min(index, points.length - 1));
  const price = points[i].y;
  const bandLow = chart.series[1].points[i].low;
  const bandHigh = chart.series[1].points[i].high;
  const median = Math.round((bandLow + bandHigh) / 2);
  const diff = price - median;
  const pct = median ? Math.round(Math.abs(diff) / median * 100) : 0;
  document.getElementById('fp-hero-price').textContent = '$' + price;
  const deltaEl = document.getElementById('fp-hero-delta');
  if (diff >= 0) {
    deltaEl.className = 'price-hero-delta up';
    deltaEl.textContent = '▲ $' + diff + ' (' + pct + '%) above market median';
  } else {
    deltaEl.className = 'price-hero-delta down';
    deltaEl.textContent = '▼ $' + Math.abs(diff) + ' (' + pct + '%) below market median';
  }
}

function fpSetRange(el, days) {
  el.closest('.range-seg').querySelectorAll('.range-seg-item').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  fpInitChart(days);
}

/* ── Occupancy: column chart, Booked/Unavailable stacked + Market Occ line ── */
function occBuildData(days) {
  const rand = ndSeededRand(days * 3 + 5);
  const cats = [];
  const booked = [], unavailable = [], market = [];
  const today = new Date(2026, 8, 22);
  const points = Math.min(days, 30);
  const step = Math.max(1, Math.round(days / points));
  for (let i = 0; i < days; i += step) {
    const d = new Date(today.getTime() + i * 86400000);
    cats.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    const b = Math.round(50 + rand() * 30);
    const u = Math.round(rand() * 15);
    booked.push(b);
    unavailable.push(u);
    market.push(Math.round(55 + Math.sin(i / 6) * 15 + rand() * 8));
  }
  return { cats, booked, unavailable, market };
}

let occChart = null;
let occDays = 30;
function occInitChart(days) {
  const el = document.getElementById('occ-hc-chart');
  if (!el || !window.Highcharts) return;
  if (days) occDays = days;
  const { cats, booked, unavailable, market } = occBuildData(occDays);
  if (occChart) { occChart.destroy(); occChart = null; }
  occChart = Highcharts.chart('occ-hc-chart', {
    chart: {
      height: 220,
      spacing: ND_CHART_SPACING,
      backgroundColor: 'transparent',
      zooming: { type: undefined },
      panning: { enabled: false },
      events: { load: function () { occUpdateHero(this, this.series[0].points.length - 1); } }
    },
    xAxis: ndXAxisConfig(cats, Math.max(1, Math.round(cats.length / 5))),
    yAxis: ndYAxisConfig({
      max: 110,
      yFormatter: function () { return this.value + '%'; }
    }),
    tooltip: { enabled: false },
    legend: { enabled: false },
    plotOptions: {
      column: { stacking: 'normal', pointPadding: 0.08, groupPadding: 0.06, borderWidth: 0 },
      series: { marker: { enabled: false }, states: { hover: { enabled: false } } }
    },
    series: [
      { type: 'column', name: 'Booked', data: booked, color: '#2CAFFE' },
      { type: 'column', name: 'Unavailable', data: unavailable, color: 'rgba(44,175,254,0.45)' },
      { type: 'line', name: 'Market Occ.', data: market, color: '#F37579', lineWidth: 2, zIndex: 5 }
    ]
  });
  const occWrap = el.closest('.hc-chart-wrap');
  attachScrub(occChart, occWrap, occUpdateHero, occTooltipHtml);
}

function occTooltipHtml(chart, idx) {
  const date = chart.xAxis[0].categories[idx];
  const booked = chart.series[0].points[idx].y;
  const unavailable = chart.series[1].points[idx].y;
  const marketOcc = chart.series[2].points[idx].y;
  return '' +
    '<div class="hc-tt-date">' + date + '</div>' +
    '<div class="hc-tt-row"><span class="hc-tt-dot" style="background:#2CAFFE"></span>Booked: <b>' + booked + '%</b></div>' +
    '<div class="hc-tt-row"><span class="hc-tt-dot" style="background:rgba(44,175,254,0.45)"></span>Unavailable: <b>' + unavailable + '%</b></div>' +
    '<div class="hc-tt-row"><span class="hc-tt-dot" style="background:#F37579"></span>Market Occ.: <b>' + marketOcc + '%</b></div>';
}

function occUpdateHero(chart, index) {
  const points = chart.series[0].points;
  if (!points || !points.length) return;
  const i = Math.max(0, Math.min(index, points.length - 1));
  const yours = points[i].y + chart.series[1].points[i].y;
  const marketVal = chart.series[2].points[i].y;
  const diff = yours - marketVal;
  document.getElementById('occ-hero-value').textContent = yours + '%';
  const deltaEl = document.getElementById('occ-hero-delta');
  if (diff >= 0) {
    deltaEl.className = 'price-hero-delta up';
    deltaEl.textContent = '▲ ' + diff + '% above market median';
  } else {
    deltaEl.className = 'price-hero-delta down';
    deltaEl.textContent = '▼ ' + Math.abs(diff) + '% below market median';
  }
}

function occSetRange(el, days) {
  el.closest('.range-seg').querySelectorAll('.range-seg-item').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  occInitChart(days);
}

/* ── Market History: column chart, swaps metric via metric-card tap ── */
const histMetricData = {
  occ: { name: 'Market Occupancy', color: '#F37579', suffix: '%', data: [58, 61, 65, 70, 68, 72, 75, 74, 72, 69, 66, 72] },
  adr: { name: 'Market ADR', color: '#2CAFFE', suffix: '', prefix: '$', data: [198, 205, 212, 220, 226, 231, 240, 238, 234, 228, 222, 234] },
  window: { name: 'Booking Window', color: '#544FC5', suffix: ' days', data: [30, 29, 28, 27, 26, 25, 24, 25, 26, 27, 28, 26] },
  los: { name: 'Length of Stay', color: '#00E272', suffix: ' nights', data: [2.6, 2.7, 2.8, 2.9, 3.0, 3.1, 3.2, 3.1, 3.0, 2.9, 2.8, 3.0] }
};
const histMonths = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];

let histChart = null;
let histCurrentKey = 'occ';
function histInitChart(key) {
  const el = document.getElementById('hist-hc-chart');
  if (!el || !window.Highcharts) return;
  if (key) histCurrentKey = key;
  const m = histMetricData[histCurrentKey];
  if (histChart) { histChart.destroy(); histChart = null; }
  histChart = Highcharts.chart('hist-hc-chart', {
    chart: { height: 190, spacing: ND_CHART_SPACING, backgroundColor: 'transparent' },
    xAxis: {
      categories: histMonths, lineWidth: 1, lineColor: '#E0E0E0', tickLength: 0,
      labels: { style: { fontSize: '10px', color: '#7A7A7A' } }
    },
    yAxis: ndYAxisConfig({
      yFormatter: function () { return (m.prefix || '') + this.value; }
    }),
    tooltip: { enabled: false },
    legend: { enabled: false },
    plotOptions: {
      column: { borderWidth: 0, borderRadius: 3, pointPadding: 0.15, groupPadding: 0.08 },
      series: { marker: { enabled: false }, states: { hover: { enabled: false } }, animation: { duration: 250 } }
    },
    series: [{ type: 'column', name: m.name, data: m.data, color: m.color }]
  });
}

function switchHistoryMetric(el, key) {
  histInitChart(key);
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
