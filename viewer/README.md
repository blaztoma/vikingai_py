# Mokinio sprendimų peržiūra

Įrankis mokytojui: Moodle SCORM ataskaitos puslapyje parodo, kokius uždavinius
mokinys įveikė ir kokį kodą parašė. Duomenys imami iš `cmi.suspend_data` lauko,
kur žaidimas įrašo įverčius ir base64 užkoduotus sprendimus.

Šis katalogas **į SCORM paketą nepakuojamas** — `tools/pack.js` jį praleidžia.

## Failai

| Failas | Paskirtis |
|---|---|
| `results-viewer.js` | Duomenų išrinkimas iš puslapio ir modalinis langas |
| `results-viewer.css` | Lango ir paleidimo nuorodos stiliai |
| `bookmarklet.html` | Adresyno mygtuko ir konsolės kodo generatorius |
| `index.html` | Bandymai be Moodle — įklijuok ataskaitos HTML |
| `bandymas.html` | Imituotas Moodle puslapis blokeliui išbandyti |
| `../dist/moodle-block.html` | Sugeneruotas vieno failo variantas Moodle HTML blokeliui |

## Du naudojimo būdai

### 1. HTML blokelis (visiems mokytojams kurse)

```bash
npm run build:viewer
```

Sugeneruoja `dist/moodle-block.html` (projekto šaknyje, šalia SCORM paketo) —
vieną failą su stiliais, kodu ir nuoroda.
Moodle: **Įtraukti bloką → HTML**, turinio redaktoriuje pereiti į HTML rodinį
(`<>` mygtukas), įklijuoti viso failo turinį. Blokelio nustatymuose parinkus
„Rodyti bet kuriame puslapyje“, nuoroda **Sprendimo peržiūra** matoma ir SCORM
ataskaitos puslapyje.

> Moodle iš blokelių turinio išvalo `<script>`, jei svetainėje neįjungtas
> patikimas turinys. Reikia: *Svetainės administravimas → Saugumas → Svetainės
> saugumo nuostatos → „Įjungti patikimą turinį“* (`enabletrusttext`) ir
> `moodle/site:trustcontent` teisė. Jei to įjungti negalima, naudok antrą būdą.

### 2. Adresyno mygtukas (nereikia jokių teisių)

Atsidaryk `bookmarklet.html`, nutempk mygtuką į adresyno juostą ir spustelėk jį
būdamas mokinio ataskaitos puslapyje. Tame pačiame puslapyje yra ir kodas
įklijavimui į naršyklės konsolę (`F12` → Console).

## Nepriklausomybė nuo žaidimo

Įrankyje nėra nė vieno lygio pavadinimo ar temos — viską jis perskaito iš
`cmi.suspend_data`. Todėl tas pats failas tinka ir C++, ir Python versijai, ir
bet kuriam kitam žaidimui, kuris rašo tokį įrašą:

```json
{
  "v": 4,
  "game": {
    "id": "vikings-cpp",
    "title": "Vikingų kelias (C++)",
    "lang": "lt",
    "codeLang": "cpp",
    "total": 10,
    "levels": [
      { "id": 1, "name": "Bjornheimas", "topic": "Įvestis ir išvestis" }
    ]
  },
  "solved": [1],
  "scores": { "1": 100 },
  "code":   { "1": "<base64 užkoduotas sprendimas>" }
}
```

* `game.lang` parenka peržiūros sąsajos kalbą (`lt`, `en`; nežinoma kalba →
  lietuvių). Naujas kalbas galima įrašyti į `STRINGS` žodyną `results-viewer.js`.
* `game.levels` duoda pavadinimus ir temas; jei jų nėra, lygiai vadinami
  bendriniu vardu („1 lygis“), tad senesni įrašai vis tiek rodomi.
* Sprendimai visada base64 — taip išlieka eilučių laužymai ir raidės su
  diakritikais.

Žaidimo pusėje aprašą sudaro `GAME_INFO` (`js/config.js`) ir vietovių sąrašas
(`js/locations.js`); jį suformuoja `gameInfo()` funkcija `js/game.js` faile.

## Kur veikia

Moodle: **SCORM paketas → Ataskaitos → mokinio eilutė → „Sekimo išsami
informacija“** (`/mod/scorm/report/userreporttracks.php`).

Kituose puslapiuose langas atsidarys su paaiškinimu, kad `cmi.suspend_data`
nerastas.

## Kai keičiamas kodas

Pataisius `results-viewer.js` ar `.css`, blokelio failą reikia sugeneruoti iš
naujo (`npm run build:viewer`) ir įklijuoti į blokelį. Adresyno mygtukas
atsinaujina tiesiog perkrovus `bookmarklet.html`.
