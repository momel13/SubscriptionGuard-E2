// Toast-Feature: showToast hinzugefügt (#55) 
const MOCK_DASHBOARD = {
  budgetTarget: 80,
  categories: [
    { id: 1, name: 'Streaming', icon: '🎬', color: '#a855f7' },
    { id: 2, name: 'Musik', icon: '🎧', color: '#22d3ee' },
    { id: 3, name: 'Software', icon: '💻', color: '#6366f1' },
    { id: 4, name: 'Cloud', icon: '☁️', color: '#0ea5e9' },
    { id: 5, name: 'Fitness', icon: '💪', color: '#10b981' },
    { id: 6, name: 'Gaming', icon: '🎮', color: '#ef4444' },
    { id: 7, name: 'News', icon: '📰', color: '#f59e0b' },
  ],
  subscriptions: [
    { id: 1, categoryId: 1, name: 'Netflix Standard', provider: 'Netflix', cost: 13.99, currency: 'EUR', interval: 'MONTHLY', startDate: '2025-10-01', cancelDeadline: '2026-05-29', contractEnd: '2026-06-30', autoRenewal: true, usageRating: 'OFTEN', isPaused: false },
    { id: 2, categoryId: 2, name: 'Spotify Family', provider: 'Spotify', cost: 17.99, currency: 'EUR', interval: 'MONTHLY', startDate: '2025-09-12', cancelDeadline: null, contractEnd: null, autoRenewal: true, usageRating: 'OFTEN', isPaused: false },
    { id: 3, categoryId: 3, name: 'Adobe Creative Cloud', provider: 'Adobe', cost: 59.99, currency: 'EUR', interval: 'MONTHLY', startDate: '2025-11-04', cancelDeadline: '2026-07-11', contractEnd: '2026-08-11', autoRenewal: true, usageRating: 'RARELY', isPaused: false },
    { id: 4, categoryId: 4, name: 'iCloud 200 GB', provider: 'Apple', cost: 2.99, currency: 'EUR', interval: 'MONTHLY', startDate: '2025-05-01', cancelDeadline: null, contractEnd: null, autoRenewal: true, usageRating: 'OFTEN', isPaused: false },
    { id: 5, categoryId: 5, name: 'McFit', provider: 'McFit', cost: 29.9, currency: 'EUR', interval: 'MONTHLY', startDate: '2025-02-01', cancelDeadline: '2026-05-22', contractEnd: '2026-06-22', autoRenewal: true, usageRating: 'NEVER', isPaused: false },
    { id: 6, categoryId: 6, name: 'PlayStation Plus', provider: 'Sony', cost: 71.99, currency: 'EUR', interval: 'YEARLY', startDate: '2025-12-15', cancelDeadline: '2026-07-17', contractEnd: '2026-08-17', autoRenewal: true, usageRating: 'RARELY', isPaused: false },
    { id: 7, categoryId: 7, name: 'NYT Digital', provider: 'NYT', cost: 4, currency: 'EUR', interval: 'MONTHLY', startDate: '2026-01-10', cancelDeadline: null, contractEnd: null, autoRenewal: false, usageRating: 'NOT_RATED', isPaused: true },
  ],
  importCandidates: [
    { id: 'c1', provider: 'Disney Plus', amount: 8.99, interval: 'MONTHLY', categoryId: 1, confidence: 94 },
    { id: 'c2', provider: 'Dropbox', amount: 11.99, interval: 'MONTHLY', categoryId: 4, confidence: 87 },
    { id: 'c3', provider: 'Duolingo', amount: 59.99, interval: 'YEARLY', categoryId: 3, confidence: 76 },
  ],
  notifications: [
    { id: 1, icon: '⏰', color: 'red', msg: 'McFit Kündigungsfrist in 4 Tagen.', meta: 'Kündigungsfrist · heute', unread: true },
    { id: 2, icon: '⏰', color: 'yellow', msg: 'Netflix Kündigungsfrist nähert sich (11 Tage).', meta: 'Kündigungsfrist · gestern', unread: true },
    { id: 3, icon: '⚠️', color: 'yellow', msg: 'Monatsbudget zu 92 % aufgebraucht.', meta: 'Budget · vor 2 Tagen', unread: false },
    { id: 4, icon: '📈', color: 'brand', msg: 'Adobe Preis seit letzter Periode +3,00 €.', meta: 'Preis · vor 5 Tagen', unread: false },
  ],
};

