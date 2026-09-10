/**
 * Netikra SCORM API lygių rėmeliams.
 *
 * KAM TO REIKIA. Kiekvienas levels/level_N/ paketas viduje yra atskiras SCORM
 * SCO su savo pipwerks klientu. Jis ieško LMS API kildamas per `parent` langų
 * grandinę ir sustoja ties pirmu langu, kuriame randa `API` arba `API_1484_11`.
 * Moodle aplinkoje tai reikštų, kad kiekvienas lygis:
 *   • perrašytų viso paketo `cmi.suspend_data` savo vieno uždavinio kodu,
 *   • nustatytų viso paketo balą pagal vieną uždavinį,
 *   • uždarant rėmelį iškviestų LMSFinish ir nutrauktų visą Moodle sesiją.
 *
 * Todėl ant žaidimo lango uždedame savo `API` objektą (SCORM 1.2 sąsaja —
 * tokią pipwerks ir tikisi). Lygis sustoja ties juo ir su tikruoju LMS
 * nebesusisiekia. Duomenys laikomi atmintyje, atskirai kiekvienam lygiui;
 * ilgalaikį saugojimą tvarko js/scorm.js kartu su visa žaidimo būsena.
 *
 * Šalutinė nauda: lygiuose įsijungia `useScorm` kelias, todėl jie nustoja
 * naudoti localStorage raktus, kurių paketo viduje įrašymo ir skaitymo vardai
 * nesutampa (skulptIdeProgram_ vs CppIdeProgram_).
 *
 * Failas turi būti prijungtas PO js/scorm.js — kad tikroji LMS API būtų
 * surasta anksčiau, nei šis objektas užstoja kelią.
 */
const LevelScormShim = (function () {

  const buckets = {};      // { levelId: { raktas: reikšmė } }
  let currentLevel = 0;    // kurio lygio rėmelis šiuo metu atidarytas

  function bucket() {
    if (!buckets[currentLevel]) buckets[currentLevel] = {};
    return buckets[currentLevel];
  }

  const api = {
    __vikingsShim: true,          // pagal šią žymę js/scorm.js mus praleidžia

    LMSInitialize: function () { return 'true'; },
    LMSFinish:     function () { return 'true'; },
    LMSCommit:     function () { return 'true'; },

    LMSGetValue: function (key) {
      const value = bucket()[key];
      return value === undefined ? '' : String(value);
    },

    LMSSetValue: function (key, value) {
      bucket()[key] = String(value);
      return 'true';
    },

    LMSGetLastError:   function () { return '0'; },
    LMSGetErrorString: function () { return 'No error'; },
    LMSGetDiagnostic:  function () { return ''; }
  };

  window.API = api;

  return {
    /** Prieš kuriant rėmelį nurodoma, kurio lygio duomenys dabar aktualūs */
    setLevel: function (id) { currentLevel = Number(id) || 0; },

    /** Išvalo vieno lygio (arba visų) duomenis – naudojama šalinant sprendimus */
    clear: function (id) {
      if (id === undefined) {
        Object.keys(buckets).forEach(k => delete buckets[k]);
      } else {
        delete buckets[Number(id)];
      }
    }
  };
})();
