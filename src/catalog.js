const checkedAt = "2026-10-20";
export const sources = [
  {
    id: "standards",
    title: "Standardy péče o přírodu a krajinu",
    organization: "AOPK ČR",
    url: "https://aopk.gov.cz/platne-standardy",
    note: "Odborné postupy; vybírat platnou verzi pro konkrétní opatření.",
  },
  {
    id: "water",
    title: "Typová opatření pro vodní toky a mokřady",
    organization: "AOPK ČR",
    url: "https://tokyamokrady.aopk.gov.cz/typova-opatreni",
    note: "Výběr přístupu závisí na stavu toku a okolní nivy.",
  },
  {
    id: "reservoir",
    title: "Malé vodní nádrže přírodě blízkým způsobem",
    organization: "AOPK ČR / ČVUT",
    url: "https://aopk.gov.cz/documents/20121/1199906/B-02-007-Standard-male-vodni-nadrze-2022.pdf/acab53c2-f0dd-1cad-2202-fda9ba50f1c6?t=1669123140763",
    note: "Standard SPPK B02 007:2022; nádrž není totéž co tůň.",
  },
  {
    id: "water-law",
    title: "Vodní zákon: povolení nakládání s vodami (§ 8)",
    organization: "MZe",
    url: "https://mze.gov.cz/public/portal/mze/legislativa/vap51514-4035",
    note: "Konkrétní režim musí určit příslušný úřad; samotný název záměru jej neurčuje.",
  },
  {
    id: "water-build",
    title: "Vodní zákon: povolování vodních děl (§ 55a)",
    organization: "MZe",
    url: "https://mze.gov.cz/public/portal/mze/legislativa/vap51514-44574",
    note: "Rozlišit stavební záměr, nakládání s vodami a ochranu přírody.",
  },
  {
    id: "trees",
    title: "Vyhlášení a ošetření památného stromu",
    organization: "AOPK ČR",
    url: "https://aopk.gov.cz/cs/chci-vyhlasit-nebo-osetrit-pamatny-strom",
    note: "Stáří samo nepotvrzuje režim památného stromu; ošetření památného stromu vyžaduje souhlas.",
  },
  {
    id: "ndop",
    title: "Nálezová data druhů a podmínky přístupu",
    organization: "AOPK ČR",
    url: "https://data.nature.cz/ds/19",
    note: "Veřejný přístup neobsahuje citlivé druhy. Prázdná mapa nevylučuje výskyt.",
  },
  {
    id: "aopk17",
    title: "OPŽP ZMV – 17. výzva SC 1.3",
    organization: "AOPK ČR",
    url: "https://dotace.aopk.gov.cz/-/aopk-opzp-zmv-17-vyzva",
    note: "Znovuotevřený příjem 20. 10.–3. 11. 2026. Při opakované kontrole 20. 10. je karta označená „probíhá“.",
  },
  {
    id: "aopk18",
    title: "OPŽP ZMV – 18. výzva SC 1.6",
    organization: "AOPK ČR",
    url: "https://dotace.aopk.gov.cz/-/aopk-opzp-zmv-18-vyzva",
    note: "Oznámené okno 21. 10.–4. 11. 2026. Zaměření na stanoviště a druhy.",
  },
  {
    id: "ppkb",
    title: "Program péče o krajinu – PPK B",
    organization: "AOPK ČR",
    url: "https://dotace.aopk.gov.cz/ppk-b",
    note: "Druhá výzva 2026 přijímala žádosti 19. 5.–18. 6. 2026; nejde o aktuálně otevřenou nabídku.",
  },
  {
    id: "forest-support",
    title: "Lesní příspěvky: pravidla od 1. 3. 2026",
    organization: "MZe",
    url: "https://mze.gov.cz/public/portal/mze/lesy/dotace-v-lesnim-hospodarstvi-a-myslivosti/financni-prispevky-na-hospodareni-v/prispevky-na-hospodareni-v-lesich-podminky-platne-od-1-3-2026",
    note: "Programy B, C, D, H, I; ohlášení a lhůty podle typu příspěvku.",
  },
  {
    id: "szif",
    title: "Plošné podpory a Jednotná žádost",
    organization: "SZIF",
    url: "https://szif.gov.cz/cs/dalsi-dotacni-programy",
    note: "Rozcestník potvrzuje AEKO a ekologické zemědělství. Konkrétní podmínky a roční lhůtu je nutné ověřit v aktuální metodice.",
  },
  {
    id: "nli",
    title: "Katalog mapových informací",
    organization: "Národní lesnický institut",
    url: "https://nli.gov.cz/portfolio/katalog-mapovych-informaci/",
    note: "Orientační lesnické podklady; nenahrazují aktuální plán a terénní šetření.",
  },
  {
    id: "soil-map",
    title: "Půda v mapách",
    organization: "Výzkumný ústav monitoringu a ochrany půdy",
    url: "https://mapy.vumop.cz/",
    note: "Půdní a erozní podklady jsou vstupem pro odborné posouzení, nikoli návrhem opatření.",
  },
].map((s) => ({ ...s, checkedAt }));

