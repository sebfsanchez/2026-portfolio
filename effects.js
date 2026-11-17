/*
 * effects.js — typing text and the live clock block.
 *
 * Typing: add data-typewriter to any element. Its text types itself out
 * when the page opens. Optional data-cps="60" sets characters per second,
 * data-delay="300" waits that many ms before starting.
 * Layout never jumps: untyped characters are already in place, just invisible.
 *
 * Live block: <div data-live> with children marked data-live-day,
 * data-live-time and a <ul data-live-lines> of lines to type, one by one, on loop.
 */
(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Typewriter ---------- */
  function typewriter(el) {
    const cps = parseFloat(el.dataset.cps) || 60;
    const delay = parseFloat(el.dataset.delay) || 0;

    // Split every text node into a visible part and a hidden (not yet typed) part
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT)
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    const parts = nodes.map((node) => {
      const text = node.nodeValue.replace(/\s+/g, ' ');
      const typed = document.createElement('span');
      const rest = document.createElement('span');
      rest.className = 'tw-rest';
      rest.textContent = text;
      const frag = document.createDocumentFragment();
      frag.append(typed, rest);
      node.parentNode.replaceChild(frag, node);
      return { typed, rest, text };
    });

    const caret = document.createElement('span');
    caret.className = 'tw-caret';
    caret.setAttribute('aria-hidden', 'true');

    const total = parts.reduce((n, p) => n + p.text.length, 0);
    let shown = 0;
    let start = null;

    function render(count) {
      let left = count;
      for (const p of parts) {
        const n = Math.max(0, Math.min(p.text.length, left));
        p.typed.textContent = p.text.slice(0, n);
        p.rest.textContent = p.text.slice(n);
        if (n < p.text.length && !caret.isConnected) p.rest.before(caret);
        left -= p.text.length;
      }
    }

    let timer = null;
    function step() {
      const t = performance.now();
      if (start === null) start = t;
      const target = Math.min(total, Math.floor(((t - start) / 1000) * cps));
      if (target !== shown) {
        shown = target;
        caret.remove();
        render(shown);
      }
      if (shown >= total) {
        clearInterval(timer);
        caret.remove();
      }
    }

    el.classList.add('is-typing');
    render(0);
    setTimeout(() => { timer = setInterval(step, 30); }, delay);
  }

  /* ---------- Live block ---------- */
  function liveBlock(el) {
    const dayEl = el.querySelector('[data-live-day]');
    const timeEl = el.querySelector('[data-live-time]');
    const list = el.querySelector('[data-live-lines]');
    const lines = list ? [...list.children].map((li) => li.textContent.trim()) : [];
    const tz = el.dataset.timezone || 'America/New_York';

    const dayFmt = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: tz });
    const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: tz });
    const timeFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: tz });

    function tick() {
      const now = new Date();
      if (dayEl) dayEl.textContent = 'Today is ' + dayFmt.format(now);
      if (timeEl) timeEl.textContent = dateFmt.format(now) + ' ' + timeFmt.format(now);
    }
    tick();
    setInterval(tick, 1000);

    const form = el.querySelector('[data-live-prompt]');

    // Each line gets its own list of phrases: one <ul data-live-source> per line
    // (top line = first list, bottom line = second). Without those lists, the
    // phrases in data-live-lines alternate between the two lines.
    const sources = Array.from(el.querySelectorAll('[data-live-source]'));
    let rows;
    if (sources.length) {
      rows = sources
        .map((s) => Array.from(s.children).map((li) => li.textContent.trim()).filter(Boolean))
        .filter((r) => r.length);
      sources.forEach((s) => s.remove());
    } else {
      rows = [lines.filter((_, i) => i % 2 === 0), lines.filter((_, i) => i % 2 === 1)]
        .filter((r) => r.length);
    }

    if (!list || !rows.length) { if (form) setupPrompt(el, form); return; }
    list.innerHTML = '';

    if (reduceMotion) {
      rows.forEach((r) => { const li = document.createElement('li'); li.textContent = r[Math.floor(Math.random() * r.length)]; list.appendChild(li); });
      if (form) setupPrompt(el, form);
      return;
    }

    // Random order without repeats: shuffle the list, use every phrase once,
    // then reshuffle (never starting the new round with the phrase just shown)
    function shuffled(arr, avoidFirst) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      if (a.length > 1 && a[0] === avoidFirst) [a[0], a[1]] = [a[1], a[0]];
      return a;
    }

    // Two lines typing at once. Each types a random phrase from its list, holds,
    // deletes it quickly, then types another. Forever.
    let promptShown = false;

    rows.forEach((phrases, r) => {
      // The text and its cursor sit in one block beside the ">", so a phrase
      // that wraps lines up under its own first word
      const li = document.createElement('li');
      const block = document.createElement('span');
      block.className = 'live-line-text';
      const span = document.createElement('span');
      block.append(span, makeCaret());
      li.appendChild(block);
      list.appendChild(li);

      (async function run() {
        await wait(r * 1300); // the bottom line starts a little later
        let lastShown = null;
        for (;;) {
          const round = shuffled(phrases, lastShown);
          lastShown = round[round.length - 1];
          for (const phrase of round) {
            await typeInto(span, phrase);
            // The visitor prompt appears once the first phrase has typed out
            if (!promptShown && form) { promptShown = true; setupPrompt(el, form); }
            await wait(2600);
            await deleteFrom(span);
            await wait(300);
          }
        }
      })();
    });
  }

  async function deleteFrom(span) {
    const text = span.textContent;
    for (let i = text.length - 1; i >= 0; i--) {
      span.textContent = text.slice(0, i);
      await wait(8 + Math.random() * 8);
    }
  }

  /* ---------- Visitor prompt: type, press Enter, get a typed reply ---------- */
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  function makeCaret() {
    const c = document.createElement('span');
    c.className = 'tw-caret';
    c.setAttribute('aria-hidden', 'true');
    return c;
  }

  async function typeInto(span, text) {
    if (reduceMotion) { span.textContent = text; return; }
    for (let i = 1; i <= text.length; i++) {
      span.textContent = text.slice(0, i);
      await wait(45 + Math.random() * 60);
    }
  }

  // Sends the message to the URL in the section's data-endpoint (e.g. Formspree).
  // With no endpoint set, nothing is sent: the visitor still sees the reply.
  async function sendMessage(endpoint, message) {
    if (!endpoint) {
      console.info('[live prompt] No data-endpoint set, so this message was not sent:', message);
      return true;
    }
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ message, page: location.pathname })
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  function setupPrompt(section, form) {
    const input = form.querySelector('.live-prompt-input');
    const text = form.querySelector('.live-prompt-text');
    const hint = form.querySelector('.live-prompt-hint');
    const reply = document.createElement('p');
    reply.className = 'live-reply';
    reply.setAttribute('role', 'status');
    form.after(reply);
    form.hidden = false;

    const sync = () => {
      text.textContent = input.value;
      if (hint) hint.hidden = input.value.length > 0;
    };
    input.addEventListener('input', sync);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const message = input.value.trim();
      if (!message || form.classList.contains('is-sending')) return;

      form.classList.add('is-sending');
      input.disabled = true;
      const ok = await sendMessage(section.dataset.endpoint, message);

      const line = document.createElement('span');
      const caret = makeCaret();
      reply.replaceChildren('> ', line, caret);
      await typeInto(line, ok ? 'message received. thank you :)' : "that didn't send. try again?");
      caret.remove();
      await wait(3500);

      // Back to an empty prompt, ready for the next message
      reply.replaceChildren();
      if (ok) input.value = '';
      input.disabled = false;
      form.classList.remove('is-sending');
      sync();
    });
  }

  /* ---------- Clock line: "Today is Monday, November 16, 2026 19:40:12" ---------- */
  function liveClock(el) {
    const tz = el.dataset.timezone || 'America/New_York';
    const dayFmt = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: tz });
    const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: tz });
    const timeFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: tz });
    const tick = () => {
      const now = new Date();
      el.textContent = 'Today is ' + dayFmt.format(now) + ', ' + dateFmt.format(now) + ' ' + timeFmt.format(now);
    };
    tick();
    setInterval(tick, 1000);
  }

  function init() {
    document.querySelectorAll('[data-live-clock]').forEach(liveClock);
    document.querySelectorAll('[data-live]').forEach(liveBlock);
    if (reduceMotion) return;
    document.querySelectorAll('[data-typewriter]').forEach(typewriter);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
