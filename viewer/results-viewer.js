/**
 * Mokinio sprendimų peržiūra Moodle aplinkoje.
 *
 * Veikia Moodle puslapyje „SCORM paketas → Ataskaitos → <mokinys> → Sekimo išsami
 * informacija“ (mod/scorm/report/userreporttracks.php). Iš to puslapio lentelės
 * paimamas cmi.suspend_data laukas, iš jo išparsinami mokinio pasiekimai ir
 * base64 užkoduoti kiekvieno lygio sprendimai, o rezultatas parodomas
 * modaliniame lange.
 *
 * Paleidimo būdai (žr. viewer/bookmarklet.html):
 *   • adresyno mygtukas (bookmarklet) — patogiausia kasdieniam darbui;
 *   • įklijavimas į naršyklės konsolę;
 *   • viewer/index.html — bandymams su įrašytu puslapio HTML.
 *
 * Šis katalogas į SCORM paketą nepakuojamas (tools/pack.js jį praleidžia).
 */
(function (global) {
  'use strict';

  const VERSION = '2.0';

  /**
   * Įrankis nuo konkretaus žaidimo nepriklauso: lygių pavadinimai, temos, jų
   * skaičius, žaidimo pavadinimas ir kalba imami iš cmi.suspend_data lauko
   * („game“ dalis, kurią įrašo žaidimo js/scorm.js). Senesniems įrašams, kur
   * to aprašo dar nėra, lygiai sudaromi iš turimų rezultatų ir vadinami
   * bendriniu vardu.
   */

  /** Sąsajos tekstai. Kalba parenkama pagal žaidimo įrašą (game.lang). */
  const STRINGS = {
    lt: {
      title:      'Mokinio sprendimai',
      attempt:    'bandymas',
      unknown:    'Nežinomas mokinys',
      level:      'lygis',
      solvedOf:   'Įveikta uždavinių',
      grade:      'Įvertinimas',
      status:     'Būsena',
      completed:  'baigta',
      incomplete: 'nebaigta',
      lmsScore:   'Rezultatas LMS',
      passedLbl:  'Įskaityta',
      yes:        'taip',
      no:         'ne',
      of:         'iš',
      copy:       'Kopijuoti',
      copied:     'Nukopijuota',
      copyFailed: 'Nepavyko',
      close:      'Uždaryti (Esc)',
      result:     'Rezultatas',
      counted:    'įskaityta',
      notSolved:  'Uždavinys dar nespręstas',
      noCode:     'Šio lygio sprendimas neišsaugotas. Programa įrašoma tada, kai mokinys ' +
                  'paspaudžia „Paleisti“ arba „Tikrinti“.',
      trimmed:    'Dėmesio: dalis sprendimų netilpo į LMS lauką ir nebuvo išsaugoti.',
      notFound:   'Šiame puslapyje nerastas cmi.suspend_data laukas. ' +
                  'Atsidaryk SCORM ataskaitą: Ataskaitos → mokinys → „Sekimo išsami informacija“.',
      badJson:    'cmi.suspend_data turinys nėra taisyklingas JSON — gali būti, kad paketas senesnės versijos.'
    },
    en: {
      title:      'Student solutions',
      attempt:    'attempt',
      unknown:    'Unknown student',
      level:      'level',
      solvedOf:   'Tasks solved',
      grade:      'Grade',
      status:     'Status',
      completed:  'completed',
      incomplete: 'incomplete',
      lmsScore:   'LMS score',
      passedLbl:  'Passed',
      yes:        'yes',
      no:         'no',
      of:         'of',
      copy:       'Copy',
      copied:     'Copied',
      copyFailed: 'Failed',
      close:      'Close (Esc)',
      result:     'Score',
      counted:    'passed',
      notSolved:  'Task not attempted yet',
      noCode:     'No solution stored for this level. The program is saved when the student ' +
                  'presses “Run” or “Check”.',
      trimmed:    'Note: some solutions did not fit into the LMS field and were not stored.',
      notFound:   'No cmi.suspend_data field on this page. Open the SCORM report: ' +
                  'Reports → student → “Track details”.',
      badJson:    'cmi.suspend_data is not valid JSON — the package may be an older version.'
    }
  };

  function strings(lang) {
    return STRINGS[String(lang || '').toLowerCase().slice(0, 2)] || STRINGS.lt;
  }

  /* ==================================================== duomenų išrinkimas */

  /**
   * Iš sekimo lentelės surenka visas cmi.* reikšmes.
   * Pirmame stulpelyje būna lauko vardas (kartais su žinyno piktograma),
   * antrame — reikšmė.
   */
  function readTracks(root) {
    const values = {};

    root.querySelectorAll('tr').forEach(tr => {
      const cells = tr.querySelectorAll('td');
      if (cells.length < 2) return;

      const key = cells[0].textContent.trim().split(/\s+/)[0];
      if (!key || key.indexOf('cmi.') !== 0) return;

      values[key] = cells[1].textContent.trim();
    });

    return values;
  }

  /** base64 → tekstas (UTF-8 saugiai, kad išliktų lietuviškos raidės) */
  function decodeBase64(value) {
    try {
      const binary = atob(String(value).replace(/\s+/g, ''));
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return new TextDecoder().decode(bytes);
    } catch (e) {
      return '';
    }
  }

  /** Mokinio vardas ir bandymo numeris iš puslapio antraštės */
  function readStudent(root) {
    const heading = root.querySelector('#region-main h3, .box h3, h3');
    const text = heading ? heading.textContent.trim() : '';

    // „Bandymas 1 - Vardas Pavardė: <žaidimas> - Sekimo išsami informacija“
    const match = text.match(/^\s*[^\d]*?(\d+)\s*[-–]\s*([^:]+):/);
    if (match) {
      return { name: match[2].trim(), attempt: match[1] };
    }
    return { name: text, attempt: '' };
  }

  /**
   * Lygių sąrašas. Pirmenybė – žaidimo aprašui iš suspend_data; jei jo nėra
   * (senesnis paketas), lygiai sudaromi iš tų numerių, kurie sutinkami
   * rezultatuose ar sprendimuose.
   */
  function buildLevels(game, scores, codes, solved, t) {
    if (game && Array.isArray(game.levels) && game.levels.length) {
      return game.levels.map(level => ({
        id:    level.id,
        name:  level.name || `${level.id} ${t.level}`,
        topic: level.topic || ''
      }));
    }

    const ids = {};
    Object.keys(scores).forEach(id => ids[id] = true);
    Object.keys(codes).forEach(id => ids[id] = true);
    solved.forEach(id => ids[id] = true);

    const known = Object.keys(ids).map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b);
    const total = (game && game.total) ? Number(game.total) : (known[known.length - 1] || 0);

    const list = [];
    for (let id = 1; id <= total; id++) {
      list.push({ id: id, name: `${id} ${t.level}`, topic: '' });
    }
    return list;
  }

  /**
   * Išparsina visą reikalingą informaciją iš pateikto dokumento.
   * @returns {{ok: boolean, reason?: string, ...}}
   */
  function parse(root) {
    const tracks  = readTracks(root);
    const student = readStudent(root);
    const raw     = tracks['cmi.suspend_data'];

    // kol dar nežinome žaidimo kalbos, kalbam numatytąja
    let t = strings(null);

    if (!raw) {
      return { ok: false, t: t, student: student, reason: t.notFound };
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      return { ok: false, t: t, student: student, reason: t.badJson };
    }

    const game   = data.game || null;
    t = strings(game && game.lang);

    const scores = data.scores || {};
    const codes  = data.code || {};
    const solved = Array.isArray(data.solved) ? data.solved : [];

    const levels = buildLevels(game, scores, codes, solved, t).map(level => ({
      id:     level.id,
      name:   level.name,
      topic:  level.topic,
      score:  (scores[level.id] !== undefined) ? Number(scores[level.id]) : null,
      solved: solved.indexOf(level.id) !== -1,
      code:   codes[level.id] ? decodeBase64(codes[level.id]) : ''
    }));

    return {
      ok: true,
      t: t,
      game: game,
      student: student.name ? student : { name: t.unknown, attempt: student.attempt },
      tracks: tracks,
      levels: levels,
      solvedCount: solved.length,
      total: (game && game.total) ? Number(game.total) : levels.length,
      trimmed: !!data.trimmed
    };
  }

  /* ============================================================== stilius */

  function ensureStyles() {
    if (document.getElementById('vkv-style')) return;

    // 1) bookmarklet ar konsolės variantas — CSS atkeliauja kartu su kodu
    if (global.VIKINGS_VIEWER_CSS) {
      const style = document.createElement('style');
      style.id = 'vkv-style';
      style.textContent = global.VIKINGS_VIEWER_CSS;
      document.head.appendChild(style);
      return;
    }

    // 2) įprastas variantas — CSS failas guli šalia šio skripto
    const dir = scriptDir();
    if (!dir) {
      // adreso nežinome (pvz., įterptas kodas be VIKINGS_VIEWER_CSS) —
      // geriau pasakyti, nei bandyti krauti failą iš svetimo serverio
      console.warn('[Peržiūra] Nerasti stiliai: nei VIKINGS_VIEWER_CSS, nei skripto adresas. ' +
                   'Sugeneruok blokelį iš naujo: npm run build:viewer');
      return;
    }

    const link = document.createElement('link');
    link.id = 'vkv-style';
    link.rel = 'stylesheet';
    link.href = dir + 'results-viewer.css';
    document.head.appendChild(link);
  }

  /**
   * Katalogas, iš kurio įkeltas šis skriptas. Nustatomas iškart, nes vėliau —
   * paspaudus nuorodą — document.currentScript jau būna tuščias.
   */
  const SCRIPT_DIR = (function () {
    const src = (document.currentScript && document.currentScript.src) ||
                (global.VIKINGS_VIEWER_SRC || '');
    return src ? src.replace(/[^/]*$/, '') : '';
  })();

  function scriptDir() {
    return SCRIPT_DIR;
  }

  /* =============================================================== langas */

  let state = { levels: [], current: null, t: strings(null) };

  function close() {
    const existing = document.getElementById('vkv-overlay');
    if (existing) existing.remove();
    document.removeEventListener('keydown', onKeyDown);
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') close();
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  /** Vieno lygio eilutė kairiajame sąraše */
  function levelRow(level) {
    const row = el('button', 'vkv-level');
    row.type = 'button';
    row.dataset.level = String(level.id);

    const num = el('span', 'vkv-level-num', String(level.id));
    const box = el('span', 'vkv-level-text');
    box.appendChild(el('span', 'vkv-level-name', level.name));
    box.appendChild(el('span', 'vkv-level-topic', level.topic));

    const badge = el('span', 'vkv-badge');
    if (level.score !== null) {
      badge.textContent = level.score + '/100';
      badge.classList.add(level.solved ? 'vkv-badge-ok' : 'vkv-badge-partial');
    } else {
      badge.textContent = '—';
      badge.classList.add('vkv-badge-none');
    }

    row.appendChild(num);
    row.appendChild(box);
    row.appendChild(badge);

    if (!level.code) row.classList.add('vkv-level-nocode');
    row.addEventListener('click', () => selectLevel(level.id));
    return row;
  }

  function selectLevel(id) {
    state.current = id;

    document.querySelectorAll('.vkv-level').forEach(node => {
      node.classList.toggle('vkv-level-active', node.dataset.level === String(id));
    });

    const level = state.levels.filter(l => l.id === id)[0];
    if (!level) return;

    const t = state.t;

    const title = document.getElementById('vkv-code-title');
    title.textContent = `${level.id}. ${level.name}` + (level.topic ? ` — ${level.topic}` : '');

    const meta = document.getElementById('vkv-code-meta');
    meta.textContent = (level.score !== null)
      ? `${t.result}: ${level.score}/100${level.solved ? ' · ' + t.counted : ''}`
      : t.notSolved;

    const body = document.getElementById('vkv-code-body');
    body.innerHTML = '';

    if (!level.code) {
      body.appendChild(el('div', 'vkv-empty', t.noCode));
      document.getElementById('vkv-copy').disabled = true;
      return;
    }

    document.getElementById('vkv-copy').disabled = false;

    const lines = level.code.replace(/\r\n/g, '\n').split('\n');
    const gutter = el('pre', 'vkv-gutter',
      lines.map((_, i) => i + 1).join('\n'));
    const code = el('pre', 'vkv-code', level.code);

    body.appendChild(gutter);
    body.appendChild(code);
  }

  function buildModal(result) {
    close();
    ensureStyles();

    const t = result.t || strings(null);
    state.t = t;

    const overlay = el('div', 'vkv-overlay');
    overlay.id = 'vkv-overlay';
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    const modal = el('div', 'vkv-modal');

    /* --- antraštė --- */
    const header = el('div', 'vkv-header');
    const gameTitle = (result.game && result.game.title) ? result.game.title : '';
    const titles = el('div', 'vkv-titles');
    titles.appendChild(el('div', 'vkv-title',
      gameTitle ? `${gameTitle} — ${t.title}` : t.title));
    titles.appendChild(el('div', 'vkv-subtitle',
      result.student.name + (result.student.attempt ? ` · ${result.student.attempt} ${t.attempt}` : '')));
    header.appendChild(titles);

    const closeBtn = el('button', 'vkv-close', '×');
    closeBtn.type = 'button';
    closeBtn.title = t.close;
    closeBtn.setAttribute('aria-label', t.close);
    closeBtn.addEventListener('click', close);
    header.appendChild(closeBtn);

    modal.appendChild(header);

    if (!result.ok) {
      const problem = el('div', 'vkv-problem');
      problem.appendChild(el('p', null, result.reason));
      modal.appendChild(problem);
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      document.addEventListener('keydown', onKeyDown);
      return;
    }

    /* --- suvestinė --- */
    const summary = el('div', 'vkv-summary');
    const percent = Math.round(result.solvedCount / result.total * 100);

    [
      [t.solvedOf,  `${result.solvedCount} ${t.of} ${result.total}`],
      [t.grade,     `${percent}%`],
      [t.status,    result.tracks['cmi.completion_status'] === 'completed' ? t.completed : t.incomplete],
      [t.lmsScore,  (result.tracks['cmi.score.raw'] || '—') + ' / 100'],
      [t.passedLbl, result.tracks['cmi.success_status'] === 'passed' ? t.yes : t.no]
    ].forEach(pair => {
      const item = el('div', 'vkv-stat');
      item.appendChild(el('span', 'vkv-stat-label', pair[0]));
      item.appendChild(el('span', 'vkv-stat-value', pair[1]));
      summary.appendChild(item);
    });
    modal.appendChild(summary);

    if (result.trimmed) {
      modal.appendChild(el('div', 'vkv-warning', t.trimmed));
    }

    /* --- turinys: lygių sąrašas ir kodas --- */
    const content = el('div', 'vkv-content');

    const list = el('div', 'vkv-list');
    result.levels.forEach(level => list.appendChild(levelRow(level)));
    content.appendChild(list);

    const pane = el('div', 'vkv-pane');
    const paneHead = el('div', 'vkv-pane-head');
    const codeTitle = el('div', 'vkv-code-title');
    codeTitle.id = 'vkv-code-title';
    const codeMeta = el('div', 'vkv-code-meta');
    codeMeta.id = 'vkv-code-meta';

    const paneTitles = el('div');
    paneTitles.appendChild(codeTitle);
    paneTitles.appendChild(codeMeta);
    paneHead.appendChild(paneTitles);

    const copyBtn = el('button', 'vkv-copy', t.copy);
    copyBtn.type = 'button';
    copyBtn.id = 'vkv-copy';
    copyBtn.addEventListener('click', () => {
      const level = state.levels.filter(l => l.id === state.current)[0];
      if (!level || !level.code) return;
      const done = (word) => {
        copyBtn.textContent = word;
        setTimeout(() => copyBtn.textContent = t.copy, 1500);
      };
      navigator.clipboard.writeText(level.code).then(
        () => done(t.copied),
        () => done(t.copyFailed)
      );
    });
    paneHead.appendChild(copyBtn);
    pane.appendChild(paneHead);

    const body = el('div', 'vkv-code-body');
    body.id = 'vkv-code-body';
    pane.appendChild(body);

    content.appendChild(pane);
    modal.appendChild(content);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    document.addEventListener('keydown', onKeyDown);

    /* atidarant rodomas pirmas uždavinys */
    state.levels = result.levels;
    const withCode = result.levels.filter(l => l.code)[0];
    selectLevel(withCode ? withCode.id : result.levels[0].id);
  }

  /* ================================================================ API */

  /** Atidaro peržiūrą pagal šiuo metu atidarytą puslapį */
  function open(source) {
    buildModal(parse(source || document));
  }

  /** Atidaro peržiūrą pagal įrašytą puslapio HTML (bandymams) */
  function openFromHtml(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    buildModal(parse(doc));
  }

  global.VikingsResultsViewer = {
    version: VERSION,
    open: open,
    openFromHtml: openFromHtml,
    close: close,
    parse: parse
  };

  // paleidus per bookmarkletą ar konsolę langas atsiveria iškart
  if (global.VIKINGS_VIEWER_AUTORUN !== false) open();

})(window);
