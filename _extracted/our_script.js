function toggleSection(id) {
  document.getElementById(id).classList.toggle('expanded');
}

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
   inspired): big price header, tap-and-drag crosshair scrubbing that
   live-updates the header, bottom range segments, and a switchable
   axis/interaction style so we can compare options live:
     A = Classic  — persistent bottom date-axis + right price axis w/ gridlines
     B = Minimal  — no axis at rest, tags reveal only while scrubbing
     C = Hybrid   — faint persistent date labels + a pinned live-value tag
   ═══════════════════════════════════════════════════════════════ */

if (window.Highcharts) {
  Highcharts.setOptions({
    chart: { style: { fontFamily: "'IBM Plex Sans', sans-serif" } },
    credits: { enabled: false },
    title: { text: null },
    exporting: { enabled: false }
  });
}

let ndStyle = 'C';

/* ── seeded PRNG so data is stable across reloads/range switches ── */
function ndSeededRand(seed) {
  let s = seed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/* ── shared axis-style helpers, reused by all three charts ── */
function ndChartSpacing(style) {
  if (style === 'A') return [8, 44, 22, 4];
  if (style === 'C') return [8, 40, 22, 4];
  return [8, 0, 4, 0];
}
function ndXAxisConfig(style, cats, step) {
  if (style === 'A') {
    return {
      categories: cats, lineWidth: 1, lineColor: '#E0E0E0', tickLength: 0,
      labels: { enabled: true, style: { fontSize: '10px', color: '#7A7A7A' }, step: step },
      crosshair: { width: 1, color: '#CBD0D6', dashStyle: 'Dash', label: { enabled: true, backgroundColor: '#333333', style: { color: '#fff', fontSize: '10px' } } }
    };
  }
  if (style === 'C') {
    return {
      categories: cats, lineWidth: 0, tickLength: 0,
      labels: { enabled: true, style: { fontSize: '9px', color: '#AEAEAE' }, step: step },
      crosshair: { width: 1, color: '#CBD0D6', dashStyle: 'Dash', label: { enabled: true, backgroundColor: '#333333', style: { color: '#fff', fontSize: '10px' } } }
    };
  }
  return {
    categories: cats, lineWidth: 0, tickLength: 0, labels: { enabled: false },
    crosshair: { width: 1, color: '#CBD0D6', dashStyle: 'Solid' }
  };
}
function ndYAxisConfig(style, opts) {
  opts = opts || {};
  if (style === 'A') {
    return {
      title: { text: null }, opposite: true, gridLineWidth: 0, tickAmount: 3, max: opts.max,
      labels: { enabled: true, style: { fontSize: '10px', color: '#7A7A7A' }, formatter: opts.yFormatter },
      crosshair: { width: 1, color: '#CBD0D6', dashStyle: 'Dash', label: { enabled: true, backgroundColor: '#333333', format: opts.yCrosshairFormat || '{value:.0f}', style: { color: '#fff', fontSize: '10px' } } }
    };
  }
  if (style === 'C') {
    const plotLines = (opts.lastValue != null) ? [{
      value: opts.lastValue, color: '#333333', width: 1, dashStyle: 'Dash', zIndex: 4,
      label: {
        useHTML: true, align: 'right', x: 40, y: 5,
        text: '<span style="background:#333333;color:#fff;font-size:10px;font-weight:700;padding:2px 6px;border-radius:3px;white-space:nowrap;">' + opts.lastLabel + '</span>'
      }
    }] : [];
    return { title: { text: null }, labels: { enabled: false }, gridLineWidth: 0, max: opts.max, plotLines: plotLines };
  }
  return { title: { text: null }, labels: { enabled: false }, gridLineWidth: 0, max: opts.max };
}

/* ── Future Prices: build arearange + line series for N days ── */
function fpBuildData(days) {
  const rand = ndSeededRand(days * 7 + 1);
  const base = 228;
  const cats = [];
  const listing = [], band5075 = [], band7590 = [];
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
    band5075.push([i, p25, p50]);
    band7590.push([i, p75, p90]);
  }
  return { cats, listing, band5075, band7590 };
}