const MockDataSource = {
  name: 'Mock-Daten',
  async loadDashboard() {
    return MOCK_DASHBOARD;
  },
  async createSubscription(payload) {
    return { ...payload, id: Date.now() };
  },
};

// Backend handoff point:
// window.SubGuardDataSource = { name: 'REST API', loadDashboard: async () => fetch('/api/dashboard').then(r => r.json()) };
let dataSource = window.SubGuardDataSource || MockDataSource;

const INTERVAL_FACTOR = { WEEKLY: 52 / 12, MONTHLY: 1, QUARTERLY: 1 / 3, YEARLY: 1 / 12 };
const fmt = (n) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n || 0);
const monthCost = (s) => Number(s.cost || 0) * (INTERVAL_FACTOR[s.interval] || 1);
const today = new Date('2026-05-18T00:00:00');
const intervalLabel = (i) => ({ WEEKLY: 'wöchentlich', MONTHLY: 'monatlich', QUARTERLY: 'vierteljährlich', YEARLY: 'jährlich' })[i] || i;
const usageLabel = (u) => ({ OFTEN: 'Häufig', RARELY: 'Selten', NEVER: 'Nie', NOT_RATED: 'Nicht bewertet' })[u] || 'Nicht bewertet';
const usageColor = (u) => ({ OFTEN: 'teal', RARELY: 'yellow', NEVER: 'red', NOT_RATED: 'brand' })[u] || 'brand';

const ICONS = {
  cash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/></svg>',
  trend: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>',
  leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M11 20A7 7 0 0 1 4 13c0-7 9-9 16-9 0 7-2 16-9 16z"/><path d="M2 22l8-8"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
};

let appState = {
  categories: [],
  subscriptions: [],
  notifications: [],
  importCandidates: [],
  budgetTarget: 80,
  subFilter: { q: '', cat: '' },
  charts: {},
};

function daysUntil(dateString) {
  if (!dateString) return null;
  const target = new Date(`${dateString}T00:00:00`);
  return Math.ceil((target - today) / 86400000);
}

function normalizeSubscription(raw, categories) {
  const category = raw.category || categories.find((c) => c.id === raw.categoryId) || {
    id: raw.categoryId || null,
    name: raw.cat || 'Sonstiges',
    icon: raw.icon || '📌',
    color: raw.color || '#6366f1',
  };

  return {
    ...raw,
    category,
    categoryId: raw.categoryId ?? category.id,
    cat: category.name,
    icon: category.icon || raw.icon || '📌',
    color: category.color || raw.color || '#6366f1',
    usageRating: raw.usageRating || raw.usage || 'NOT_RATED',
    isPaused: raw.isPaused ?? raw.paused ?? false,
    deadline: raw.deadline ?? daysUntil(raw.cancelDeadline),
  };
}

function getSubscriptionFormElements() {
  const form = document.getElementById('subscription-form');
  if (!form) return null;

  return {
    form,
    alert: document.getElementById('subscription-form-alert'),
    submit: document.getElementById('subscription-submit'),
    fields: {
      name: document.getElementById('subscription-name'),
      provider: document.getElementById('subscription-provider'),
      categoryId: document.getElementById('subscription-category-select'),
      cost: document.getElementById('subscription-cost'),
      interval: document.getElementById('subscription-interval'),
      usageRating: document.getElementById('subscription-usage'),
      cancelDeadline: document.getElementById('subscription-cancel-deadline'),
      contractEnd: document.getElementById('subscription-contract-end'),
      autoRenewal: document.getElementById('subscription-auto-renewal'),
    },
  };
}

function setFieldError(input, errorId, message, showError) {
  const error = document.getElementById(errorId);
  const hasError = Boolean(message);
  if (!input) return;

  input.classList.toggle('is-invalid', hasError && showError);
  input.setAttribute('aria-invalid', String(hasError && showError));
  if (error) error.textContent = showError ? message : '';
}

