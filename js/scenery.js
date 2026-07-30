/**
 * Žemėlapio dekoracijos: banguojanti jūra, šiaurės pašvaistė, ledkalniai,
 * kalnai, miškai, ugnikalnis, debesys, paukščiai, jūros gyvatė, kompasas.
 *
 * Viskas piešiama SVG'u, animuojama CSS'u (žr. css/style.css).
 */
const Scenery = (function () {
  const NS = 'http://www.w3.org/2000/svg';
  const W = 1000, H = 620;

  function el(name, attrs, parent) {
    const n = document.createElementNS(NS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  /* ------------------------------------------------ šiaurės pašvaistė */

  function drawAurora(g) {
    const bands = [
      { d: 'M -80 96  C 160 26, 400 132, 620 66  C 800 12, 930 78, 1080 44', w: 26, dur: 17, delay: 0 },
      { d: 'M -80 140 C 180 70, 380 168, 640 104 C 820 60, 940 122, 1080 86', w: 16, dur: 23, delay: -6 },
      { d: 'M -80 58  C 200 6,  420 92,  660 30  C 840 -14, 950 44, 1080 14', w: 34, dur: 29, delay: -12 }
    ];
    bands.forEach((b, i) => {
      el('path', {
        class: 'aurora-band',
        d: b.d,
        stroke: 'url(#auroraGrad)',
        'stroke-width': b.w,
        'stroke-linecap': 'round',
        fill: 'none',
        filter: 'url(#bigBlur)',
        style: `animation-duration:${b.dur}s;animation-delay:${b.delay}s`
      }, g);
    });
  }

  /* ------------------------------------------------ jūra */

  /** Vientisa banga, kurios ilgis dvigubai didesnis už žemėlapį – kad ciklas būtų nematomas */
  function wavePath(y, amp, len, span) {
    let d = `M 0 ${y}`;
    for (let x = 0; x < span; x += len) {
      d += ` q ${len / 4} ${-amp} ${len / 2} 0 q ${len / 4} ${amp} ${len / 2} 0`;
    }
    return d;
  }

  function drawSea(g, landPaths) {
    // sekluma prie krantų
    const shallow = el('g', { class: 'shallow' }, g);
    landPaths.forEach(p => {
      const b = p.getBBox();
      el('ellipse', {
        cx: b.x + b.width / 2,
        cy: b.y + b.height / 2,
        rx: b.width / 2 + 34,
        ry: b.height / 2 + 30,
        fill: 'url(#shallowGrad)'
      }, shallow);
    });

    // bangų eilės
    const waves = el('g', { class: 'waves' }, g);
    const span = W * 2;
    let i = 0;
    for (let y = 12; y < H + 30; y += 27) {
      const depth = y / H;                       // toliau nuo horizonto – ryškesnės
      const amp   = 2.4 + depth * 4.2;
      const len   = 150 - depth * 55;
      const dur   = 26 - (i % 4) * 4;
      const rev   = i % 2 === 1;

      const row = el('g', {
        class: 'wave-row' + (rev ? ' rev' : ''),
        style: `animation-duration:${dur}s;animation-delay:${-i * 1.7}s`
      }, waves);

      const d = wavePath(y, amp, len, span + len);
      el('path', {
        class: 'wave',
        d,
        'stroke-width': (0.9 + depth * 1.5).toFixed(2),
        opacity: (0.10 + depth * 0.22).toFixed(2)
      }, row);
      el('path', {
        class: 'wave',
        d,
        transform: `translate(${span} 0)`,
        'stroke-width': (0.9 + depth * 1.5).toFixed(2),
        opacity: (0.10 + depth * 0.22).toFixed(2)
      }, row);

      i++;
    }
  }

  /* ------------------------------------------------ sausumos detalės */

  function mountain(g, x, y, w, h, snow) {
    el('path', {
      class: 'mtn',
      d: `M ${x - w / 2} ${y} L ${x - w * 0.12} ${y - h} L ${x + w * 0.1} ${y - h * 0.72}
          L ${x + w * 0.3} ${y - h * 0.9} L ${x + w / 2} ${y} Z`
    }, g);
    if (snow) {
      el('path', {
        class: 'mtn-snow',
        d: `M ${x - w * 0.26} ${y - h * 0.62} L ${x - w * 0.12} ${y - h}
            L ${x + w * 0.03} ${y - h * 0.78} L ${x - w * 0.06} ${y - h * 0.7}
            L ${x - w * 0.16} ${y - h * 0.76} Z`
      }, g);
    }
  }

  function pine(g, x, y, s) {
    el('path', {
      class: 'pine',
      d: `M ${x} ${y - 9 * s} L ${x + 3.4 * s} ${y - 3 * s} L ${x + 1.6 * s} ${y - 3 * s}
          L ${x + 4.4 * s} ${y + 1.4 * s} L ${x - 4.4 * s} ${y + 1.4 * s}
          L ${x - 1.6 * s} ${y - 3 * s} L ${x - 3.4 * s} ${y - 3 * s} Z`
    }, g);
  }

  function iceberg(g, x, y, s, delay) {
    // išorinė grupė laiko poziciją, vidinė – animuojama (kad CSS neperrašytų transform)
    const pos = el('g', { transform: `translate(${x} ${y}) scale(${s})` }, g);
    const berg = el('g', { class: 'iceberg', style: `animation-delay:${delay}s` }, pos);
    el('ellipse', { class: 'berg-shadow', cx: 0, cy: 6, rx: 18, ry: 4 }, berg);
    el('path', { class: 'berg', d: 'M -16 6 L -7 -13 L 0 -4 L 6 -17 L 17 6 Z' }, berg);
    el('path', { class: 'berg-lit', d: 'M -7 -13 L 0 -4 L -2 6 L -11 6 Z' }, berg);
  }

  function volcano(g, x, y) {
    el('path', { class: 'mtn volcano', d: `M ${x - 26} ${y} L ${x - 7} ${y - 26} L ${x + 7} ${y - 26} L ${x + 26} ${y} Z` }, g);
    el('path', { class: 'lava', d: `M ${x - 7} ${y - 26} L ${x + 7} ${y - 26} L ${x + 3} ${y - 19} L ${x - 3} ${y - 19} Z` }, g);
    for (let i = 0; i < 3; i++) {
      el('circle', {
        class: 'smoke',
        cx: x, cy: y - 28, r: 5 + i,
        style: `animation-delay:${-i * 1.9}s`
      }, g);
    }
  }

  function drawLandDetail(g) {
    // Skandinavija
    [[884, 152, 62, 40, 1], [908, 226, 54, 34, 1], [886, 306, 66, 42, 0], [924, 384, 50, 30, 0]]
      .forEach(m => mountain(g, m[0], m[1], m[2], m[3], m[4]));
    [[946, 186, 1.3], [962, 254, 1.1], [938, 442, 1.2], [956, 330, 1], [910, 470, 1.2]]
      .forEach(t => pine(g, t[0], t[1], t[2]));

    // Grenlandija – ledynai
    el('path', { class: 'icecap', d: 'M 196 60 C 246 34, 312 44, 330 78 C 344 106, 300 132, 258 130 C 214 128, 176 96, 196 60 Z' }, g);
    [[230, 104, 52, 32, 1], [292, 92, 46, 28, 1], [204, 132, 40, 24, 1]]
      .forEach(m => mountain(g, m[0], m[1], m[2], m[3], m[4]));

    // Islandija – ledynas ir ugnikalnis
    el('path', { class: 'icecap', d: 'M 496 118 C 522 112, 538 126, 530 142 C 520 158, 490 158, 484 140 C 480 128, 486 120, 496 118 Z' }, g);
    volcano(g, 452, 158);

    // Britanija ir Airija
    [[672, 356, 44, 26, 0]].forEach(m => mountain(g, m[0], m[1], m[2], m[3], m[4]));
    [[662, 392, 1.2], [692, 428, 1.1], [652, 452, 1.2], [694, 466, 1], [676, 412, 1]]
      .forEach(t => pine(g, t[0], t[1], t[2]));
    [[556, 424, 1.2], [578, 452, 1], [540, 448, 1.1]]
      .forEach(t => pine(g, t[0], t[1], t[2]));

    // Vinlandas / Helulandas – tankūs miškai
    [[52, 236, 56, 34, 1], [92, 288, 44, 26, 0]]
      .forEach(m => mountain(g, m[0], m[1], m[2], m[3], m[4]));
    [[46, 320, 1.3], [78, 352, 1.2], [34, 396, 1.3], [96, 432, 1.2], [58, 466, 1.4],
     [118, 486, 1.2], [80, 524, 1.3], [36, 546, 1.2], [126, 542, 1.1]]
      .forEach(t => pine(g, t[0], t[1], t[2]));

    // Europos krantas
    [[812, 584, 1.2], [868, 572, 1.1], [928, 578, 1.2], [764, 600, 1]]
      .forEach(t => pine(g, t[0], t[1], t[2]));

    // ledkalniai atviroje jūroje
    [[206, 216, 1.1, 0], [312, 214, 0.85, -2.4], [386, 96, 0.9, -4.1],
     [120, 168, 1, -1.2], [430, 214, 0.7, -3.3]]
      .forEach(b => iceberg(g, b[0], b[1], b[2], b[3]));

    // jūros gyvatė
    drawSerpent(g, 296, 330);
  }

  function drawSerpent(g, x, y) {
    const s = el('g', { class: 'serpent', transform: `translate(${x} ${y})` }, g);
    el('path', {
      class: 'serpent-body',
      d: 'M -76 10 q 18 -26 36 0 q 18 26 36 0 q 18 -26 36 0'
    }, s);
    const head = el('g', { class: 'serpent-head' }, s);
    el('path', { class: 'serpent-body', d: 'M 32 10 q 10 -20 26 -22 q 14 -2 18 8 q -12 -2 -18 6 q -6 8 -14 12 Z' }, head);
    el('circle', { class: 'serpent-eye', cx: 62, cy: -8, r: 2 }, head);
  }

  /* ------------------------------------------------ dangus */

  function drawSky(g) {
    // debesys
    [[150, 70, 1.5, 90, -10], [520, 60, 1.1, 120, -40], [760, 130, 1.3, 105, -70],
     [330, 250, 0.9, 140, -25], [880, 330, 1.1, 130, -95], [430, 500, 1.2, 115, -55]]
      .forEach(c => {
        const cl = el('g', {
          class: 'cloud',
          transform: `translate(${c[0]} ${c[1]}) scale(${c[2]})`,
          style: `animation-duration:${c[3]}s;animation-delay:${c[4]}s`
        }, g);
        el('g', { filter: 'url(#cloudBlur)' }, cl);
        const inner = cl.firstChild;
        [[-30, 4, 26, 12], [0, -4, 34, 16], [28, 4, 24, 11], [10, 8, 30, 10]]
          .forEach(e => el('ellipse', { class: 'cloud-puff', cx: e[0], cy: e[1], rx: e[2], ry: e[3] }, inner));
      });

    // paukščiai
    [[120, 60, 0], [180, 42, -7], [66, 34, -13], [300, 92, -20]].forEach((b, i) => {
      const bird = el('g', {
        class: 'bird',
        style: `animation-duration:${b[1] + 40}s;animation-delay:${b[2]}s`
      }, g);
      const pos  = el('g', { transform: `translate(0 ${b[0]}) scale(${0.8 + (i % 3) * 0.25})` }, bird);
      const flap = el('g', { class: 'bird-inner' }, pos);
      el('path', { class: 'wing', d: 'M -9 0 q 4.5 -5 9 0' }, flap);
      el('path', { class: 'wing', d: 'M 0 0 q 4.5 -5 9 0' }, flap);
    });
  }

  /* ------------------------------------------------ kompasas */

  function drawCompass(g) {
    const c = el('g', { class: 'compass', transform: 'translate(452 552)' }, g);
    el('circle', { class: 'compass-ring', r: 42 }, c);
    el('circle', { class: 'compass-ring thin', r: 33 }, c);

    const star = el('g', { class: 'compass-star' }, c);
    el('path', { class: 'star-major', d: 'M 0 -34 L 8 -6 L 0 0 L -8 -6 Z' }, star);
    el('path', { class: 'star-major dark', d: 'M 0 34 L 8 6 L 0 0 L -8 6 Z' }, star);
    el('path', { class: 'star-major dark', d: 'M -34 0 L -6 -8 L 0 0 L -6 8 Z' }, star);
    el('path', { class: 'star-major', d: 'M 34 0 L 6 -8 L 0 0 L 6 8 Z' }, star);
    [45, 135, 225, 315].forEach(a => {
      el('path', { class: 'star-minor', d: 'M 0 -24 L 5 -4 L 0 0 L -5 -4 Z', transform: `rotate(${a})` }, star);
    });

    [['Š', 0, -46], ['P', 0, 52], ['V', 50, 4], ['R', -50, 4]].forEach(t => {
      const n = el('text', { class: 'compass-letter', x: t[1], y: t[2] }, c);
      n.textContent = t[0];
    });
  }

  /* ------------------------------------------------ startas */

  function init() {
    const landPaths = Array.from(document.querySelectorAll('#land path'));
    drawAurora(document.getElementById('aurora'));
    drawSea(document.getElementById('sea-decor'), landPaths);
    drawLandDetail(document.getElementById('land-detail'));
    drawSky(document.getElementById('sky-decor'));
    drawCompass(document.getElementById('compass'));
  }

  return { init };
})();
