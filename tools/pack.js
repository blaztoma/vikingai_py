#!/usr/bin/env node
'use strict';

/**
 * SCORM paketo pakuotojas.
 *
 *   npm run package        – supakuoja viską, įskaitant filmus
 *   npm run package:lite   – be filmų (žr. --no-videos paaiškinimą apačioje)
 *
 * Rezultatas: dist/vikings_cpp_scorm.zip — failas, kurį galima iškart įkelti į
 * Moodle (Veikla → SCORM paketas).
 *
 * Papildomai pakuotojas atnaujina imsmanifest.xml failų sąrašą: į ZIP patenkanti
 * manifesto kopija išvardija visus paketo failus, nors darbiniame kataloge
 * manifestas lieka trumpas. Taip paketas praeina griežtesnių LMS patikras.
 *
 * Priklausomybių nėra — ZIP rašomas rankomis, suspaudimui naudojamas įtaisytas
 * zlib. Jau suspausti formatai (mp4, png, …) dedami be pakartotinio spaudimo.
 */

const fs   = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT     = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT, 'dist');

/** Į paketą nekeliauja niekada */
// „viewer“ – mokytojo įrankis Moodle ataskaitai; mokiniams jo pakete nereikia
const SKIP_DIRS  = ['.git', 'dist', 'tools', 'viewer', 'node_modules', '.vscode', '.idea', '.junie'];
const SKIP_FILES = ['.htaccess', 'package.json', 'package-lock.json', '.gitignore', '.DS_Store'];
const SKIP_EXT   = ['.iml', '.log', '.zip'];

/** Šių formatų spausti neapsimoka – jie jau suspausti */
const STORE_EXT = ['.mp4', '.webm', '.mp3', '.ogg', '.png', '.jpg', '.jpeg', '.gif',
                   '.webp', '.ico', '.zip', '.woff', '.woff2', '.gz'];

/* ------------------------------------------------------------ argumentai */

const args = process.argv.slice(2);
const options = {
  videos: !args.includes('--no-videos'),
  out:    (args.find(a => a.startsWith('--out=')) || '').slice(6) || null,
  quiet:  args.includes('--quiet')
};

/* ------------------------------------------------------------ CRC32 */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  return table;
})();

function crc32(buffer) {
  let crc = -1;
  for (let i = 0; i < buffer.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buffer[i]) & 0xFF];
  }
  return (crc ^ -1) >>> 0;
}

/* ------------------------------------------------------------ ZIP rašymas */

/** DOS laiko formatas ZIP antraštėms */
function dosTime(date) {
  const time = ((date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() / 2)) & 0xFFFF;
  const day  = (((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()) & 0xFFFF;
  return { time, day };
}

class ZipWriter {
  constructor(target) {
    this.stream  = fs.createWriteStream(target);
    this.entries = [];
    this.offset  = 0;
  }

  write(buffer) {
    this.offset += buffer.length;
    if (!this.stream.write(buffer)) {
      return new Promise(resolve => this.stream.once('drain', resolve));
    }
    return Promise.resolve();
  }

  async addFile(name, content, modified) {
    const stored     = STORE_EXT.includes(path.extname(name).toLowerCase());
    const compressed = stored ? content : zlib.deflateRawSync(content, { level: 9 });
    const method     = stored ? 0 : 8;
    const { time, day } = dosTime(modified || new Date());
    const nameBuf    = Buffer.from(name, 'utf8');
    const crc        = crc32(content);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);       // parašas
    local.writeUInt16LE(20, 4);               // reikalinga versija
    local.writeUInt16LE(0x0800, 6);           // vėliavos: UTF-8 vardai
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(day, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(content.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);               // extra laukų nėra

    this.entries.push({
      nameBuf, crc, method, time, day,
      csize: compressed.length,
      usize: content.length,
      offset: this.offset
    });

    await this.write(local);
    await this.write(nameBuf);
    await this.write(compressed);
  }

  async finish() {
    const start = this.offset;

    for (const e of this.entries) {
      const header = Buffer.alloc(46);
      header.writeUInt32LE(0x02014b50, 0);    // centrinio katalogo įrašas
      header.writeUInt16LE(20, 4);            // sukūrusi versija
      header.writeUInt16LE(20, 6);            // reikalinga versija
      header.writeUInt16LE(0x0800, 8);
      header.writeUInt16LE(e.method, 10);
      header.writeUInt16LE(e.time, 12);
      header.writeUInt16LE(e.day, 14);
      header.writeUInt32LE(e.crc, 16);
      header.writeUInt32LE(e.csize, 20);
      header.writeUInt32LE(e.usize, 24);
      header.writeUInt16LE(e.nameBuf.length, 28);
      header.writeUInt16LE(0, 30);            // extra
      header.writeUInt16LE(0, 32);            // komentaras
      header.writeUInt16LE(0, 34);            // disko numeris
      header.writeUInt16LE(0, 36);            // vidiniai požymiai
      header.writeUInt32LE(0, 38);            // išoriniai požymiai
      header.writeUInt32LE(e.offset, 42);

      await this.write(header);
      await this.write(e.nameBuf);
    }

    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0);
    end.writeUInt16LE(0, 4);
    end.writeUInt16LE(0, 6);
    end.writeUInt16LE(this.entries.length, 8);
    end.writeUInt16LE(this.entries.length, 10);
    end.writeUInt32LE(this.offset - start, 12);
    end.writeUInt32LE(start, 16);
    end.writeUInt16LE(0, 20);

    await this.write(end);

    return new Promise((resolve, reject) => {
      this.stream.on('error', reject);
      this.stream.end(resolve);
    });
  }
}

/* ------------------------------------------------------------ failų rinkimas */

function collect(dir, base = '') {
  const found = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      if (SKIP_DIRS.includes(entry.name)) continue;
      if (!options.videos && rel === 'videos') continue;
      found.push(...collect(path.join(dir, entry.name), rel));
      continue;
    }

    if (SKIP_FILES.includes(entry.name)) continue;
    if (SKIP_EXT.includes(path.extname(entry.name).toLowerCase())) continue;
    found.push(rel);
  }

  return found;
}

