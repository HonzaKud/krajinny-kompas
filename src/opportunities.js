// Scénáře nejsou samostatné granty ani odhad pravděpodobnosti schválení.
const checkedAt = "2026-10-20";
const urls = {
  opzp17: "https://dotace.aopk.gov.cz/-/aopk-opzp-zmv-17-vyzva",
  opzp18: "https://dotace.aopk.gov.cz/-/aopk-opzp-zmv-18-vyzva",
  rates:
    "https://dotace.aopk.gov.cz/documents/1319311/2643585/Prilohy_pro_zadatele-v20_k-2-6-2026_.zip/e0ea7484-0322-09eb-a2c0-38e4b399fd52?t=1781185415236",
  zmv: "https://dotace.aopk.gov.cz/web/dotace/opzp-v-prs-aopk-cr",
  ppk: "https://dotace.aopk.gov.cz/ppk-b",
  forest:
    "https://mze.gov.cz/public/portal/mze/lesy/dotace-v-lesnim-hospodarstvi-a-myslivosti/financni-prispevky-na-hospodareni-v/prispevky-na-hospodareni-v-lesich-podminky-platne-od-1-3-2026",
  forestGuide:
    "https://mze.gov.cz/public/portal/mze/-a90142---CXKMqWg3/prirucka-pro-zadatele-prehled-podminek-platnych-od-1.-3.-2026?_linka=a717266",
  aeko: "https://mze.gov.cz/public/portal/mze/dotace/szp-pro-obdobi-2021-2027/rozvoj-venkova/agroenvironmentalne-klimaticka-opatreni",
  water: "https://tokyamokrady.aopk.gov.cz/typova-opatreni",
  trees: "https://aopk.gov.cz/cs/chci-vyhlasit-nebo-osetrit-pamatny-strom",
  soil: "https://mapy.vumop.cz/",
};
const zmvLimits = [
  "Procento platí pro způsobilý základ ZMV podle NOO, nikoli automaticky pro cenu dodavatele.",
  "Nezpůsobilé výdaje, rozdíl skutečné ceny a základu i následnou péči hradí vlastník; prověřit předfinancování.",
];
const share = (
  percent,
  label,
  basis = "Způsobilý základ ZMV; sazebník příjemců v11, Příručka 18.1.",
  limitations = zmvLimits,
) => ({
  label,
  grantPercentMax: percent,
  ownPercentMin: percent === null ? null : 100 - percent,
  basis,
  limitations,
});
const effort = (level, label, reason) => ({ level, label, reason });
const entry = (data) => ({
  checkedAt,
  financialNote:
    "Orientační rámec programu, nikoli přiznaná podpora. Schválení závisí na konkrétním projektu a podmínkách výzvy.",
  ...data,
});

