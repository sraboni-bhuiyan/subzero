// ════════════════════════════════════════════════════════
//  CONSTANTS
// ════════════════════════════════════════════════════════

const CANCEL_GUIDES = {
  Netflix: [
    'Go to netflix.com and sign in',
    'Click your profile icon (top right)',
    'Select "Account"',
    'Scroll to "Membership & Billing"',
    'Click "Cancel Membership"',
    'Confirm cancellation',
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
  'Xbox Game Pass': [
    'Go to account.microsoft.com',
    'Click "Services & subscriptions"',
    'Find Xbox Game Pass and click "Manage"',
    'Select "Cancel" and confirm',
  ],
  'LinkedIn Premium': [
    'Go to linkedin.com and sign in',
    'Click your profile photo → "Premium features"',
    'Click "Manage Premium account"',
    'Select "Cancel subscription"',
    'Follow the prompts to confirm',
  ],
  'Dropbox Plus': [
    'Go to dropbox.com and sign in',
    'Click your avatar → "Settings"',
    'Go to the "Plan" tab',
    'Click "Cancel plan" and confirm',
  ],
  default: [
    'Sign in to the service website',
    'Go to Account Settings or Billing',
    'Find the Subscription or Plan section',
    'Click Cancel or Downgrade',
    'Check your email for a cancellation confirmation',
  ],
};

const ICONS = {
  Streaming:      '🎬',
  Music:          '🎵',
  Software:       '💻',
  Gaming:         '🎮',
  News:           '📰',
  Fitness:        '💪',
  'Cloud Storage':'☁️',
  Other:          '📦',
};

const COLORS = {
  Streaming:      '#6c63ff',
  Music:          '#48cfad',
  Software:       '#ff6b6b',
  Gaming:         '#ffd166',
  News:           '#7986cb',
  Fitness:        '#ff9f43',
  'Cloud Storage':'#45aaf2',
  Other:          '#a55eea',
};

const DEMO_SUBS = [
  { id: '1', name: 'Netflix',              category: 'Streaming',     cost: 17.99, billing: 'monthly', status: 'keep'   },
  { id: '2', name: 'Spotify',              category: 'Music',         cost:  9.99, billing: 'monthly', status: 'keep'   },
  { id: '3', name: 'Adobe Creative Cloud', category: 'Software',      cost: 54.99, billing: 'monthly', status: 'review' },
  { id: '4', name: 'Xbox Game Pass',       category: 'Gaming',        cost: 14.99, billing: 'monthly', status: 'review' },
  { id: '5', name: 'NY Times',             category: 'News',          cost:  4.99, billing: 'monthly', status: 'cancel' },
  { id: '6', name: 'Dropbox Plus',         category: 'Cloud Storage', cost: 99.00, billing: 'yearly',  status: 'cancel' },
  { id: '7', name: 'LinkedIn Premium',     category: 'Software',      cost: 39.99, billing: 'monthly', status: 'review' },
];

// ════════════════════════════════════════════════════════
//  STATE
// ════════════════════════════════════════════════════════

let subs           = JSON.parse(localStorage.getItem('subzero-subs') || 'null');
let currency       = localStorage.getItem('subzero-currency') || '€';
let editingId      = null;
let cancelTargetId = null;
let deleteTargetId = null;

if (!subs) { subs = DEMO_SUBS; save(); }

// ════════════════════════════════════════════════════════
//  PERSISTENCE
// ════════════════════════════════════════════════════════

function save() {
  localStorage.setItem('subzero-subs', JSON.stringify(subs));
}

// ════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════

function getMonthly(s) {
  if (s.billing === 'monthly') return s.cost;
  if (s.billing === 'yearly')  return s.cost / 12;
  if (s.billing === 'weekly')  return s.cost * 4.33;
  return s.cost;
}

function fmt(n) {
  return currency + n.toFixed(2);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function generateId() {
  return Date.now().toString() + Math.random().toString(36).slice(2, 6);
}

// ════════════════════════════════════════════════════════
//  TOAST
// ════════════════════════════════════════════════════════

let toastTimer = null;

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

// ════════════════════════════════════════════════════════
//  STATS
// ════════════════════════════════════════════════════════

function updateStats() {
  const total   = subs.reduce((a, s) => a + getMonthly(s), 0);
  const savings = subs
    .filter(s => s.status === 'cancel')
    .reduce((a, s) => a + getMonthly(s), 0);

  document.getElementById('stat-monthly').textContent = fmt(total);
  document.getElementById('stat-yearly').textContent  = fmt(total * 12);
  document.getElementById('stat-savings').textContent = fmt(savings);
  document.getElementById('stat-count').textContent   = subs.length;

  const pct = total > 0 ? Math.min(100, (savings / total) * 100) : 0;
  document.getElementById('savings-bar').style.width  = pct + '%';
}

// ════════════════════════════════════════════════════════
//  RENDER TABLE
// ════════════════════════════════════════════════════════

function renderTable() {
  const filter  = document.getElementById('filter-status').value;
  const search  = document.getElementById('search-input').value.trim().toLowerCase();
  const sort    = document.getElementById('sort-select').value;
  const tbody   = document.getElementById('subs-body');
  const empty   = document.getElementById('empty-state');
  const noRes   = document.getElementById('no-results');

  // Hide both placeholders to start
  empty.classList.add('hidden');
  noRes.classList.add('hidden');

  // If no subs at all
  if (subs.length === 0) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
    updateStats();
    return;
  }

  // Filter by status
  let filtered = filter === 'all'
    ? [...subs]
    : subs.filter(s => s.status === filter);

  // Filter by search
  if (search) {
    filtered = filtered.filter(s =>
      s.name.toLowerCase().includes(search) ||
      s.category.toLowerCase().includes(search)
    );
  }

  // Sort
  if (sort === 'name-asc')   filtered.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === 'name-desc')  filtered.sort((a, b) => b.name.localeCompare(a.name));
  if (sort === 'cost-asc')   filtered.sort((a, b) => getMonthly(a) - getMonthly(b));
  if (sort === 'cost-desc')  filtered.sort((a, b) => getMonthly(b) - getMonthly(a));

  // No results after filter/search
  if (filtered.length === 0) {
    tbody.innerHTML = '';
    noRes.classList.remove('hidden');
    updateStats();
    return;
  }

  // Build rows
  tbody.innerHTML = filtered.map(s => {
    const monthly  = getMonthly(s);
    const yearly   = (monthly * 12).toFixed(2);
    const color    = COLORS[s.category] || '#6c63ff';
    const icon     = ICONS[s.category]  || '📦';

    const badgeClass = {
      keep:   'badge-keep',
      review: 'badge-review',
      cancel: 'badge-cancel',
      none:   'badge-none',
    }[s.status] || 'badge-none';

    const badgeLabel   = s.status === 'none' ? 'Untagged' : capitalize(s.status);
    const billingLabel = capitalize(s.billing);

    return `
      <tr>
        <td>
          <div class="sub-name">
            <div class="sub-icon" style="background:${color}22; color:${color}">
              ${icon}
            </div>
            <div>
              <div class="sub-title">${s.name}</div>
              <div class="sub-yearly">${currency}${yearly}/yr</div>
            </div>
          </div>
        </td>
        <td class="hide-sm billing-text">${s.category}</td>
        <td>
          <div class="cost-main">${fmt(s.cost)}</div>
          <div class="cost-sub">${fmt(monthly)}/mo</div>
        </td>
        <td class="hide-sm billing-text">${billingLabel}</td>
        <td><span class="badge ${badgeClass}">${badgeLabel}</span></td>
        <td>
          <div class="actions-row">
            <button class="action-btn action-keep"   onclick="setStatus('${s.id}', 'keep')">Keep</button>
            <button class="action-btn action-review" onclick="setStatus('${s.id}', 'review')">Review</button>
            <button class="action-btn action-cancel" onclick="openCancelGuide('${s.id}')">Cancel</button>
            <button class="action-btn action-edit"   onclick="openEditModal('${s.id}')">✏️</button>
            <button class="action-btn action-delete" onclick="openDeleteModal('${s.id}')">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  updateStats();
}

// ════════════════════════════════════════════════════════
//  STATUS
// ════════════════════════════════════════════════════════

function setStatus(id, status) {
  const s = subs.find(x => x.id === id);
  if (!s) return;
  s.status = status;
  save();
  renderTable();
  showToast(`Marked as ${capitalize(status)}`, 'success');
}

// ════════════════════════════════════════════════════════
//  CURRENCY
// ════════════════════════════════════════════════════════

function changeCurrency() {
  currency = document.getElementById('currency-select').value;
  localStorage.setItem('subzero-currency', currency);
  // update currency label in modal
  document.querySelectorAll('.currency-label').forEach(el => {
    el.textContent = currency;
  });
  renderTable();
}

// ════════════════════════════════════════════════════════
//  ADD / EDIT MODAL
// ════════════════════════════════════════════════════════

function openAddModal() {
  editingId = null;
  document.getElementById('modal-title').textContent    = 'Add Subscription';
  document.getElementById('modal-save-btn').textContent = 'Add Subscription';
  document.getElementById('f-name').value     = '';
  document.getElementById('f-cost').value     = '';
  document.getElementById('f-category').value = 'Streaming';
  document.getElementById('f-billing').value  = 'monthly';
  document.getElementById('f-status').value   = 'none';
  document.getElementById('add-modal').classList.remove('hidden');
  document.getElementById('f-name').focus();
}

function openEditModal(id) {
  const s = subs.find(x => x.id === id);
  if (!s) return;
  editingId = id;
  document.getElementById('modal-title').textContent    = 'Edit Subscription';
  document.getElementById('modal-save-btn').textContent = 'Save Changes';
  document.getElementById('f-name').value     = s.name;
  document.getElementById('f-cost').value     = s.cost;
  document.getElementById('f-category').value = s.category;
  document.getElementById('f-billing').value  = s.billing;
  document.getElementById('f-status').value   = s.status;
  document.getElementById('add-modal').classList.remove('hidden');
  document.getElementById('f-name').focus();
}

function closeModal() {
  document.getElementById('add-modal').classList.add('hidden');
  editingId = null;
}

function saveSubscription() {
  const name  = document.getElementById('f-name').value.trim();
  const cost  = parseFloat(document.getElementById('f-cost').value);

  // Validation
  if (!name) {
    showToast('Please enter a service name.', 'error');
    document.getElementById('f-name').focus();
    return;
  }
  if (isNaN(cost) || cost < 0) {
    showToast('Please enter a valid cost.', 'error');
    document.getElementById('f-cost').focus();
    return;
  }

  if (editingId) {
    // EDIT existing
    const s = subs.find(x => x.id === editingId);
    if (!s) return;
    s.name     = name;
    s.cost     = cost;
    s.category = document.getElementById('f-category').value;
    s.billing  = document.getElementById('f-billing').value;
    s.status   = document.getElementById('f-status').value;
    save();
    renderTable();
    closeModal();
    showToast(`"${name}" updated.`, 'success');
  } else {
    // ADD new
    const sub = {
      id:       generateId(),
      name,
      category: document.getElementById('f-category').value,
      cost,
      billing:  document.getElementById('f-billing').value,
      status:   document.getElementById('f-status').value,
    };
    subs.push(sub);
    save();
    renderTable();
    closeModal();
    showToast(`"${name}" added.`, 'success');
  }
}

// ════════════════════════════════════════════════════════
//  DELETE MODAL
// ════════════════════════════════════════════════════════

function openDeleteModal(id) {
  const s = subs.find(x => x.id === id);
  if (!s) return;
  deleteTargetId = id;
  document.getElementById('delete-name').textContent = s.name;
  document.getElementById('delete-modal').classList.remove('hidden');
}

function closeDeleteModal() {
  document.getElementById('delete-modal').classList.add('hidden');
  deleteTargetId = null;
}

function confirmDelete() {
  if (!deleteTargetId) return;
  const s = subs.find(x => x.id === deleteTargetId);
  const name = s ? s.name : 'Subscription';
  subs = subs.filter(x => x.id !== deleteTargetId);
  save();
  renderTable();
  closeDeleteModal();
  showToast(`"${name}" deleted.`, 'info');
}

// ════════════════════════════════════════════════════════
//  CANCEL GUIDE MODAL
// ════════════════════════════════════════════════════════

function openCancelGuide(id) {
  const s = subs.find(x => x.id === id);
  if (!s) return;
  cancelTargetId = id;
  document.getElementById('cancel-title').textContent = 'Cancel ' + s.name;
  const steps = CANCEL_GUIDES[s.name] || CANCEL_GUIDES.default;
  document.getElementById('cancel-steps').innerHTML = steps
    .map(step => `>${step}</li>`)
    .join('');
  document.getElementById('cancel-modal').classList.remove('hidden');
}

function closeCancelModal() {
  document.getElementById('cancel-modal').classList.add('hidden');
  cancelTargetId = null;
}

function markCancelled() {
  if (!cancelTargetId) return;
  const s = subs.find(x => x.id === cancelTargetId);
  const name = s ? s.name : 'Subscription';
  subs = subs.filter(x => x.id !== cancelTargetId);
  save();
  renderTable();
  closeCancelModal();
  showToast(`"${name}" removed. Nice save! 💰`, 'success');
}

// ════════════════════════════════════════════════════════
//  EXPORT CSV
// ════════════════════════════════════════════════════════

function exportCSV() {
  if (subs.length === 0) {
    showToast('Nothing to export yet.', 'error');
    return;
  }

  const headers = ['Name', 'Category', 'Cost', 'Billing', 'Monthly Cost', 'Yearly Cost', 'Status'];

  const rows = subs.map(s => {
    const monthly = getMonthly(s).toFixed(2);
    const yearly  = (getMonthly(s) * 12).toFixed(2);
    return [
      `"${s.name}"`,
      `"${s.category}"`,
      s.cost.toFixed(2),
      `"${capitalize(s.billing)}"`,
      monthly,
      yearly,
      `"${s.status === 'none' ? 'Untagged' : capitalize(s.status)}"`,
    ].join(',');
  });

  const csv     = [headers.join(','), ...rows].join('\n');
  const blob    = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url     = URL.createObjectURL(blob);
  const link    = document.createElement('a');
  const date    = new Date().toISOString().slice(0, 10);

  link.href     = url;
  link.download = `subzero-export-${date}.csv`;
  link.click();
  URL.revokeObjectURL(url);

  showToast('Exported successfully!', 'success');
}

// ════════════════════════════════════════════════════════
//  KEYBOARD & CLICK-OUTSIDE TO CLOSE MODALS
// ════════════════════════════════════════════════════════

document.getElementById('add-modal').addEventListener('click', function (e) {
  if (e.target === this) closeModal();
});

document.getElementById('cancel-modal').addEventListener('click', function (e) {
  if (e.target === this) closeCancelModal();
});

document.getElementById('delete-modal').addEventListener('click', function (e) {
  if (e.target === this) closeDeleteModal();
});

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    closeModal();
    closeCancelModal();
    closeDeleteModal();
  }
  // Ctrl/Cmd + K focuses search
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    document.getElementById('search-input').focus();
  }
});

// ════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════

(function init() {
  // Restore currency selector
  const savedCurrency = localStorage.getItem('subzero-currency') || '€';
  currency = savedCurrency;
  const currencySelect = document.getElementById('currency-select');
  if (currencySelect) currencySelect.value = savedCurrency;

  // Update currency label in modal
  document.querySelectorAll('.currency-label').forEach(el => {
    el.textContent = currency;
  });

  // Initial render
  renderTable();
})();