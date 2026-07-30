/**
 * Žemėlapio piešimas ir laivo kelionės animacija.
 * Dirba tik su SVG — jokių išorinių bibliotekų.
 */
const GameMap = (function () {
  const SVG_NS = 'http://www.w3.org/2000/svg';

  const svg      = document.getElementById('map');
  const gRoutes  = document.getElementById('routes');
  const gMarkers = document.getElementById('markers');
  const gShip    = document.getElementById('ship-layer');

  const routePaths = [];   // routePaths[i] – kelias iš i-tosios į (i+1)-ąją vietovę
  const markerEls  = [];

  function el(name, attrs) {
    const node = document.createElementNS(SVG_NS, name);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  /** Lenkta trajektorija tarp dviejų taškų (statmenas nuokrypis, kad atrodytų kaip burlaivio kursas) */
  function curveBetween(a, b) {
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const bend = Math.min(70, len * 0.22);
    const cx = mx + (-dy / len) * bend;
    const cy = my + ( dx / len) * bend;
    return `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
  }

  function drawRoutes() {
    for (let i = 0; i < LOCATIONS.length - 1; i++) {
      const d = curveBetween(LOCATIONS[i], LOCATIONS[i + 1]);

      const base = el('path', { d, class: 'route-line', 'stroke-dasharray': '7 9' });
      gRoutes.appendChild(base);

      // ta pati trajektorija, bet nematoma – pagal ją juda laivas
      const track = el('path', { d, class: 'route-track' });
      gRoutes.appendChild(track);

      routePaths.push({ line: base, track });
    }
  }

  function drawMarkers() {
    LOCATIONS.forEach((loc, i) => {
      const g = el('g', { class: 'marker locked', transform: `translate(${loc.x},${loc.y})` });

      g.appendChild(el('circle', { class: 'marker-halo', r: 20 }));
      g.appendChild(el('circle', { class: 'marker-dot',  r: 9 }));

      const num = el('text', { class: 'marker-num', y: 4.5 });
      num.textContent = loc.id;
      g.appendChild(num);

      const label = el('text', { class: 'marker-label', y: -28 });
      label.textContent = loc.name;
      g.appendChild(label);

      gMarkers.appendChild(g);
      markerEls.push(g);
    });
  }

  function drawShip() {
    const g = el('g', { id: 'ship', class: 'ship' });

    // korpusas
    g.appendChild(el('path', {
      class: 'ship-hull',
      d: 'M -20 4 Q -14 13 0 13 Q 14 13 20 4 Q 12 8 0 8 Q -12 8 -20 4 Z'
    }));
    // priekio ir laivagalio drakono galvos
    g.appendChild(el('path', { class: 'ship-hull', d: 'M -20 4 L -23 -8 Q -18 -6 -17 0 Z' }));
    g.appendChild(el('path', { class: 'ship-hull', d: 'M 20 4 L 23 -8 Q 18 -6 17 0 Z' }));
    // stiebas ir burė
    g.appendChild(el('line', { class: 'ship-mast', x1: 0, y1: 4, x2: 0, y2: -16 }));
    g.appendChild(el('path', { class: 'ship-sail', d: 'M -11 -14 L 11 -14 L 11 -1 L -11 -1 Z' }));
    g.appendChild(el('path', { class: 'ship-stripe', d: 'M -11 -9.5 L 11 -9.5 L 11 -5.5 L -11 -5.5 Z' }));

    gShip.appendChild(g);
    return g;
  }

  const shipEl = { node: null };

  /** Laivas pastatomas ant vietovės (be judesio) */
  function placeShipAt(index) {
    const loc = LOCATIONS[index];
    shipEl.node.setAttribute('transform', `translate(${loc.x},${loc.y - 14}) rotate(0)`);
    shipEl.node.classList.add('visible');
  }

  /**
   * Kelionė laivu iš vietovės `from` į `to`.
   * @returns {Promise<void>} išsipildo, kai laivas priplaukia.
   */
  function sail(from, to, duration = 2600) {
    return new Promise(resolve => {
      const segment = routePaths[Math.min(from, to)];
      if (!segment) { placeShipAt(to); resolve(); return; }

      const path    = segment.track;
      const total   = path.getTotalLength();
      const reverse = to < from;

      segment.line.classList.add('route-active');
      shipEl.node.classList.add('visible', 'sailing');

      const start = performance.now();

      function frame(now) {
        const t = Math.min(1, (now - start) / duration);
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // ease-in-out
        const dist = (reverse ? 1 - eased : eased) * total;

        const p    = path.getPointAtLength(dist);
        const lead = path.getPointAtLength(Math.min(total, Math.max(0, dist + (reverse ? -6 : 6))));
        const angle = Math.atan2(lead.y - p.y, lead.x - p.x) * 180 / Math.PI;
        // laivas plaukia horizontaliai; pakreipiam tik švelniai, kad neapvirstų
        const tilt = Math.max(-25, Math.min(25, angle > 90 ? angle - 180 : (angle < -90 ? angle + 180 : angle)));
        const flip = (angle > 90 || angle < -90) ? -1 : 1;

        shipEl.node.setAttribute(
          'transform',
          `translate(${p.x},${p.y - 10}) rotate(${tilt}) scale(${flip},1)`
        );

        if (t < 1) {
          requestAnimationFrame(frame);
        } else {
          shipEl.node.classList.remove('sailing');
          placeShipAt(to);
          resolve();
        }
      }
      requestAnimationFrame(frame);
    });
  }

  /** Perpiešia vietovių ir maršrutų būsenas pagal pasiektą vietovę */
  function update(currentIndex, completedCount) {
    markerEls.forEach((g, i) => {
      g.classList.toggle('done',    i < completedCount);
      g.classList.toggle('current', i === currentIndex);
      g.classList.toggle('locked',  i > currentIndex);
    });

    routePaths.forEach((seg, i) => {
      seg.line.classList.toggle('route-done', i < currentIndex);
    });
  }

  function init() {
    Scenery.init();
    drawRoutes();
    drawMarkers();
    shipEl.node = drawShip();
  }

  return { init, update, sail, placeShipAt, svg };
})();
