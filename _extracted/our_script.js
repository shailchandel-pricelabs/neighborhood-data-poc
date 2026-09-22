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

/* ── Market History: tap a metric tile to swap the trend chart (matches desktop) ── */
const HISTORY_DATASETS = {
  occ:    { fmt: v => v + '%',     vals: [38,50,57,57,70,82,80,68,58,53,53,41] },
  window: { fmt: v => v + 'd',     vals: [18,17,15,14,11,9,10,12,14,16,17,19] },
  los:    { fmt: v => v.toFixed(1),vals: [2.4,2.6,2.9,3.1,3.6,4.0,3.8,3.3,2.9,2.7,2.6,2.3] },
  adr:    { fmt: v => '$' + v,     vals: [150,162,178,193,215,240,232,205,180,168,162,148] },
};
function switchHistoryMetric(el, key) {
  const data = HISTORY_DATASETS[key];
  if (!data) return;
  const max = Math.max(...data.vals), min = Math.min(...data.vals);
  const baseline = 120, top = 15, range = max - min || 1;
  data.vals.forEach((v, i) => {
    const rect = document.getElementById('hist-bar-' + i);
    const label = document.getElementById('hist-label-' + i);
    if (!rect || !label) return;
    const h = 20 + ((v - min) / range) * 88; // 20..108 px tall
    const y = baseline - h;
    rect.setAttribute('y', y);
    rect.setAttribute('height', h);
    rect.setAttribute('opacity', v === max ? '1' : (v === min ? '0.6' : '0.85'));
    label.setAttribute('y', y - 4);
    label.textContent = data.fmt(v);
  });
}

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

/* ── Future Prices: time range pills ── */
function setFPRange(days, clickedPill) {
  // Update active pill state
  const controls = clickedPill.closest('.chart-controls');
  controls.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  clickedPill.classList.add('active');
  // Update x-axis labels in the daily chart based on range
  const dailySvg = document.querySelector('#fp-chart-daily svg');
  const labels = dailySvg.querySelectorAll('text.axis-label[text-anchor="middle"]');
  const rangeLabels = {
    30: ['Sep 20', 'Sep 27', 'Oct 4', 'Oct 11'],
    60: ['Oct', 'Nov', '', ''],
    90: ['Oct', 'Nov', 'Dec', 'Jan'],
    180: ['Oct', 'Dec', 'Feb', 'Apr'],
    360: ['Nov', 'Feb', 'May', 'Aug']
  };
  const newLabels = rangeLabels[days] || rangeLabels[90];
  labels.forEach((l, i) => { if (i < newLabels.length) l.textContent = newLabels[i]; });
  // Also update monthly chart labels
  const monthlySvg = document.querySelector('#fp-chart-monthly svg');
  const mLabels = monthlySvg.querySelectorAll('text.axis-label[text-anchor="middle"]');
  const mRangeLabels = {
    30: ['Oct', '', '', '', '', ''],
    60: ['Oct', 'Nov', '', '', '', ''],
    90: ['Oct', 'Nov', 'Dec', '', '', ''],
    180: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
    360: ['Oct', 'Dec', 'Feb', 'Apr', 'Jun', 'Aug']
  };
  const mNew = mRangeLabels[days] || mRangeLabels[90];
  mLabels.forEach((l, i) => { if (i < mNew.length) l.textContent = mNew[i]; });
}

/* ── Future Prices: toggle Daily / Monthly view ── */
function toggleFPView(value) {
  const isMonthly = value === 'Monthly';
  document.getElementById('fp-chart-daily').style.display = isMonthly ? 'none' : '';
  document.getElementById('fp-chart-monthly').style.display = isMonthly ? '' : 'none';
  document.getElementById('fp-legend-daily').style.display = isMonthly ? 'none' : '';
  document.getElementById('fp-legend-monthly').style.display = isMonthly ? '' : 'none';
}

/* ── Occupancy: toggle Daily / Monthly view ── */
function toggleOccView(value) {
  const isMonthly = value === 'Monthly';
  document.getElementById('occ-chart-monthly').style.display = isMonthly ? '' : 'none';
  document.getElementById('occ-chart-daily').style.display = isMonthly ? 'none' : '';
  document.getElementById('occ-legend-monthly').style.display = isMonthly ? '' : 'none';
  document.getElementById('occ-legend-daily').style.display = isMonthly ? 'none' : '';
}

/* ── Occupancy: legend toggle (show/hide chart lines) ── */
function toggleOccLegend(el, type) {
  el.classList.toggle('off');
  const isOff = el.classList.contains('off');
  const classMap = {
    'occ-lyf': '.occ-lyf-line',
    'occ-lyf-d': '.occ-lyf-line',
    'occ-stly': '.occ-stly-line',
    'occ-stly-d': '.occ-stly-line',
    'occ-pickup': '.occ-pickup-line',
    'occ-pickup-d': '.occ-pickup-line'
  };
  const selector = classMap[type];
  if (selector) {
    document.querySelectorAll(selector).forEach(l => l.style.display = isOff ? 'none' : '');
  }
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
