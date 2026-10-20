# Krajinný kompas

Pracovní nástroj pro vlastníky krajiny: evidence parcel, příprava záměrů, srovnání vodních a pečujících opatření, kandidátní podpory, rozpočet včetně péče a export podkladu pro odbornou konzultaci.

## Spuštění

Node.js 22 nebo novější. `npm ci`, `npm run dev`. Kontrola: `npm test`, `npm run build`. Výstup `dist/` je statický a podporuje GitHub Pages.

## Použití

Začněte smyšlenou ukázkou, nebo v **Moje data** načtěte JSON portfolia. Importuje se také strukturovaný historický soupis parcel s poli `area_m2`, `parcel_number`, `cadastral_area`, `land_type`. Osobní údaje vlastníků se nepřebírají. Projekt lze exportovat, znovu načíst a dobrovolně ukládat v tomto prohlížeči. Místní uložení není záloha ani synchronizace. Před zavřením bez zapnutého uložení exportujte JSON.

Záměr přiřaďte k parcelám, zaznamenejte cíl a vyplňte podklady jako ano/ne/neověřeno. Úplnost odpovědí neznamená schválení. Rozpočet podpory je uživatelský scénář, nikoli dotační kalkulace potvrzená poskytovatelem. Markdown report lze použít v Obsidianu, předat odborníkovi nebo dále upravit.

Mapa zobrazuje pouze dodané WGS84 geometrie Polygon/MultiPolygon. Bez geometrie nebude poloha odhadována. Smyšlené demo geometrie nepředstavují skutečné parcely. Externí podklad je volitelný a při načtení předává poskytovateli zobrazovanou oblast; aplikace neprovádí automatickou analýzu ochranných pásem nebo biologických dat.

## Data a důvěryhodnost

Výchozí portfolio je výhradně smyšlené. Repo ani hostování neobsahují rodinné listy vlastnictví, adresy či skutečný soupis majetku. Import a výpočty běží místně; aplikace nemá backend, AI klíč ani analytické měření. Veřejný hosting a otevřené externí odkazy zpracovávají běžné síťové požadavky podle pravidel svých provozovatelů.

Výběrový katalog obsahuje 8 opatření a 6 programů. Není úplným dotačním vyhledávačem. Primární zdroje, datum ověření a postup aktualizace: [docs/SOURCES.md](docs/SOURCES.md). Staré a neověřené výzvy nejsou vydávány za otevřený příjem. Žádný výstup nenahrazuje místní průzkum, právní titul, odborný návrh, rozhodnutí úřadu nebo přiznání podpory.

## Další rozvoj

Připojení ověřených geometrií, souhlasů, nájemních vztahů a terénních pozorování; automatizovaný sběr otevřených výzev vyžaduje samostatnou datovou službu a pravidla kontroly. Aktuální verze žádné pravidelné sledování ani automatické upozorňování neslibuje.
