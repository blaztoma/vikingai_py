/**
 * SCORM integracija (Moodle ir kiti LMS).
 *
 * Paketas pateikiamas kaip SCORM 2004 4th Edition, nes jo `cmi.suspend_data`
 * telpa 64 000 simbolių (SCORM 1.2 – tik 4 096), o mums ten reikia sutalpinti
 * visų dešimties uždavinių sprendimus. Jei LMS vis dėlto pateiktų tik 1.2 API,
 * modulis persijungia ir dirba su ja (raktai išverčiami, limitas sumažinamas).
 *
 * Kas rašoma į LMS:
 *   cmi.score.raw / .min / .max   – išspręstų uždavinių procentas (0–100)
 *   cmi.score.scaled              – tas pats 0–1 skalėje
 *   cmi.progress_measure          – eigos dalis 0–1
 *   cmi.completion_status         – completed, kai išspręsti visi uždaviniai
 *   cmi.success_status            – passed, kai pasiektas PASSING_SCALED
 *   cmi.location                  – dabartinė vietovė (grįžus tęsiama nuo jos)
 *   cmi.suspend_data              – visa žaidimo būsena ir sprendimų tekstai
 *
 * Sprendimų tekstai koduojami base64, kad išliktų eilučių laužymai, tabuliacija
 * ir lietuviškos raidės — atkūrus programa atrodo lygiai taip, kaip buvo palikta.
 *
 * SVARBU: šis failas turi būti prijungtas PIRMAS — anksčiau už
 * js/level-scorm-shim.js. Tikroji LMS API surandama iškart, dar prieš tai, kai
 * ant lango uždedamas netikras API objektas lygių rėmeliams.
 */
