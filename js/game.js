/**
 * Žaidimo eiga (būsenų mašina):
 *
 *   VIDEO(0) ──► TASK(0) ──► SAIL(0→1) ──► VIDEO(1) ──► ... ──► TASK(9) ──► OUTRO ──► FINISH
 *
 * Kiekvienos vietovės filmas rodomas atplaukus, prieš jos uždavinį;
 * pirmasis filmas kartu yra ir įvadinis, o po paskutinio uždavinio – baigiamasis.
 */
const Game = (function () {
  const PHASE = {
    VIDEO:  'video',
    TASK:   'task',
    SAIL:   'sail',
    OUTRO:  'outro',
    FINISH: 'finish'
  };

  const SAVE_KEY = 'vikings.progress.v2';

  const state = {
    phase: PHASE.VIDEO,
    index: 0,          // dabartinė vietovė (0..9)
    completed: 0,      // kiek vietovių jau įveikta
    busy: false,       // true, kol laivas plaukia
    lastScore: null,   // paskutinis rezultatas iš lygio programos
    solved: []         // vietovių id, kurių uždaviniai jau įveikti
  };

  const ui = {
    kicker:   document.getElementById('panel-kicker'),
    title:    document.getElementById('panel-title'),
    body:     document.getElementById('panel-body'),
    hint:     document.getElementById('panel-hint'),
    next:     document.getElementById('btn-next'),
    reset:    document.getElementById('btn-reset'),
    clear:    document.getElementById('btn-clear-code'),
    panel:    document.getElementById('panel'),
    current:  document.getElementById('progress-current'),
    total:    document.getElementById('progress-total'),
    fill:     document.getElementById('progress-fill')
  };

  /* ---------------------------------------------------- išsaugojimas */

  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        phase: state.phase, index: state.index,
        completed: state.completed, solved: state.solved
      }));
    } catch (e) { /* privatus režimas – tiesiog neįrašom */ }
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (typeof d.index === 'number' && d.index >= 0 && d.index < LOCATIONS.length) {
        state.index     = d.index;
        state.completed = Math.max(0, Math.min(LOCATIONS.length, d.completed || 0));
        state.solved    = Array.isArray(d.solved) ? d.solved : [];
        // nutrūkusią kelionę pratęsiam nuo tos vietovės filmo
        state.phase     = (d.phase === PHASE.SAIL) ? PHASE.VIDEO : (d.phase || PHASE.VIDEO);
      }
    } catch (e) { /* sugadintas įrašas – pradedam iš naujo */ }
  }

  /* ---------------------------------------------------- atvaizdavimas */

  function placeholder(kind, text) {
    return `<div class="placeholder ${kind}">
              <div class="placeholder-icon">${kind === 'movie' ? '▶' : '⌨'}</div>
              <div class="placeholder-text">${text}</div>
            </div>`;
  }

  /** Uždavinio kortelė: siužetas, sąlyga, įvestis/išvestis, pavyzdžiai, užuomina */
  function renderTask(loc) {
    const t = TASKS[loc.id];
    if (!t) {
      return `<p class="subtitle">${loc.subtitle}</p><p>${loc.intro}</p>` +
             placeholder('task', `Uždavinys dar neparuoštas — tema „${loc.topic}“.`);
    }

    const examples = t.examples.map((ex, i) => `
      <div class="example">
        <div class="example-head">${t.examples.length > 1 ? `${i + 1} pavyzdys` : 'Pavyzdys'}</div>
        <div class="example-cols">
          <div><span class="io-label">Įvestis</span><pre>${ex.in || '(nėra)'}</pre></div>
          <div><span class="io-label">Išvestis</span><pre>${ex.out}</pre></div>
        </div>
      </div>`).join('');

    return `
      <p class="subtitle">${loc.subtitle}</p>
      <div class="task-card">

        <div class="task-tabs" role="tablist">
          <button class="tab-btn active" data-tab="task"   role="tab">Užduotis</button>
          <button class="tab-btn"        data-tab="theory" role="tab">Teorija</button>
        </div>

        <div class="tab-pane active" data-pane="task">
          <h3 class="task-title">${t.title}</h3>
          <p class="task-story">${t.story}</p>
          <p class="task-goal">${t.goal}</p>
          <dl class="task-io">
            <dt>Įvestis</dt><dd>${t.input}</dd>
            <dt>Išvestis</dt><dd>${t.output}</dd>
          </dl>
          ${examples}
          <details class="task-hint">
            <summary>Užuomina</summary>
            <p>${t.hint}</p>
          </details>
        </div>

        <div class="tab-pane" data-pane="theory">
          <h3 class="task-title">${loc.topic}</h3>
          <div class="theory">${t.theory || '<p>Teorija šiai temai dar neparuošta.</p>'}</div>
        </div>

      </div>`;
  }

  /** Kortelių perjungimas (delegavimas – turinys perpiešiamas kas etapą) */
  function onPanelClick(e) {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;

    const card = btn.closest('.task-card');
    card.querySelectorAll('.tab-btn').forEach(b =>
      b.classList.toggle('active', b === btn));
    card.querySelectorAll('.tab-pane').forEach(p =>
      p.classList.toggle('active', p.dataset.pane === btn.dataset.tab));
  }

  /**
   * Filmui pasibaigus (arba jį praleidus) einama į kitą etapą.
   * Įsimenam etapą, kuriame filmas buvo paleistas – kad pavėlavęs
   * „ended“ įvykis nepraleistų dviejų etapų iš karto.
   */
  function videoEndHandler() {
    const phaseAtStart = state.phase;
    const indexAtStart = state.index;
    return () => {
      if (state.phase === phaseAtStart && state.index === indexAtStart) next();
    };
  }

  function render() {
    const loc = LOCATIONS[state.index];

    ui.total.textContent   = LOCATIONS.length;
    ui.current.textContent = Math.min(state.index + 1, LOCATIONS.length);
    ui.fill.style.width    = (state.completed / LOCATIONS.length * 100) + '%';

    ui.panel.dataset.phase = state.phase;
    ui.next.disabled = state.busy;
    ui.next.hidden = false;
    ui.panel.classList.remove('solved');
    ui.next.classList.remove('pulse');

    switch (state.phase) {

      // Rodant filmą dešinėje jau matoma tos vietovės užduotis
      case PHASE.VIDEO:
        ui.kicker.textContent = `Tema ${loc.id} · ${loc.topic}`;
        ui.title.textContent  = loc.name;
        ui.body.innerHTML     = renderTask(loc);
        ui.hint.textContent   = 'Filmą galima praleisti mygtuku dešiniajame viršutiniame kampe.';
        ui.next.hidden        = true;   // filmo metu apačioje mygtuko nereikia
        Theater.showVideo(locationVideo(loc.id), `${loc.id}. ${loc.name}`, videoEndHandler());
        break;

      case PHASE.TASK:
        ui.kicker.textContent = `Tema ${loc.id} · ${loc.topic}`;
        ui.title.textContent  = loc.name;
        ui.body.innerHTML     = renderTask(loc);
        ui.next.textContent   = isLast() ? 'Užbaigti sagą' : 'Kelti bures';
        Theater.showCoding(loc, TASKS[loc.id]);

        // toliau plaukti galima tik įveikus uždavinį
        if (isSolved(loc)) {
          markSolved(state.lastScore);
        } else {
          ui.next.disabled    = true;
          ui.hint.textContent = 'Išspręsk uždavinį ir paspausk „Tikrinti“ — tada galėsi kelti bures.';
        }
        break;

      case PHASE.SAIL:
        ui.kicker.textContent = 'Kelionė jūra';
        ui.title.textContent  = `${LOCATIONS[state.index].name} → ${LOCATIONS[state.index + 1].name}`;
        ui.body.innerHTML =
          `<p>Drakaras skrodžia bangas. Sekite laivą žemėlapyje…</p>`;
        ui.hint.textContent  = '';
        ui.next.textContent  = 'Plaukiame…';
        Theater.hide();
        break;

      case PHASE.OUTRO:
        ui.kicker.textContent = 'Baigiamasis filmas';
        ui.title.textContent  = 'Kelionės pabaiga';
        ui.body.innerHTML =
          `<p>Visos ${LOCATIONS.length} vietovės įveiktos — drakaras pasiekė vakarų kraštą.</p>`;
        ui.hint.textContent  = 'Filmą galima praleisti mygtuku dešiniajame viršutiniame kampe.';
        ui.next.textContent  = 'Praleisti filmą';
        Theater.showVideo(OUTRO_VIDEO, 'Baigiamasis filmas', videoEndHandler());
        break;

      case PHASE.FINISH:
        ui.kicker.textContent = 'Pabaiga';
        ui.title.textContent  = 'Saga baigta';
        ui.body.innerHTML =
          `<p>Aplankytos visos ${LOCATIONS.length} vietovės. Skaldai gieda apie tavo įgūdžius:
             nuo įvesties ir kintamųjų iki ciklo ciklo viduje.</p>
           <p class="subtitle">Visas nuplauktas kelias matomas žemėlapyje.</p>`;
        ui.hint.textContent  = '';
        ui.next.textContent  = 'Pradėti iš naujo';
        Theater.hide();
        break;
    }

    // panelės turinys irgi neatsiranda staiga
    ui.body.classList.remove('fade-in');
    void ui.body.offsetWidth;          // priverstinis perskaičiavimas, kad animacija pasikartotų
    ui.body.classList.add('fade-in');

    GameMap.update(state.index, state.completed);
  }

  function isLast() {
    return state.index === LOCATIONS.length - 1;
  }

  function isSolved(loc) {
    return state.solved.indexOf(loc.id) !== -1;
  }

  /* ---------------------------------------------------- eiga */

  async function next() {
    if (state.busy) return;
    // klaviatūra irgi neturi praleisti neišspręsto uždavinio
    if (state.phase === PHASE.TASK && !isSolved(LOCATIONS[state.index])) return;

    switch (state.phase) {

      case PHASE.VIDEO:
        state.phase = PHASE.TASK;
        break;

      case PHASE.TASK:
        state.completed = Math.max(state.completed, state.index + 1);
        if (isLast()) {
          state.phase = PHASE.OUTRO;
        } else {
          await sailToNext();     // nuplaukiam, o ten – kitos vietovės filmas
          return;
        }
        break;

      case PHASE.OUTRO:
        state.phase = PHASE.FINISH;
        break;

      case PHASE.FINISH:
        reset();
        return;
    }

    save();
    render();
  }

  async function sailToNext() {
    const from = state.index;
    const to   = from + 1;

    state.phase = PHASE.SAIL;
    state.busy  = true;
    render();

    await GameMap.sail(from, to);

    state.index = to;
    state.phase = PHASE.VIDEO;   // atplaukus – tos vietovės filmas
    state.busy  = false;
    save();
    render();
  }

  function reset() {
    state.phase = PHASE.VIDEO;
    state.index = 0;
    state.completed = 0;
    state.busy = false;
    state.solved = [];
    state.lastScore = null;
    save();
    GameMap.placeShipAt(0);
    render();
  }

  /* ------------------------------------------ išsaugotų sprendimų šalinimas */

  /**
   * Lygio aplinka studento programą įsimena localStorage'e raktais
   * „skulptIdeProgram_<task_id>“ / „CppIdeProgram_<task_id>“ (ir *Name_ variantais).
   * Čia jie visi išvalomi, kad uždavinius būtų galima spręsti nuo tuščio lapo.
   */
  function savedSolutionKeys() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && /IdeProgram(Name)?_/.test(key)) keys.push(key);
    }
    return keys;
  }

  function clearSavedSolutions() {
    const keys = savedSolutionKeys();

    if (keys.length === 0) {
      alert('Išsaugotų sprendimų nerasta.');
      return;
    }

    const ok = confirm(
      `Rasta išsaugotų sprendimų: ${keys.length}.\n\n` +
      'Jie bus ištrinti visam laikui, o uždaviniai atsivers su tuščiu šablonu. Tęsti?');
    if (!ok) return;

    keys.forEach(k => localStorage.removeItem(k));

    // atidarytame lygyje kodas dar liktų redaktoriuje – perkraunam, kad neišsisaugotų iš naujo
    Theater.reloadLevel();

    alert(`Pašalinta išsaugotų sprendimų: ${keys.length}.`);
  }

  /* ---------------------------------------------- žinutės iš lygio iframe */

  /**
   * Lygio programa (levels/level_N/) rezultatą atsiunčia taip:
   *
   *   postMessage({ type: 'setScore', score, masteryScore, status }, '*')
   *
   *   score        – surinkti taškai (0–100)
   *   masteryScore – kiek taškų reikia, kad būtų galima plaukti toliau
   *   status       – 'passed' arba 'failed'
   */
  function onLevelMessage(e) {
    if (e.origin !== location.origin) return;      // tik iš savo serverio
    if (state.phase !== PHASE.TASK) return;

    const d = e.data;
    if (!d || d.type !== 'setScore') return;

    handleScore({
      score:   Number(d.score) || 0,
      mastery: Number.isFinite(Number(d.masteryScore)) ? Number(d.masteryScore) : 100,
      status:  d.status,
      location: LOCATIONS[state.index]
    });
  }

  /** Rezultato paskirstymas į keturis atvejus */
  function handleScore(r) {
    state.lastScore = r;

    if (r.score <= 0)        return onAllWrong(r);
    if (r.score < r.mastery) return onNotEnough(r);
    if (r.score < 100)       return onPassedWithMistakes(r);
    return onPerfect(r);
  }

  /* --- keturi rezultato atvejai (kol kas tik pranešimai į konsolę) --- */

  /** 0 taškų – programa visiškai neteisinga */
  function onAllWrong(r) {
    console.log(`[${r.location.name}] Programa visiškai neteisinga (${r.score}/100). ` +
                'Perskaityk uždavinio sąlygą iš naujo ir bandyk dar kartą.');
  }

  /** Taškų yra, bet per mažai – toliau neplaukiama */
  function onNotEnough(r) {
    console.log(`[${r.location.name}] Ne viskas teisinga: ${r.score} iš 100, ` +
                `o pereiti į kitą lygį reikia ${r.mastery}. Dar pasistenk!`);
  }

  /** Taškų pakanka, bet ne viskas teisinga – leidžiama plaukti toliau */
  function onPassedWithMistakes(r) {
    console.log(`[${r.location.name}] Ne viskas teisinga (${r.score} iš 100), ` +
                `bet reikiamą ribą (${r.mastery}) pasiekei — plaukiame į kitą lygį.`);
    markSolved(r);
  }

  /** 100 taškų – viskas teisinga */
  function onPerfect(r) {
    console.log(`[${r.location.name}] Viskas teisinga (${r.score} iš 100) — ` +
                'plaukiame į kitą lygį!');
    markSolved(r);
  }

  /** Uždavinys įveiktas – atrakinam mygtuką (eiga nešokinėja pati) */
  function markSolved(r) {
    const loc = LOCATIONS[state.index];
    if (!isSolved(loc)) {
      state.solved.push(loc.id);
      save();
    }

    const points = r ? ` (${r.score}/100)` : '';
    ui.panel.classList.add('solved');
    ui.hint.textContent = isLast()
      ? `✔ Uždavinys įveiktas${points}. Saga baigta!`
      : `✔ Uždavinys įveiktas${points}. Gali kelti bures.`;
    ui.next.textContent = isLast() ? 'Užbaigti sagą ▸' : 'Kelti bures ▸';
    ui.next.disabled = false;
    ui.next.classList.add('pulse');
  }

  /* ---------------------------------------------------- startas */

  function init() {
    GameMap.init();
    load();
    GameMap.placeShipAt(state.index);
    render();

    ui.next.addEventListener('click', next);
    ui.body.addEventListener('click', onPanelClick);
    window.addEventListener('message', onLevelMessage);
    ui.reset.addEventListener('click', () => {
      if (confirm('Pradėti kelionę nuo pradžių?')) reset();
    });
    ui.clear.addEventListener('click', clearSavedSolutions);

    document.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (document.activeElement === ui.reset) return;
        if (ui.next.hidden) return;      // filmo metu klaviatūra irgi nepraleidžia
        e.preventDefault();
        next();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);

  return { state, next, reset };
})();
