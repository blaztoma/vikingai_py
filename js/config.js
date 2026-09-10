/**
 * Paketo nustatymai.
 *
 * VIDEO_BASE — iš kur imami filmai.
 *   ''                         – filmai guli pačiame pakete (videos/ katalogas);
 *   'https://serveris/filmai/' – filmai atskirai, pakete jų nėra.
 *
 * Antrasis variantas skirtas tada, kai Moodle riboja įkeliamo failo dydį:
 * supakuok su `npm run package:lite` ir čia nurodyk adresą, kuriuo pasiekiami
 * video_1.mp4 … video_10.mp4 ir outro.mp4.
 */
const VIDEO_BASE = '';

/**
 * REVISIT_MODE — kas nutinka pasirinkus ankstesnę vietovę (žemėlapyje arba sąraše).
 *
 *   'review'  – peržiūra. Atsiveria to uždavinio sąlyga ir sprendimas, jį galima
 *               pataisyti ir patikrinti iš naujo, o mygtukas „Grįžti į kelionę“
 *               grąžina tiksliai ten, kur mokinys buvo. Kelionės eiga nejuda,
 *               filmas nerodomas.
 *
 *   'journey' – kelionė tęsiama nuo pasirinktos vietovės. Iš naujo parodomas tos
 *               vietovės filmas, mokinys sprendžia uždavinį ir plaukia toliau
 *               įprasta tvarka. Tinka, kai norima nuotykį išgyventi iš naujo.
 *
 * Pasiekti rezultatai ir sprendimai abiem atvejais išlieka.
 */
const REVISIT_MODE = 'journey';

/**
 * GAME_INFO — žaidimo aprašas, keliaujantis kartu su rezultatais į LMS.
 *
 * Šie duomenys įrašomi į cmi.suspend_data, todėl mokytojo peržiūros įrankis
 * (viewer/) nieko apie žaidimą žinoti iš anksto neprivalo: pavadinimus, temas,
 * lygių skaičių ir kalbą jis perskaito iš paties įrašo.
 *
 *   id       – trumpas žaidimo raktas (jei LMS yra keli žaidimai)
 *   title    – kaip vadinti žaidimą peržiūroje
 *   lang     – sąsajos kalba: 'lt', 'en', …
 *   codeLang – programavimo kalba, kuria rašomi sprendimai
 *
 * Lygių sąrašas (pavadinimai ir temos) surenkamas automatiškai iš js/locations.js.
 */
const GAME_INFO = {
  id:       'vikings-py',
  title:    'Vikingų kelias (Python)',
  lang:     'lt',
  codeLang: 'python'
};