const Scorm = (function () {

  /** Kiek reikia surinkti, kad būtų įskaityta „passed“ (0–1 skalėje) */
  const PASSING_SCALED = 0.6;

  /** cmi.suspend_data talpa: 2004 – 64 000, 1.2 – 4 096 simboliai */
  const LIMIT_2004 = 63000;
  const LIMIT_12   = 4000;

  const state = {
    handle: null,     // LMS API objektas
    version: null,    // '2004' arba '1.2'
    active: false,    // ar sesija inicijuota
    lastError: ''
  };

  /* ------------------------------------------------ API paieška ir kvietimai */

  /**
   * LMS API guli viename iš tėvinių langų. Einame per grandinę aukštyn,
   * praleisdami savo pačių apgaulingą API (jis skirtas tik lygių rėmeliams).
   */
  function findApi(win) {
    let depth = 0;
    try {
      while (win && depth <= 500) {
        if (win.API_1484_11 && !win.API_1484_11.__vikingsShim) {
          return { handle: win.API_1484_11, version: '2004' };
        }
        if (win.API && !win.API.__vikingsShim) {
          return { handle: win.API, version: '1.2' };
        }
        if (!win.parent || win.parent === win) break;
        win = win.parent;
        depth++;
      }
    } catch (e) {
      /* kitos kilmės langas – toliau eiti negalime */
    }
    return null;
  }

  function locate() {
    let found = findApi(window);
    if (!found && window.opener) found = findApi(window.opener);
    if (!found && window.top !== window) {
      try { found = findApi(window.top); } catch (e) { /* cross-origin */ }
    }
    return found;
  }

  /** Vienodi vardai abiem versijoms */
  function call(name2004, name12, arg1, arg2) {
    if (!state.handle) return '';
    const fn = state.version === '2004' ? name2004 : name12;
    try {
      return arg2 === undefined ? state.handle[fn](arg1) : state.handle[fn](arg1, arg2);
    } catch (e) {
      state.lastError = String(e && e.message || e);
      return '';
    }
  }

  /** SCORM 2004 raktų atitikmenys SCORM 1.2 duomenų modelyje */
  const KEYS_12 = {
    'cmi.completion_status': 'cmi.core.lesson_status',
    'cmi.success_status':    'cmi.core.lesson_status',
    'cmi.score.raw':         'cmi.core.score.raw',
    'cmi.score.min':         'cmi.core.score.min',
    'cmi.score.max':         'cmi.core.score.max',
    'cmi.location':          'cmi.core.lesson_location',
    'cmi.exit':              'cmi.core.exit',
    'cmi.entry':             'cmi.core.entry',
    'cmi.learner_id':        'cmi.core.student_id',
    'cmi.learner_name':      'cmi.core.student_name'
  };

  /** SCORM 1.2 šių laukų neturi – tyliai praleidžiam */
  const ONLY_2004 = ['cmi.score.scaled', 'cmi.progress_measure'];

  function translate(key) {
    if (state.version === '2004') return key;
    if (ONLY_2004.indexOf(key) !== -1) return null;
    return KEYS_12[key] || key;
  }

  function get(key) {
    const k = translate(key);
    if (!k) return '';
    return call('GetValue', 'LMSGetValue', k);
  }

  function set(key, value) {
    const k = translate(key);
    if (!k) return false;
    const ok = call('SetValue', 'LMSSetValue', k, String(value));
    return ok === 'true' || ok === true;
  }

  function commit() {
    return call('Commit', 'LMSCommit', '');
  }

  /* ------------------------------------------------ base64 (UTF-8 saugus) */

  function encode(text) {
    const bytes = new TextEncoder().encode(String(text));
    let binary = '';
    const CHUNK = 0x8000;                       // dideliems tekstams – dalimis
    for (let i = 0; i < bytes.length; i += CHUNK) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
    }
    return btoa(binary);
  }

  function decode(base64) {
    try {
      const binary = atob(String(base64));
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return new TextDecoder().decode(bytes);
    } catch (e) {
      return '';
    }
  }

  /* ------------------------------------------------ sesijos pradžia/pabaiga */

  function init() {
    if (state.active) return true;

    // dažniausiai API jau surasta modulio įkėlimo metu (žr. failo apačią)
    const found = state.handle ? { handle: state.handle, version: state.version } : locate();
    if (!found) {
      console.info('[SCORM] LMS nerastas — žaidimas veikia savarankiškai, ' +
                   'progresas saugomas tik naršyklėje.');
      return false;
    }

    state.handle  = found.handle;
    state.version = found.version;

    const ok = call('Initialize', 'LMSInitialize', '');
    state.active = (ok === 'true' || ok === true);

    if (!state.active) {
      console.warn('[SCORM] Nepavyko pradėti sesijos su LMS.');
      state.handle = null;
      return false;
    }

    console.info(`[SCORM] Sesija pradėta (${state.version}), ` +
                 `mokinys: ${get('cmi.learner_name') || 'nežinomas'}`);

    // grįžus prie veiklos sesija tęsiama, o ne pradedama iš naujo
    set('cmi.exit', state.version === '2004' ? 'suspend' : 'suspend');

    window.addEventListener('pagehide', finish);
    window.addEventListener('beforeunload', finish);

    return true;
  }

  function finish() {
    if (!state.active) return;
    state.active = false;
    set('cmi.exit', 'suspend');
    commit();
    call('Terminate', 'LMSFinish', '');
    state.handle = null;
  }

  /* ------------------------------------------------ būsenos įrašymas */

  function limit() {
    return state.version === '1.2' ? LIMIT_12 : LIMIT_2004;
  }

  /**
   * Suformuoja suspend_data turinį. Jei netelpa, po vieną meta seniausių
   * lygių sprendimų tekstus — eigos duomenys (išspręsta, balai) lieka visada.
   */
  function serialize(snapshot) {
    const payload = {
      v: 4,
      game:      snapshot.game,      // žaidimo aprašas peržiūros įrankiui
      phase:     snapshot.phase,
      index:     snapshot.index,
      completed: snapshot.completed,
      solved:    snapshot.solved,
      scores:    snapshot.scores || {},
      code:      Object.assign({}, snapshot.code || {})
    };

    let json = JSON.stringify(payload);
    const max = limit();
    if (json.length <= max) return json;

    const ids = Object.keys(payload.code).sort((a, b) => Number(a) - Number(b));
    while (json.length > max && ids.length) {
      delete payload.code[ids.shift()];
      payload.trimmed = true;
      json = JSON.stringify(payload);
    }

    console.warn('[SCORM] suspend_data netilpo — dalis sprendimų tekstų nebuvo įrašyta.');
    return json;
  }

  /**
   * Įrašo visą būseną į LMS: taškus, eigą, statusus ir sprendimus.
   * Taškai = išspręstų uždavinių procentas.
   */
  function saveState(snapshot) {
    if (!state.active) return false;

    const total  = snapshot.total || 1;
    const solved = (snapshot.solved || []).length;
    const scaled = Math.max(0, Math.min(1, solved / total));
    const raw    = Math.round(scaled * 100);

    set('cmi.score.min', '0');
    set('cmi.score.max', '100');
    set('cmi.score.raw', String(raw));
    set('cmi.score.scaled', scaled.toFixed(4));
    set('cmi.progress_measure', scaled.toFixed(4));

    set('cmi.completion_status', solved >= total ? 'completed' : 'incomplete');
    set('cmi.success_status', scaled >= PASSING_SCALED ? 'passed' : 'failed');
    set('cmi.location', String(snapshot.index || 0));

    set('cmi.suspend_data', serialize(snapshot));

    commit();
    return true;
  }

  /** Nuskaito anksčiau įrašytą būseną (arba null, jei jos nėra) */
  function loadState() {
    if (!state.active) return null;

    const raw = get('cmi.suspend_data');
    if (!raw) return null;

    try {
      const data = JSON.parse(raw);
      return (data && typeof data === 'object') ? data : null;
    } catch (e) {
      console.warn('[SCORM] suspend_data turinys sugadintas — pradedama iš naujo.');
      return null;
    }
  }

  /* ------------------------------------------------ pagalbinės */

  function isAvailable() { return state.active; }
  function version()     { return state.version; }
  function learnerName() { return state.active ? get('cmi.learner_name') : ''; }

  // API surandama iškart, kol dar neuždėtas apgaulingas API lygių rėmeliams
  const detected = locate();
  if (detected) {
    state.handle  = detected.handle;
    state.version = detected.version;
  }

  return {
    init, finish, saveState, loadState,
    encode, decode,
    isAvailable, version, learnerName,
    PASSING_SCALED
  };
})();
