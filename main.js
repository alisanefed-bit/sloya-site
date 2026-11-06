/* SLOYA — интерактив */

// ---- настройки ----
const CONFIG = {
  behance: 'https://www.behance.net/alisanefed39a7',
  whatsapp: '79067848165',               // номер WhatsApp в формате 79991234567
  cases: [
    // url — ссылка на кейс на Behance (пока ведёт на профиль)
    { img: 'assets/img/case-boho.jpg',    tag: 'Айдентика', title: 'Branding for a Boho-Style Coffee House', url: '' },
    { img: 'assets/img/case-porfiry.jpg', tag: 'Брендинг',  title: 'Porfiry. Identity for a Cybersecurity AI Assistant', url: '' },
    { img: 'assets/img/case-squash.jpg',  tag: 'Редизайн',  title: 'Central Squash. Identity Redesign', url: '' },
  ],
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ссылки
$$('[data-behance]').forEach(a => (a.href = CONFIG.behance));
if (CONFIG.whatsapp) $$('[data-whatsapp]').forEach(a => { a.href = `https://wa.me/${CONFIG.whatsapp}`; a.target = '_blank'; a.rel = 'noopener'; });
$$('[data-year]').forEach(el => (el.textContent = new Date().getFullYear()));

// ---- масштаб композиции под ширину экрана ----
const hero = $('.hero');
const svcMap = $('.svc-map');
function fit() {
  hero.style.setProperty('--k', Math.min(1, innerWidth / 1440));
  const w = svcMap.parentElement.clientWidth - parseFloat(getComputedStyle(svcMap.parentElement).paddingLeft) * 2;
  svcMap.style.setProperty('--ks', Math.min(1, w / 1240));
}
fit();
addEventListener('resize', fit);

// ---- шапка ----
const header = $('.header');
const burger = $('.burger');
const nav = $('.nav');
let lastY = scrollY;
addEventListener('scroll', () => {
  const y = scrollY;
  header.classList.toggle('is-scrolled', y > 20);
  header.classList.toggle('is-hidden', y > 600 && y > lastY && !nav.classList.contains('is-open'));
  lastY = y;
}, { passive: true });
burger.addEventListener('click', () => {
  const open = burger.getAttribute('aria-expanded') !== 'true';
  burger.setAttribute('aria-expanded', open);
  nav.classList.toggle('is-open', open);
});
nav.addEventListener('click', e => {
  if (e.target.closest('a')) { burger.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open'); }
});

// ---- первый экран: параллакс сетки и букв ----
const grid = $('.hero__grid-lines');
const sloy = $('.hero__sloy');
let mx = 0, my = 0, cx = 0, cy = 0;
if (!reduceMotion) {
  hero.addEventListener('pointermove', e => {
    const r = hero.getBoundingClientRect();
    mx = (e.clientX - r.left) / r.width - 0.5;
    my = (e.clientY - r.top) / r.height - 0.5;
  });
  hero.addEventListener('pointerleave', () => { mx = my = 0; });
  (function tick() {
    cx += (mx - cx) * 0.06;
    cy += (my - cy) * 0.06;
    const s = Math.min(scrollY, 900);
    grid.style.transform = `translate3d(${cx * 46}px, ${cy * 46 + s * 0.12}px, 0)`;
    sloy.style.transform = `translate3d(${cx * -18}px, ${cy * -14 - s * 0.08}px, 0) rotate(-5.825deg)`;
    requestAnimationFrame(tick);
  })();
}

// ---- бегущая строка: дублируем набор логотипов ----
const track = $('.marquee__track');
track.append($('.marquee__set', track).cloneNode(true));
$$('.marquee__set', track)[1].setAttribute('aria-hidden', 'true');

// ---- услуги ↔ форма ----
const chipFor = name => $(`.chips input[value="${name}"]`);
const svcs = $$('.svc');
const noHover = matchMedia('(hover: none), (max-width: 900px)');
const showWork = btn => svcs.forEach(b => b.classList.toggle('is-on', b === btn));
svcs.forEach(btn => {
  btn.addEventListener('click', () => {
    const chip = chipFor(btn.dataset.service);
    if (!chip) return;
    chip.checked = !chip.checked;
    btn.classList.toggle('is-picked', chip.checked);
    if (noHover.matches) showWork(btn);
  });
});
// без наведения (телефон, планшет) кружок раскрывается у услуги, которая сейчас в середине экрана
const centerIO = new IntersectionObserver(entries => {
  if (!noHover.matches) return;
  const hit = entries.filter(e => e.isIntersecting).pop();
  if (hit) showWork(hit.target);
}, { rootMargin: '-45% 0px -45% 0px' });
svcs.forEach(b => centerIO.observe(b));
noHover.addEventListener('change', () => { if (!noHover.matches) showWork(null); });
$$('.chips input').forEach(chip => chip.addEventListener('change', () => {
  const btn = $(`.svc[data-service="${chip.value}"]`);
  if (btn) btn.classList.toggle('is-picked', chip.checked);
}));

// ---- кейсы: карусель по дуге ----
(function arcCarousel() {
  const root = $('.arc');
  const stage = $('.arc__stage', root);
  const dotsBox = $('.arc__dots');
  const data = CONFIG.cases;
  // чтобы перескок карточки с края на край шёл за кадром, нужно минимум 6 слотов
  const reps = Math.max(1, Math.ceil(6 / data.length));
  const items = Array.from({ length: data.length * reps }, (_, i) => data[i % data.length]);
  const n = items.length;
  let current = 1 % data.length;   // по центру — Porfiry, как в макете
  const prevOffset = new Array(n).fill(null);

  const cards = items.map((c, i) => {
    const a = document.createElement('a');
    a.className = 'case';
    a.href = c.url || CONFIG.behance;
    a.target = '_blank';
    a.rel = 'noopener';
    a.draggable = false;
    a.innerHTML = `
      <span class="case__img"><img src="${c.img}" alt="" loading="lazy" draggable="false">
        <span class="case__more">Смотреть на Behance ↗</span></span>
      <span class="case__cap"><b>${c.tag}</b><span>${c.title}</span></span>`;
    a.addEventListener('click', e => {
      if (dragMoved) { e.preventDefault(); return; }
      if (!a.classList.contains('is-center')) { e.preventDefault(); go(i); }
    });
    stage.append(a);
    return a;
  });

  const dots = data.map((c, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', `${c.tag}: ${c.title}`);
    b.addEventListener('click', () => go(nearest(i)));
    dotsBox.append(b);
    return b;
  });

  // ближайший слот с нужным кейсом
  function nearest(dataIdx) {
    let best = current, bestD = Infinity;
    for (let i = 0; i < n; i++) {
      if (i % data.length !== dataIdx) continue;
      const d = Math.abs(wrap(i - current));
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }
  const wrap = k => { k = ((k % n) + n) % n; return k > n / 2 ? k - n : k; };

  function layout() {
    const mobile = innerWidth <= 900;
    const w = cards[0].offsetWidth || 610;
    const dx = mobile ? w * 0.92 : 666;      // шаг из макета: 666px между центрами
    const dy = mobile ? 70 : 125;            // боковые карточки ниже на 125px
    const rot = mobile ? 7 : 8;              // и повёрнуты на ±8°
    cards.forEach((card, i) => {
      const k = wrap(i - current);
      const ak = Math.abs(k);
      const jump = prevOffset[i] === null || Math.abs(k - prevOffset[i]) > 1;
      card.classList.toggle('no-anim', jump);
      card.style.transform =
        `translate(${k * dx}px, ${dy * Math.pow(ak, 1.7)}px) rotate(${k * rot}deg)`;
      card.style.opacity = ak > 1 ? 0 : 1;
      card.style.zIndex = 10 - ak;
      card.style.pointerEvents = ak > 1 ? 'none' : '';
      card.tabIndex = ak > 1 ? -1 : 0;
      card.classList.toggle('is-center', k === 0);
      card.setAttribute('aria-hidden', ak > 1);
      prevOffset[i] = k;
    });
    dots.forEach((d, i) => d.setAttribute('aria-selected', i === current % data.length));
    // снимаем no-anim после кадра, чтобы следующие сдвиги снова были плавными
    requestAnimationFrame(() => requestAnimationFrame(() => cards.forEach(c => c.classList.remove('no-anim'))));
  }

  function go(i) { current = ((i % n) + n) % n; layout(); }
  $('.arc__nav--prev').addEventListener('click', () => go(current - 1));
  $('.arc__nav--next').addEventListener('click', () => go(current + 1));
  root.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(current - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); go(current + 1); }
  });

  // свайп / перетаскивание
  let startX = null, dragMoved = false;
  root.addEventListener('pointerdown', e => {
    if (e.target.closest('.arc__nav')) return;
    startX = e.clientX; dragMoved = false;
  });
  addEventListener('pointermove', e => {
    if (startX !== null && Math.abs(e.clientX - startX) > 8) dragMoved = true;
  });
  addEventListener('pointerup', e => {
    if (startX === null) return;
    const d = e.clientX - startX;
    startX = null;
    if (Math.abs(d) > 50) go(current + (d < 0 ? 1 : -1));
    setTimeout(() => { dragMoved = false; }, 0);
  });

  layout();
  addEventListener('resize', layout);
})();

