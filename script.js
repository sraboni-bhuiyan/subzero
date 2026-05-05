// ── Cancel how-to guides ──────────────────────────────────────────
const CANCEL_GUIDES = {
  Netflix: [
    'Go to netflix.com and sign in',
    'Click your profile icon (top right)',
    'Select "Account"',
    'Scroll to "Membership & Billing"',
    'Click "Cancel Membership" and confirm',
  ],
  Spotify: [
    'Go to spotify.com/account',
    'Click "Manage your plan"',
    'Scroll down and click "Cancel Premium"',
    'Follow the steps and confirm',
  ],
  Amazon: [
    'Go to amazon.de and sign in',
    'Hover "Account & Lists" → "Memberships & Subscriptions"',
    'Find Prime and click "Manage membership"',
    'Select "End membership" and confirm',
  ],
  'Adobe Creative Cloud': [
    'Go to account.adobe.com',
    'Click "Plans" in the left sidebar',
    'Click "Manage plan" next to your subscription',
    'Select "Cancel your plan" and follow the steps',
  ],
  default: [
    'Sign in to the service website',
    'Go to Account Settings or Billing',
    'Find the Subscription or Plan section',
    'Click Cancel or Downgrade',
    'Check your email for a cancellation confirmation',
  ],
};

// ── Category icons & colors ───────────────────────────────────────
const ICONS = {
  Streaming: '🎬', Music: '🎵', Software: '💻',
  Gaming: '🎮', News: '📰', Fitness: '💪',
  'Cloud Storage': '☁️', Other: '📦',
};

const COLORS = {
  Streaming: '#6c63ff', Music: '#48cfad', Software: '#ff6b6b',
  Gaming: '#ffd166', News: '#7986cb', Fitness: '#ff9f43',
  'Cloud Storage': '#45aaf2', Other: '#a55eea',
};

// ── Demo data (only loaded if localStorage is empty) ─────────────
const DEMO_SUBS = [
  { id: '1', name: 'Netflix',               category: 'Streaming',      cost: 17.99, billing: 'monthly', status: 'keep'   },
  { id: '2', name: 'Spotify',               category: 'Music',          cost:  9.99, billing: 'monthly', status: 'keep'   },
  { id: '3', name: 'Adobe Creative Cloud',  category: 'Software',       cost: 54.99, billing: 'monthly', status: 'review' },
  { id: '4', name: 'Xbox Game Pass',        category: 'Gaming',         cost: 14.99, billing: 'monthly', status: 'review' },
  { id: '5', name: 'NY Times',              category: 'News',           cost:  4.99, billing: 'monthly', status: 'cancel' },
  { id: '6', name: 'Dropbox Plus',          category: 'Cloud Storage',  cost: 99.00, billing: 'yearly',  status: 'cancel' },
  { id: '7', name: 'LinkedIn Premium',      category: 'Software',       cost: 39.99, billing: 'monthly', status: 'review' },
];

// ── State ─────────────────────────────────────────────────────────
let subs = JSON.parse(localStorage.getItem('subzero-subs') || 'null');
if (!subs) { subs = DEMO_SUBS; save(); }

let cancelTargetId = null;

// ── Persistence ───────────────────────────────────────────────────
function save() {
  localStorage.setItem('subzero-subs', JSON.stringify(subs));
}

// ── Helpers ───────────────────────────────────────────────────────
function getMonthly(s) {
  if (s.billing === 'monthly') return s.cost;
  if (s.billing === 'yearly')  return s.cost / 12;
  if (s.billing === 'weekly')  return s.cost * 4.33;
  return s.cost;
}

