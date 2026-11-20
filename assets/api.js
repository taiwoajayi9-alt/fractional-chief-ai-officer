/* Sends data to the Google Apps Script web app.
   Plain-text body keeps it a "simple" request, so browsers skip the CORS preflight
   that Apps Script cannot answer. The script replies with JSON we can read. */
(function () {
  var loadedAt = Date.now();

  function endpoint() {
    var c = window.PLW_CONFIG || {};
    var url = c.endpoint || '';
    return /^https:\/\/script\.google\.com\//.test(url) ? url : '';
  }

  window.plwPost = function (payload, opts) {
    opts = opts || {};
    var url = endpoint();
    if (!url) {
      if (window.console) console.warn('ProdLoop Works: no endpoint set in assets/config.js');
      return Promise.reject(new Error('not-configured'));
    }
    payload = Object.assign({}, payload, {
      elapsed: Date.now() - (opts.startedAt || loadedAt),
      page: location.pathname,
      referrer: document.referrer || ''
    });
    var controller = 'AbortController' in window ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, 20000) : null;
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow',
      keepalive: !!opts.keepalive,
      signal: controller ? controller.signal : undefined
    }).then(function (r) {
      if (timer) clearTimeout(timer);
      return r.json();
    }).then(function (data) {
      if (!data || data.ok !== true) throw new Error((data && data.error) || 'failed');
      return data;
    });
  };

  window.plwRef = function (prefix) {
    var a = new Uint8Array(6);
    (window.crypto || window.msCrypto).getRandomValues(a);
    var s = Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    return (prefix || 'R') + '-' + s.toUpperCase();
  };
})();