function validateSubscriptionForm(showErrors = false) {
  const elements = getSubscriptionFormElements();
  if (!elements) return { valid: true, values: null };

  const { fields } = elements;
  const costRaw = fields.cost.value.trim();
  const categoryRaw = fields.categoryId.value;
  const values = {
    name: fields.name.value.trim(),
    provider: fields.provider.value.trim(),
    categoryId: categoryRaw ? Number(categoryRaw) : null,
    cost: costRaw === '' ? null : Number(costRaw),
    interval: fields.interval.value,
    usageRating: fields.usageRating.value || 'NOT_RATED',
    cancelDeadline: fields.cancelDeadline.value || null,
    contractEnd: fields.contractEnd.value || null,
    autoRenewal: fields.autoRenewal.checked,
  };
  const errors = {};

  if (!values.name) errors.name = 'Bitte gib einen Namen ein.';
  if (!values.provider) errors.provider = 'Bitte gib einen Anbieter ein.';
  if (!values.categoryId) errors.categoryId = 'Bitte wähle eine Kategorie aus.';
  if (costRaw === '') errors.cost = 'Bitte gib die Kosten ein.';
  else if (!Number.isFinite(values.cost) || values.cost <= 0) errors.cost = 'Kosten müssen größer als 0 sein.';
  if (!values.interval) errors.interval = 'Bitte wähle ein Intervall aus.';

  const visibleError = (key) => showErrors || fields[key]?.dataset.touched === 'true';
  setFieldError(fields.name, 'subscription-name-error', errors.name, visibleError('name'));
  setFieldError(fields.provider, 'subscription-provider-error', errors.provider, visibleError('provider'));
  setFieldError(fields.categoryId, 'subscription-category-error', errors.categoryId, visibleError('categoryId'));
  setFieldError(fields.cost, 'subscription-cost-error', errors.cost, visibleError('cost'));
  setFieldError(fields.interval, 'subscription-interval-error', errors.interval, visibleError('interval'));

  const valid = Object.keys(errors).length === 0;
  if (elements.submit) elements.submit.disabled = !valid;
  if (elements.alert) {
    elements.alert.textContent = showErrors && !valid ? 'Bitte fülle alle Pflichtfelder korrekt aus, bevor gespeichert wird.' : '';
    elements.alert.classList.toggle('visible', showErrors && !valid);
  }

  return { valid, values };
}

function buildSubscriptionPayload(values) {
  return {
    categoryId: values.categoryId,
    name: values.name,
    provider: values.provider,
    cost: values.cost,
    currency: 'EUR',
    interval: values.interval,
    startDate: today.toISOString().slice(0, 10),
    cancelDeadline: values.cancelDeadline,
    contractEnd: values.contractEnd,
    autoRenewal: values.autoRenewal,
    usageRating: values.usageRating,
    isPaused: false,
  };
}

// ✅ NEU: Toast-Nachricht anzeigen
function showToast(message) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = `
    position:fixed; bottom:60px; left:50%; transform:translateX(-50%);
    z-index:9999; background:#10b981; color:white;
    padding:12px 24px; border-radius:12px; font-size:14px;
    font-weight:600; box-shadow:0 4px 20px rgba(0,0,0,0.3);
    transition:opacity 0.4s; white-space:nowrap;
  `;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; }, 2500);
  setTimeout(() => toast.remove(), 3000);
}

function getSubscriptionSaveErrorMessage(error) {
  const message = error?.message || '';

  if (/failed to fetch|networkerror|load failed|fetch/i.test(message)) {
    return 'Das Backend ist nicht erreichbar. Bitte prüfe die API-Verbindung oder nutze den Mock-Fallback.';
  }

  if (/status:\s*(404|500|502|503|504)/i.test(message)) {
    return `Das Backend hat das Speichern abgelehnt (${message}). Bitte API-Endpunkt und Serverstatus prüfen.`;
  }

  return message
    ? `Das Abo konnte nicht gespeichert werden: ${message}`
    : 'Das Abo konnte nicht gespeichert werden. Bitte prüfe die API-Verbindung.';
}

