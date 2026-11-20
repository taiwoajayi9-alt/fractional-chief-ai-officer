/* ProdLoop Works assessments: question flow, scoring, report, details and PDF.
   Reads window.PLW_ASSESS (data-org.js or data-ind.js). Posts results via plwPost (api.js). */
(function () {
  var A = window.PLW_ASSESS;
  var ORG = A.kind === 'org';
  // Site-specific wording. The ProdLoop Works defaults apply unless the page sets window.PLW_SITE.
  var SITE = Object.assign({
    home: '../../',
    homeName: 'ProdLoop Works',
    logo: '../../assets/mark-black.png',
    privacy: '../../privacy/',
    refPrefix: null,
    helpLabel: 'How we help:',
    ctaLabel: 'Book a free 30-minute walkthrough',
    printFoot: 'Book a free 30-minute walkthrough of these results at prodloop.co/works',
    consentOrg: 'ProdLoop Works may contact me to discuss these results.',
    consentInd: 'ProdLoop may send me practical resources on working with AI.',
    serviceName: null   // function(dim) → label for the "How we help" link
  }, window.PLW_SITE || {});
  var HOME = SITE.home;
  var BACK = SITE.backLabel || ('Back to ' + SITE.homeName);
  var STAGES = ['AI-curious', 'AI-assisted', 'AI-accelerated', 'AI-native'];
  var RANGES = ['0–24%', '25–49%', '50–79%', '80–100%'];
  var dimByKey = {};
  A.dims.forEach(function (d) { dimByKey[d.key] = d; });
  var scored = A.dims.filter(function (d) { return !d.usage; });

  var $ = function (s, r) { return (r || document).querySelector(s); };
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function store(v) { try { sessionStorage.setItem(A.storageKey, JSON.stringify(v)); } catch (e) {} }
  function restore() { try { return JSON.parse(sessionStorage.getItem(A.storageKey) || 'null'); } catch (e) { return null; } }

  // ---------- state ----------
  var S = restore() || null;
  function fresh() {
    return {
      ref: window.plwRef(SITE.refPrefix || (ORG ? 'ORG' : 'IND')),
      startedAt: Date.now(),
      order: A.questions.map(function (q) {
        var idx = q.options.map(function (_, i) { return i; });
        if (!q.keepOrder) for (var i = idx.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
        return idx;
      }),
      answers: A.questions.map(function () { return null; }), // 0–3, or 'ns' for Not sure
      i: 0, screen: 'intro', posted: false, details: null
    };
  }

  // ---------- header ----------
  var headLinks = $('#head-links');
  function header(screen) {
    var back = '<a class="head-link" href="' + HOME + '">← ' + esc(BACK) + '</a>';
    if (screen === 'q') headLinks.innerHTML = '<a class="head-link" href="' + HOME + '">' + (ORG ? 'Exit assessment' : 'Exit check') + '</a>';
    else if (screen === 'report') headLinks.innerHTML = '<button type="button" class="btn sm" data-act="pdf">Download PDF</button><a class="head-link hide-sm" href="' + HOME + '">' + esc(BACK) + '</a>';
    else if (screen === 'details') headLinks.innerHTML = '<a class="head-link" href="#" data-act="to-report">← Back to your results</a>';
    else headLinks.innerHTML = back;
  }

  var screens = { intro: $('#s-intro'), q: $('#s-q'), report: $('#s-report'), details: $('#s-details') };
  function show(name, push) {
    Object.keys(screens).forEach(function (k) { screens[k].hidden = k !== name; });
    header(name);
    S.screen = name;
    store(S);
    if (push !== false) {
      var st = { screen: name, i: S.i };
      try { history.pushState(st, '', location.pathname + location.search); } catch (e) {}
    }
    window.scrollTo(0, 0);
  }

  // ---------- scoring ----------
  function score() {
    var res = {}, notSure = 0;
    A.dims.forEach(function (d) { res[d.key] = { pts: 0, n: 0 }; });
    A.questions.forEach(function (q, i) {
      var a = S.answers[i];
      if (a === 'ns') { notSure++; return; }
      if (a == null) return;
      res[q.dim].pts += a; res[q.dim].n++;
    });
    var dims = scored.map(function (d) {
      var r = res[d.key];
      return { key: d.key, name: d.name, pct: r.n ? Math.round(r.pts / (3 * r.n) * 100) : null };
    });
    var valid = dims.filter(function (d) { return d.pct != null; });
    var overall = valid.length ? Math.round(valid.reduce(function (s, d) { return s + d.pct; }, 0) / valid.length) : 0;
    var stageIdx = overall >= 80 ? 3 : overall >= 50 ? 2 : overall >= 25 ? 1 : 0;
    var lowest = valid.slice().sort(function (a, b) { return a.pct - b.pct; });
    return { dims: dims, overall: overall, stageIdx: stageIdx, stage: STAGES[stageIdx], notSure: notSure, lowest: lowest };
  }

  // ---------- question screen ----------
  var groups = A.dims.map(function (d) {
    var qs = []; A.questions.forEach(function (q, i) { if (q.dim === d.key) qs.push(i); });
    return { dim: d, qs: qs };
  });

  function renderQ() {
    var i = S.i, q = A.questions[i], d = dimByKey[q.dim], total = A.questions.length;
    var left = Math.max(1, Math.ceil((total - i) * A.minutes / total));
    var gi = A.dims.indexOf(d);
    var bars = groups.map(function (g, k) {
      var done = g.qs.filter(function (qi) { return qi < i; }).length;
      var bg = k < gi ? 'background:#0A0A0A' : k === gi ? 'background:linear-gradient(90deg,#C8402A ' + Math.round(done / g.qs.length * 100) + '%,rgba(10,10,10,.14) ' + Math.round(done / g.qs.length * 100) + '%)' : '';
      return '<div style="' + bg + '"></div>';
    }).join('');
    var labels = groups.map(function (g, k) { return '<span' + (k === gi ? ' class="on"' : '') + '>' + esc(g.dim.name) + '</span>'; }).join('');
    var cols = 'grid-template-columns:repeat(' + groups.length + ',minmax(0,1fr))';
    var num = ('0' + (ORG ? gi + 1 : gi)).slice(-2);
    var eyebrow = d.usage ? d.name : (ORG ? num + ' — ' + d.name : d.name + ' — ' + d.sub);

    var opts = S.order[i].map(function (oi) {
      return '<label class="opt"><input type="radio" name="a" value="' + oi + '"' + (S.answers[i] === oi ? ' checked' : '') + '><span class="r" aria-hidden="true"></span>' + esc(q.options[oi]) + '</label>';
    }).join('');
    if (!q.noUnsure) opts += '<label class="opt unsure"><input type="radio" name="a" value="ns"' + (S.answers[i] === 'ns' ? ' checked' : '') + '><span class="r" aria-hidden="true"></span>Not sure</label>';

    screens.q.innerHTML =
      '<div class="wrap progress">' +
        '<div class="meta"><b>Question ' + (i + 1) + ' of ' + total + '</b><span class="time muted">About ' + left + ' minute' + (left > 1 ? 's' : '') + ' left</span><span class="dim-now muted">' + esc(d.name) + '</span></div>' +
        '<div class="bars" role="progressbar" aria-valuemin="0" aria-valuemax="' + total + '" aria-valuenow="' + (i + 1) + '" aria-label="Question ' + (i + 1) + ' of ' + total + '" style="' + cols + '">' + bars + '</div>' +
        '<div class="bar-labels" aria-hidden="true" style="' + cols + '">' + labels + '</div>' +
      '</div>' +
      '<form class="wrap q" id="qform" novalidate>' +
        '<div class="ask"><p class="eyebrow">' + esc(eyebrow) + '</p><h1 id="qtext" tabindex="-1">' + esc(q.text) + '</h1><p class="hint">' + esc(A.hint) + '</p></div>' +
        '<fieldset aria-labelledby="qtext">' + opts +
          '<div class="qnav">' + (i > 0 ? '<button type="button" class="btn-text" data-act="prev">← Back</button>' : '<a class="btn-text head-link" href="#" data-act="to-intro">← Back</a>') +
          '<button type="submit" class="btn" id="next"' + (S.answers[i] == null ? ' disabled' : '') + '>' + (i === total - 1 ? 'See my results' : 'Next') + ' <span aria-hidden="true">→</span></button></div>' +
        '</fieldset>' +
      '</form>';
    var h = $('#qtext'); if (h) h.focus({ preventScroll: true });
  }

  document.addEventListener('change', function (e) {
    if (e.target.name === 'a' && e.target.form && e.target.form.id === 'qform') {
      var v = e.target.value;
      S.answers[S.i] = v === 'ns' ? 'ns' : Number(v);
      store(S);
      $('#next').disabled = false;
    }
  });
  document.addEventListener('submit', function (e) {
    if (e.target.id !== 'qform') return;
    e.preventDefault();
    if (S.answers[S.i] == null) return;
    if (S.i < A.questions.length - 1) { S.i++; renderQ(); show('q'); }
    else finish();
  });

  // ---------- results ----------
  function payloadBase(r) {
    var p = { ref: S.ref, overall: r.overall, stage: r.stage, notSure: r.notSure };
    r.dims.forEach(function (d) { p['dim_' + d.key] = d.pct == null ? '' : d.pct; });
    p.answers = A.questions.map(function (q, i) {
      var a = S.answers[i];
      return a === 'ns' ? 'Not sure' : a == null ? '' : a + ' · ' + q.options[a];
    });
    if (!ORG) {
      var u = usage();
      p.frequency = u.freq; p.mode = u.mode;
    }
    return p;
  }

  function finish() {
    var r = score();
    if (!S.posted) {
      var p = payloadBase(r); p.type = ORG ? 'org_result' : 'ind_result';
      window.plwPost(p, { startedAt: S.startedAt }).then(function () { S.posted = true; store(S); }).catch(function () {});
    }
    renderReport();
    show('report');
  }

  function usage() {
    var fi = A.questions.findIndex(function (q) { return q.id === 'freq'; });
    var mi = A.questions.findIndex(function (q) { return q.id === 'mode'; });
    var f = S.answers[fi], m = S.answers[mi];
    return {
      freq: typeof f === 'number' ? A.usageWords.freq[f] : '',
      mode: typeof m === 'number' ? A.usageWords.mode[m] : ''
    };
  }

  function stageSvg(idx) {
    var x = [70, 210, 350, 490];
    var g = '';
    for (var k = 0; k < 4; k++) {
      var t = 'translate(' + x[k] + ' 90)';
      if (k === idx) {
        g += '<g transform="' + t + '"><circle class="pulse" r="' + (44 + k * 4) + '" stroke="#C8402A" stroke-width="1.4"></circle><circle r="' + (38 + k * 3) + '" stroke-width="2.6" fill="#0A0A0A"></circle>' + (k >= 2 ? '<circle r="' + (24 + k * 2) + '" stroke="#F5F2EC" stroke-width="1.6"></circle>' : '') + '<circle r="10" fill="#C8402A" stroke="none"></circle></g>';
      } else if (k === 0) g += '<g transform="' + t + '"><circle r="34" stroke-width="1.6" stroke-dasharray="3 6" fill="#F5F2EC"></circle><circle r="5" fill="#0A0A0A" stroke="none" opacity="0.35"></circle></g>';
      else if (k === 1) g += '<g transform="' + t + '"><circle r="38" stroke-width="2" fill="#F5F2EC"></circle><circle r="9" fill="#0A0A0A" stroke="none"></circle></g>';
      else if (k === 2) g += '<g transform="' + t + '"><circle r="40" stroke-width="2.2" fill="#F5F2EC"></circle><circle r="26" stroke-width="1.4"></circle><circle r="9" fill="#0A0A0A" stroke="none"></circle></g>';
      else g += '<g transform="' + t + '"><circle r="44" stroke-width="2.6" fill="#F5F2EC"></circle><circle r="31" stroke-width="1.8"></circle><circle r="20" stroke-width="1.2"></circle><circle r="9" fill="#0A0A0A" stroke="none"></circle></g>';
    }
    var txt = '';
    for (var j = 0; j < 4; j++) {
      var on = j === idx ? ' fill="#0A0A0A"' : '';
      txt += '<text x="' + x[j] + '" y="170"' + on + '>' + STAGES[j].toUpperCase() + '</text><text x="' + x[j] + '" y="190" font-weight="400" letter-spacing="0"' + on + '>' + RANGES[j] + (j === idx ? ' · you' : '') + '</text>';
    }
    var label = 'Stage scale: ' + STAGES.map(function (s, j) { return s + (j === idx ? ' (your stage)' : ''); }).join(', ');
    return '<svg viewBox="0 0 560 220" role="img" aria-label="' + label + '"><g fill="none" stroke="#0A0A0A" stroke-linecap="round"><path d="M70 90 H 490" stroke-width="1" stroke-dasharray="3 6" opacity="0.6"></path>' + g + '</g><g font-family="DM Sans, sans-serif" font-size="13" letter-spacing="1.3" font-weight="600" text-anchor="middle" fill="#4A463F">' + txt + '</g></svg>';
  }

  function stageBar(idx) {
    return '<div class="stage-bar" aria-hidden="true">' + STAGES.map(function (s, j) {
      return '<div' + (j === idx ? ' class="on"' : '') + '><div></div><p>' + s.replace('AI-', '').toUpperCase() + (j === idx ? ' · YOU' : '') + '</p></div>';
    }).join('') + '</div>';
  }

  function walkthroughUrl(topic) {
    var q = new URLSearchParams({ topic: topic, ref: S.ref, from: ORG ? 'organisation report' : 'fluency report' });
    // Personal details travel in sessionStorage (same tab), never in the URL.
    var d = S.details;
    if (d) { try { sessionStorage.setItem('plw-prefill', JSON.stringify({ ref: S.ref, name: d.name, email: d.email, company: d.company, role: d.role })); } catch (e) {} }
    return HOME + '?' + q.toString() + '#contact';
  }

  function renderReport() {
    var r = score();
    var d = S.details;
    var meaning = A.stageMeaning[r.stage];
    var lowKeys = r.lowest.slice(0, ORG ? 2 : 1).map(function (x) { return x.key; });
    var date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    var dimRows = r.dims.map(function (x) {
      var def = dimByKey[x.key];
      var low = lowKeys.indexOf(x.key) > -1;
      var name = esc(x.name) + (def.sub ? ' <span class="sub">· ' + esc(def.sub) + '</span>' : '');
      var pct = x.pct == null ? '<span class="na">Not enough answers</span>' : x.pct + '%';
      return '<div class="dim' + (low ? ' low' : '') + '"><span class="name">' + name + '</span><div class="track"><div class="fill" style="width:' + (x.pct || 0) + '%"></div></div><span class="pct">' + pct + '</span></div>';
    }).join('');

    var html = '<div class="wrap print-only"><div class="print-head" style="display:none"><img src="' + SITE.logo + '" alt="' + esc(SITE.homeName) + '"><span>' + (ORG ? 'AI maturity report' : 'AI fluency report') + (d ? ' · ' + esc(ORG ? d.company : d.name) : '') + ' · ' + date + ' · Ref ' + esc(S.ref) + '</span></div></div>';

    if (ORG) {
      html +=
        '<section class="wrap r-hero"><div class="copy">' +
          '<p class="eyebrow">Your AI maturity report' + (d ? ' · ' + esc(d.company) : '') + '</p>' +
          '<p class="based">Based on your answers</p>' +
          '<h1>Your organisation looks <span class="it">' + r.stage + '.</span></h1>' +
          '<p class="meaning">' + esc(meaning) + '</p>' +
          '<p class="line no-print"><a href="#" data-act="invite" style="font-weight:500">Invite colleagues to <span class="hide-sm">take it and </span>compare views →</a><span class="copied" id="copied" role="status"></span></p>' +
          '<p class="score"><b>' + r.overall + '</b><span>/ 100 overall score</span></p>' +
          stageBar(r.stageIdx) +
        '</div><div class="stage-svg">' + stageSvg(r.stageIdx) + '</div></section>' +
        '<section class="wrap r-sec"><div class="h"><h2>Your score in each area</h2></div>' + dimRows + '</section>' +
        '<section class="wrap r-sec"><div class="h"><h2>Where to go next</h2></div><div class="next">' +
          r.lowest.slice(0, 2).map(function (x) {
            var def = dimByKey[x.key];
            return '<div><p class="eyebrow">' + esc(def.name) + ' · ' + x.pct + '%</p><p class="step">' + esc(def.next) + '</p><p class="help">' + esc(SITE.helpLabel) + ' <a href="' + walkthroughUrl(def.topic) + '">' + esc(SITE.serviceName ? SITE.serviceName(def) : def.service) + ' →</a></p></div>';
          }).join('') +
        '</div>' +
        (r.notSure >= 3 ? '<p class="unsure-note">You weren\'t sure about ' + r.notSure + ' answers. That may mean AI activity, ownership or decisions aren\'t yet visible across the organisation.</p>' : '') +
        '</section>' +
        '<section class="r-cta"><div class="wrap row"><h2>' + (r.stageIdx < 3 ? 'Ready to become <span class="it">' + STAGES[r.stageIdx + 1] + '?</span>' : 'Stay <span class="it">AI-native.</span>') + '</h2>' +
          '<a class="btn cream no-print" href="' + walkthroughUrl('readiness') + '">' + esc(SITE.ctaLabel) + ' <span aria-hidden="true">→</span></a>' +
          '<p class="print-only print-foot" style="display:none;margin:0">' + esc(SITE.printFoot) + '</p>' +
        '</div></section>';
    } else {
      var u = usage();
      var low = r.lowest[0];
      var lowDef = low ? dimByKey[low.key] : null;
      var usageLine = u.freq ? 'How you use AI: ' + u.freq + (u.mode ? ', ' + u.mode : '') + '.' : '';
      var share = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(location.origin + location.pathname);
      var bridge = new URLSearchParams();
      if (d && d.sector) bridge.set('sector', d.sector);
      if (d && d.size) bridge.set('size', d.size);
      if (d && d.role) bridge.set('role', d.role);
      var bq = bridge.toString();
      html +=
        '<section class="wrap r-hero"><div class="copy">' +
          '<p class="eyebrow">Your AI fluency report' + (d ? ' · ' + esc(d.name) : '') + '</p>' +
          '<h1>You\'re <span class="it">' + r.stage + '.</span></h1>' +
          '<p class="meaning">' + esc(meaning) + '</p>' +
          '<p class="score"><b>' + r.overall + '</b><span>/ 100 overall score</span></p>' +
          (usageLine ? '<p class="line m">' + esc(usageLine) + '</p>' : '') +
          '<p class="line no-print"><a href="' + share + '" target="_blank" rel="noopener" style="font-weight:500">Share your stage on LinkedIn →</a></p>' +
          stageBar(r.stageIdx) +
        '</div><div class="stage-svg">' + stageSvg(r.stageIdx) + '</div></section>' +
        '<section class="wrap r-sec"><div class="h"><h2>Your score on each of the 4Ds</h2></div>' + dimRows + '</section>' +
        (lowDef ? '<section class="wrap r-sec"><div class="h" style="display:block"><h2>Three things to try this week</h2><p>To strengthen ' + esc(lowDef.name) + ' · ' + low.pct + '%</p></div><ol class="practices">' +
          lowDef.practices.map(function (p, k) { return '<li><span>' + (k + 1) + '</span><p>' + esc(p) + '</p></li>'; }).join('') + '</ol></section>' : '') +
        '<section class="r-cta"><div class="wrap row top-pad"><h2>Keep building your <span class="it">AI skills.</span></h2>' +
          '<a class="btn cream no-print" href="' + walkthroughUrl('capability') + '">Ask about AI training <span aria-hidden="true">→</span></a></div>' +
          '<div class="wrap bridge"><p>Is your organisation ready too? <a href="../organisation/' + (bq ? '?' + bq : '') + '">Take the AI maturity assessment →</a></p>' +
          '<p class="credit">Draws on the AI Fluency Framework published by Anthropic. Not affiliated with or endorsed by Anthropic.</p></div></section>';
    }
    screens.report.innerHTML = html;
  }

  // ---------- details ----------
  var ROLES = ['Founder / CEO / MD', 'Executive / C-suite', 'Director / Head of', 'Manager / team lead', 'Individual contributor', 'Other'];
  var SECTORS = ['Financial services', 'Technology', 'Education', 'Health', 'Government & public sector', 'Retail & consumer', 'Manufacturing', 'Energy & utilities', 'Media & creative', 'Professional services', 'Non-profit', 'Other'];
  var SIZES = ['1–10', '11–50', '51–200', '201–1,000', '1,001–5,000', 'More than 5,000'];
  var urlQ = new URLSearchParams(location.search);

  function sel(name, label, list, required, full) {
    var pre = S.details && S.details[name] || urlQ.get(name) || '';
    return '<label class="fld' + (full ? ' full' : '') + '">' + label + (required ? '' : '<span class="opt-tag">Optional</span>') +
      '<select name="' + name + '"' + (required ? ' required' : '') + '><option value=""' + (pre ? '' : ' selected') + (required ? ' disabled' : '') + '>Choose one</option>' +
      list.map(function (o) { return '<option' + (o === pre ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select></label>';
  }
  function txt(name, label, type, ph, required, ac) {
    var pre = S.details && S.details[name] || '';
    return '<label class="fld">' + label + (required ? '' : '<span class="opt-tag">Optional</span>') + '<input type="' + type + '" name="' + name + '" placeholder="' + esc(ph) + '" autocomplete="' + ac + '" value="' + esc(pre) + '"' + (required ? ' required' : '') + '></label>';
  }

  function renderDetails() {
    var preSize = S.details && S.details.size || urlQ.get('size') || '';
    var sizes = SIZES.map(function (s) { return '<label class="chip"><input type="radio" name="size" value="' + s + '"' + (s === preSize ? ' checked' : '') + '>' + s + '</label>'; }).join('');
    var fields = ORG
      ? txt('name', 'Your name', 'text', 'What should we call you?', true, 'name') +
        txt('email', 'Work email', 'email', 'name@company.com', true, 'email') +
        txt('company', 'Company / organisation', 'text', 'Where do you work?', true, 'organization') +
        sel('role', 'Your role', ROLES, true) +
        sel('sector', 'Sector', SECTORS, true, true)
      : txt('name', 'Your name', 'text', 'What should we call you?', true, 'name') +
        txt('email', 'Email', 'email', 'name@example.com', true, 'email') +
        sel('role', 'Your role', ROLES, true) +
        txt('company', 'Company / organisation', 'text', 'Where do you work?', false, 'organization') +
        sel('sector', 'Sector', SECTORS, false, true);
    var consent = ORG ? SITE.consentOrg : SITE.consentInd;
    screens.details.innerHTML =
      '<div class="wrap details"><div class="side">' +
        '<svg viewBox="0 0 120 120" aria-hidden="true"><g fill="none" stroke="#0A0A0A"><circle cx="60" cy="60" r="44" stroke-width="3"></circle><circle cx="60" cy="60" r="32" stroke-width="2"></circle><circle cx="60" cy="60" r="21" stroke-width="1.5"></circle><circle cx="60" cy="60" r="10" fill="#C8402A" stroke="none"></circle></g></svg>' +
        '<h1 tabindex="-1" id="dtitle">Download your report.</h1><p>Add your details and we\'ll prepare your full report as a PDF.</p></div>' +
        '<form id="dform" novalidate>' +
          '<div class="grid2">' + fields + '</div>' +
          '<fieldset class="sizes"><legend class="legend">Company size' + (ORG ? '' : '<span class="opt-tag">Optional</span>') + '</legend><div class="chips">' + sizes + '</div></fieldset>' +
          '<div class="hp" aria-hidden="true"><label>Leave this empty<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>' +
          '<label class="consent"><input type="checkbox" name="consent"' + (S.details && S.details.consent ? ' checked' : '') + '>' + consent + '</label>' +
          '<p class="consent-note">Optional. You\'ll get your report either way. <a href="' + SITE.privacy + '">Privacy notice</a></p>' +
          '<p class="form-error" id="derr" role="alert" hidden></p>' +
          '<div><button type="submit" class="btn" id="dsubmit">Download PDF <span aria-hidden="true">↓</span></button></div>' +
        '</form></div>';
    $('#dtitle').focus({ preventScroll: true });
  }

  document.addEventListener('submit', function (e) {
    if (e.target.id !== 'dform') return;
    e.preventDefault();
    var f = e.target, v = function (n) { return String((f.elements[n] && f.elements[n].value) || '').trim(); };
    var size = (f.querySelector('input[name=size]:checked') || {}).value || '';
    var miss = [];
    var okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('email'));
    function mark(n, bad) { if (f.elements[n] && f.elements[n].setAttribute) f.elements[n].setAttribute('aria-invalid', bad ? 'true' : 'false'); }
    mark('name', !v('name')); if (!v('name')) miss.push('your name');
    mark('email', !okEmail); if (!okEmail) miss.push(ORG ? 'a valid work email' : 'a valid email');
    if (ORG) { mark('company', !v('company')); if (!v('company')) miss.push('your company or organisation'); }
    mark('role', !v('role')); if (!v('role')) miss.push('your role');
    if (ORG) { mark('sector', !v('sector')); if (!v('sector')) miss.push('your sector'); if (!size) miss.push('your company size'); }
    var err = $('#derr');
    if (miss.length) {
      err.textContent = 'Please add ' + (miss.length > 1 ? miss.slice(0, -1).join(', ') + ' and ' + miss[miss.length - 1] : miss[0]) + '.';
      err.hidden = false;
      var bad = f.querySelector('[aria-invalid="true"]'); if (bad) bad.focus();
      return;
    }
    err.hidden = true;
    S.details = { name: v('name'), email: v('email'), company: v('company'), role: v('role'), sector: v('sector'), size: size, consent: f.elements.consent.checked };
    store(S);
    var r = score();
    var p = payloadBase(r);
    Object.assign(p, S.details, { type: ORG ? 'org_lead' : 'ind_lead', website: v('website') });
    var btn = $('#dsubmit'); btn.disabled = true; btn.firstChild.nodeValue = 'Preparing your report… ';
    var done = false;
    function go() {
      if (done) return; done = true;
      renderReport(); show('report');
      setTimeout(function () { window.print(); }, 350);
    }
    window.plwPost(p, { startedAt: S.startedAt, keepalive: true }).then(go, go);
    setTimeout(go, 4000); // never hold the report hostage to the network
  });

  // ---------- actions ----------
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-act]');
    if (!t) return;
    var act = t.getAttribute('data-act');
    if (act !== 'pdf') e.preventDefault();
    if (act === 'start') { start(); }
    else if (act === 'prev') { if (S.i > 0) { S.i--; renderQ(); show('q'); } }
    else if (act === 'to-intro') { show('intro'); }
    else if (act === 'to-report') { renderReport(); show('report'); }
    else if (act === 'pdf') {
      e.preventDefault();
      if (S.details) window.print(); else { renderDetails(); show('details'); }
    }
    else if (act === 'invite') {
      var link = location.origin + location.pathname;
      var note = $('#copied');
      var msg = function (m) { if (note) note.textContent = m; };
      if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
        navigator.share({ title: 'AI Maturity Assessment', text: 'Take this 7-minute AI maturity assessment so we can compare views.', url: link }).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(link).then(function () { msg('Link copied. Send it to your colleagues.'); }, function () { msg(link); });
      } else msg(link);
    }
  });

  function start() {
    var keepDetails = S && S.details;
    S = fresh();
    if (keepDetails) S.details = keepDetails;
    renderQ(); show('q');
  }

  window.addEventListener('popstate', function (e) {
    var st = e.state;
    if (!st || !S) { show('intro', false); return; }
    if (st.screen === 'q') { S.i = Math.min(st.i || 0, A.questions.length - 1); renderQ(); }
    if (st.screen === 'report') renderReport();
    if (st.screen === 'details') renderDetails();
    show(st.screen, false);
  });

  // ---------- boot ----------
  if (!S) S = fresh();
  if (S.screen === 'q') { renderQ(); show('q', false); }
  else if (S.screen === 'report' || S.screen === 'details') { renderReport(); show('report', false); }
  else show('intro', false);
  try { history.replaceState({ screen: S.screen, i: S.i }, ''); } catch (e) {}

  // Resume link on intro if an assessment is in progress
  var resume = $('#resume');
  if (resume && S.answers.some(function (a) { return a != null; })) {
    resume.hidden = false;
    resume.querySelector('a').addEventListener('click', function (e) {
      e.preventDefault();
      if (S.answers.every(function (a) { return a != null; })) { renderReport(); show('report'); }
      else { S.i = S.answers.indexOf(null); renderQ(); show('q'); }
    });
  }
})();
