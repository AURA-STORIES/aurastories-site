(() => {
  const root = document.documentElement;
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const allowed = ['system', 'light', 'dark'];
  let mode = 'system';

  try {
    const saved = localStorage.getItem('aura-theme');
    if (allowed.includes(saved)) mode = saved;
  } catch {}

  const apply = () => {
    const theme = mode === 'system' ? (media.matches ? 'dark' : 'light') : mode;
    root.dataset.themeMode = mode;
    root.dataset.theme = theme;
  };

  window.setAuraThemeMode = next => {
    if (!allowed.includes(next)) return;
    mode = next;
    try { localStorage.setItem('aura-theme', mode); } catch {}
    apply();
  };

  media.addEventListener?.('change', () => {
    if (mode === 'system') apply();
  });
  apply();
})();