async function handleSubscriptionSubmit(event) {
  event.preventDefault();

  const { valid, values } = validateSubscriptionForm(true);
  if (!valid) return;

  const elements = getSubscriptionFormElements();
  const payload = buildSubscriptionPayload(values);
  const submitLabel = elements.submit?.textContent || 'Speichern';
  let saveFailed = false;
  let saveErrorMessage = '';

  try {
    if (elements.submit) {
      elements.submit.disabled = true;
      elements.submit.textContent = 'Speichern...';
    }

    const savedSubscription = typeof dataSource.createSubscription === 'function'
      ? await dataSource.createSubscription(payload)
      : { ...payload, id: Date.now() };

    appState.subscriptions = appState.subscriptions.concat(normalizeSubscription(savedSubscription || payload, appState.categories));
    renderDashboard();
    renderBudget();
    renderSubs();
    renderAnalysis();

    // ✅ NEU: Toast anzeigen und zur Abo-Liste scrollen
    if (elements.alert) {
      elements.alert.textContent = '';
      elements.alert.classList.remove('visible');
    }
    const savedLocally = dataSource === MockDataSource || typeof dataSource.createSubscription !== 'function';
    showToast(savedLocally ? '✓ Abo lokal im Mock-Fallback gespeichert!' : '✓ Abo erfolgreich gespeichert!');
    document.getElementById('subs-grid').scrollIntoView({ behavior: 'smooth' });

  } catch (error) {
    saveFailed = true;
    saveErrorMessage = getSubscriptionSaveErrorMessage(error);
    console.error('Subscription could not be saved.', error);
    if (elements.alert) {
      elements.alert.textContent = saveErrorMessage;
      elements.alert.classList.add('visible');
    }
  } finally {
    if (elements.submit) elements.submit.textContent = submitLabel;
    const currentValidation = validateSubscriptionForm(false);
    if (saveFailed && currentValidation.valid && elements.alert) {
      elements.alert.textContent = saveErrorMessage;
      elements.alert.classList.add('visible');
    }
  }
}

function setupSubscriptionFormValidation() {
  const elements = getSubscriptionFormElements();
  if (!elements) return;

  Object.values(elements.fields).forEach((field) => {
    if (!field || field.dataset.validationBound === 'true') return;
    field.dataset.validationBound = 'true';
    field.addEventListener('input', () => {
      field.dataset.touched = 'true';
      validateSubscriptionForm(false);
    });
    field.addEventListener('change', () => {
      field.dataset.touched = 'true';
      validateSubscriptionForm(false);
    });
  });

  if (elements.form.dataset.validationBound !== 'true') {
    elements.form.dataset.validationBound = 'true';
    elements.form.addEventListener('submit', handleSubscriptionSubmit);
  }

  validateSubscriptionForm(false);
}

function statCard(label, value, hint, icon, cls) {
  return `
    <div class="glass stat-card hover-lift">
      <div class="stat-row">
        <div>
          <div class="stat-label">${label}</div>
          <div class="stat-value">${value}</div>
          <div class="stat-hint">${hint}</div>
        </div>
        <div class="stat-icon ${cls || ''}">${ICONS[icon]}</div>
      </div>
    </div>
  `;
}

function getDerived(subscriptions) {
  const active = subscriptions.filter((s) => !s.isPaused);
  const totalMonthly = active.reduce((a, s) => a + monthCost(s), 0);
  const yearlyTotal = totalMonthly * 12;
  const savingsPotential = active
    .filter((s) => s.usageRating === 'NEVER' || s.usageRating === 'RARELY')
    .reduce((a, s) => a + monthCost(s), 0);
  const upcoming = active
    .filter((s) => s.deadline != null && s.deadline >= 0)
    .sort((a, b) => a.deadline - b.deadline)
    .slice(0, 4);
  const byCat = {};

  for (const s of active) {
    const key = s.category?.name || s.cat || 'Sonstiges';
    if (!byCat[key]) byCat[key] = { name: key, cost: 0, count: 0, color: s.color || '#6366f1' };
    byCat[key].cost += monthCost(s);
    byCat[key].count += 1;
  }

  return {
    active,
    totalMonthly,
    yearlyTotal,
    savingsPotential,
    upcoming,
    catRows: Object.values(byCat).sort((a, b) => b.cost - a.cost),
  };
}

