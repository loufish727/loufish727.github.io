(function () {
  const tabs = [...document.querySelectorAll('[data-tab]')];
  const panels = [...document.querySelectorAll('[data-panel]')];
  const tablist = document.querySelector('[data-tour-tabs]');
  if (tablist && tabs.length && panels.length) {
    document.documentElement.classList.add('js');
    tablist.setAttribute('role', 'tablist');
    function select(tab, focus = false) {
      tabs.forEach(item => {
        const active = item === tab;
        item.setAttribute('aria-selected', String(active));
        item.tabIndex = active ? 0 : -1;
      });
      panels.forEach(panel => { panel.hidden = panel.dataset.panel !== tab.dataset.tab; });
      if (focus) tab.focus({ preventScroll: true });
    }
    tabs.forEach((tab, index) => {
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', `panel-${tab.dataset.tab}`);
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next === undefined) return;
        event.preventDefault();
        select(tabs[next], true);
      });
    });
    panels.forEach(panel => {
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', `tab-${panel.dataset.panel}`);
    });
    select(tabs[0]);
  }
  // Retire only the legacy root worker, never registrations owned by sibling apps.
  if (location.protocol !== 'file:' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => Promise.all(
      registrations.filter(registration => registration.scope === `${location.origin}/`)
        .map(registration => registration.unregister())
    )).catch(() => {});
  }
})();
