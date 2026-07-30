/**
 * Vietovių (lokacijų) aprašai.
 *
 * x, y  – koordinatės žemėlapio SVG erdvėje (viewBox 0 0 1000 620)
 * topic – programavimo tema, kuri sprendžiama toje vietovėje
 * task  – katalogas levels/level_N/ (sprendimai ir testai)
 *
 * Uždavinių sąlygos – js/tasks.js (raktas = vietovės id).
 */
/**
 * Vietovės filmas — rodomas atplaukus, prieš tos vietovės uždavinį.
 * 1 vietovė → videos/video_1.mp4 (kartu ir įvadinis), 2 vietovė → video_2.mp4 ir t.t.
 */
function locationVideo(locationId) {
  return `videos/video_${locationId}.mp4`;
}

/** Baigiamasis filmas – po paskutinės vietovės uždavinio */
const OUTRO_VIDEO = 'videos/outro.mp4';

const LOCATIONS = [
  {
    id: 1,
    name: 'Bjornheimas',
    subtitle: 'Gimtasis kaimas fjorde.',
    x: 878, y: 176,
    topic: 'Įvestis ir išvestis',
    task: 'levels/level_1/',
    intro: 'Prieš išplaukiant skaldas įrašo į sagą kiekvieno keliautojo vardą — pirmiausia jo reikia paklausti.',
    debrief: 'Moki perskaityti tai, ką įveda vartotojas, ir parodyti atsakymą. Kitoje vietovėje reikės tuos duomenis kur nors išsaugoti — pasitelksi kintamuosius.'
  },
  {
    id: 2,
    name: 'Haugro uostas',
    subtitle: 'Paskutinis uostas prieš išplaukiant į atvirą jūrą',
    x: 836, y: 296,
    topic: 'Kintamieji',
    task: 'levels/level_2/',
    intro: 'Į drakarą kraunamos atsargos. Kiekvienas skaičius turi turėti savo vardą, kitaip viskas susimaišys.',
    debrief: 'Kintamasis — dėžė su užrašu. Toliau tas dėžes reikės sudėti, atimti ir dalyti.'
  },
  {
    id: 3,
    name: 'Šetlando salos',
    subtitle: 'Vėjuotos uolos šiaurėje.',
    x: 701, y: 243,
    topic: 'Matematinės operacijos',
    task: 'levels/level_3/',
    intro: 'Šturmanas skaičiuoja, kiek dienų truks kelionė ir kiek maisto tam prireiks.',
    debrief: 'Skaičiavimai — programos raumenys. Kitoje vietovėje teks priimti sprendimą: taip ar ne.'
  },
  {
    id: 4,
    name: 'Farerų salos',
    subtitle: 'Avių sala rūkuose.',
    x: 619, y: 188,
    topic: 'Sąlyga if',
    task: 'levels/level_4/',
    intro: 'Ar šieno užteks bandai iki pavasario? Nuo atsakymo priklauso, ar žiemosime saloje.',
    debrief: 'Programa jau moka pasirinkti iš dviejų kelių. Toliau kelių bus daugiau nei du.'
  },
  {
    id: 5,
    name: 'Lindisfarnas',
    subtitle: 'Šventoji sala prie Anglijos krantų.',
    x: 686, y: 396,
    topic: 'Sudėtinės sąlygos (if / else if)',
    task: 'levels/level_5/',
    intro: 'Sargybinis pagal vėliavą ir irklų skaičių sprendžia, kas artėja prie kranto.',
    debrief: 'Kelios sąlygos viena po kitos aprėpia visus atvejus. Kitoje vietovėje tą patį veiksmą kartosi daug kartų — tam yra ciklas.'
  },
  {
    id: 6,
    name: 'Dublinas',
    subtitle: 'Prekyvietė prie Lifio.',
    x: 566, y: 434,
    topic: 'Ciklas for',
    task: 'levels/level_6/',
    intro: 'Prekeivis nori kainoraščio: kiek kainuoja 1, 2, 3 … kailiai. Rašyti ranka per ilga.',
    debrief: 'Ciklas for kartoja žinomą kartų skaičių. O kaip elgtis, kai iš anksto nežinai, kiek kartų?'
  },
  {
    id: 7,
    name: 'Islandija',
    subtitle: 'Ugnies ir ledo žemė.',
    x: 476, y: 146,
    topic: 'Ciklas while',
    task: 'levels/level_7/',
    intro: 'Ugnikalnis pabudo. Bėgame tol, kol pasieksime saugų krantą — o kiek žingsnių jų prireiks, niekas nežino.',
    debrief: 'Ciklas while sukasi, kol galioja sąlyga. Toliau ciklas ne tik kartos — jis dar ir skaičiuos.'
  },
  {
    id: 8,
    name: 'Grenlandija',
    subtitle: 'Ledynų pakrantė.',
    x: 258, y: 112,
    topic: 'Suma ir kiekis',
    task: 'levels/level_8/',
    intro: 'Naujakuriai suneša sugautas žuvis į bendrą krūvą. Reikia žinoti, kiek jų iš viso ir kiek buvo žvejų.',
    debrief: 'Kaupiamoji suma ir skaitiklis — du svarbiausi ciklo pagalbininkai. Iš jų gimsta vidurkis.'
  },
  {
    id: 9,
    name: 'Helulandas',
    subtitle: 'Plokščiųjų akmenų krantas.',
    x: 132, y: 258,
    topic: 'Vidurkis, didžiausia ir mažiausia reikšmė',
    task: 'levels/level_9/',
    intro: 'Iš dienoraščio įrašų reikia sužinoti, koks buvo vidutinis, šalčiausias ir šilčiausias kelionės oras.',
    debrief: 'Iš to paties ciklo gali gauti kelis atsakymus iškart. Liko paskutinis iššūkis — ciklas ciklo viduje.'
  },
  {
    id: 10,
    name: 'Vinlandas',
    subtitle: 'Naujoji Žemė vakaruose.',
    x: 118, y: 432,
    topic: 'Ciklas cikle',
    task: 'levels/level_10/',
    intro: 'Naujoji žemė dalijama į stačiakampius laukus — eilutė po eilutės, langelis po langelio.',
    debrief: 'Kelionė baigta: nuo pirmo įvesto vardo iki dvimačio lauko. Sagą apie tavo įgūdžius giedos skaldai.'
  }
];