// ---- форма ----
(function form() {
  const f = $('#brief');
  const ta = $('#f-msg', f);
  const file = $('.attach input', f);
  const attach = $('.attach', f);
  const fileName = $('.attach__name', f);
  const clear = $('.attach__clear', f);
  const done = $('.form__done', f);
  const fail = $('.form__fail', f);

  const grow = () => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; };
  ta.addEventListener('input', grow);

  file.addEventListener('change', () => {
    const fl = file.files[0];
    if (fl && fl.size > 10 * 1024 * 1024) { alert('Файл больше 10 МБ — пришлите его, пожалуйста, в Telegram'); file.value = ''; }
    const has = !!file.files[0];
    attach.classList.toggle('has-file', has);
    fileName.textContent = has ? file.files[0].name : 'Прикрепить файл pdf/doc';
    clear.hidden = !has;
  });
  clear.addEventListener('click', e => { e.preventDefault(); file.value = ''; file.dispatchEvent(new Event('change')); });

  const contactOk = v => /^\S+@\S+\.\S+$/.test(v) || /^@?[a-z0-9_]{4,32}$/i.test(v) || /^\+?[\d\s()-]{10,}$/.test(v);
  const checks = [
    [$('#f-name', f), v => v.trim().length > 0],
    [$('#f-contact', f), v => contactOk(v.trim())],
  ];
  checks.forEach(([input]) => input.addEventListener('input', () => input.closest('.field').classList.remove('is-bad')));
  const consent = $('.consent input', f);
  consent.addEventListener('change', () => consent.parentElement.classList.remove('is-bad'));

  // текст заявки для запасного письма, если сервис не ответил
  const asText = () => {
    const d = new FormData(f);
    const services = d.getAll('Услуги[]').join(', ');
    return [
      `Имя: ${d.get('Имя')}`,
      `Контакт: ${d.get('Контакт')}`,
      services && `Услуги: ${services}`,
      d.get('Проект') && `О проекте: ${d.get('Проект')}`,
      file.files[0] && `(файл «${file.files[0].name}» пришлю ответным письмом)`,
    ].filter(Boolean).join('\n');
  };
  const showFail = () => {
    $('[data-mailto]', fail).href =
      `mailto:alisanefed@gmail.com?subject=${encodeURIComponent('Заявка с сайта SLOYA')}&body=${encodeURIComponent(asText())}`;
    fail.hidden = false;
  };
  $('.form__retry', fail).addEventListener('click', () => { fail.hidden = true; f.requestSubmit(); });

  f.addEventListener('submit', async e => {
    e.preventDefault();
    let firstBad = null;
    checks.forEach(([input, ok]) => {
      const bad = !ok(input.value);
      input.closest('.field').classList.toggle('is-bad', bad);
      if (bad && !firstBad) firstBad = input;
    });
    if (!consent.checked) { consent.parentElement.classList.add('is-bad'); firstBad ||= consent; }
    if (firstBad) { firstBad.focus(); return; }

    f.classList.add('is-sending');
    // успехом считаем только явный ответ сервиса, а не любую загрузку страницы
    let ok = false;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 20000);
      const res = await fetch(f.action.replace('formsubmit.co/', 'formsubmit.co/ajax/'), {
        method: 'POST', body: new FormData(f), headers: { Accept: 'application/json' }, signal: ctrl.signal,
      });
      clearTimeout(timer);
      const json = res.ok ? await res.json().catch(() => ({})) : {};
      // первая заявка возвращает просьбу активировать форму — письмо владельцу при этом уходит
      ok = String(json.success) === 'true' || /activat/i.test(json.message || '');
    } catch (_) { ok = false; }
    f.classList.remove('is-sending');

    if (!ok) { showFail(); return; }
    done.hidden = false;
    f.reset();
    file.dispatchEvent(new Event('change'));
    $$('.svc').forEach(b => b.classList.remove('is-picked', 'is-on'));
  });
})();
