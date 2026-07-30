/**
 * Tempiamas skirtukas tarp žemėlapio ir uždavinio juostos.
 *
 * Plotis saugomas kaip CSS kintamasis --panel-w ant .stage ir įsimenamas
 * localStorage'e, tad kitą kartą atsidaro toks pat, koks buvo paliktas.
 */
const Layout = (function () {
  const KEY       = 'vikings.panelWidth';
  const DEFAULT_W = 380;
  const MIN_PANEL = 300;   // siauriau uždavinio sąlyga nebesiskaito
  const MIN_MAP   = 420;   // žemėlapiui / kodo langui irgi reikia vietos

  const stage    = document.querySelector('.stage');
  const splitter = document.getElementById('splitter');

  let startX = 0;
  let startW = 0;

  function limits() {
    const total = stage.clientWidth - splitter.offsetWidth;
    return { min: MIN_PANEL, max: Math.max(MIN_PANEL, total - MIN_MAP) };
  }

  function apply(width) {
    const { min, max } = limits();
    const w = Math.round(Math.min(max, Math.max(min, width)));
    stage.style.setProperty('--panel-w', w + 'px');
    return w;
  }

  function saved() {
    const v = parseInt(localStorage.getItem(KEY), 10);
    return Number.isFinite(v) ? v : DEFAULT_W;
  }

  function store(w) {
    try { localStorage.setItem(KEY, String(w)); } catch (e) { /* privatus režimas */ }
  }

  /* ------------------------------------------------------------ tempimas */

  function onPointerDown(e) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    startX = e.clientX;
    startW = stage.querySelector('.panel').offsetWidth;

    splitter.setPointerCapture(e.pointerId);
    splitter.classList.add('active');
    document.body.classList.add('resizing');
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!splitter.classList.contains('active')) return;
    // juosta dešinėje: pelę stumiant kairėn, ji platėja
    apply(startW - (e.clientX - startX));
  }

  function onPointerUp(e) {
    if (!splitter.classList.contains('active')) return;
    splitter.releasePointerCapture(e.pointerId);
    splitter.classList.remove('active');
    document.body.classList.remove('resizing');
    store(stage.querySelector('.panel').offsetWidth);
  }

  /* --------------------------------------------------- klaviatūra ir kt. */

  function onKeyDown(e) {
    const step = e.shiftKey ? 40 : 12;
    let w = null;

    if (e.key === 'ArrowLeft')  w = stage.querySelector('.panel').offsetWidth + step;
    if (e.key === 'ArrowRight') w = stage.querySelector('.panel').offsetWidth - step;
    if (e.key === 'Home')       w = DEFAULT_W;

    if (w === null) return;
    e.preventDefault();
    store(apply(w));
  }

  function init() {
    if (!stage || !splitter) return;

    apply(saved());

    splitter.addEventListener('pointerdown', onPointerDown);
    splitter.addEventListener('pointermove', onPointerMove);
    splitter.addEventListener('pointerup', onPointerUp);
    splitter.addEventListener('pointercancel', onPointerUp);
    splitter.addEventListener('dblclick', () => store(apply(DEFAULT_W)));
    splitter.addEventListener('keydown', onKeyDown);

    // pakeitus lango dydį plotis gali nebetilpti į leistinas ribas
    window.addEventListener('resize', () => apply(stage.querySelector('.panel').offsetWidth));
  }

  document.addEventListener('DOMContentLoaded', init);

  return { apply };
})();
