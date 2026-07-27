// Matomo itself is loaded by the tarteaucitron consent banner (see the
// rgpd script in docusaurus.config.js), which also tracks the initial
// page view once the visitor consents. This module adds what that
// integration cannot see: SPA navigations and client-side searches.
//
// Once matomo.js is loaded, it replaces window._paq (a plain array used
// as a command queue) with a tracker proxy. Only pushing after that
// replacement means: no consent, no data — nothing is queued pre-consent
// to be flushed retroactively when the visitor accepts.
const matomoLoaded = () =>
  typeof window !== 'undefined' &&
  Boolean(window._paq) &&
  !Array.isArray(window._paq);

if (typeof window !== 'undefined') {
  setupSearchTracking();
}

const clientModule = {
  onRouteDidUpdate({location, previousLocation}) {
    if (!previousLocation) {
      // Initial load: tracked by the tarteaucitron Matomo service.
      return;
    }
    if (
      previousLocation.pathname === location.pathname &&
      previousLocation.search === location.search
    ) {
      // Hash-only change (e.g. heading anchor): not a new page view.
      return;
    }
    if (!matomoLoaded()) {
      return;
    }
    trackPageViewWhenTitleSettles();
  },
};

// The document title is rewritten by React after the route hook, so an
// immediate snapshot can record the view under the wrong page's title.
// Track once the title has stopped changing for a beat, with a hard cap
// so a view is never lost.
let cancelPendingPageView;
function trackPageViewWhenTitleSettles() {
  // A navigation arriving before the previous view settled supersedes it;
  // firing both would count the new URL twice.
  cancelPendingPageView?.();
  let fired = false;
  let debounce;
  let observer;
  const fire = () => {
    if (fired) {
      return;
    }
    fired = true;
    observer?.disconnect();
    window.clearTimeout(debounce);
    window._paq.push(['setCustomUrl', window.location.href]);
    window._paq.push(['setDocumentTitle', document.title]);
    window._paq.push(['trackPageView']);
  };
  cancelPendingPageView = () => {
    fired = true;
    observer?.disconnect();
    window.clearTimeout(debounce);
  };
  const titleElement = document.querySelector('title');
  if (!titleElement) {
    fire();
    return;
  }
  debounce = window.setTimeout(fire, 250);
  observer = new MutationObserver(() => {
    window.clearTimeout(debounce);
    debounce = window.setTimeout(fire, 100);
  });
  observer.observe(titleElement, {childList: true, characterData: true, subtree: true});
  setTimeout(fire, 1000);
}

// The lunr search box (docusaurus-lunr-search) is client-side only, so no
// query is ever logged server-side. Watch the input, and once the visitor
// stops typing, report the query and how many suggestions the dropdown
// shows. Zero-result queries are the list of articles we should write.
function setupSearchTracking() {
  let debounce;
  document.addEventListener(
    'input',
    (event) => {
      const target = event.target;
      if (target?.id !== 'search_input_react') {
        return;
      }
      window.clearTimeout(debounce);
      const keyword = target.value.trim();
      if (keyword.length < 3) {
        return;
      }
      debounce = window.setTimeout(() => {
        // The visitor may have navigated away (e.g. clicked a suggestion)
        // in the meantime: only report if the query is still on screen,
        // and only report zero on the explicit no-results template, so
        // a dismissed dropdown never fakes a zero-result search.
        if (!matomoLoaded() || target.value.trim() !== keyword) {
          return;
        }
        const noResults = document.querySelector(
          '.ds-dropdown-menu [class*="--no-results"]',
        );
        const suggestions = document.querySelectorAll(
          '.ds-dropdown-menu .ds-suggestion',
        ).length;
        if (noResults) {
          window._paq.push(['trackSiteSearch', keyword, false, 0]);
        } else if (suggestions > 0) {
          window._paq.push(['trackSiteSearch', keyword, false, suggestions]);
        }
      }, 1500);
    },
    true,
  );
}

export default clientModule;
