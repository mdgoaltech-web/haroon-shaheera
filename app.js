/* Wedding invitation — renders everything from config.js (window.WEDDING). */
(function () {
  'use strict';
  var W = window.WEDDING;
  if (!W) return;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var pad = function (n) { return String(n).padStart(2, '0'); };

  var ICONS = {
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    pin: '<path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    chat: '<path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4.1A8 8 0 1 1 20 11.5z"/>',
    share: '<path d="M12 15V4M8 8l4-4 4 4M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    chevron: '<path d="M6 9l6 6 6-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    prev: '<path d="M15 6l-6 6 6 6"/>',
    next: '<path d="M9 6l6 6-6 6"/>'
  };
  function icon(name, cls) {
    return '<svg' + (cls ? ' class="' + cls + '"' : '') + ' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[name] + '</svg>';
  }

  // ---------- facts derived from the config ----------
  function dateParts(iso) {
    var a = String(iso).split('-').map(Number);
    return { y: a[0], m: a[1], d: a[2], weekday: DAYS[new Date(Date.UTC(a[0], a[1] - 1, a[2])).getUTCDay()] };
  }
  function ordinal(d) {
    if (d % 100 >= 11 && d % 100 <= 13) return 'th';
    return ['th', 'st', 'nd', 'rd'][d % 10] || 'th';
  }
  function parseTime(s) {
    var m = /(\d{1,2})[:.](\d{2})\s*([ap])\.?\s*m/i.exec(s || '');
    if (!m) return null;
    var h = Number(m[1]) % 12;
    if (m[3].toLowerCase() === 'p') h += 12;
    return { h: h, min: Number(m[2]) };
  }
  function eventInfo(ev) {
    var p = dateParts(ev.date);
    var dayMatches = !ev.day || ev.day.trim().toLowerCase() === p.weekday.toLowerCase();
    var start = parseTime(ev.programme && ev.programme[0] && ev.programme[0].time);
    return {
      p: p, dayMatches: dayMatches, start: start,
      printedDate: pad(p.d) + ordinal(p.d) + ' ' + MONTHS[p.m - 1] + ' ' + p.y,
      calendarOk: (dayMatches || ev.dateConfirmed === true) && !!start
    };
  }
  var coupleLine = [W.couple.groom, W.couple.joiner, W.couple.bride].join(' ');
  function venueLine(v) { return [v.name, v.address].filter(Boolean).join(', '); }
  function mapsUrl(v) {
    if (!v || v.pinVerified !== true) return null;
    if (v.mapsUrl) return v.mapsUrl;
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(v.mapsQuery || venueLine(v));
  }

  // ---------- calendar ----------
  function icsText(s) { return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); }
  function fold(line) { return (line.match(/[\s\S]{1,60}/g) || ['']).join('\r\n '); }
  function eventText(ev) {
    var v = W.venues[ev.venue] || {};
    return {
      title: ev.name + ' · ' + coupleLine,
      location: venueLine(v),
      details: (ev.programme || []).map(function (x) { return x.label + ' ' + x.time; }).join('\n')
    };
  }
  function localStamp(ev) {
    var i = eventInfo(ev);
    return '' + i.p.y + pad(i.p.m) + pad(i.p.d) + 'T' + pad(i.start.h) + pad(i.start.min) + '00';
  }
  function buildIcs(ev) {
    var t = eventText(ev), tz = W.timezone || 'Asia/Karachi', off = W.utcOffset || '+0500';
    var now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    return [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Wedding Invitation//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'BEGIN:VTIMEZONE', 'TZID:' + tz, 'BEGIN:STANDARD', 'DTSTART:19700101T000000',
      'TZOFFSETFROM:' + off, 'TZOFFSETTO:' + off, 'TZNAME:PKT', 'END:STANDARD', 'END:VTIMEZONE',
      'BEGIN:VEVENT', 'UID:' + ev.id + '-' + ev.date + '@wedding-invitation', 'DTSTAMP:' + now,
      'DTSTART;TZID=' + tz + ':' + localStamp(ev), // start only: the card gives no end time
      'SUMMARY:' + icsText(t.title), 'LOCATION:' + icsText(t.location), 'DESCRIPTION:' + icsText(t.details),
      'END:VEVENT', 'END:VCALENDAR'
    ].map(fold).join('\r\n') + '\r\n';
  }
  function googleCalUrl(ev) {
    var t = eventText(ev), s = localStamp(ev);
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      '&text=' + encodeURIComponent(t.title) +
      '&dates=' + s + '/' + s +
      '&ctz=' + encodeURIComponent(W.timezone || 'Asia/Karachi') +
      '&location=' + encodeURIComponent(t.location) +
      '&details=' + encodeURIComponent(t.details);
  }
  function icsHref(ev) {
    var ics = buildIcs(ev);
    try { return URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' })); }
    catch (e) { return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics); }
  }

  // ---------- small UI helpers ----------
  var toastTimer;
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }
  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px';
    document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, text.length);
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
    return ok;
  }
  function copy(text, okMsg) {
    var done = function () { toast(okMsg); };
    var fail = function () { legacyCopy(text) ? done() : toast('Could not copy. Press and hold the text to copy it.'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fail);
    else fail();
  }
  function shareUrl() { return W.siteUrl || location.href.split('#')[0]; }
  function mapsButton(v) {
    var url = mapsUrl(v);
    return url
      ? '<a class="btn" href="' + esc(url) + '" target="_blank" rel="noopener">' + icon('pin') + 'Open in Maps</a>'
      : '<button class="btn is-off" type="button" disabled>' + icon('pin') + 'Map pin to be confirmed</button>';
  }
  function copyAddressButton(key) {
    return '<button class="btn" type="button" data-act="copy-address" data-venue="' + esc(key) + '">' + icon('copy') + 'Copy Address</button>';
  }
  function sectionHead(id, eyebrow, title) {
    return '<div class="section-head"><p class="eyebrow">' + esc(eyebrow) + '</p><h2 id="' + id + '">' + esc(title) +
      '</h2><img class="sprig" src="assets/sprig.svg" alt="" width="260" height="44" loading="lazy"></div>';
  }
  function coupleHtml() {
    return '<span>' + esc(W.couple.groom) + '</span><span class="joiner">' + esc(W.couple.joiner) + '</span><span>' + esc(W.couple.bride) + '</span>';
  }

  // ---------- render ----------
  function renderStatic() {
    $$('[data-fill="seal"]').forEach(function (el) { el.textContent = W.couple.seal || ''; });
    $$('[data-icon]').forEach(function (el) { el.innerHTML = icon(el.getAttribute('data-icon')); });
    $('#names').innerHTML = coupleHtml();
    $('#footerNames').textContent = coupleLine;
  }

  function renderReview() {
    if (!W.showReviewNotes) return;
    var notes = [];
    W.events.forEach(function (ev) {
      var i = eventInfo(ev);
      if (!i.dayMatches) {
        notes.push('<strong>' + esc(ev.name) + ':</strong> the card prints “' + esc(ev.day) + ' ' + esc(i.printedDate) + '”, but that date is a ' + i.p.weekday +
          '. ' + (i.calendarOk ? 'You have marked the date as confirmed.' : 'Add to Calendar is switched off for this event until you correct the day or date in config.js.'));
      } else if (!i.start) {
        notes.push('<strong>' + esc(ev.name) + ':</strong> the start time could not be read, so Add to Calendar is switched off.');
      }
    });
    Object.keys(W.venues).forEach(function (k) {
      var v = W.venues[k];
      if (v.pinVerified === true && !v.pinNote) return; // confirmed pin, nothing to review
      notes.push('<strong>' + esc(v.name) + ':</strong> ' + (v.pinVerified === true ? '' : 'map pin not verified, so Open in Maps is switched off. ') + esc(v.pinNote || ''));
    });
    if (!notes.length) return;
    $('#review').innerHTML = '<div class="wrap"><aside class="review" aria-label="Review notes"><h2>For your review</h2>' +
      '<p>Only you should see this box. Set <strong>showReviewNotes</strong> to <strong>false</strong> in config.js before sending the link to guests.</p>' +
      '<ul><li>' + notes.join('</li><li>') + '</li></ul></aside></div>';
  }

  function renderInvitation() {
    var inv = W.invitation, g = inv.greeting, h = '<div class="invite">';
    if (g && g.text) h += '<p class="bismillah" lang="' + esc(g.lang || 'ar') + '" dir="' + esc(g.dir || 'rtl') + '">' + esc(g.text) + '</p>';
    if (inv.hosts) h += '<p class="hosts">' + esc(inv.hosts) + '</p>';
    if (inv.wording) h += '<p class="wording">' + esc(inv.wording) + '</p>';
    h += '<h2 class="couple">' + coupleHtml() + '</h2>';
    if (inv.closing) h += '<p class="wording">' + esc(inv.closing) + '</p>';
    h += '<img class="sprig" src="assets/sprig.svg" alt="" width="260" height="44"></div>';
    $('#invitation').innerHTML = h;
  }

  function renderEvents() {
    var h = sectionHead('events-h', 'Save the dates', 'Wedding Events') + '<div class="event-list">';
    W.events.forEach(function (ev) {
      var i = eventInfo(ev), v = W.venues[ev.venue] || {}, first = ev.programme && ev.programme[0];
      var pid = 'panel-' + ev.id;
      h += '<article class="event" id="event-' + esc(ev.id) + '">' +
        '<button class="event-head" type="button" aria-expanded="false" aria-controls="' + pid + '">' +
          '<span class="event-date"><span class="d-day">' + esc(ev.day || i.p.weekday) + '</span>' +
          '<span class="d-num">' + pad(i.p.d) + '<sup>' + ordinal(i.p.d) + '</sup></span>' +
          '<span class="d-month">' + MONTHS[i.p.m - 1] + ' ' + i.p.y + '</span></span>' +
          '<span class="event-sum"><span class="ev-name">' + esc(ev.name) + '</span>' +
          '<span class="where">' + esc(venueLine(v)) + '</span>' +
          (first ? '<span class="when">' + esc(first.label) + ' ' + esc(first.time) + '</span>' : '') + '</span>' +
          icon('chevron', 'chev') +
        '</button>' +
        '<div class="event-panel" id="' + pid + '" role="region" aria-label="' + esc(ev.name) + ' details"><div><div class="event-body">';
      if (ev.intro) h += '<p class="event-intro">' + esc(ev.intro) + '</p>';
      h += '<dl class="programme">' + (ev.programme || []).map(function (x) {
        return '<div><dt>' + esc(x.label) + '</dt><span class="lead" aria-hidden="true"></span><dd>' + esc(x.time) + '</dd></div>';
      }).join('') + '</dl>';
      h += '<div class="place"><span class="label">Venue</span><span class="p-name">' + esc(v.name) + '</span><span class="p-addr">' + esc(v.address) + '</span></div>';
      h += '<div class="cal">';
      if (i.calendarOk) {
        var cid = 'cal-' + ev.id;
        h += '<button class="btn btn-primary" type="button" data-act="toggle-cal" aria-expanded="false" aria-controls="' + cid + '">' + icon('calendar') + 'Add to Calendar</button>' +
          '<div class="cal-options" id="' + cid + '" hidden>' +
          '<a class="btn" href="' + esc(icsHref(ev)) + '" download="' + esc(ev.id) + '.ics" data-act="ics">Apple / Outlook</a>' +
          '<a class="btn" href="' + esc(googleCalUrl(ev)) + '" target="_blank" rel="noopener">Google Calendar</a></div>';
      } else {
        h += '<button class="btn is-off" type="button" disabled>' + icon('calendar') + 'Calendar entry coming soon</button>' +
          '<p class="note">The date for this event is being confirmed. Please check back before saving it.</p>';
      }
      h += '</div><div class="actions">' + mapsButton(v) + copyAddressButton(ev.venue) + '</div>';
      h += '</div></div></div></article>';
    });
    $('#events').innerHTML = h + '</div>';
  }

  function renderLocation() {
    var h = sectionHead('location-h', 'Getting there', 'Location') + '<div class="venue-list">';
    Object.keys(W.venues).forEach(function (k) {
      var v = W.venues[k];
      var hosted = W.events.filter(function (e) { return e.venue === k; }).map(function (e) { return e.name; });
      if (!hosted.length) return;
      h += '<article class="venue"><div class="place"><span class="for">' + esc(hosted.join(' · ')) + '</span>' +
        '<span class="p-name">' + esc(v.name) + '</span><span class="p-addr">' + esc(v.address) + '</span></div>' +
        '<div class="actions">' + mapsButton(v) + copyAddressButton(k) + '</div>' +
        (v.pinVerified === true ? '' : '<p class="note">The map pin for this address is being confirmed. Please use the printed address for now.</p>') +
        '</article>';
    });
    $('#location').innerHTML = h + '</div>';
  }

  function waUrl(n) {
    var msg = ($('#rsvpMessage') || {}).value || W.rsvp.message || '';
    return 'https://wa.me/' + n.intl + '?text=' + encodeURIComponent(msg);
  }
  function renderRsvp() {
    var r = W.rsvp, sec = $('#rsvp');
    if (!r || !r.numbers || !r.numbers.length) {
      sec.hidden = true;
      $$('[data-if="rsvp"]').forEach(function (el) { el.hidden = true; });
      return;
    }
    var anyWa = r.numbers.some(function (n) { return n.whatsapp; });
    var h = sectionHead('rsvp-h', 'Kindly reply', r.heading || 'R.S.V.P.') + '<div class="rsvp-box">';
    r.numbers.forEach(function (n, idx) {
      h += '<div class="rsvp-number"><div class="num-row"><p class="num">' + esc(n.display) + '</p>' +
        '<button class="icon-btn" type="button" data-act="copy-number" data-number="' + esc(n.display) + '" aria-label="Copy ' + esc(n.display) + '">' + icon('copy') + '</button></div>' +
        '<div class="rsvp-actions">' +
        '<a class="btn btn-primary" href="tel:+' + esc(n.intl) + '" aria-label="Call ' + esc(n.display) + '">' + icon('phone') + 'Call</a>' +
        (n.whatsapp ? '<a class="btn" data-wa="' + idx + '" href="' + esc(waUrl(n)) + '" target="_blank" rel="noopener" aria-label="WhatsApp ' + esc(n.display) + '">' + icon('chat') + 'WhatsApp</a>' : '') +
        '</div></div>';
    });
    if (anyWa) {
      h += '<div class="field"><label class="label" for="rsvpMessage">Your WhatsApp message</label>' +
        '<textarea id="rsvpMessage" rows="6">' + esc(r.message || '') + '</textarea>' +
        '<p class="note">Edit the message, then tap WhatsApp next to a number above.</p></div>';
    }
    sec.innerHTML = h + '</div>';
    var ta = $('#rsvpMessage');
    if (ta) ta.addEventListener('input', function () {
      $$('[data-wa]').forEach(function (a) { a.href = waUrl(r.numbers[Number(a.getAttribute('data-wa'))]); });
    });
  }

  function renderCard() {
    var pages = W.cardPages || [], sec = $('#card');
    if (!pages.length) { sec.hidden = true; return; }
    var h = sectionHead('card-h', 'As printed', 'The Printed Card') + '<div class="pages">';
    pages.forEach(function (p, idx) {
      h += '<button class="page-thumb" type="button" data-page="' + idx + '" aria-label="View the ' + esc(p.caption) + ' page">' +
        '<img src="' + esc(p.src) + '" alt="Printed card: ' + esc(p.caption) + '" width="' + p.w + '" height="' + p.h + '" loading="lazy" decoding="async">' +
        '<span>' + esc(p.caption) + '</span></button>';
    });
    sec.innerHTML = h + '</div>';
  }

  // ---------- opening ----------
  var opening = $('#top'), stage = $('#stage'), openBtn = $('#openBtn'), main = $('#main'), nav = $('#quicknav');
  var state = 'sealed';

  function unseal() { main.hidden = false; nav.hidden = false; }
  function goTo(id, smooth) {
    var el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: smooth && !reduceMotion ? 'smooth' : 'instant', block: 'start' });
  }
  function showNames(instant) {
    if (instant) opening.classList.add('instant');
    opening.classList.add('is-open', 'names-in');
    openBtn.textContent = 'Read the Invitation';
    state = 'open';
  }
  function petals() {
    var colors = ['#EBBDB9', '#F3D3CF', '#C9B8E0', '#F7E1DC', '#D9CCEB'];
    var box = $('#fireflies'), h = stage.offsetHeight;
    for (var i = 0; i < 16; i++) {
      var p = document.createElement('span');
      p.className = 'petal';
      p.style.cssText = '--x:' + (8 + Math.random() * 84).toFixed(1) + '%;--c:' + colors[i % colors.length] +
        ';--d:' + (3.2 + Math.random() * 2.2).toFixed(2) + 's;--delay:' + (0.9 + Math.random() * 1.6).toFixed(2) +
        's;--dx:' + Math.round(Math.random() * 120 - 60) + 'px;--fall:' + Math.round(h * (0.7 + Math.random() * 0.3)) +
        'px;--rot:' + Math.round(Math.random() * 540 - 270) + 'deg';
      p.addEventListener('animationend', function (e) { e.target.remove(); });
      box.appendChild(p);
    }
  }
  function fireflies() {
    var box = $('#fireflies'), spots = [[20, 30], [78, 26], [50, 17], [14, 55], [86, 50], [30, 88], [70, 90], [50, 96], [24, 70], [80, 72], [38, 24], [64, 21]];
    spots.forEach(function (s, i) {
      var f = document.createElement('span');
      f.className = 'firefly';
      f.style.cssText = '--x:' + s[0] + '%;--y:' + s[1] + '%;--d:' + (5 + (i % 5) * 0.9) + 's;--delay:-' + (i * 0.7).toFixed(1) +
        's;--dx:' + (i % 2 ? 14 : -12) + 'px;--dy:' + (i % 3 ? -16 : 12) + 'px';
      box.appendChild(f);
    });
  }
  function openInvitation() {
    if (state === 'open') { goTo('invitation', true); return; }
    if (state === 'opening') return;
    unseal();
    if (reduceMotion) { showNames(true); return; }
    state = 'opening';
    opening.classList.add('is-open');
    petals();
    var moved = false;
    var mark = function () { moved = true; };
    ['wheel', 'touchmove', 'keydown'].forEach(function (ev) { window.addEventListener(ev, mark, { passive: true, once: true }); });
    setTimeout(function () { showNames(false); }, 1500);
    setTimeout(function () { if (!moved && window.scrollY < 40) goTo('invitation', true); }, 4600);
  }

  // ---------- printed card viewer ----------
  var lb = $('#lightbox'), lbImg = $('#lbImg'), lbScroll = $('#lbScroll'), lbIndex = 0, lbZoom = 1, lbReturn = null;
  var ZOOMS = [1, 1.75, 2.5, 3.5];
  function lbFit() {
    var p = W.cardPages[lbIndex], cw = lbScroll.clientWidth, ch = lbScroll.clientHeight;
    var fit = Math.min(cw, ch * (p.w / p.h));
    lbImg.style.setProperty('--fit', Math.max(120, Math.floor(fit)) + 'px');
    lbImg.style.setProperty('--z', lbZoom);
    lbScroll.classList.toggle('zoomed', lbZoom > 1);
    $('[data-lb="out"]').disabled = lbZoom <= ZOOMS[0];
    $('[data-lb="in"]').disabled = lbZoom >= ZOOMS[ZOOMS.length - 1];
  }
  function lbShow(i) {
    var n = W.cardPages.length;
    lbIndex = (i + n) % n; lbZoom = 1;
    var p = W.cardPages[lbIndex];
    lbImg.src = p.src; lbImg.alt = 'Printed card: ' + p.caption;
    $('#lbCaption').textContent = p.caption;
    $('#lbCount').textContent = (lbIndex + 1) + ' / ' + n;
    lbFit(); lbScroll.scrollTop = 0; lbScroll.scrollLeft = 0;
  }
  function lbOpen(i, from) {
    lbReturn = from || null;
    lb.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    lbShow(i);
    $('[data-lb="close"]').focus();
  }
  function lbClose() {
    lb.hidden = true;
    document.documentElement.style.overflow = '';
    if (lbReturn) lbReturn.focus();
  }
  function lbStep(dir) {
    var i = ZOOMS.indexOf(lbZoom) + dir;
    if (i < 0 || i >= ZOOMS.length) return;
    var fx = (lbScroll.scrollLeft + lbScroll.clientWidth / 2) / Math.max(1, lbScroll.scrollWidth);
    var fy = (lbScroll.scrollTop + lbScroll.clientHeight / 2) / Math.max(1, lbScroll.scrollHeight);
    lbZoom = ZOOMS[i]; lbFit();
    lbScroll.scrollLeft = fx * lbScroll.scrollWidth - lbScroll.clientWidth / 2;
    lbScroll.scrollTop = fy * lbScroll.scrollHeight - lbScroll.clientHeight / 2;
  }

  // ---------- events ----------
  function onClick(e) {
    var t = e.target.closest('[data-act],[data-page],[data-lb],.event-head');
    if (!t) return;
    if (t.classList.contains('event-head')) {
      var open = t.getAttribute('aria-expanded') !== 'true';
      t.setAttribute('aria-expanded', String(open));
      t.parentNode.classList.toggle('open', open);
      return;
    }
    if (t.hasAttribute('data-page')) { lbOpen(Number(t.getAttribute('data-page')), t); return; }
    var lbAct = t.getAttribute('data-lb');
    if (lbAct) {
      if (lbAct === 'close') lbClose();
      else if (lbAct === 'in') lbStep(1);
      else if (lbAct === 'out') lbStep(-1);
      else lbShow(lbIndex + (lbAct === 'next' ? 1 : -1));
      return;
    }
    var act = t.getAttribute('data-act');
    if (act === 'toggle-cal') {
      var box = document.getElementById(t.getAttribute('aria-controls'));
      var show = box.hidden;
      box.hidden = !show;
      t.setAttribute('aria-expanded', String(show));
    } else if (act === 'ics') {
      toast('Calendar file ready. Open it to save the event.');
    } else if (act === 'copy-address') {
      copy(venueLine(W.venues[t.getAttribute('data-venue')]), 'Address copied');
    } else if (act === 'copy-number') {
      copy(t.getAttribute('data-number'), 'Number copied');
    } else if (act === 'copy-link') {
      copy(shareUrl(), 'Link copied');
    } else if (act === 'share') {
      var data = { title: W.share.title, text: W.share.text, url: shareUrl() };
      if (navigator.share) {
        navigator.share(data).catch(function (err) { if (!err || err.name !== 'AbortError') copy(data.url, 'Link copied'); });
      } else copy(data.url, 'Link copied');
    }
  }

  function init() {
    renderStatic(); renderReview(); renderInvitation(); renderEvents(); renderLocation(); renderRsvp(); renderCard();
    fireflies();
    document.addEventListener('click', onClick);
    openBtn.addEventListener('click', openInvitation);
    $('#detailsLink').addEventListener('click', function (e) {
      e.preventDefault();
      unseal();
      if (state === 'sealed') showNames(true);
      setTimeout(function () { goTo('events', true); }, 60); // after the page has grown
    });
    lbImg.addEventListener('dblclick', function () { lbStep(lbZoom > 1 ? -ZOOMS.indexOf(lbZoom) : 1); });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') lbClose();
      else if (e.key === 'ArrowRight') lbShow(lbIndex + 1);
      else if (e.key === 'ArrowLeft') lbShow(lbIndex - 1);
      else if (e.key === 'Tab') { // keep focus inside the viewer
        var f = $$('button:not([disabled])', lb), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    window.addEventListener('resize', function () { if (!lb.hidden) lbFit(); });
    // A link straight to a section (e.g. …/#events) skips the envelope.
    var hash = (location.hash || '').slice(1);
    if (hash && hash !== 'top' && document.getElementById(hash)) {
      unseal(); showNames(true);
      var jump = function () { goTo(hash, false); };
      setTimeout(jump, 60);
      window.addEventListener('load', function () { setTimeout(jump, 0); });
    }
  }
  init();
})();
