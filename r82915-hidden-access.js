(function () {
  'use strict';
  window.__IMF_HIDDEN_ACCESS_STANDALONE = true;
  var clicks = 0;
  var lastClickAt = 0;
  var resetTimer = 0;

  function isImfohsaLogo(target) {
    var image = target && target.closest ? target.closest('img') : null;
    if (!image) return false;
    var marker = ((image.alt || '') + ' ' + (image.getAttribute('src') || '')).toLowerCase();
    return marker.indexOf('imfohsa') !== -1;
  }

  function openOperationalAccess() {
    var url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('access', '1');
    url.searchParams.set('v', '82915c27');
    window.location.assign(url.toString());
  }

  document.addEventListener('click', function (event) {
    if (new URLSearchParams(window.location.search).has('access') || !isImfohsaLogo(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();

    var now = Date.now();
    clicks = now - lastClickAt <= 1400 ? clicks + 1 : 1;
    lastClickAt = now;
    window.clearTimeout(resetTimer);
    if (clicks >= 2) {
      clicks = 0;
      openOperationalAccess();
      return;
    }
    resetTimer = window.setTimeout(function () { clicks = 0; }, 1500);
  }, true);
})();