/** Į manifesto kopiją surašomi visi paketo failai */
function buildManifest(files) {
  const source = fs.readFileSync(path.join(ROOT, 'imsmanifest.xml'), 'utf8');
  const list = files
    .filter(f => f !== 'imsmanifest.xml')
    .map(f => `      <file href="${f.replace(/&/g, '&amp;')}"/>`)
    .join('\n');

  const replaced = source.replace(
    /<!-- FILES:BEGIN -->[\s\S]*?<!-- FILES:END -->/,
    `<!-- FILES:BEGIN -->\n${list}\n      <!-- FILES:END -->`);

  if (replaced === source) {
    console.warn('  ! imsmanifest.xml neturi FILES žymių — failų sąrašas nepapildytas');
  }
  return Buffer.from(replaced, 'utf8');
}

/** ZIP failo vardas pagal package.json (vikings-cpp-scorm → vikings_cpp_scorm) */
function packageName() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    if (pkg.name) return String(pkg.name).replace(/[^a-z0-9_]+/gi, '_');
  } catch (e) { /* be package.json – naudojam bendrą vardą */ }
  return 'scorm_paketas';
}

function human(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/* ------------------------------------------------------------ pagrindinis */

async function main() {
  const files = collect(ROOT).sort();

  if (!files.includes('index.html') || !files.includes('imsmanifest.xml')) {
    console.error('KLAIDA: nerastas index.html arba imsmanifest.xml — ar tikrai pakuojamas žaidimo katalogas?');
    process.exit(1);
  }

  fs.mkdirSync(DIST_DIR, { recursive: true });

  // pavadinimas imamas iš package.json – tas pats pakuotojas tinka abiem žaidimams
  const base   = packageName();
  const name   = options.videos ? `${base}.zip` : `${base}_be_filmu.zip`;
  const target = options.out ? path.resolve(ROOT, options.out) : path.join(DIST_DIR, name);

  console.log(`Pakuojama: ${files.length} failų${options.videos ? '' : ' (be filmų)'}`);

  const zip = new ZipWriter(target);
  let raw = 0;

  for (const rel of files) {
    const full = path.join(ROOT, rel);
    const stat = fs.statSync(full);

    const content = rel === 'imsmanifest.xml'
      ? buildManifest(files)
      : fs.readFileSync(full);

    raw += content.length;
    await zip.addFile(rel, content, stat.mtime);

    if (!options.quiet && stat.size > 2 * 1024 * 1024) {
      console.log(`  · ${rel} (${human(stat.size)})`);
    }
  }

  await zip.finish();

  const packed = fs.statSync(target).size;
  console.log('');
  console.log(`Paketas:   ${path.relative(ROOT, target)}`);
  console.log(`Dydis:     ${human(packed)} (turinio ${human(raw)})`);
  console.log(`Failų:     ${files.length}`);

  if (packed > 50 * 1024 * 1024) {
    console.log('');
    console.log('DĖMESIO: paketas didesnis nei 50 MB — tiek dažnai leidžia įkelti Moodle.');
    console.log('  • padidinkite įkėlimo ribą (Site administration → Security → Site security settings), arba');
    console.log('  • supakuokite be filmų:  npm run package:lite');
    console.log('    ir nurodykite filmų adresą js/config.js faile (VIDEO_BASE).');
  }
}

main().catch(err => {
  console.error('Nepavyko supakuoti:', err);
  process.exit(1);
});
