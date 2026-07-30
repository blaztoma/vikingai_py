/**
 * Programavimo uždaviniai. Raktas – vietovės id (1..10).
 *
 * title    – uždavinio pavadinimas
 * story    – siužetinis įvadas (vikingų kontekstas)
 * goal     – ką konkrečiai turi padaryti programa
 * input    – kokie duomenys įvedami
 * output   – ką programa turi išvesti
 * examples – [{ in, out }] pavyzdžiai (in gali būti tuščias)
 * hint     – užuomina, jei įstrigo
 * checks   – ką tikrins automatinis tikrintuvas (bus naudojama vėliau)
 */
const TASKS = {

  /* ---------------------------------------------- 1. Įvestis ir išvestis */
  1: {
    title: 'Sagos įrašas',
    story: 'Skaldas rašo sagą apie būsimą kelionę, todėl turi įamžinti kiekvieno keliautojo vardą ir metus, praleistus jūroje.',
    goal: 'Nuskaityk keliautojo vardą ir metų skaičių, tada išvesk sakinį: <code>&lt;vardas&gt; jūroje praleido &lt;metai&gt; metus.</code>',
    input: 'Pirmoje eilutėje – vardas (tekstas). Antroje eilutėje – metų skaičius (sveikasis skaičius).',
    output: 'Viena eilutė pagal aukščiau nurodytą pavyzdį.',
    examples: [
      { in: 'Leifas\n7', out: 'Leifas jūroje praleido 7 metus.' },
      { in: 'Astrida\n3', out: 'Astrida jūroje praleido 3 metus.' }
    ],
    hint: 'Įvestį nuskaityk į du kintamuosius, o išvesdamas sujunk tekstą su kintamųjų reikšmėmis.',
    theory: `
      <p>Programa bendrauja su vartotoju per <b>įvestį</b> ir <b>išvestį</b>. Įvestis nuskaitoma
         funkcija <code>input()</code>, o rezultatas parodomas su <code>print()</code>.</p>
      <pre><code>uostas = input()        # nuskaito vieną eilutę
print(uostas)           # išveda reikšmę</code></pre>
      <p><code>input()</code> visada grąžina <b>tekstą</b>. Jei reikia skaičiaus, jį būtina paversti:</p>
      <pre><code>irklai = int(input())     # tekstas -> sveikasis skaičius
gylis  = float(input())   # tekstas -> trupmeninis skaičius</code></pre>
      <p>Pavyzdys — nuskaitomi du skaičiai ir išvedama jų suma:</p>
      <pre><code>kaireje = int(input())
desineje = int(input())
print("Iš viso irklų:", kaireje + desineje)</code></pre>
      <p>Tekstą su kintamųjų reikšmėmis patogiausia sujungti f-eilute — prieš kabutes rašoma
         raidė <code>f</code>, o kintamieji dedami į riestinius skliaustus:</p>
      <pre><code>print(f"Uoste {uostas} gylis {gylis} metrų.")</code></pre>
      <p>Kableliai <code>print</code> viduje savaime palieka tarpą, o f-eilutėje tarpus rašai pats.</p>
    `,
    checks: ['nuskaitomos abi eilutės', 'išvedamas tikslus sakinio formatas']
  },

  /* ---------------------------------------------- 2. Kintamieji */
  2: {
    title: 'Drakaro krovinys',
    story: 'Į laivą kraunamos atsargos: vandens statinės, grūdų maišai ir sūdyta žuvis. Uosto raštininkas nori aiškios krovinio ataskaitos.',
    goal: 'Nuskaityk tris skaičius į tris atskirus, prasmingai pavadintus kintamuosius. Suskaičiuok visų daiktų sumą. Išvesk informaciją atskirose eilutėse, tokiu formatu: <code>Statinės: 12</code>, <code>Grūdų maišai: 30</code>, <code>Žuvies statinės: 8</code>, <code>Viso: 50</code>.',
    input: 'Trys skaičiai atskirose eilutėse: statinių, grūdų maišų ir žuvies statinių kiekiai.',
    output: 'Trys eilutės su pavadinimu ir reikšme.',
    examples: [
      { in: '12\n30\n8', out: 'Statinės: 12\nGrūdų maišai: 30\nŽuvies statinės: 8\nViso: 50' }
    ],
    hint: 'Kintamųjų vardai turi pasakyti, kas juose saugoma: `statines`, `grudai`, `zuvis` — o ne `a`, `b`, `c`.',
    theory: `
      <p><b>Kintamasis</b> — tai vardas, kuriuo pavadinama saugoma reikšmė. Reikšmė priskiriama
         lygybės ženklu; kairėje – vardas, dešinėje – reikšmė.</p>
      <pre><code>karys = "Ragnaras"
amzius = 34
svoris = 78.5</code></pre>
      <p>Reikšmę galima pakeisti bet kada — naujas priskyrimas ištrina senąją:</p>
      <pre><code>amzius = 34
amzius = amzius + 1   # dabar 35</code></pre>
      <p>Kintamajame galima laikyti ne tik įvestą, bet ir <b>apskaičiuotą</b> reikšmę. Dešinėje
         pusėje esantis veiksmas atliekamas pirmas, o rezultatas įrašomas į kairėje esantį vardą:</p>
      <pre><code>ilgis = 23
plotis = 5
plotas = ilgis * plotis      # naujas kintamasis iš kitų dviejų
print("Plotas:", plotas)     # Plotas: 115</code></pre>
      <p>Taip patogu susidėlioti skaičiavimą žingsniais — kiekvienas tarpinis rezultatas gauna
         savo aiškų vardą, o galutinę reikšmę lieka tik išvesti.</p>
      <p><b>Dažna klaida:</b> <code>input()</code> grąžina tekstą, o su tekstu <code>+</code>
         reiškia ne sudėtį, o sujungimą:</p>
      <pre><code>a = input()          # įvedama 12
b = input()          # įvedama 30
print(a + b)         # 1230  – sulipdytas tekstas!

a = int(input())     # dabar tai skaičiai
b = int(input())
print(a + b)         # 42</code></pre>
      <p>Svarbiausi duomenų tipai:</p>
      <ul>
        <li><code>int</code> — sveikasis skaičius: <code>25</code></li>
        <li><code>float</code> — trupmeninis: <code>1.5</code></li>
        <li><code>str</code> — tekstas: <code>"Leifas"</code></li>
        <li><code>bool</code> — loginė reikšmė: <code>True</code> arba <code>False</code></li>
      </ul>
      <p>Vardai turi pasakyti, kas viduje: <code>amzius</code> suprantama, o <code>a</code> — ne.
         Vardas rašomas be lietuviškų raidžių ir tarpų, negali prasidėti skaitmeniu.</p>
    `,
    checks: ['naudojami trys atskiri kintamieji', 'teisingas išvedimo formatas']
  },

  /* ---------------------------------------------- 3. Matematinės operacijos */
  3: {
    title: 'Šturmano skaičiavimai',
    story: 'Iki Šetlando salų – žinomas atstumas jūrmylėmis. Drakaras per dieną įveikia tam tikrą jų skaičių, o kiekvienas įgulos narys kasdien suvalgo po vieną maisto porciją.',
    goal: 'Apskaičiuok ir išvesk: (1) kiek dienų truko kelionė, (2) kiek jūrmylių reikėjo įveikti paskutinę dieną, (3) kiek liko maisto porcijų (porcijos skaičiuojamos ir už nepilną paskutinę dieną).',
    input: 'Keturi sveikieji skaičiai atskirose eilutėse: atstumas jūrmylėmis, per dieną nuplaukiamos jūrmylės, įgulos dydis, maisto porcijų kiekis.',
    output: 'Trys eilutės: <code>Dienos: X</code>, <code>Paskutinės jūrmylės: Y</code>, <code>Liko porcijų: Z</code>.',
    examples: [
      { in: '340\n60\n25\n200', out: 'Dienos: 6\nPaskutinės jūrmylės: 40\nLiko porcijų: 50' },
      { in: '120\n40\n10\n50', out: 'Dienos: 3\nPaskutinės jūrmylės: 40\nLiko porcijų: 20' }
    ],
    hint: 'Visą kelionės trukmę dienomis gausi dalmenį apvalindamas į viršų. Paskutinės dienos jūrmyles nusako dalybos liekana; jei ji lygi nuliui, paskutinę dieną nuplaukiamas visas dienos jūrmylių kiekis. Suvalgytas porcijas skaičiuok už visas dienas, įskaitant nepilną.',
    theory: `
      <p>Pagrindiniai veiksmai su skaičiais:</p>
      <ul>
        <li><code>+</code> sudėtis, <code>-</code> atimtis, <code>*</code> daugyba</li>
        <li><code>/</code> dalyba — <b>visada</b> grąžina trupmeninį skaičių: <code>7 / 2 = 3.5</code></li>
        <li><code>//</code> sveikoji dalyba — atmeta trupmeninę dalį: <code>7 // 2 = 3</code></li>
        <li><code>%</code> dalybos liekana: <code>7 % 2 = 1</code></li>
        <li><code>**</code> kėlimas laipsniu: <code>2 ** 3 = 8</code></li>
      </ul>
      <p>Sveikoji dalyba ir liekana kartu pasako, kiek pilnų dalių telpa ir kiek lieka. Pavyzdžiui,
         47 skydai dalijami po lygiai 6 kariams:</p>
      <pre><code>skydai = 47
kariai = 6
kiekvienam = skydai // kariai   # 7
sandelyje = skydai % kariai     # 5 liko</code></pre>
      <p>Kai dalį reikia <b>apvalinti į viršų</b> — pavyzdžiui, 47 keliautojai sodinami į valtis
         po 6, ir nepilna valtis vis tiek plaukia:</p>
      <pre><code>valtys = -(-47 // 6)   # 8
# arba: valtys = math.ceil(47 / 6)</code></pre>
      <p>Apvalinti galima ir funkcija <code>round()</code>: <code>round(5.47, 1)</code> duoda <code>5.5</code>.</p>
    `,
    checks: ['teisingai suskaičiuota kelionės trukmė dienomis', 'teisingai apskaičiuota paskutinės dienos nuoplauka', 'teisingai suskaičiuota likusi maisto atsarga']
  },

  /* ---------------------------------------------- 4. Sąlyga if */
  4: {
    title: 'Ar plauksime?',
    story: 'Maisto atsargos išseko, bet Farerų saloje ganosi gausios avių bandos. Jei avių užteks likusiai kelionei, vikingai plauks toliau; jei ne — teks žiemoti saloje.',
    goal: 'Nustatyk, ar avių užteks maisto porcijoms visai kelionei (iš vienos avies gaunama 20 maisto porcijų). Jei užteks — išvesk <code>Keliaujam</code>, jei ne — <code>Žiemojam</code>.',
    input: 'Trys sveikieji skaičiai vienoje eilutėje: avių kiekis, Drakaro įgulos skaičius ir numatomas kelionės dienų skaičius (nuo 30 iki 50 dienų).',
    output: 'Viena eilutė su sprendimu.',
    examples: [
      { in: '55 25 40', out: 'Keliaujam' },
      { in: '40 25 45', out: 'Žiemojam' }
    ],
    hint: 'Iš avių kiekio apskaičiuok visas turimas maisto porcijas (avys × 20), o reikalingas porcijas — įgula × dienos. Tada jas palygink.',
    theory: `
      <p><b>Sąlyga</b> leidžia programai pasirinkti vieną iš kelių kelių. Rašoma <code>if</code>,
         sąlyga, dvitaškis, o vykdomos eilutės <b>atitraukiamos</b> (įprastai 4 tarpais):</p>
      <pre><code>if svoris &lt;= keliamoji_galia:
    print("Krovinys telpa")
else:
    print("Reikia antro laivo")</code></pre>
      <p>Atitraukimas Python kalboje yra ne grožis, o taisyklė — būtent jis parodo, kurios eilutės
         priklauso sąlygai.</p>
      <p>Palyginimo operatoriai:</p>
      <ul>
        <li><code>==</code> lygu (dėmesio: du lygybės ženklai), <code>!=</code> nelygu</li>
        <li><code>&gt;</code> daugiau, <code>&lt;</code> mažiau</li>
        <li><code>&gt;=</code> daugiau arba lygu, <code>&lt;=</code> mažiau arba lygu</li>
      </ul>
      <p>Jei kelios reikšmės surašytos vienoje eilutėje, jas galima išskirstyti taip:</p>
      <pre><code>ilgis, plotis = input().split()
ilgis = int(ilgis)
plotis = int(plotis)</code></pre>
      <p>Pirmiausia verta apskaičiuoti abi lyginamas reikšmes į kintamuosius ir tik tada lyginti —
         sąlyga tampa daug aiškesnė:</p>
      <pre><code>plotas = ilgis * plotis
if plotas &gt; 100:
    print("Didelė menė")</code></pre>
    `,
    checks: ['naudojama if/else konstrukcija', 'teisingai apskaičiuotas porcijų poreikis ir atsarga', 'abu atvejai išvedami teisingai']
  },

  /* ---------------------------------------------- 5. Sudėtinės sąlygos */
  5: {
    title: 'Sargybinis prie kranto',
    story: 'Lindisfarno sargybinis mato artėjantį laivą. Kas tai — draugas, prekeivis ar priešas? Sprendimą lemia irklų skaičius ir vėliavos spalva.',
    goal: 'Pagal irklų skaičių (n) ir vėliavos spalvą nustatyk laivo tipą ir išvesk:<br>' +
          '• <code>Žvejai</code>, jei irklų mažiau nei 10;<br>' +
          '• <code>Prekeiviai</code>, jei irklų nuo 10 iki 29 imtinai <b>ir</b> vėliava balta;<br>' +
          '• <code>Karo laivas</code>, jei irklų 30 ar daugiau <b>arba</b> vėliava juoda;<br>' +
          '• <code>Nežinomas</code> visais kitais atvejais.',
    input: 'Pirmoje eilutėje – irklų skaičius, antroje – vėliavos spalva (<code>balta</code>, <code>juoda</code> arba <code>žalia</code>).',
    output: 'Viena eilutė su laivo tipu.',
    examples: [
      { in: '6\nbalta',   out: 'Žvejai' },
      { in: '18\nbalta',  out: 'Prekeiviai' },
      { in: '12\njuoda',  out: 'Karo laivas' },
      { in: '15\nzalia',  out: 'Nežinomas' }
    ],
    hint: 'Tikrink sąlygas tokia tvarka, kad ankstesnė neperimtų vėlesniųjų atvejų. Naudok logines operacijas IR bei ARBA.',
    theory: `
      <p>Kai atvejų daugiau nei du, sąlygos jungiamos <code>elif</code> šakomis. Tikrinama iš viršaus
         į apačią, ir <b>vykdoma tik pirmoji tinkanti</b> šaka:</p>
      <pre><code>if greitis &lt; 5:
    print("Štilis")
elif greitis &lt; 15:
    print("Palankus vėjas")
elif greitis &lt; 25:
    print("Stiprus vėjas")
else:
    print("Audra")</code></pre>
      <p>Kai sprendimą lemia ne vienas, o keli dydžiai, sąlygos jungiamos loginėmis operacijomis:</p>
      <pre><code>if greitis &lt; 15 and kryptis == "pietu":
    print("Keliam bures")
elif rukas or naktis:
    print("Laukiam kranto")</code></pre>
      <p>Loginės operacijos:</p>
      <ul>
        <li><code>and</code> — tiesa, kai <b>abi</b> sąlygos teisingos</li>
        <li><code>or</code> — tiesa, kai bent <b>viena</b> teisinga</li>
        <li><code>not</code> — apverčia reikšmę</li>
      </ul>
      <p>Sąlygų <b>tvarka svarbi</b>: jei bendresnę sąlygą užrašysi anksčiau, ji „pasiims“ atvejus,
         skirtus vėlesnėms. Todėl siauriausios sąlygos rašomos pirma.</p>
      <p>Priklausymą rėžiui galima užrašyti trumpiau: <code>5 &lt;= greitis &lt;= 15</code>.</p>
    `,
    checks: ['naudojamos else if šakos', 'naudojamos loginės operacijos', 'visi keturi atvejai teisingi']
  },

  /* ---------------------------------------------- 6. Ciklas for */
  6: {
    title: 'Prekeivio kainoraštis',
    story: 'Dublino turguje kailiai parduodami vienoda kaina, bet prekeivis, norėdamas parduoti daugiau, už kiekvieną papildomai perkamą kailį taiko 5 % nuolaidą visai sumai. Jam reikia kainoraščio su nuolaidomis.',
    goal: 'Išvesk kainoraštį nuo 1 iki n prekių. Už kiekvieną papildomą kailį taikoma papildoma 5 % nuolaida visai sumai (perkant 1 kailį nuolaidos nėra, 2 kailius — 5 %, 3 — 10 % ir t. t.). Suma išvedama su 2 skaitmenimis po kablelio. Kiekviena eilutė: <code>&lt;kiekis&gt; x &lt;kaina&gt; = &lt;suma&gt; (-&lt;nuolaida&gt;%)</code>.',
    input: 'Pirmoje eilutėje – vieno kailio kaina sidabro monetomis, antroje – didžiausias kiekis n.',
    output: 'n eilučių kainoraščio su galutine kaina (2 skaitmenys po kablelio) ir pritaikyta nuolaida.',
    examples: [
      { in: '99\n4', out: '1 x 99 = 99.00 (-0%)\n2 x 99 = 188.10 (-5%)\n3 x 99 = 267.30 (-10%)\n4 x 99 = 336.60 (-15%)' },
      { in: '45\n3', out: '1 x 45 = 45.00 (-0%)\n2 x 45 = 85.50 (-5%)\n3 x 45 = 121.50 (-10%)' }
    ],
    hint: 'Ciklo skaitiklis (kiekis) pradedamas nuo 1 ir eina iki n imtinai. Nuolaida procentais = (kiekis − 1) × 5. Galutinė suma = kiekis × kaina × (1 − nuolaida / 100). Sumą išvesk su dviem skaitmenimis po kablelio (pvz. su toFixed(2)).',
    theory: `
      <p><b>Ciklas for</b> kartoja veiksmus žinomą kartų skaičių. Kartų seką duoda
         <code>range()</code>:</p>
      <pre><code>for i in range(5):      # i įgyja 0, 1, 2, 3, 4
    print(i)</code></pre>
      <p>Svarbu: <code>range(a, b)</code> eina nuo <code>a</code>, bet <b>iki b neįskaitant</b>.
         Todėl skaičiuojant nuo 1 iki n imtinai rašoma:</p>
      <pre><code>for suolas in range(1, suolu + 1):
    print("Suolas", suolas, "- du irklininkai")</code></pre>
      <p>Trečias <code>range</code> argumentas nurodo žingsnį:</p>
      <pre><code>range(0, 10, 2)   # 0, 2, 4, 6, 8
range(10, 0, -1)  # 10, 9, 8, ... 1</code></pre>
      <p>Skaičių išvesti nurodytu tikslumu patogiausia f-eilutėje — po dvitaškio nurodomas
         formatas <code>.2f</code> (du skaitmenys po kablelio):</p>
      <pre><code>svoris = 7 / 3
print(f"Vidutinis svoris: {svoris:.2f} kg")   # 2.33 kg</code></pre>
      <p>Ciklo kintamasis yra paprastas kintamasis — jį galima naudoti ir skaičiavimuose,
         pavyzdžiui, kai kiekvienas kitas žingsnis kainuoja vis daugiau:</p>
      <pre><code>for diena in range(1, 4):
    print(diena, "diena -", diena * 2, "statinės vandens")</code></pre>
    `,
    checks: ['naudojamas for ciklas', 'nuolaida didėja po 5 % už kiekvieną papildomą prekę', 'teisingai apskaičiuota galutinė suma su nuolaida']
  },

  /* ---------------------------------------------- 7. Ciklas while */
  7: {
    title: 'Bėgimas nuo lavos',
    story: 'Islandijos ugnikalnis pabudo. Lava rieda link kranto, o vikingas bėga link laivo. Kiek žingsnių jis spės žengti, iš anksto nežino niekas.',
    goal: 'Kiekviename žingsnyje vikingas nubėga tam tikrą atstumą, bet lava priartėja savuoju. Skaičiuok žingsnius tol, kol vikingas pasiekia laivą (nueitas atstumas ≥ atstumas iki laivo) arba kol lava jį pasiveja (lavos nueitas atstumas ≥ vikingo nueitas atstumas). Išvesk žingsnių skaičių ir baigtį: <code>Pabėgau</code> arba <code>Lava pasivijo</code>.',
    input: 'Trys skaičiai atskirose eilutėse: atstumas iki laivo metrais (sveikasis skaičius), vikingo žingsnio ilgis metrais (trupmeninis, maždaug nuo 0.5 iki 1.3) ir lavos poslinkis metrais sulig vikingo žingsniu.',
    output: 'Dvi eilutės: <code>Žingsniai: X</code> ir baigties žodis.',
    examples: [
      { in: '50\n1\n0.5', out: 'Žingsniai: 50\nPabėgau' },
      { in: '50\n0.7\n0.8', out: 'Žingsniai: 1\nLava pasivijo' }
    ],
    hint: 'Kartų skaičius iš anksto nežinomas, todėl reikia while ciklo su dviem stabdymo sąlygomis. Nepamiršk žingsnių skaitiklio.',
    theory: `
      <p><b>Ciklas while</b> kartojamas tol, kol galioja sąlyga. Jis naudojamas tada, kai kartų
         skaičius iš anksto nežinomas:</p>
      <pre><code>kartai = 0
while vanduo &gt; 0:
    vanduo = vanduo - kibiras     # semiam po kibirą
    kartai = kartai + 1
print("Semta kartų:", kartai)</code></pre>
      <p>Kad ciklas nesisuktų amžinai, jo viduje <b>būtinai</b> turi keistis kažkas, kas veikia
         sąlygą. Jei pamirši atnaujinti kintamąjį, programa užstrigs.</p>
      <p>Sąlygų gali būti kelios — jos jungiamos <code>and</code> arba <code>or</code>. Ciklas
         sukasi tol, kol galioja <b>visos</b> <code>and</code> sujungtos sąlygos:</p>
      <pre><code>while atsargos &gt; 0 and dienos &lt; 30:
    atsargos = atsargos - 5
    dienos = dienos + 1</code></pre>
      <p>Ciklui pasibaigus dažnai reikia išsiaiškinti, <b>kuri</b> sąlyga jį sustabdė — tai
         patikrinama jau po ciklo:</p>
      <pre><code>if atsargos &lt;= 0:
    print("Baigėsi maistas")
else:
    print("Ištvėrėm mėnesį")</code></pre>
      <p>Trupmeninius skaičius nuskaitysi su <code>float(input())</code>. Ciklą galima nutraukti ir
         iš vidaus komanda <code>break</code>.</p>
    `,
    checks: ['naudojamas while ciklas', 'abi stabdymo sąlygos', 'teisingas žingsnių skaičius']
  },

  /* ---------------------------------------------- 8. Suma ir kiekis */
  8: {
    title: 'Bendras laimikis',
    story: 'Grenlandijos naujakuriai grįžta iš žvejybos ir vienas po kito verčia laimikį į bendrą krūvą. Sąrašas baigiasi, kai kas nors įveda 0.',
    goal: 'Skaičiuok įvedamas žuvų reikšmes tol, kol įvedamas 0 (jo skaičiuoti nereikia). Išvesk bendrą sumą, žvejų skaičių ir kiek jų sugavo daugiau nei 10 žuvų.',
    input: 'Sveikieji skaičiai atskirose eilutėse; įvestis baigiama nuliu.',
    output: 'Trys eilutės: <code>Suma: X</code>, <code>Žvejai: Y</code>, <code>Sėkmingi: Z</code>.',
    examples: [
      { in: '12\n5\n20\n3\n0', out: 'Suma: 40\nŽvejai: 4\nSėkmingi: 2' },
      { in: '0', out: 'Suma: 0\nŽvejai: 0\nSėkmingi: 0' }
    ],
    hint: 'Prieš ciklą sukurk tris kintamuosius ir prilygink juos nuliui: sumą ir du skaitiklius. Cikle kiekvieną atnaujink atskirai.',
    theory: `
      <p><b>Kaupiamoji suma</b> ir <b>skaitiklis</b> — du dažniausi ciklo pagalbininkai. Abu
         sukuriami <u>prieš</u> ciklą ir prilyginami nuliui:</p>
      <pre><code>ilgis_viso = 0
virves = 0</code></pre>
      <p>Cikle prie sumos pridedama reikšmė, o skaitiklis padidinamas vienetu:</p>
      <pre><code>ilgis_viso = ilgis_viso + ilgis   # trumpiau: ilgis_viso += ilgis
virves = virves + 1               # trumpiau: virves += 1</code></pre>
      <p>Kai iš anksto nežinoma, kiek reikšmių bus įvesta, naudojamas <b>pabaigos ženklas</b> —
         sutarta reikšmė, kuri nutraukia įvedimą. Pavyzdyje matuojamos virvės, o matavimas
         baigiamas įvedus <code>-1</code>:</p>
      <pre><code>ilgis = int(input())
while ilgis != -1:
    ilgis_viso += ilgis
    virves += 1
    ilgis = int(input())   # kita reikšmė ciklo gale</code></pre>
      <p>Atkreipk dėmesį: pirmoji reikšmė nuskaitoma prieš ciklą, o kita — jo pabaigoje. Taip
         pabaigos ženklas į skaičiavimus nepatenka, o programa teisingai suveikia ir tada, kai
         iš karto įvedamas pabaigos ženklas.</p>
      <p>Skirtingiems klausimams reikia skirtingų skaitiklių — cikle jų gali būti keli, o vienas
         iš jų didinamas tik esant sąlygai:</p>
      <pre><code>if ilgis &gt; 5:
    ilgos += 1</code></pre>
    `,
    checks: ['kaupiamoji suma', 'du skirtingi skaitikliai', 'ciklas baigiamas nuliu', 'veikia ir tuščias sąrašas']
  },

  /* ---------------------------------------------- 9. Vidurkis, min, max */
  9: {
    title: 'Pabaisa',
    story: 'Vikingai plaukia paskutinį kelionės etapą, tačiau kiekvieną dieną iš gelmių po kelis kartus išnyra jūros pabaisa. Šturmanas žymi, kiek kartų per dieną ji pasirodė, ir bando nuspėti, ar ji puls.',
    goal: 'Nuskaityk n dienų pabaisos pasirodymų skaičius ir išvesk: (1) vidutinį pasirodymų skaičių per dieną (suapvalintą iki vieno skaitmens po kablelio), (2) kurią dieną pabaisa pasirodė mažiausiai kartų, (3) kurią dieną – daugiausiai kartų. Galiausiai nustatyk, ar pabaisa puls: ji puls tik tada, kai kiekvieną naują dieną pasirodo daugiau kartų nei prieš tai buvusią. Jei taip — išvesk <code>Puls</code>, jei ne — <code>Nepuls</code>.',
    input: 'Pirmoje eilutėje – dienų skaičius n (n ≥ 1). Toliau n eilučių su sveikaisiais pabaisos pasirodymų skaičiais.',
    output: 'Keturios eilutės: <code>Vidurkis: X.X</code>, <code>Mažiausiai: D diena</code>, <code>Daugiausiai: D diena</code>, <code>Puls</code> arba <code>Nepuls</code>.',
    examples: [
      { in: '5\n4\n2\n7\n9\n5', out: 'Vidurkis: 5.4\nMažiausiai: 3 diena\nDaugiausiai: 5 diena\nNepuls' },
      { in: '1\n3\n4\n6\n10', out: 'Vidurkis: 5.0\nMažiausiai: 1 diena\nDaugiausiai: 5 diena\nPuls' }
    ],
    hint: 'Vidurkiui cikle kaupk sumą ir dalyk iš n. Mažiausio ir didžiausio pasirodymų ieškok cikle — įsimink ne tik reikšmę, bet ir dienos numerį (numeracija nuo 1). Puolimui tikrink, ar kiekviena reikšmė griežtai didesnė už prieš tai buvusią; jei bent kartą nepadidėja — pabaisa nepuls.',
    theory: `
      <p><b>Vidurkis</b> gaunamas sumą padalijus iš reikšmių kiekio. Suma kaupiama cikle, o
         dalyba atliekama jau po jo:</p>
      <pre><code>suma = 0
for i in range(kiek):
    suma += float(input())     # pvz. gaudytos žuvies svoris
vidurkis = suma / kiek
print(f"Vidurkis: {vidurkis:.1f}")</code></pre>
      <p><b>Didžiausios ir mažiausios</b> reikšmės ieškoma palyginant kiekvieną naują su iki šiol
         geriausia. Pradinė reikšmė imama <u>pirmoji perskaityta</u>, o ne nulis — kitaip
         rezultatas bus klaidingas (ypač su neigiamomis reikšmėmis):</p>
      <pre><code>if temperatura &gt; silciausia:
    silciausia = temperatura
    silciausias_menuo = menuo</code></pre>
      <p>Kai reikia ne tik reikšmės, bet ir <b>kelinta</b> ji buvo, kartu įsimenamas eilės numeris.
         Numeracija nuo 1 patogiai gaunama rašant <code>for menuo in range(1, kiek + 1)</code>.</p>
      <p><b>Sekos savybę</b> patogu tikrinti loginiu kintamuoju: iš pradžių laikoma, kad savybė
         galioja, o radus pirmą pažeidimą ji paneigiama. Pavyzdyje tikrinama, ar visos reikšmės
         teigiamos:</p>
      <pre><code>visos_teigiamos = True
if temperatura &lt;= 0:
    visos_teigiamos = False</code></pre>
      <p>Jei savybė susijusi su gretimomis reikšmėmis, papildomai reikia atsiminti ankstesnę —
         dar vienas kintamasis, atnaujinamas ciklo gale (<code>ankstesne = temperatura</code>).</p>
    `,
    checks: ['teisingas vidurkis su dalyba', 'randamos mažiausio ir didžiausio pasirodymų dienos', 'teisingai nustatoma, ar pabaisa puls (griežtai didėjanti seka)']
  },

  /* ---------------------------------------------- 10. Ciklas cikle */
  10: {
    title: 'Vinlando laukų dalyba',
    story: 'Naujoji Žemė dalijama į stačiakampį laukų tinklą: e eilučių ir s stulpelių. Kiekvienas laukas gauna savo naudingumo įvertį — eilutės ir stulpelio numerių sandaugą.',
    goal: 'Išvesk naudingumo įverčių lentelę, kurioje būtų e eilučių ir s stulpelių taip, kaip parodyta pavyzdžiuose. Po lentele išvesk bendrą visų laukų naudingumo sumą.',
    input: 'Du sveikieji skaičiai vienoje eilutėje: eilučių skaičius ir stulpelių skaičius.',
    output: 'Lentelė, o po ja eilutė <code>Viso: X</code>.',
    examples: [
      { in: '3 4', out: '1 2 3 4\n2 4 6 8\n3 6 9 12\nViso: 60' },
      { in: '1 1', out: '1\nViso: 1' }
    ],
    hint: 'Išorinis ciklas eina per eilutes, vidinis – per stulpelius. Sumą kaupk tame pačiame vidiniame cikle.',
    theory: `
      <p><b>Ciklas cikle</b> reikalingas ten, kur duomenys turi dvi kryptis — eilutes ir stulpelius.
         Išorinis ciklas eina per eilutes, o vidinis kiekvienai eilutei — per visus stulpelius:</p>
      <p>Pavyzdys — piešiamas skydų stačiakampis:</p>
      <pre><code>for eile in range(3):
    for skydas in range(5):
        print("O", end=" ")
    print()   # eilutės pabaiga</code></pre>
      <p>Svarbu suprasti tvarką: vidinis ciklas <b>visas</b> įvykdomas kiekvieną kartą, kai
         išorinis žengia vieną žingsnį. Jei eilučių 3, o stulpelių 5, veiksmas atliekamas 15 kartų.</p>
      <p><code>print(..., end=" ")</code> palieka žymeklį toje pačioje eilutėje ir prideda tarpą, o
         tuščias <code>print()</code> perkelia į naują eilutę.</p>
      <p>Kitas būdas — surinkti eilutę į tekstą ir išvesti ją vienu kartu:</p>
      <pre><code>eilute = ""
for skydas in range(5):
    eilute += "O "
print(eilute.strip())</code></pre>
      <p>Vidiniame cikle galima ir kaupti — taip nė vienas langelis nebus praleistas:</p>
      <pre><code>viso = 0
for eile in range(3):
    for skydas in range(5):
        viso += 1
print("Iš viso skydų:", viso)   # 15</code></pre>
    `,
    checks: ['naudojamas ciklas cikle', 'teisingi tarpai tarp skaičių', 'teisinga bendra suma']
  }
};