const q = (id, label, help, sourceId = "standards") => ({
  id,
  label,
  help,
  sourceId,
  required: true,
});
const common = [
  q(
    "ownership",
    "Máte ověřené právo jednat o dotčených pozemcích?",
    "Doložte aktuální vlastnictví, spoluvlastníky a přístup.",
  ),
  q(
    "consent",
    "Jsou vyjasněné souhlasy vlastníků a uživatelů?",
    "Zkontrolujte také pacht, nájem, správu toku a sousední pozemky.",
  ),
  q(
    "ecology",
    "Byly prověřeny přírodní hodnoty a ochranné režimy?",
    "Mapový průzkum doplňte podle záměru terénním šetřením. Chybějící záznam neznamená nepřítomnost druhu.",
    "ndop",
  ),
  q(
    "siteVisit",
    "Proběhla a je zdokumentovaná prohlídka místa?",
    "Fotografie s datem, sezónní stav, přístup techniky a návaznosti v krajině.",
  ),
  q(
    "maintenance",
    "Máte domluvenou následnou péči a její financování?",
    "Jmenujte odpovědnou osobu, rozsah prací, termíny a zdroj peněz.",
  ),
];
const waterQuestions = [
  q(
    "waterAuthority",
    "Je s příslušnými úřady vyjasněný povolovací postup?",
    "Zjistěte vodoprávní a stavební režim, ochranu přírody a potřebná stanoviska.",
    "water-build",
  ),
  q(
    "waterBalance",
    "Je prověřen zdroj vody a chování místa během roku?",
    "Sledujte sucho i mokrá období; samotná čára potoka v mapě není bilance vody.",
    "water",
  ),
  q(
    "flow",
    "Jsou vyhodnocené dopady na tok, sousedy a odtok?",
    "Posoudit bezpečné převedení velkých vod i zachování podmínek níže po toku.",
    "water-law",
  ),
];
const make = (id, title, category, summary, details) => ({
  id,
  title,
  category,
  summary,
  questions: [...common, ...(category === "Voda" ? waterQuestions : [])],
  costNote:
    "Rozpočet sestavte z konkrétních nabídek. Podpora, vlastní spoluúčast ani provozní výdaje zde nejsou automaticky odhadovány.",
  ...details,
});
export const measures = [
  make(
    "pools",
    "Tůně pro život v krajině",
    "Voda",
    "Prověřte drobné vodní biotopy, jejichž smyslem je příroda a pestrý vodní režim.",
    {
      benefits: [
        "Rozmanitost vodních a mokřadních stanovišť",
        "Doplnění sítě drobných biotopů",
      ],
      questions: [
        ...common,
        ...waterQuestions,
        q(
          "fish",
          "Je vyjasněno hospodaření bez vysazování ryb?",
          "Účel tůně a případné rybí obsádky řešte s biologem; záměr pro obojživelníky se liší od chovného rybníka.",
          "water",
        ),
      ],
      prerequisites: [
        "Průzkum vody, půdy a druhů v místě",
        "Prověření, zda nevznikne zásah do cenného existujícího biotopu",
      ],
      steps: [
        "Zaznamenejte místo po dešti i za sucha.",
        "Nechte porovnat několik menších tůní, mokřad a variantu bez zásahu.",
        "Konzultujte režim a teprve potom objednávejte výkop.",
      ],
      outputs: [
        "Zákres variant a výškové řešení",
        "Stanovisko k proveditelnosti",
        "Plán péče a fotografického sledování",
      ],
      risks: [
        "Vyschnutí může být přirozené; neznamená samo o sobě neúspěch.",
        "Nevhodné zahloubení, živiny nebo rybí obsádka mohou zhoršit biologický přínos.",
      ],
      experts: [
        "Biolog se zkušeností s mokřady",
        "Projektant podle charakteru zásahu",
      ],
      programIds: ["opzp17", "opzp18", "ppkb"],
      sourceIds: ["standards", "water", "water-law", "ndop"],
    },
  ),
  make(
    "wetland",
    "Obnova mokřadu a prameniště",
    "Voda",
    "Začněte příčinou odvodnění a návaznostmi na celé údolí, nikoli bagrem.",
    {
      benefits: [
        "Obnova přirozeného vodního režimu",
        "Péče o mokřadní stanoviště",
      ],
      prerequisites: [
        "Zmapování drenáží a vlastníků",
        "Prověření zdroje vody a současných přírodních hodnot",
      ],
      steps: [
        "Popište odvodnění a sezónní zamokření.",
        "Nechte posoudit dopad na okolní hospodaření.",
        "Srovnejte obnovu režimu s pouhou úpravou seče.",
      ],
      outputs: [
        "Mapa odvodnění a dotčených práv",
        "Návrh srovnatelných variant",
        "Plán monitoringu vody a vegetace",
      ],
      risks: [
        "Zvýšení hladiny může ovlivnit sousedy a přístup.",
        "Zasypání drenáže bez znalosti soustavy může způsobit škody.",
      ],
      experts: [
        "Hydrolog nebo hydrogeolog podle místa",
        "Biolog",
        "Projektant",
      ],
      programIds: ["opzp17", "opzp18"],
      sourceIds: ["standards", "water", "water-law"],
    },
  ),
  make(
    "stream",
    "Potok a jeho niva",
    "Voda",
    "Zvažte prostor pro vodu, stav koryta i přirozenou obnovu před jednotlivými technickými zásahy.",
    {
      benefits: [
        "Pestřejší koryto a návaznost na nivu",
        "Možnost obnovy přirozených procesů",
      ],
      prerequisites: [
        "Identifikace toku a správce",
        "Poznání povodí, staveb a dotčených pozemků",
      ],
      steps: [
        "Zaznamenejte opevnění, zahloubení, překážky a břehy.",
        "Sjednejte společnou prohlídku se správcem toku.",
        "Porovnejte aktivní revitalizaci, renaturaci a údržbu.",
      ],
      outputs: [
        "Pasport úseku",
        "Záznam projednání",
        "Variantní studie s dopady mimo parcelu",
      ],
      risks: [
        "Vlastnictví břehu neopravňuje k libovolnému přehrazení toku.",
        "Místní zásah může ovlivnit průtok, migraci a sousední stavby.",
      ],
      experts: ["Správce toku", "Vodohospodářský projektant", "Biolog"],
      programIds: ["opzp17", "opzp18"],
      sourceIds: ["water", "water-law", "water-build"],
    },
  ),
  make(
    "pond",
    "Rybník nebo malá vodní nádrž",
    "Voda",
    "Porovnejte účel nádrže, vodní bilanci a dlouhodobou správu s mokřadem a tůněmi.",
    {
      questions: [
        ...common,
        ...waterQuestions,
        q(
          "sediment",
          "Je vyjasněn sediment, jeho kvalita a nakládání s ním?",
          "U obnovy zjistěte množství, odběry vzorků a legální využití či odstranění.",
          "reservoir",
        ),
        q(
          "operator",
          "Je zajištěn budoucí provozovatel a bezpečnost díla?",
          "Péče o hráz, objekty, provozní dokumenty a dohled mohou znamenat dlouhodobé výdaje.",
          "water-build",
        ),
      ],
      benefits: [
        "Vodní a litorální stanoviště při vhodném návrhu",
        "Možnost víceúčelového využití podle místních podmínek",
      ],
      prerequisites: [
        "Jasné zadání: příroda, chov, krajina či jiný účel",
        "Hydrologická bilance, geotechnické a majetkové podklady",
      ],
      steps: [
        "Zjistěte, zda jde o obnovu existujícího díla nebo novostavbu.",
        "Porovnejte varianty včetně menšího zásahu.",
        "Zahrňte sediment, péči o hráz, provoz a povolení do rozhodnutí.",
      ],
      outputs: [
        "Studie proveditelnosti",
        "Investiční i provozní rozpočet",
        "Povolovací plán a plán správy",
      ],
      risks: [
        "Samotná vodní plocha nezaručuje odstranění sucha v lese.",
        "Nedostatek vody, eutrofizace a zanášení mohou znehodnotit záměr.",
        "Hráz a objekty přinášejí technickou odpovědnost.",
      ],
      experts: [
        "Autorizovaný vodohospodářský projektant",
        "Hydrolog",
        "Biolog",
        "Specialista na bezpečnost vodních děl podle režimu",
      ],
      programIds: ["opzp17"],
      sourceIds: ["reservoir", "water-build", "water-law"],
    },
  ),
  make(
    "forest",
    "Odolnější a pestřejší les",
    "Les",
    "Spojte plán obnovy porostu se stanovištěm, vodou, ochranou půdy a skutečnými možnostmi péče.",
    {
      questions: [
        ...common,
        q(
          "operator",
          "Je návrh projednaný s odborným lesním hospodářem?",
          "Vycházejte z LHP nebo LHO, stavu porostu a závazných podmínek.",
          "forest-support",
        ),
      ],
      benefits: [
        "Stanovištně vhodná obnova a výchova",
        "Šetrnější práce s půdou a biotopy",
      ],
      prerequisites: [
        "Aktuální porostní podklady",
        "Domluva s odborným lesním hospodářem",
      ],
      steps: [
        "Sepište plánované práce a jejich termíny.",
        "Proberte druhovou a prostorovou skladbu i tlak zvěře.",
        "Před zahájením prověřte potřebné ohlášení podpory.",
      ],
      outputs: [
        "Plán prací podle porostů",
        "Rozpočet ochrany a následné péče",
        "Podklady pro evidenci a příspěvek",
      ],
      risks: [
        "Dotace sama nezajistí přežití výsadby.",
        "Nevhodné druhy, zvěř či poškození půdy mohou zvýšit budoucí náklady.",
      ],
      experts: [
        "Odborný lesní hospodář",
        "Biolog při zásazích do cenných stanovišť",
      ],
      programIds: ["forest-mze", "opzp18"],
      sourceIds: ["forest-support", "nli", "ndop"],
    },
  ),
  make(
    "meadow",
    "Druhově pestrá louka",
    "Louky",
    "Navrhněte seč či pastvu podle stanoviště a cílových druhů a zajistěte dlouhodobého hospodáře.",
    {
      questions: [
        ...common,
        q(
          "operator",
          "Je domluven hospodář a slučitelnost se závazky?",
          "Prověřte užívání v LPIS, pacht a existující plošné podpory.",
          "szif",
        ),
      ],
      benefits: [
        "Udržení vhodné vegetace",
        "Pestrá struktura a prostor pro bezobratlé",
      ],
      prerequisites: [
        "Botanické zhodnocení a historie hospodaření",
        "Dohoda o odvozu biomasy nebo pastvě",
      ],
      steps: [
        "Zaznamenejte současný porost a termíny péče.",
        "S biologem určete režim a případné ponechávané plochy.",
        "S hospodářem ověřte slučitelnost se závazky.",
      ],
      outputs: [
        "Plán péče po částech plochy",
        "Kalendář a evidence zásahů",
        "Dohoda s realizátorem",
      ],
      risks: [
        "Univerzální termín seče nemusí vyhovovat cílovým druhům.",
        "Obnova nevhodným osivem může poškodit místní hodnoty.",
      ],
      experts: ["Botanik nebo biolog", "Hospodář"],
      programIds: ["opzp18", "ppkb", "aeko", "organic"],
      sourceIds: ["standards", "szif", "ndop"],
    },
  ),
  make(
    "trees",
    "Péče o staré stromy a nabídky",
    "Stromy",
    "Oddělte stav stromu, jeho přírodní hodnotu, právní režim a obchodní podmínky nabídky.",
    {
      questions: [
        ...common,
        q(
          "treeStatus",
          "Je doložen právní režim a návrh odborného ošetření?",
          "Starý strom nemusí být památný; u památného stromu je k ošetření nutný souhlas.",
          "trees",
        ),
      ],
      benefits: [
        "Delší zachování hodnotných stromů",
        "Srozumitelná a porovnatelná péče",
      ],
      prerequisites: [
        "Inventarizace, fotografie a lokalizace",
        "Písemná nabídka s rozsahem, cenou a odpovědností",
      ],
      steps: [
        "Nechte hodnotit strom a jeho okolí kvalifikovaným odborníkem.",
        "Porovnejte rozsah nabídek a budoucí kontrolu.",
        "Vyjasněte souhlasy, platby a postup bez přiznání podpory.",
      ],
      outputs: [
        "Karta stromu a návrh péče",
        "Seznam nejasností nabídky",
        "Doklad předání a plán dalších kontrol",
      ],
      risks: [
        "Dotace nezbavuje vlastníka odpovědnosti.",
        "Zásah do dutin a biotopů může poškodit chráněné organismy.",
      ],
      experts: ["Kvalifikovaný arborista", "Biolog podle výskytu organismů"],
      programIds: ["ppkb", "opzp18"],
      sourceIds: ["trees", "standards", "ndop"],
    },
  ),
  make(
    "soil",
    "Půda, eroze a krajinné prvky",
    "Půda",
    "Začněte tím, odkud přitéká voda a kdo na půdě hospodaří; hledejte proveditelnou dohodu.",
    {
      questions: [
        ...common,
        q(
          "operator",
          "Je dohodnuté opatření se skutečným hospodářem?",
          "Vlastnictví, LPIS a pacht představují různé vztahy; dotaci nemusí čerpat vlastník.",
          "szif",
        ),
      ],
      benefits: [
        "Omezení odnosu půdy podle návrhu",
        "Více krajinné struktury a návazných biotopů",
      ],
      prerequisites: [
        "Zmapování erozních drah a hospodaření",
        "Dohoda o využití ploch a údržbě prvků",
      ],
      steps: [
        "Zdokumentujte odtok při dešti a nánosy.",
        "Srovnejte změnu hospodaření, zatravnění a vegetační prvky.",
        "Projednejte dopady do pachtu a existujících závazků.",
      ],
      outputs: [
        "Mapa problémů a variant",
        "Dohoda s hospodářem",
        "Plán měření výsledku po deštích",
      ],
      risks: [
        "Nevhodně umístěný prvek může soustředit odtok jinam.",
        "Ztráta obhospodařované plochy a údržba patří do ekonomiky záměru.",
      ],
      experts: [
        "Agronom nebo protierozní projektant",
        "Hospodář",
        "Krajinář podle návrhu",
      ],
      programIds: ["opzp17", "aeko", "organic"],
      sourceIds: ["soil-map", "szif", "standards"],
    },
  ),
];

