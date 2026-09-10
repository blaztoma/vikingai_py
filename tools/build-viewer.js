#!/usr/bin/env node
'use strict';

/**
 * Sprendimų peržiūros supakavimas į vieną HTML failą Moodle HTML blokeliui.
 *
 *   npm run build:viewer            – suspaustas variantas (numatyta)
 *   npm run build:viewer -- --pretty – be suspaudimo, patogu skaityti ir derinti
 *
 * Rezultatas: dist/moodle-block.html — visas turinys viename faile:
 * stiliai, peržiūros kodas ir nuoroda „Sprendimo peržiūra“. Failo turinį reikia
 * nukopijuoti į Moodle HTML blokelį (blokelio turinio redaktoriuje persijungus į
 * HTML kodo rodinį).
 *
 * Suspaudimas sąmoningai atsargus: išmetami tik atskiromis eilutėmis rašomi
 * komentarai ir tušti tarpai. Kodo struktūra nekeičiama, todėl nėra rizikos
 * sugadinti reguliariųjų reiškinių ar eilučių konstantų.
 */

const fs   = require('fs');
const path = require('path');

const ROOT   = path.resolve(__dirname, '..');
const VIEWER = path.join(ROOT, 'viewer');
// visi sugeneruoti failai (ir SCORM paketas, ir šis) guli tame pačiame dist/
const OUT_DIR = path.join(ROOT, 'dist');
const OUT     = path.join(OUT_DIR, 'moodle-block.html');

const pretty = process.argv.includes('--pretty');

/* ------------------------------------------------------------ suspaudimas */

/** Iš JS išmetami atskirose eilutėse esantys komentarai ir tuščios eilutės */
function shrinkJs(source) {
  return source
    .replace(/^[ \t]*\/\*[\s\S]*?\*\/[ \t]*$/gm, '')   // /* ... */ blokai nuo eilutės pradžios
    .replace(/^[ \t]*\/\/.*$/gm, '')                    // // komentarai atskirose eilutėse
    .replace(/\n{2,}/g, '\n')                           // tuščios eilutės
    .replace(/^[ \t]+/gm, '')                           // įtraukos
    .trim();
}

/** CSS: išmetami komentarai ir nereikalingi tarpai */
function shrinkCss(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s*([{};,])\s*/g, '$1')
    // tarpas PRIEŠ dvitaškį neliečiamas – „.vkv-modal ::-webkit-scrollbar“ yra
    // palikuonio selektorius, o sulipdytas jis reikštų visai kitą elementą
    .replace(/:\s+/g, ':')
    .replace(/;}/g, '}')
    .replace(/\s+/g, ' ')
    .trim();
}

function human(bytes) {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

/* ------------------------------------------------------------- surinkimas */

function build() {
  const cssSource = fs.readFileSync(path.join(VIEWER, 'results-viewer.css'), 'utf8');
  const jsSource  = fs.readFileSync(path.join(VIEWER, 'results-viewer.js'), 'utf8');

  const css = pretty ? cssSource : shrinkCss(cssSource);
  const js  = pretty ? jsSource  : shrinkJs(jsSource);

  // <\/script> apsauga: kodo viduje tokios sekos nėra, bet tikrinam iš principo
  const safeJs = js.replace(/<\/script/gi, '<\\/script');

  const html = `<!--
  Vikingų kelias — mokinio sprendimų peržiūra.
  Sugeneruota tools/build-viewer.js (${new Date().toISOString().slice(0, 10)}).
  Visas turinys viename faile: stiliai, kodas ir paleidimo nuoroda.
  Įkelti į Moodle: Įtraukti bloką → HTML → turinio redaktoriuje pereiti į HTML
  rodinį (<> mygtukas) ir įklijuoti visą šį tekstą.

  Stiliai laikomi skripto viduje, o ne atskira stiliaus žyme: Moodle blokelių
  turinį valo ir tokią žymę dažnai pašalina — tada langas atsivertų be jokio
  apipavidalinimo.
-->
<div class="vkv-block">
  <a href="#" class="vkv-launch" data-vkv-launch>
    <span class="vkv-launch-rune">ᚠ</span> Sprendimo peržiūra
  </a>
</div>

<script>
(function () {
  if (window.VikingsResultsViewer) { bindLaunchers(); return; }
  window.VIKINGS_VIEWER_AUTORUN = false;
  window.VIKINGS_VIEWER_CSS = ${JSON.stringify(css)};

${safeJs}

  bindLaunchers();

  function bindLaunchers() {
    document.querySelectorAll('[data-vkv-launch]').forEach(function (link) {
      if (link.dataset.vkvBound) return;
      link.dataset.vkvBound = '1';
      link.addEventListener('click', function (e) {
        e.preventDefault();
        window.VikingsResultsViewer.open();
      });
    });
  }
})();
</script>
`;

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT, html, 'utf8');

  const before = cssSource.length + jsSource.length;
  console.log(`Failas:  ${path.relative(ROOT, OUT)}`);
  console.log(`Dydis:   ${human(html.length)}${pretty ? '' : ` (iš ${human(before)})`}`);
  console.log('');
  console.log('Įkėlimas į Moodle:');
  console.log('  1. Kurse įjunk redagavimo režimą ir spausk „Įtraukti bloką“ → „HTML“.');
  console.log('  2. Blokelio turinio redaktoriuje pereik į HTML rodinį (mygtukas <>).');
  console.log('  3. Įklijuok viso šio failo turinį ir išsaugok.');
  console.log('  4. Blokelio nustatymuose parink „Rodyti bet kuriame puslapyje“, kad');
  console.log('     nuoroda matytųsi ir SCORM ataskaitos puslapyje.');
}

try {
  build();
} catch (err) {
  console.error('Nepavyko surinkti peržiūros failo:', err.message);
  process.exit(1);
}
