const navToggle = document.querySelector('#nav-toggle');
const primaryNav = document.querySelector('#primary-nav');

if (navToggle && primaryNav) {
  const closeNav = () => {
    primaryNav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  };

  navToggle.addEventListener('click', () => {
    const willOpen = !primaryNav.classList.contains('is-open');
    primaryNav.classList.toggle('is-open', willOpen);
    navToggle.setAttribute('aria-expanded', String(willOpen));
  });

  primaryNav.addEventListener('click', event => {
    if (event.target.closest('a')) closeNav();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
      closeNav();
      navToggle.focus();
    }
  });
}
