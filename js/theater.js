/**
 * Kino ir kodo sluoksnis virš žemėlapio.
 *
 * Theater.showVideo(src, title, onEnd) – groja filmą per visą žemėlapio plotą;
 *                                        pasibaigus (arba praleidus) kviečia onEnd().
 * Theater.showCoding(loc, task)        – filmo vietoje parodo programavimo langą (kol kas placeholderis).
 * Theater.hide()                       – atlaisvina žemėlapį (kelionė laivu).
 */
const Theater = (function () {
  const root = document.getElementById('theater');
  let current = null;      // aktyvus <video>, kad galėtume sustabdyti
  let lastCoding = null;   // paskutinis rodytas lygis – kad galėtume jį perkrauti

  const LEAVE_MS = 320; // turi sutapti su .scene-leave trukme CSS'e

  function stopVideo() {
    if (!current) return;
    current.pause();
    current = null;
  }

  /**
   * Naują sceną (filmą ar kodo langą) įstato vietoj senosios:
   * senoji nublunka didėdama, naujoji įplaukia iš mažesnio mastelio.
   */
  function mount(box, mode, opts) {
    root.hidden = false;
    root.classList.remove('closing', 'minimized');   // nauja scena visada pilno dydžio
    root.dataset.mode = mode;

    const prev = root.firstElementChild;
    if (prev) {
      prev.classList.add('scene-leave');
      setTimeout(() => prev.remove(), LEAVE_MS);
    }

    box.classList.add('scene', 'scene-enter');
    root.appendChild(box);

    if (!opts || !opts.manualReveal) reveal(box);
  }

  /** Scena parodoma (nuimama pradinė būsena) – dvigubas rAF, kad animacija tikrai suveiktų */
  function reveal(box) {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => box.classList.remove('scene-enter')));
  }

  /** Sluoksnis pasitraukia (kelionė laivu) – irgi ne staiga, o nublukdamas */
  function hide() {
    if (root.hidden) return;
    stopVideo();
    root.classList.add('closing');

    setTimeout(() => {
      if (!root.classList.contains('closing')) return;   // per tą laiką atsirado nauja scena
      root.innerHTML = '';
      root.hidden = true;
      root.dataset.mode = '';
      root.classList.remove('closing', 'minimized');
    }, LEAVE_MS);
  }

  /* ------------------------------------------------------------ filmas */

  function showVideo(src, title, onEnd) {
    stopVideo();

    const box = document.createElement('div');
    box.className = 'theater-video';
    box.innerHTML = `
      <video id="scene-video" playsinline preload="auto" controls></video>
      <div class="theater-bar">
        <span class="theater-title">${title}</span>
        <button class="btn btn-ghost btn-skip" id="btn-skip">Praleisti filmą ▸</button>
      </div>`;
    mount(box, 'video');

    const video = box.querySelector('video');
    current = video;

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      onEnd();
    };

    video.addEventListener('ended', finish);
    video.addEventListener('error', () => showMissing(src, title, finish));
    box.querySelector('#btn-skip').addEventListener('click', finish);

    video.src = src;
    const p = video.play();
    if (p && p.catch) {
      // naršyklė gali neleisti automatinio paleidimo su garsu – rodome mygtuką
      p.catch(() => box.classList.add('needs-play'));
    }

    // rankinio paleidimo mygtukas, jei autoplay užblokuotas
    const playBtn = document.createElement('button');
    playBtn.className = 'big-play';
    playBtn.innerHTML = '▶';
    playBtn.addEventListener('click', () => {
      video.play();
      box.classList.remove('needs-play');
    });
    box.appendChild(playBtn);
  }

  /** Filmo dar nėra – nerodome klaidos, o tiesiog leidžiame eiti toliau */
  function showMissing(src, title, finish) {
    stopVideo();

    const box = document.createElement('div');
    box.className = 'theater-video missing';
    box.innerHTML = `
      <div class="missing-card">
        <div class="missing-icon">▶</div>
        <h3>${title}</h3>
        <p>Šio filmo failas dar neįkeltas.</p>
        <code>${src}</code>
        <button class="btn btn-primary" id="btn-missing">Tęsti</button>
      </div>`;
    mount(box, 'video');
    box.querySelector('#btn-missing').addEventListener('click', finish);
  }

  /* -------------------------------------------------- programavimo langas */

  function showCoding(loc, task) {
    stopVideo();
    lastCoding = { loc, task };

    const box = document.createElement('div');
    box.className = 'code-window';
    box.innerHTML = `
      <div class="code-titlebar">
        <span class="code-dots"><i></i><i></i><i></i></span>
        <span class="code-title">${loc.id}. ${loc.name} — ${task ? task.title : loc.topic}</span>
        <span class="code-lang">${loc.topic}</span>
        <span class="win-buttons">
          <button class="win-btn" id="btn-min" title="Sutraukti langą ir pamatyti žemėlapį"
                  aria-label="Sutraukti langą">─</button>
          <button class="win-btn" id="btn-max" title="Išskleisti langą"
                  aria-label="Išskleisti langą" disabled>▣</button>
        </span>
      </div>

      <div class="code-main">
        <iframe class="code-frame" src="${loc.task}"
                title="Programavimo aplinka: ${loc.name}"></iframe>
        <div class="frame-loading">
          <div class="frame-spinner"></div>
          <div class="frame-loading-text">Kraunama programavimo aplinka…</div>
        </div>
      </div>

      <div class="code-toolbar">
        <span class="code-note" id="code-note">Parašyk sprendimą ir spausk „Paleisti“</span>
        <button class="btn btn-ghost" id="btn-run">Paleisti</button>
        <button class="btn btn-primary" id="btn-check">Tikrinti</button>
      </div>`;
    // Lango rėmas atsiranda iš karto galutinio dydžio, o jo viduje sukasi
    // mūsų pačių indikatorius – lygio aplinka nublunka tik jai susikrovus.
    mount(box, 'code');

    const frame = box.querySelector('.code-frame');
    frame.addEventListener('load', () => {
      makeTransparent(frame);
      bridgeScore(frame);
      waitForLevelReady(box, frame);
    });
    watchFrame(frame, loc);
    wireToolbar(box, frame);
    wireWindowButtons(box);
  }

  /**
   * Sutraukimas / išskleidimas. Langas nėra išardomas — tik paslepiamas jo vidus,
   * todėl iframe'as lieka gyvas ir studento kodas bei įkelta aplinka niekur nedingsta.
   */
  function wireWindowButtons(box) {
    const minBtn = box.querySelector('#btn-min');
    const maxBtn = box.querySelector('#btn-max');

    const setMinimized = (on) => {
      root.classList.toggle('minimized', on);
      minBtn.disabled = on;
      maxBtn.disabled = !on;
    };

    minBtn.addEventListener('click', () => setMinimized(true));
    maxBtn.addEventListener('click', () => setMinimized(false));

    // dvigubas spustelėjimas ant antraštės – tas pats perjungimas
    box.querySelector('.code-titlebar').addEventListener('dblclick', (e) => {
      if (e.target.closest('.win-btn')) return;
      setMinimized(!root.classList.contains('minimized'));
    });
  }

  /**
   * Apatinės juostos mygtukai kviečia lygio programos funkcijas iframe'o viduje:
   *   „Paleisti“ → runProgram()
   *   „Tikrinti“ → evalProgram()
   * Apie sprendimo teisingumą lygio programa praneša atskirai, per postMessage.
   */
  function wireToolbar(box, frame) {
    const note = box.querySelector('#code-note');

    const say = (text, isError) => {
      note.textContent = text;
      note.classList.toggle('error', !!isError);
    };

    const call = (fnName, labels) => {
      const win = frame.contentWindow;
      try {
        if (!win || typeof win[fnName] !== 'function') {
          say(`Šio lygio programoje nerasta ${fnName}() funkcijos`, true);
          return;
        }
        say(labels.busy);
        const result = win[fnName]();

        // Pyodide gali grąžinti Promise – palaukiam pabaigos
        if (result && typeof result.then === 'function') {
          result.then(
            () => say(labels.done),
            err => say(labels.fail + ': ' + err, true)
          );
        } else {
          say(labels.done);
        }
      } catch (e) {
        say(labels.fail + ': ' + e.message, true);
      }
    };

    box.querySelector('#btn-run').addEventListener('click', () => call('runProgram', {
      busy: 'Programa vykdoma…',
      done: 'Programa įvykdyta',
      fail: 'Klaida vykdant programą'
    }));

    box.querySelector('#btn-check').addEventListener('click', () => call('evalProgram', {
      busy: 'Sprendimas tikrinamas…',
      done: 'Tikrinimas baigtas',
      fail: 'Klaida tikrinant sprendimą'
    }));
  }

  /**
   * Lygio aplinka kraunasi dinamiškai (ui_loader.js parodo savo „Kraunama…“ sluoksnį,
   * paskui pakeičia visą <body> turinį). Todėl iframe'ą rodome tik tada, kai tas
   * sluoksnis dingsta — kitaip matytųsi, kaip turinys persipiešia jau lange.
   */
  function waitForLevelReady(box, frame) {
    const MAX_WAIT = 30000;
    const started  = Date.now();

    const done = () => {
      if (!frame.isConnected) return;
      frame.classList.add('ready');
      const loader = box.querySelector('.frame-loading');
      if (loader) {
        loader.classList.add('gone');
        setTimeout(() => loader.remove(), 400);
      }
    };

    const check = () => {
      if (!frame.isConnected) return;             // etapas pasikeitė
      if (Date.now() - started > MAX_WAIT) return done();

      try {
        const doc = frame.contentDocument;
        // dar sukasi lygio aplinkos suktukas arba <body> tuščias
        const busy = !doc ||
                     doc.querySelector('.pywasm-spinner-overlay') ||
                     doc.documentElement.classList.contains('pywasm-preloading') ||
                     !doc.body ||
                     doc.body.children.length === 0;
        if (busy) return setTimeout(check, 150);
      } catch (e) { /* kito kilmės šaltinio puslapis – rodome iš karto */ }

      done();
    };

    check();
  }

  /**
   * LAIKINAS TILTAS.
   *
   * Naujoji lygio programos versija rezultatą atsiųs pati per sendScoreToParent().
   * Serveryje esančiame pakete tos funkcijos dar nėra, o SCORM kelias (setScore)
   * neveikia, nes be LMS `useScorm` yra false. Todėl apgaubiame showOverallResults() —
   * ji iškviečiama, kai visi testai jau atlikti, ir tuo metu:
   *     actualScore   – surinkti taškai (0–100)
   *     passing_score – kiek reikia, kad būtų įskaityta
   * Kai tik iframe'e atsiras sendScoreToParent, tiltas savaime nebeįsijungs.
   */
  function bridgeScore(frame) {
    let tries = 0;

    const attach = () => {
      const win = frame.contentWindow;
      if (!frame.isConnected || !win) return;                       // etapas pasikeitė

      try {
        if (typeof win.sendScoreToParent === 'function') return;    // programa praneša pati
        if (typeof win.showOverallResults !== 'function') {
          if (++tries < 120) setTimeout(attach, 300);               // paketas dar kraunasi
          return;
        }
        if (win.__vikingsBridge) return;
        win.__vikingsBridge = true;

        const original = win.showOverallResults;
        win.showOverallResults = function () {
          const result = original.apply(this, arguments);
          try {
            const score   = Number(win.actualScore);
            const mastery = Number(win.passing_score);
            if (Number.isFinite(score)) {
              window.postMessage({
                type: 'setScore',
                score: score,
                masteryScore: Number.isFinite(mastery) && mastery > 0 ? mastery : 100,
                status: score >= mastery ? 'passed' : 'failed'
              }, location.origin);
            }
          } catch (e) { /* rezultato nepavyko nuskaityti */ }
          return result;
        };
      } catch (e) { /* kito kilmės šaltinio puslapis */ }
    };

    attach();
  }

  /**
   * Lygio puslapis pats piešia baltą foną, todėl permatomumui neužtenka
   * iframe'o stiliaus – įrašome taisyklę į patį dokumentą (jis to paties serverio).
   */
  function makeTransparent(frame) {
    try {
      const doc = frame.contentDocument;
      if (!doc || !doc.head || doc.getElementById('vikings-frame-style')) return;

      const style = doc.createElement('style');
      style.id = 'vikings-frame-style';
      style.textContent = `
        html, body { background: transparent !important; }

        /* slankjuostės – tokios pačios kaip žaidimo aplinkoje */
        * { scrollbar-width: thin; scrollbar-color: #b8892f #0a151d; }

        /* !important – lygio aplinkos CSS užkraunamas vėliau už šį */
        ::-webkit-scrollbar { width: 11px !important; height: 11px !important; }
        ::-webkit-scrollbar-track {
          background: #0a151d !important;
          border-left: 1px solid #2c4252 !important;
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #f0c874, #9c7423) !important;
          border: 2px solid #0a151d !important;
          border-radius: 8px !important;
          min-height: 34px;
        }
        ::-webkit-scrollbar-thumb:hover  { background: linear-gradient(180deg, #ffdf9b, #d9a441) !important; }
        ::-webkit-scrollbar-thumb:active { background: #d9a441 !important; }
        ::-webkit-scrollbar-corner { background: #0a151d !important; }
      `;
      doc.head.appendChild(style);
    } catch (e) { /* kito kilmės šaltinio puslapis – praleidžiam */ }
  }

  /**
   * Jei lygio kataloge dar nėra index.html, serveris grąžina katalogo sąrašą –
   * tada vietoj jo rodome paaiškinimą. Puslapio turinio netikriname: programavimo
   * aplinka gali būti generuojama JS'u, todėl tuščias <body> nieko nereiškia.
   */
  function watchFrame(frame, loc) {
    frame.addEventListener('error', () => frameFallback(frame, loc));

    fetch(loc.task)
      .then(res => (res.ok ? res.text() : Promise.reject(new Error(res.status))))
      .then(html => {
        if (/<title>\s*Index of/i.test(html)) frameFallback(frame, loc);
      })
      .catch(() => frameFallback(frame, loc));
  }

  function frameFallback(frame, loc) {
    const holder = frame.parentNode;
    if (!holder || !frame.isConnected) return;   // etapas jau pasikeitė

    const win = frame.closest('.code-window');
    if (win) {
      win.querySelectorAll('.code-toolbar .btn').forEach(b => { b.disabled = true; });
      const note = win.querySelector('#code-note');
      if (note) note.textContent = 'Nėra ko paleisti — lygio programa neįkelta';
    }
    holder.innerHTML = `
      <div class="frame-missing">
        <div class="missing-icon">⌨</div>
        <h3>Šio lygio programa dar neįkelta</h3>
        <p>Programavimo aplinka bus įkeliama iš katalogo:</p>
        <code>${loc.task}</code>
        <p class="frame-missing-note">Įdėk ten <code>index.html</code> — jis iškart atsiras šiame lange.</p>
      </div>`;
  }

  /** Atidarytą lygį įkelia iš naujo (pvz., ištrynus išsaugotus sprendimus) */
  function reloadLevel() {
    if (root.hidden || root.dataset.mode !== 'code' || !lastCoding) return;
    showCoding(lastCoding.loc, lastCoding.task);
  }

  return { showVideo, showCoding, hide, reloadLevel };
})();