function renderDashboard() {
  const { active, totalMonthly, yearlyTotal, savingsPotential, upcoming } = getDerived(appState.subscriptions);

  document.getElementById('stat-grid').innerHTML = `
    ${statCard('Monatliche Kosten', fmt(totalMonthly), `${active.length} aktive Abos`, 'cash')}
    ${statCard('Jährlich projiziert', fmt(yearlyTotal), 'auf Basis aktueller Abos', 'trend', 'accent')}
    ${statCard('Einsparpotenzial', fmt(savingsPotential), 'selten / nie genutzt', 'leaf', 'purple')}
    ${statCard('Offene Erinnerungen', upcoming.length, 'kommende Fristen', 'bell', 'yellow')}
  `;

  document.getElementById('deadline-list').innerHTML = upcoming.map((s) => {
    const cls = s.deadline <= 7 ? 'red' : s.deadline <= 30 ? 'yellow' : 'teal';
    return `
      <div class="row">
        <div class="row-left">
          <div class="sub-icon" style="background:${s.color}22; width:36px; height:36px; font-size:18px;">${s.icon}</div>
          <div>
            <div class="row-name">${s.name}</div>
            <div class="row-sub">Frist in ${s.deadline} Tagen</div>
          </div>
        </div>
        <span class="badge ${cls}">${s.deadline === 0 ? 'heute' : `${s.deadline} Tage`}</span>
      </div>
    `;
  }).join('');

  const recos = active.flatMap((s) => {
    if (s.usageRating === 'NEVER') return [`${s.name} kündigen — keine Nutzung erkannt.`];
    if (s.usageRating === 'RARELY') return [`${s.name} prüfen — selten genutzt.`];
    return [];
  });

  document.getElementById('reco-list').innerHTML = recos.slice(0, 4).map((r) => `
    <div class="row" style="border:0;">
      <div class="row-left"><span class="badge brand dot">Tipp</span><span style="font-size:14px;">${r}</span></div>
    </div>
  `).join('');
}

function renderBudget() {
  const { totalMonthly } = getDerived(appState.subscriptions);
  const budgetSpent = totalMonthly;
  const budgetTarget = appState.budgetTarget || 80;
  const over = budgetSpent > budgetTarget;
  const budgetPct = budgetTarget > 0 ? Math.min(100, (budgetSpent / budgetTarget) * 100) : 100;
  const ringC = 264;

  document.getElementById('b-spent').textContent = fmt(budgetSpent);
  document.getElementById('b-target').textContent = fmt(budgetTarget);
  document.getElementById('b-remaining').textContent = over ? `+${fmt(budgetSpent - budgetTarget)} über` : `${fmt(budgetTarget - budgetSpent)} übrig`;
  document.getElementById('b-status').textContent = over ? 'Über Budget' : 'Im Budget';
  document.getElementById('b-status').className = `badge ${over ? 'red' : 'teal'}`;
  document.getElementById('b-bar').style.width = `${budgetPct}%`;
  document.getElementById('b-bar').className = `progress-bar ${over ? 'red' : 'teal'}`;
  document.getElementById('ring-pct').textContent = `${Math.round(budgetPct)}%`;
  document.getElementById('ring-circle').setAttribute('stroke-dashoffset', String(ringC - ((ringC * budgetPct) / 100)));
}

function renderCategoryControls() {
  const filter = document.getElementById('category-filter');
  const formSelect = document.getElementById('subscription-category-select');
  const filterOptions = ['<option value="">Alle Kategorien</option>']
    .concat(appState.categories.map((c) => `<option value="${c.name}">${c.name}</option>`))
    .join('');
  const formOptions = ['<option value="">Kategorie wählen</option>']
    .concat(appState.categories
    .map((c) => `<option value="${c.id}">${c.icon || ''} ${c.name}</option>`)
    ).join('');

  if (filter) filter.innerHTML = filterOptions;
  if (formSelect) {
    formSelect.innerHTML = formOptions;
    if (!formSelect.value && appState.categories.length) formSelect.value = String(appState.categories[0].id);
  }
  validateSubscriptionForm(false);
}