export const opportunities = [
  entry({
    id: "forest-renewal",
    title: "Obnova lesa a ochrana mladého porostu",
    category: "Les",
    type: "grant",
    landTypes: ["forest"],
    measureId: "forest",
    programId: "forest-mze",
    summary:
      "Prověřit příspěvek na přirozenou obnovu, výsadbu, oplocení nebo výchovu podle skutečně provedených prací.",
    fitReason:
      "Lesní pozemek je vhodný začátek; rozhoduje porost, práce a jejich termín, ne samotná výměra v katastru.",
    costShare: share(
      null,
      "Jednotkové sazby podle práce",
      "Příspěvek za technické jednotky, ne jednotné procento faktury.",
      [
        "Např. přirozená obnova: 30 000 Kč/ha pro meliorační a zpevňující dřeviny, 20 000 Kč/ha pro cílové a přípravné dřeviny dle příručky 2026.",
        "Minimální požadovaný příspěvek v žádosti 3 000 Kč; skutečné náklady mohou být vyšší.",
      ],
    ),
    effort: effort(
      "medium",
      "Střední",
      "OLH, evidence porostu, ohlášení a žádost; běžné hospodářské práce už mohou být plánované.",
    ),
    risks: [
      "Pozdní ohlášení nebo chybějící evidence může podporu zmařit.",
      "U výsadby sadbou první je tříletá udržitelnost; oplocenka do zajištění porostu.",
      "Ne každý les potřebuje výsadbu; nejprve posoudit přirozenou obnovu.",
    ],
    benefits: [
      "Pomoc s náklady obnovy a ochrany",
      "Možnost pestřejšího porostu",
    ],
    nextStep:
      "Požádat OLH o seznam již plánovaných prací a ověření jejich podpory před objednáním.",
    sourceIds: ["forest-support", "nli"],
    sourceUrls: [urls.forest, urls.forestGuide],
  }),
  entry({
    id: "forest-habitat",
    title: "Péče o přírodně cenný les",
    category: "Les",
    type: "grant",
    landTypes: ["forest"],
    measureId: "forest",
    programId: "opzp18",
    summary:
      "Projekt zaměřený na lesní stanoviště nebo cílové druhy, nikoli náhrada běžného lesního hospodaření.",
    fitReason:
      "Relevantní při doložené přírodní hodnotě a potřebě cílené péče. EVL může být důvodem vhodného managementu, ne automatickým vyloučením.",
    costShare: share(100, "Až 100 % způsobilého základu"),
    effort: effort(
      "high",
      "Vyšší",
      "Nutné biologické zdůvodnění, projekt, souhlasy a vhodný rozsah ZMV.",
    ),
    risks: [
      "Nutno prokázat podporovaný cíl; pouhé vlastnictví lesa nestačí.",
      "Obvykle minimálně 250 000 Kč přímých způsobilých realizačních výdajů bez DPH.",
      "Stejnou práci nelze financovat dvakrát.",
    ],
    benefits: ["Péče o stanoviště a druhy", "Financování cíleného managementu"],
    nextStep:
      "Porovnat předmět ochrany a stav porostu s regionálním pracovištěm AOPK a OLH.",
    sourceIds: ["aopk18", "ndop"],
    sourceUrls: [urls.opzp18, urls.rates, urls.zmv],
  }),
  entry({
    id: "meadow-care",
    title: "Cílená seč nebo pastva cenné louky",
    category: "Louky",
    type: "grant",
    landTypes: ["meadow"],
    measureId: "meadow",
    programId: "ppkb",
    summary:
      "Drobná péče o cenný luční biotop, například mozaiková seč s odvozem hmoty.",
    fitReason:
      "Louka může být kandidátem při doloženém přírodním přínosu. PPK B je mimo zvláště chráněná území; EVL není totéž co ZCHÚ.",
    costShare: share(
      100,
      "Až 100 %, nejvýše 250 000 Kč",
      "Uznatelné náklady PPK B, nikoli sazba ZMV.",
      [
        "Strop 250 000 Kč na projekt; respektovat NOO a podmínky příslušné výzvy.",
        "Výzva PPK B 2/2026 skončila 18. 6. 2026. Další výzva není tímto přislíbena.",
      ],
    ),
    effort: effort(
      "medium",
      "Střední",
      "Zákres, rozpočet, domluva péče a doložení přírodního cíle; bez rozsáhlé stavby.",
    ),
    risks: [
      "Běžná povinná údržba ani dvojí platba za tutéž činnost nemusí být způsobilá.",
      "Seč a odvoz biomasy musí někdo skutečně zajistit.",
    ],
    benefits: ["Pestřejší luční porost", "Omezení zarůstání"],
    nextStep:
      "Připravit jednu lokalitu s fotografiemi a popisem dosavadní péče pro konzultaci dalšího financování.",
    sourceIds: ["ppkb", "standards"],
    sourceUrls: [urls.ppk],
  }),
  entry({
    id: "meadow-aeko",
    title: "Louka v existujícím závazku AEKO",
    category: "Louky",
    type: "grant",
    landTypes: ["meadow"],
    measureId: "meadow",
    programId: "aeko",
    summary:
      "Prověřit pokračující plošnou platbu u skutečného hospodáře v LPIS.",
    fitReason:
      "Vlastník nemusí být příjemcem. Relevantní zejména tam, kde už hospodář závazek má.",
    costShare: share(
      null,
      "Roční platba na hektar podle titulu",
      "Plošná platba za podmínky hospodaření, nikoli proplacení procenta nákladů.",
      [
        "Sazba závisí na titulu a soubězích; samotný katastr ji neurčuje.",
        "MZe oznámilo, že v roce 2027 nebudou nové pětileté závazky AEKO ani EZ.",
      ],
    ),
    effort: effort(
      "medium",
      "Střední a opakovaná",
      "Pětileté závazky, každoroční žádosti a pravidla seče, pastvy či evidence podle titulu.",
    ),
    risks: [
      "Bez hospodaření a evidence v LPIS nevzniká automatický nárok vlastníka.",
      "Nový vstup v roce 2027 je uzavřen; nejde o nabídku pro okamžité nové zařazení.",
      "Nesplnění managementu může vést ke krácení nebo vrácení platby.",
    ],
    benefits: ["Průběžné financování vhodné péče"],
    nextStep:
      "Zjistit u hospodáře, zda na konkrétním půdním bloku již existuje AEKO závazek a jaký.",
    sourceIds: ["szif"],
    sourceUrls: [urls.aeko],
  }),
  entry({
    id: "field-buffer",
    title: "Remíz, mez nebo pás dřevin u pole",
    category: "Půda",
    type: "grant",
    landTypes: ["arable", "meadow", "other"],
    measureId: "soil",
    programId: "opzp17",
    summary:
      "Vegetační krajinný prvek s návazností na odtok, erozi a okolní hospodaření.",
    fitReason:
      "Pole nabízí prostor pro krajinný prvek; vhodné místo vyplývá ze svahu, odtoku a dohody s hospodářem.",
    costShare: share(
      80,
      "Až 80 % základu; nejméně 20 % vlastní",
      "Běžné vegetační krajinné prvky, podaktivita 1.3.1.2.1.080_07.",
    ),
    effort: effort(
      "high",
      "Vyšší",
      "Návrh, práva k ploše, zemědělské návaznosti a několik let péče o výsadbu.",
    ),
    risks: [
      "Změna využití může ovlivnit pacht i zemědělské podpory.",
      "Podpora založení prvků ÚSES má jinou sazbu a vyžaduje skutečné vymezení ÚSES.",
      "Výsadba bez péče může zaniknout.",
    ],
    benefits: ["Členitější krajina", "Přírodě blízká ochrana půdy"],
    nextStep:
      "Vybrat s hospodářem jednu problémovou hranu pole a prověřit varianty v terénu.",
    sourceIds: ["aopk17", "soil-map"],
    sourceUrls: [urls.opzp17, urls.rates, urls.soil],
  }),
  entry({
    id: "pools-water",
    title: "Menší tůně místo velkého rybníka",
    category: "Voda",
    type: "grant",
    landTypes: ["water", "meadow", "forest", "other"],
    measureId: "pools",
    programId: "opzp17",
    summary: "Porovnat několik mělkých vodních biotopů s variantou bez výkopu.",
    fitReason:
      "Zamokření nebo blízkost potoka je podnět k posouzení, nikoli důkaz, že tůň bude fungovat.",
    costShare: share(
      90,
      "Až 90 % základu; nejméně 10 % vlastní",
      "Tvorba a obnova tůní (mokřadů), podaktivita 1.3.1.1.1.090_01.",
    ),
    effort: effort(
      "high",
      "Vyšší",
      "Terén, vodní bilance, biologie a povolovací režim předcházejí zemním pracím.",
    ),
    risks: [
      "Tůň může sezónně vysychat; cílem není vždy celoroční voda.",
      "Výkop může poškodit hodnotnou mokrou louku.",
      "Nutno ověřit minimální velikost projektu ZMV a přístup techniky.",
    ],
    benefits: ["Vodní biotopy", "Možnost menšího zásahu než nádrž"],
    nextStep:
      "Objednat společnou prohlídku biologa a odborníka na vodní režim; zatím nebagrovat.",
    sourceIds: ["aopk17", "water", "water-law"],
    sourceUrls: [urls.opzp17, urls.rates, urls.water],
  }),
  entry({
    id: "wetland-drains",
    title: "Obnova mokřadu omezením odvodnění",
    category: "Voda",
    type: "grant",
    landTypes: ["water", "meadow", "forest", "arable", "other"],
    measureId: "wetland",
    programId: "opzp17",
    summary:
      "Řešit příčinu vysušování, pokud ji tvoří nevhodné odvodňovací zařízení.",
    fitReason:
      "Relevantní jen při doložení drenáží nebo odvodnění a proveditelnosti změny vodního režimu.",
    costShare: share(
      100,
      "Až 100 % způsobilého základu",
      "Eliminace negativních funkcí odvodnění, podaktivita 1.3.1.5.1.100_04. Nová výkopová tůň spadá do jiné sazby.",
    ),
    effort: effort(
      "high",
      "Vyšší",
      "Je třeba znát celou odvodňovací soustavu a dopady i za hranicí pozemku.",
    ),
    risks: [
      "Zvýšení hladiny může poškodit sousední pozemky či stavby.",
      "Neznámé vlastnictví a funkce drenáže mohou projekt zastavit.",
    ],
    benefits: [
      "Obnova přirozeného vodního režimu",
      "Podpora mokřadního stanoviště",
    ],
    nextStep:
      "Nechat nejprve zmapovat odvodnění a jeho vlastníky, pak porovnat varianty.",
    sourceIds: ["aopk17", "water", "water-law"],
    sourceUrls: [urls.opzp17, urls.rates, urls.water],
  }),
  entry({
    id: "stream-floodplain",
    title: "Potok a niva: revitalizace nebo renaturace",
    category: "Voda",
    type: "grant",
    landTypes: ["water", "meadow", "forest", "other"],
    measureId: "stream",
    programId: "opzp17",
    summary:
      "Obnovit prostor pro vodu a přirozené procesy v návazném úseku toku.",
    fitReason:
      "Potok přidává další možnost, ale nejdřív se musí určit tok, správce a dotčené parcely.",
    costShare: share(
      100,
      "Až 100 % způsobilého základu",
      "Revitalizace a renaturace toků a niv, podaktivita 1.3.1.1.3.100_04.",
    ),
    effort: effort(
      "high",
      "Vysoká",
      "Správce toku, více vlastníků, projekt a vodoprávní či stavební postup.",
    ),
    risks: [
      "Vlastnictví břehu není oprávnění potok přehradit.",
      "Zásah se může projevit níže po toku.",
      "Někdy je vhodnější řízená přirozená obnova než stavba.",
    ],
    benefits: [
      "Pestřejší koryto a niva",
      "Obnova vazby toku na okolní krajinu",
    ],
    nextStep:
      "Sjednat prohlídku se správcem toku a porovnat aktivní zásah s renaturací.",
    sourceIds: ["aopk17", "water", "water-law"],
    sourceUrls: [urls.opzp17, urls.rates, urls.water],
  }),
  entry({
    id: "pond-restoration",
    title: "Rybník: nejprve prověřit provoz a ekonomiku",
    category: "Voda",
    type: "grant",
    landTypes: ["water", "meadow", "other"],
    measureId: "pond",
    programId: "opzp17",
    summary:
      "Malá vodní nádrž je investice s dlouhodobou správou, nikoli automaticky nejlepší zadržení vody.",
    fitReason:
      "Vhodnost závisí na vodní bilanci, podloží, bezpečnosti a účelu; porovnat i tůně a mokřad.",
    costShare: share(
      40,
      "Až 40 % základu; nejméně 60 % vlastní",
      "Malé vodní nádrže, podaktivita 1.3.1.1.2.040_02 v 17. výzvě.",
    ),
    effort: effort(
      "high",
      "Vysoká",
      "Projekt, povolení, hráz, voda, případný sediment a následná bezpečná správa.",
    ),
    risks: [
      "Spoluúčast je výrazně vyšší než u tůní či revitalizace.",
      "Odbahnění vyžaduje vyřešit kvalitu a uložení sedimentu.",
      "Budoucí opravy a provoz zůstávají závazkem vlastníka.",
    ],
    benefits: [
      "Vodní plocha při vhodném návrhu",
      "Možnost obnovy existujícího přírodě blízkého prvku",
    ],
    nextStep:
      "Před projektem porovnat celoživotní náklady nádrže s tůněmi a mokřadem.",
    sourceIds: ["aopk17", "reservoir", "water-build"],
    sourceUrls: [urls.opzp17, urls.rates, urls.water],
  }),
  entry({
    id: "old-trees-care",
    title: "Ošetření významných a starých stromů",
    category: "Stromy",
    type: "grant",
    landTypes: ["garden", "meadow", "arable", "other"],
    measureId: "trees",
    programId: "ppkb",
    summary:
      "Odborně zdůvodněná péče o významné dřeviny mimo les; nabídku dodavatele oddělit od dotace.",
    fitReason:
      "Starý strom může mít přírodní hodnotu i bez vyhlášení za památný strom.",
    costShare: share(
      100,
      "Až 100 %, nejvýše 250 000 Kč",
      "Uznatelné náklady PPK B; konkrétní strom a zásah musí odpovídat výzvě.",
      [
        "Výzva PPK B 2/2026 je uzavřena, nová není potvrzena.",
        "Posudek, rozsah ošetření a následná péče musí být finančně vyjasněné.",
      ],
    ),
    effort: effort(
      "medium",
      "Střední",
      "Arboristické posouzení, biologická hodnota a případné souhlasy; lze porovnat více nabídek.",
    ),
    risks: [
      "Stáří samo neznamená právní ochranu památného stromu.",
      "Ošetření památného stromu vyžaduje souhlas orgánu ochrany přírody.",
      "Dotace není důvod podepsat neurčitou smlouvu s drahou následnou péčí.",
    ],
    benefits: [
      "Bezpečnější a šetrnější péče",
      "Zachování stromu a jeho mikrostanovišť",
    ],
    nextStep:
      "Získat písemný rozsah práce, cenu a následné závazky; ověřit arboristu a status stromu.",
    sourceIds: ["ppkb", "trees", "standards"],
    sourceUrls: [urls.ppk, urls.trees],
  }),
  entry({
    id: "tenant-agreement",
    title: "Dohoda s hospodářem bez nové dotace",
    category: "Půda",
    type: "alternative",
    landTypes: ["arable", "meadow"],
    measureId: "soil",
    programId: null,
    summary:
      "Začít jednou změnou péče: vhodnější seč, ochrana mokrého místa nebo dohoda o okraji pole.",
    fitReason:
      "U propachtované půdy bývá rychlejší dohoda se skutečným uživatelem než vlastní dotační žádost.",
    costShare: share(
      0,
      "Bez předpokládané dotace",
      "Smluvní dohoda vlastníka a hospodáře.",
      [
        "Cena, případný ušlý výnos a rozdělení práce se sjednávají; aplikace je neodhaduje.",
      ],
    ),
    effort: effort(
      "low",
      "Nižší",
      "Jedna prohlídka a konkrétní dohoda; rozsah povolení závisí na zásahu.",
    ),
    risks: [
      "Nesmí porušit existující dotační závazek nebo ochranný režim.",
      "Ústní dohoda nemusí zajistit následnou péči.",
    ],
    benefits: ["Možnost začít bez čekání na výzvu", "Malý ověřitelný krok"],
    nextStep:
      "Domluvit jednu konkrétní plochu, způsob péče a termín společného vyhodnocení.",
    sourceIds: ["soil-map", "szif"],
    sourceUrls: [urls.soil, urls.aeko],
    financialNote:
      "Nedotační alternativa. Nízká administrace neznamená nulové náklady ani automaticky povolený zásah.",
  }),
  entry({
    id: "water-observation",
    title: "Voda bez bagru: pozorování a porovnání variant",
    category: "Voda",
    type: "alternative",
    landTypes: ["forest", "water", "meadow", "arable", "other"],
    measureId: "wetland",
    programId: null,
    summary:
      "První krok zvládnutelný bez žádosti: zdokumentovat mokrá místa, odtok a stav za sucha.",
    fitReason:
      "Pomůže rozlišit problém dřív, než se zaplatí nevhodný rybník, drenáž nebo výkop.",
    costShare: share(
      0,
      "Bez předpokládané dotace",
      "Vlastní čas, případně cena odborné konzultace.",
      [
        "První pozorování může být svépomocí; terénní a odborné závěry nejsou automatická analýza z katastru.",
      ],
    ),
    effort: effort(
      "low",
      "Nižší první krok",
      "Fotografie a poznámky ve více ročních obdobích; samotné pozorování není stavební zásah.",
    ),
    risks: [
      "Jedna návštěva po dešti neprokáže roční dostupnost vody.",
      "Bez odborného návrhu neměnit drenáže ani koryto.",
    ],
    benefits: [
      "Lepší zadání pro projektanta",
      "Možnost vybrat levnější a vhodnější variantu",
    ],
    nextStep:
      "Po dešti a za sucha pořídit fotografie ze stejných míst a zaznamenat směr odtoku.",
    sourceIds: ["water", "standards"],
    sourceUrls: [urls.water],
    financialNote:
      "Nedotační přípravná alternativa. Ušetření nelze předem vyčíslit; odbornou konzultaci poptat samostatně.",
  }),
  entry({
    id: "tree-offer-review",
    title: "Prověřit nabídku péče o stromy",
    category: "Stromy",
    type: "alternative",
    landTypes: ["garden", "meadow", "arable", "other"],
    measureId: "trees",
    programId: null,
    summary:
      "Z nabídky udělat srozumitelný seznam prací, cen a závazků ještě před podpisem.",
    fitReason:
      "Užitečné i bez dotace a bez vyplňování projektu: stačí konkrétní nabídka a fotografie stromu. Potřebu zásahu musí posoudit odborník.",
    costShare: share(
      0,
      "Cenu nejprve písemně vyjasnit",
      "Smluvní cena posouzení a péče; žádná dotace se nepředpokládá.",
      [
        "Oddělit cenu posudku, samotné práce a následné péče včetně DPH.",
        "Písemně vyjasnit, kdo platí přípravu a práce, pokud dotace nevyjde; bez potvrzení nepředpokládat bezplatnou službu.",
      ],
    ),
    effort: effort(
      "low",
      "Nižší první krok",
      "Vyžádat jednu konkrétní písemnou nabídku; při nejasném rozsahu nezávislé arboristické posouzení.",
    ),
    risks: [
      "Neurčitý rozsah nebo otevřená cena následné péče může znamenat další výdaje.",
      "Starý strom není automaticky památný; právní režim a potřebné souhlasy ověřit před prací.",
      "Nevhodný řez může zhoršit stav stromu i jeho biologickou hodnotu.",
    ],
    benefits: [
      "Srovnatelné nabídky a jasnější náklady",
      "Menší riziko nevhodného zásahu nebo nečekaných závazků",
    ],
    nextStep:
      "Vyžádat písemně: které stromy, jaký zásah a proč, kdo jej odborně posoudil, konečná cena, následná péče a platby při nezískání dotace.",
    sourceIds: ["trees", "standards"],
    sourceUrls: [urls.trees, "https://aopk.gov.cz/platne-standardy"],
    financialNote:
      "Nedotační kontrola nabídky. Posouzení smluvních a cenových podmínek je doporučený pracovní postup, nikoli příslib úspory nebo právní stanovisko.",
  }),
];
