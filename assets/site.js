/* ProdLoop Works landing page: menu, topic pre-select, enquiry form. */
(function () {
  var menu = document.getElementById('menu');
  var openBtn = document.getElementById('menu-open');
  // The sticky header uses backdrop-filter, which would trap a fixed overlay inside it.
  if (menu) document.body.appendChild(menu);

  function setMenu(open) {
    if (!menu) return;
    menu.hidden = !open;
    openBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.documentElement.style.overflow = open ? 'hidden' : '';
    if (open) {
      var first = menu.querySelector('[data-close-menu]');
      if (first) first.focus();
    } else {
      openBtn.focus({ preventScroll: true });
    }
  }
  if (openBtn) openBtn.addEventListener('click', function () { setMenu(menu.hidden); });
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('[data-close-menu]')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu && !menu.hidden) setMenu(false);
  });

  var form = document.getElementById('enquiry');
  if (!form) return;

  function tick(topic) {
    var box = form.querySelector('input[name="help"][value="' + topic + '"]');
    if (box) box.checked = true;
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-pick]');
    if (a) tick(a.getAttribute('data-pick'));
  });

  // Pre-fill from links in the assessment reports, e.g. ?topic=readiness&ref=ORG-1A2B#contact
  var q = new URLSearchParams(location.search);
  if (q.get('topic')) q.get('topic').split(',').forEach(tick);
  var pre = null;
  try { pre = JSON.parse(sessionStorage.getItem('plw-prefill') || 'null'); } catch (e) {}
  if (pre && q.get('ref') && pre.ref === q.get('ref')) {
    ['name', 'email', 'company', 'role'].forEach(function (k) {
      if (pre[k] && form.elements[k]) form.elements[k].value = String(pre[k]).slice(0, 200);
    });
  }
  if (q.get('ref')) form.elements.ref.value = q.get('ref').slice(0, 40);
  var site = document.body.getAttribute('data-site');   // e.g. "Fractional CAIO site"
  form.elements.source.value = (site ? site + ': ' : '') + (q.get('from') || (q.get('ref') ? 'assessment report' : 'landing page'));
  if (q.get('ref') && q.get('from') === 'organisation report' && !form.elements.message.value) {
    form.elements.message.value = "I'd like a walkthrough of our AI maturity results.";
  }

  var errorEl = document.getElementById('form-error');
  var sentEl = document.getElementById('form-sent');
  var failedEl = document.getElementById('form-failed');
  var sendBtn = document.getElementById('send');
  var sending = false;

  function value(name) { return String(form.elements[name].value || '').trim(); }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (sending) return;
    errorEl.hidden = true;
    failedEl.hidden = true;
    sentEl.hidden = true;

    var name = value('name'), email = value('email'), company = value('company');
    var missing = [];
    form.elements.name.setAttribute('aria-invalid', name ? 'false' : 'true');
    form.elements.email.setAttribute('aria-invalid', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'false' : 'true');
    form.elements.company.setAttribute('aria-invalid', company ? 'false' : 'true');
    if (!name) missing.push('your name');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) missing.push('a valid work email');
    if (!company) missing.push('your company or organisation');
    if (missing.length) {
      var list = missing.length > 1 ? missing.slice(0, -1).join(', ') + ' and ' + missing[missing.length - 1] : missing[0];
      errorEl.textContent = 'Please add ' + list + '.';
      errorEl.hidden = false;
      var bad = form.querySelector('[aria-invalid="true"]');
      if (bad) bad.focus();
      return;
    }

    var help = Array.prototype.filter.call(form.querySelectorAll('input[name="help"]'), function (b) { return b.checked; })
      .map(function (b) { return b.parentNode.textContent.trim(); });

    sending = true;
    sendBtn.setAttribute('aria-busy', 'true');
    sendBtn.firstChild.nodeValue = 'Sending… ';

    window.plwPost({
      type: 'enquiry',
      name: name, email: email, company: company,
      role: value('role'),
      help: help.join('; '),
      message: value('message'),
      ref: value('ref'),
      source: value('source'),
      website: value('website')
    }).then(function () {
      sentEl.hidden = false;
      sentEl.focus();
      form.querySelectorAll('input:not([type=hidden]):not([type=checkbox]), textarea').forEach(function (el) { el.value = ''; });
      form.querySelectorAll('input[type=checkbox]').forEach(function (el) { el.checked = false; });
    }).catch(function () {
      failedEl.hidden = false;
      failedEl.focus();
    }).then(function () {
      sending = false;
      sendBtn.removeAttribute('aria-busy');
      sendBtn.firstChild.nodeValue = 'Send enquiry ';
    });
  });
})();