function renderSubs() {
  const grid = document.getElementById('subs-grid');
  const list = appState.subscriptions.filter((s) => {
    if (appState.subFilter.cat && s.category?.name !== appState.subFilter.cat) return false;
    if (appState.subFilter.q && !(`${s.name} ${s.provider}`.toLowerCase().includes(appState.subFilter.q.toLowerCase()))) return false;
    return true;
  });

  grid.innerHTML = list.map((s) => {
    const dl = s.deadline;
    const dlCls = dl == null ? 'brand' : dl <= 7 ? 'red' : dl <= 30 ? 'yellow' : 'teal';
    const dlLabel = dl == null ? 'keine Frist' : dl === 0 ? 'heute' : `${dl} Tage`;
    return `
      <div class="glass sub-card hover-lift" style="opacity:${s.isPaused ? 0.55 : 1};">
        <div class="sub-head">
          <div class="sub-left">
            <div class="sub-icon" style="background:${s.color}22;">${s.icon}</div>
            <div class="sub-meta">
              <div class="sub-name">${s.name}</div>
              <div class="sub-provider">${s.provider}</div>
            </div>
          </div>
          <span class="badge ${usageColor(s.usageRating)}">${usageLabel(s.usageRating)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:14px;">
          <div>
            <div class="row-sub">${intervalLabel(s.interval)}</div>
            <div class="sub-cost">${fmt(s.cost)}</div>
            <div class="sub-per">≈ ${fmt(monthCost(s))} / Monat</div>
          </div>
          <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px;">
            ${s.isPaused ? '<span class="badge brand">Pausiert</span>' : ''}
            <span class="badge ${dlCls}">${dlLabel}</span>
            <span class="badge brand dot">${s.category?.name || s.cat}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderAnalysis() {
  const { totalMonthly, yearlyTotal, savingsPotential, catRows } = getDerived(appState.subscriptions);

  document.getElementById('analysis-stats').innerHTML = `
    ${statCard('Monatlich', fmt(totalMonthly), '', 'cash')}
    ${statCard('Jährlich', fmt(yearlyTotal), '', 'trend', 'accent')}
    ${statCard('Einsparpotenzial', fmt(savingsPotential), 'selten/nie genutzt', 'leaf', 'purple')}
    ${statCard('Aktive Kategorien', catRows.length, '', 'bell', 'yellow')}
  `;

  document.getElementById('breakdown').innerHTML = catRows.map((c) => {
    const pct = totalMonthly > 0 ? ((c.cost / totalMonthly) * 100).toFixed(1) : 0;
    return `
      <div style="margin-bottom:10px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
          <div style="display:flex; gap:8px; align-items:center;">
            <span style="width:10px;height:10px;border-radius:3px;background:${c.color};"></span>
            <span style="font-weight:600;font-size:14px;">${c.name}</span>
            <span class="badge brand" style="font-size:11px;">${c.count} Abos</span>
          </div>
          <b style="font-size:14px;">${fmt(c.cost)}</b>
        </div>
        <div class="progress" style="height:6px;"><div class="progress-bar" style="width:${pct}%; background:${c.color};"></div></div>
      </div>
    `;
  }).join('');
}

function drawCharts() {
  if (!window.Chart) return;
  const { totalMonthly, catRows } = getDerived(appState.subscriptions);

  if (appState.charts.d) {
    appState.charts.d.destroy();
    appState.charts.l.destroy();
  }

  const d = document.getElementById('doughnut').getContext('2d');
  appState.charts.d = new Chart(d, {
    type: 'doughnut',
    data: {
      labels: catRows.map((c) => c.name),
      datasets: [{
        data: catRows.map((c) => c.cost),
        backgroundColor: catRows.map((c) => c.color),
        borderColor: 'rgba(11,13,18,0.6)',
        borderWidth: 2,
      }],
    },
    options: {
      cutout: '64%',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: 'rgba(230,232,238,0.85)', boxWidth: 12 } },
        tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${fmt(ctx.parsed)}` } },
      },
    },
  });

  const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  const trend = months.map((_, i) => Number((totalMonthly * (0.78 + Math.random() * 0.05 + i * 0.02)).toFixed(2)));
  const l = document.getElementById('line').getContext('2d');
  const grad = l.createLinearGradient(0, 0, 0, 280);
  grad.addColorStop(0, 'rgba(99,102,241,0.45)');
  grad.addColorStop(1, 'rgba(99,102,241,0.0)');
  appState.charts.l = new Chart(l, {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        label: 'Monatskosten',
        data: trend,
        borderColor: '#22d3ee',
        backgroundColor: grad,
        pointBackgroundColor: '#a855f7',
        tension: 0.42,
        fill: true,
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => fmt(ctx.parsed.y) } } },
      scales: {
        x: { ticks: { color: 'rgba(230,232,238,0.7)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { ticks: { color: 'rgba(230,232,238,0.7)', callback: (v) => fmt(v) }, grid: { color: 'rgba(255,255,255,0.05)' } },
      },
    },
  });
}