const allApplicants = ["private", "farmer", "municipality", "ngo", "company"];
const candidateNote =
  "Pouze kandidát k prověření. Tematická shoda nepotvrzuje způsobilost žadatele, lokality, výdajů ani nárok na podporu. Před objednávkou prací ověřte platné dokumenty a souběh financování.";
export const programs = [
  {
    id: "opzp17",
    title: "OPŽP ZMV · 17. výzva",
    provider: "AOPK ČR",
    summary:
      "Adaptace krajiny na změnu klimatu, včetně vybraných vodních a vegetačních opatření.",
    measureIds: ["pools", "wetland", "stream", "pond", "soil"],
    applicantTypes: allApplicants,
    status: "open",
    window: { start: "2026-10-20", end: "2026-11-03" },
    eligibilityNote:
      "Registrace v JDP do 3. 11. 2026 v 15:00, doručení žádosti do 10. 11. 2026 v 15:00 podle změny výzvy. Ověřte úplné podmínky a odlišné kroky podání. " +
      candidateNote,
    sourceIds: ["aopk17"],
  },
  {
    id: "opzp18",
    title: "OPŽP ZMV · 18. výzva",
    provider: "AOPK ČR",
    summary:
      "Péče o stanoviště a druhy; nestačí obecný zájem o ekologický projekt.",
    measureIds: ["pools", "wetland", "stream", "forest", "meadow", "trees"],
    applicantTypes: allApplicants,
    status: "upcoming",
    window: { start: "2026-10-21", end: "2026-11-04" },
    eligibilityNote:
      "Oznámené budoucí okno. Opatření musí odpovídat konkrétní podaktivitě a podmínkám biologického přínosu. " +
      candidateNote,
    sourceIds: ["aopk18"],
  },
  {
    id: "ppkb",
    title: "Program péče o krajinu · PPK B",
    provider: "AOPK ČR",
    summary:
      "Neinvestiční péče a podpora přírodních hodnot; karta zachycuje ukončenou druhou výzvu 2026.",
    measureIds: ["pools", "meadow", "trees"],
    applicantTypes: allApplicants,
    status: "closed",
    window: { start: "2026-05-19", end: "2026-06-18" },
    eligibilityNote:
      "Ukončená výzva je podklad pro přípravu, nikoli možnost podat novou žádost. Ověřte územní působnost a případnou další výzvu. " +
      candidateNote,
    sourceIds: ["ppkb"],
  },
  {
    id: "forest-mze",
    title: "Příspěvky na hospodaření v lesích",
    provider: "MZe / krajský úřad",
    summary:
      "Obnova, výchova, ochrana lesa a šetrné technologie podle příslušného programu.",
    measureIds: ["forest"],
    applicantTypes: ["private", "farmer", "municipality", "company", "ngo"],
    status: "verify",
    window: { start: null, end: null },
    eligibilityNote:
      "Pravidla účinná od 1. 3. 2026. Lhůty a případné předchozí ohlášení se odvozují od typu příspěvku a provedení prací; jednotné roční okno zde není stanoveno. " +
      candidateNote,
    sourceIds: ["forest-support"],
  },
  {
    id: "aeko",
    title: "Agroenvironmentálně-klimatická opatření",
    provider: "SZIF",
    summary:
      "Plošná podpora konkrétních způsobů zemědělského hospodaření a víceletých závazků.",
    measureIds: ["meadow", "soil"],
    applicantTypes: ["farmer"],
    status: "verify",
    window: { start: null, end: null },
    eligibilityNote:
      "Žádá způsobilý hospodář, nikoli automaticky vlastník. Aktuální roční lhůta, titul, evidence LPIS a slučitelnost závazků vyžadují samostatné ověření. " +
      candidateNote,
    sourceIds: ["szif"],
  },
  {
    id: "organic",
    title: "Ekologické zemědělství",
    provider: "SZIF",
    summary:
      "Podpora ekologického hospodaření v režimu Jednotné žádosti, nikoli jednorázová dotace na každou louku.",
    measureIds: ["meadow", "soil"],
    applicantTypes: ["farmer"],
    status: "verify",
    window: { start: null, end: null },
    eligibilityNote:
      "Prověřte registraci, kontrolní systém, hospodaření a souběh titulů. Zveřejněný rozcestník nepotvrzuje aktuálně otevřený příjem; roční okno zde není ověřeno. " +
      candidateNote,
    sourceIds: ["szif"],
  },
].map((p) => ({
  ...p,
  checkedAt,
  url: sources.find((s) => s.id === p.sourceIds[0]).url,
}));