function fmt(n) {
  return '€' + n.toFixed(2);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ── Stats ─────────────────────────────────────────────────────────
function updateStats() {
  const total    = subs.reduce((a, s) => a + getMonthly(s), 0);
  const savings  = subs.filter(s => s.status === 'cancel')
                       .reduce((a, s) => a + getMonthly(s), 0);

  document.getElementById('stat-monthly').textContent = fmt(total);
  document.getElementById('stat-yearly').textContent  = fmt(total * 12);
  document.getElementById('stat-savings').textContent = fmt(savings);
  document.getElementById('stat-count').textContent   = subs.length;

  const pct = total > 0 ? Math.min(100, (savings / total) * 100) : 0;
  document.getElementById('savings-bar').style.width = pct + '%';
}

// ── Render ───────────────────────────────────────────────────────
function renderTable() {
    const filter = document.getElementById('filter-status').value;
    const tbody = document.getElementById('subs-body');
    const empty = document.getElementById('empty-state');
    const filtered = filter === 'all' ? subs : subs.filter(s => s.status === filter);

    if (subs.length === 0) {
        empty.classList.remove('hidden');
        tbody.innerHTML = '';
        updateStats();
    return;
    }

empty.classList.add('hidden');

tbody.innerHTML = filtered.map(s => {
const monthly = getMonthly(s);
const yearly = (monthly * 12).toFixed(2);
const color = COLORS[s.category] || '#6c63ff';
const icon = ICONS[s.category] || '📦';
const badgeClass = { keep: 'badge-keep', review: 'badge-review', cancel: 'badge-cancel', none: 'badge-none' }[s.status] || 'badge-none';
const badgeLabel = s.status === 'none' ? 'Untagged' : capitalize(s.status);
const billingLabel = capitalize(s.billing);

return `<tr><td><div class="sub-name"><div class="sub-icon" style="background:${color}22;color:${color}">${icon}</div><div><div class="sub-title">${s.name}</div><div class="sub-yearly">€${yearly}/yr</div></div></div></td><td class="billing-text">${s.category}</td><td><div class="cost-main">${fmt(s.cost)}</div><div class="cost-sub">${fmt(monthly)}/mo</div></td><td class="billing-text">${billingLabel}</td><td><span class="badge ${badgeClass}">${badgeLabel}</span></td><td><div class="actions-row"><button class="action-btn action-keep" onclick="setStatus('${s.id}','keep')">Keep</button><button class="action-btn action-review" onclick="setStatus('${s.id}','review')">Review</button><button class="action-btn action-cancel" onclick="openCancelGuide('${s.id}')">Cancel</button></div></td></tr>`;
}).join('');

updateStats();
}

function setStatus(id, status) {
    const s = subs.find(x => x.id === id);
    if (s) { s.status = status; save(); renderTable(); }
}

function openAddModal() {
    document.getElementById('f-name').value = '';
    document.getElementById('f-cost').value = '';
    document.getElementById('f-category').value = 'Streaming';
    document.getElementById('f-billing').value = 'monthly';
    document.getElementById('f-status').value = 'none';
    document.getElementById('add-modal').classList.remove('hidden');
    document.getElementById('f-name').focus();
}

function closeModal() {
    document.getElementById('add-modal').classList.add('hidden');
}

function saveSubscription() {
    const name = document.getElementById('f-name').value.trim();
    const cost = parseFloat(document.getElementById('f-cost').value);
    if (!name) { alert('Please enter a service name.'); return; }
    if (isNaN(cost) || cost < 0) { alert('Please enter a valid cost.'); return; }
    const sub = {
    id: Date.now().toString(),
    name,
    category: document.getElementById('f-category').value,
    cost,
    billing: document.getElementById('f-billing').value,
    status: document.getElementById('f-status').value,
    };
    subs.push(sub);
    save();
    renderTable();
    closeModal();
}

function openCancelGuide(id) {
    const s = subs.find(x => x.id === id);
    if (!s) return;
    cancelTargetId = id;
    document.getElementById('cancel-title').textContent = 'Cancel ' + s.name;
    const steps = CANCEL_GUIDES[s.name] || CANCEL_GUIDES.default;
    document.getElementById('cancel-steps').innerHTML = steps.map(step => '>' + step + '</li>').join('');
    document.getElementById('cancel-modal').classList.remove('hidden');
    }

    function closeCancelModal() {
    document.getElementById('cancel-modal').classList.add('hidden');
    cancelTargetId = null;
}

function markCancelled() {
    if (!cancelTargetId) return;
    subs = subs.filter(x => x.id !== cancelTargetId);
    save();
    renderTable();
    closeCancelModal();
}

document.getElementById('add-modal').addEventListener('click', function(e) {
if (e.target === this) closeModal();
});

document.getElementById('cancel-modal').addEventListener('click', function(e) {
if (e.target === this) closeCancelModal();
});

document.addEventListener('keydown', function(e) {
if (e.key === 'Escape') { closeModal(); closeCancelModal(); }
});

document.getElementById('add-modal').classList.add('hidden');
document.getElementById('cancel-modal').classList.add('hidden');
document.getElementById('delete-modal').classList.add('hidden');
renderTable();