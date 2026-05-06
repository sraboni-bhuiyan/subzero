// ── Theme toggle (shared by index.html and app.html) ──

function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('subzero-theme', next);
  document.getElementById('theme-btn').textContent = next === 'dark' ? '🌙' : '☀️';
}

// Apply saved theme on page load
(function () {
  const saved = localStorage.getItem('subzero-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  window.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('theme-btn');
    if (btn) btn.textContent = saved === 'dark' ? '🌙' : '☀️';
  });
})();