const rectangle = (x, y, w, h) => ({
  type: "Polygon",
  coordinates: [
    [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
      [x, y],
    ],
  ],
});
export const starterPortfolio = {
  schemaVersion: 1,
  id: "demo",
  name: "Modelové údolí",
  isDemo: true,
  description:
    "Zcela smyšlený ukázkový projekt. Názvy, výměry a geometrie nejsou evidencí skutečných parcel. Mapa slouží pouze k demonstraci ovládání; neobsahuje ověřené přírodní ani katastrální překryvy.",
  parcels: [
    {
      id: "demo-forest",
      name: "Les nad údolím",
      landType: "les",
      areaM2: 62000,
      parcelNumber: "",
      cadastralArea: "Modelové území",
      protections: [],
      geometry: rectangle(14.95, 49.7, 0.005, 0.003),
    },
    {
      id: "demo-meadow",
      name: "Louka u vody",
      landType: "louka",
      areaM2: 17000,
      parcelNumber: "",
      cadastralArea: "Modelové území",
      protections: [],
      geometry: rectangle(14.955, 49.7, 0.003, 0.002),
    },
    {
      id: "demo-field",
      name: "Pole na svahu",
      landType: "orná půda",
      areaM2: 41000,
      parcelNumber: "",
      cadastralArea: "Modelové území",
      protections: [],
      geometry: rectangle(14.955, 49.702, 0.004, 0.003),
    },
    {
      id: "demo-water",
      name: "Údolní pás",
      landType: "ostatní plocha",
      areaM2: 5000,
      parcelNumber: "",
      cadastralArea: "Modelové území",
      protections: [],
      geometry: rectangle(14.953, 49.699, 0.007, 0.0007),
    },
  ],
  projects: [
    {
      id: "demo-wetland",
      name: "Vrátit vodě prostor pod lesem",
      measureId: "wetland",
      parcelIds: ["demo-meadow", "demo-water"],
      areaHa: 0.3,
      evidence: {
        ownership: "yes",
        consent: "unknown",
        siteVisit: "yes",
        ecology: "unknown",
        maintenance: "unknown",
        waterAuthority: "unknown",
        waterBalance: "unknown",
        flow: "unknown",
      },
      budget: {
        preparation: 25000,
        implementation: 160000,
        ownWork: 5000,
        annualMaintenance: 4000,
        years: 5,
        eligibleCosts: 0,
        grantRate: 0,
      },
      notes:
        "SMYŠLENÁ UKÁZKA: Porovnat obnovu mokřadu s několika menšími tůněmi a variantou bez zásahu. Nejdřív sezónní pozorování vody a konzultace s biologem. Částky jsou pouze ukázkové vstupy, nikoli odhad ceny skutečné stavby.",
    },
    {
      id: "demo-forest-care",
      name: "Odolnější les s plánem následné péče",
      measureId: "forest",
      parcelIds: ["demo-forest"],
      areaHa: 1.5,
      evidence: {
        ownership: "yes",
        siteVisit: "yes",
        operator: "unknown",
        ecology: "unknown",
        consent: "unknown",
        maintenance: "no",
      },
      budget: {
        preparation: 8000,
        implementation: 75000,
        ownWork: 10000,
        annualMaintenance: 12000,
        years: 5,
        eligibleCosts: 0,
        grantRate: 0,
      },
      notes:
        "SMYŠLENÁ UKÁZKA: Probrat obnovu a ochranu mladých dřevin s odborným lesním hospodářem. Následná péče dosud není zajištěna. Ceny slouží pouze k ukázce práce s rozpočtem.",
    },
    {
      id: "demo-meadow-care",
      name: "Pestrá louka bez zbytečných závazků",
      measureId: "meadow",
      parcelIds: ["demo-meadow"],
      areaHa: 1.7,
      evidence: {
        ownership: "yes",
        consent: "unknown",
        siteVisit: "yes",
        ecology: "unknown",
        maintenance: "unknown",
        operator: "unknown",
      },
      budget: {
        preparation: 5000,
        implementation: 15000,
        ownWork: 0,
        annualMaintenance: 8000,
        years: 5,
        eligibleCosts: 0,
        grantRate: 0,
      },
      notes:
        "SMYŠLENÁ UKÁZKA: Nejdřív ověřit hospodáře, užívání a vhodný režim seče. Porovnat péči bez podpory a s případným víceletým závazkem. Uvedené výdaje jsou demonstrační.",
    },
  ],
  observations: [],
};