function renderNotifications() {
  document.getElementById('notif-list').innerHTML = appState.notifications.map((n) => {
    const rgb = n.color === 'red' ? '239,68,68' : n.color === 'yellow' ? '245,158,11' : '99,102,241';
    return `
      <div class="notif ${n.unread ? 'unread' : ''}">
        <div class="notif-body">
          <div class="notif-icon" style="background:rgba(${rgb},0.15);">${n.icon}</div>
          <div>
            <div class="notif-msg">${n.msg} ${n.unread ? '<span class="badge brand" style="margin-left:6px;">neu</span>' : ''}</div>
            <div class="notif-meta">${n.meta}</div>
          </div>
        </div>
        ${n.unread ? '<button class="btn subtle" style="padding:6px 12px;font-size:12px;">✓ Erledigt</button>' : ''}
      </div>
    `;
  }).join('');
}

function renderImportCandidates() {
  const target = document.getElementById('import-candidates');
  if (!target) return;

  target.innerHTML = appState.importCandidates.map((candidate) => {
    const category = appState.categories.find((c) => c.id === candidate.categoryId);
    return `
      <div class="candidate">
        <div>
          <div class="row-name">${candidate.provider}</div>
          <div class="row-sub">${category?.name || 'Sonstiges'} · ${candidate.confidence}% Treffer</div>
        </div>
        <div>
          <div class="row-sub">${intervalLabel(candidate.interval)}</div>
          <b>${fmt(candidate.amount)}</b>
        </div>
        <span class="badge brand dot">Vorschlag</span>
        <div style="display:flex; gap:8px; justify-content:flex-end;">
          <button class="btn subtle" style="padding:6px 10px;font-size:12px;">Verwerfen</button>
          <button class="btn" style="padding:6px 10px;font-size:12px;">Bestätigen</button>
        </div>
      </div>
    `;
  }).join('');
}

function renderApp(payload) {
  const rawSubscriptions = payload.subscriptions || [];
  appState.categories = payload.categories || Array.from(new Map(rawSubscriptions.map((s) => {
    const category = s.category || { id: s.categoryId || s.cat, name: s.cat || 'Sonstiges', icon: s.icon, color: s.color };
    return [category.name, category];
  })).values());
  appState.subscriptions = rawSubscriptions.map((s) => normalizeSubscription(s, appState.categories));
  appState.notifications = payload.notifications || [];
  appState.importCandidates = payload.importCandidates || [];
  appState.budgetTarget = payload.budgetTarget ?? 80;

  renderCategoryControls();
  renderDashboard();
  renderBudget();
  renderSubs();
  renderAnalysis();
  renderNotifications();
  renderImportCandidates();
}

function go(view) {
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === `view-${view}`));
  document.querySelectorAll('.nav-item').forEach((n) => n.classList.toggle('active', n.dataset.view === view));
  if (view === 'analysis') drawCharts();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function filterSubs(v) {
  appState.subFilter.q = v;
  renderSubs();
}

function filterCat(v) {
  appState.subFilter.cat = v;
  renderSubs();
}

async function init() {
  document.querySelectorAll('.nav-item').forEach((n) => n.addEventListener('click', () => go(n.dataset.view)));
  document.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => go(b.dataset.go)));
  setupSubscriptionFormValidation();
  window.filterSubs = filterSubs;
  window.filterCat = filterCat;

  try {
    const payload = await dataSource.loadDashboard();
    renderApp(payload);
    document.getElementById('data-source-label').textContent = `Klickbarer Prototyp — ${dataSource.name}`;
  } catch (error) {
    console.error('Dashboard data source failed. Falling back to mock data.', error);
    dataSource = MockDataSource;
    renderApp(await dataSource.loadDashboard());
    document.getElementById('data-source-label').textContent = 'Klickbarer Prototyp — Mock-Fallback (Speichern lokal simuliert)';
  }
}

init();