let fpChart = null;
let fpDays = 30;
function fpInitChart(days) {
  const el = document.getElementById('fp-hc-chart');
  if (!el || !window.Highcharts) return;
  if (days) fpDays = days;
  const { cats, listing, band5075, band7590 } = fpBuildData(fpDays);
  const lastPrice = listing[listing.length - 1][1];
  if (fpChart) { fpChart.destroy(); fpChart = null; }
  fpChart = Highcharts.chart('fp-hc-chart', {
    chart: {
      height: 200,
      spacing: ndChartSpacing(ndStyle),
      backgroundColor: 'transparent',
      zooming: { type: undefined },
      panning: { enabled: false },
      events: {
        load: function () { fpUpdateHero(this, this.series[0].points.length - 1); }
      }
    },
    xAxis: ndXAxisConfig(ndStyle, cats, Math.max(1, Math.round(cats.length / 5))),
    yAxis: ndYAxisConfig(ndStyle, {
      lastValue: lastPrice, lastLabel: '$' + lastPrice,
      yFormatter: function () { return '$' + this.value; },
      yCrosshairFormat: '${value:.0f}'
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
        data: band5075.map(p => [p[1] - 20, p[1]]),
        color: '#A8D8FF',
        zIndex: 3
      }
    ]
  });
  attachScrub(fpChart, fpUpdateHero);
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
  const lastTotal = booked[booked.length - 1] + unavailable[unavailable.length - 1];
  if (occChart) { occChart.destroy(); occChart = null; }
  occChart = Highcharts.chart('occ-hc-chart', {
    chart: {
      height: 220,
      spacing: ndChartSpacing(ndStyle),
      backgroundColor: 'transparent',
      zooming: { type: undefined },
      panning: { enabled: false },
      events: { load: function () { occUpdateHero(this, this.series[0].points.length - 1); } }
    },
    xAxis: ndXAxisConfig(ndStyle, cats, Math.max(1, Math.round(cats.length / 5))),
    yAxis: ndYAxisConfig(ndStyle, {
      max: 110, lastValue: lastTotal, lastLabel: lastTotal + '%',
      yFormatter: function () { return this.value + '%'; },
      yCrosshairFormat: '{value:.0f}%'
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
  attachScrub(occChart, occUpdateHero);
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
  const lastVal = m.data[m.data.length - 1];
  const lastLabel = (m.prefix || '') + lastVal + (m.suffix || '');
  if (histChart) { histChart.destroy(); histChart = null; }
  histChart = Highcharts.chart('hist-hc-chart', {
    chart: { height: 190, spacing: ndChartSpacing(ndStyle), backgroundColor: 'transparent' },
    xAxis: {
      categories: histMonths, lineWidth: ndStyle === 'A' ? 1 : 0, lineColor: '#E0E0E0', tickLength: 0,
      labels: { style: { fontSize: ndStyle === 'C' ? '9px' : '10px', color: ndStyle === 'C' ? '#AEAEAE' : '#7A7A7A' } }
    },
    yAxis: ndYAxisConfig(ndStyle, {
      lastValue: lastVal, lastLabel: lastLabel,
      yFormatter: function () { return (m.prefix || '') + this.value; },
      yCrosshairFormat: (m.prefix || '') + '{value:.0f}' + (m.suffix || '')
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

/* ── Master style switcher: reinitializes all charts with the chosen style,
   preserving each chart's current range/metric selection ── */
function ndSetStyle(style) {
  ndStyle = style;
  document.querySelectorAll('.style-opt').forEach(o => o.classList.remove('active'));
  const btn = document.getElementById('style-opt-' + style);
  if (btn) btn.classList.add('active');
  fpInitChart();
  occInitChart();
  histInitChart();
}

/* ── Trading-app crosshair scrub: tap-and-drag updates the hero header live ── */
function attachScrub(chart, updateFn) {
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
  }

  container.addEventListener('mousedown', e => { dragging = true; moveTo(e); });
  container.addEventListener('mousemove', e => { if (dragging) moveTo(e); });
  window.addEventListener('mouseup', () => { dragging = false; });

  container.addEventListener('touchstart', e => { dragging = true; moveTo(e.touches[0]); }, { passive: true });
  container.addEventListener('touchmove', e => { if (dragging) { moveTo(e.touches[0]); e.preventDefault(); } }, { passive: false });
  container.addEventListener('touchend', () => { dragging = false; });
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

/* ── Competitor Calendar detail view ── */
function openCompCalendar(name, rating, type, price, min, max) {
  document.getElementById('cc-title').textContent = name;
  document.getElementById('cc-meta').textContent = '★ ' + rating + ' · ' + type;
  openSheet('bs-comp-calendar');
}

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
