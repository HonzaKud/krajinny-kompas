# Krajinný kompas

Možnosti péče a financování pro lesy, louky, pole, stromy a vodu. Po otevření rovnou zobrazí varianty, finanční rámec, pracnost, rizika a první krok. Vyplňování evidenčních formulářů není součástí hlavního toku.

## Použití

Procházejte možnosti ihned nebo zvolte oblast jedním filtrem. Porovnat lze až tři varianty. Detail uvádí podporu a vlastní podíl, základ výpočtu, omezení, zdroje a důvody návaznosti. Výsledky lze stáhnout v Markdownu.

**Načíst podklady** je nepovinné. Podporuje Markdownové tabulky, JSON portfolia a historického soupisu, TXT/CSV, textová PDF a OCR skenů nebo JPG/PNG. Importované parcely se automaticky využijí pro seřazení výsledků. Nové dokumenty se přidávají k existující evidenci; rozpory se odmítnou a původní data zůstanou. Osobní identifikátory vlastníků nejsou přebírány do strukturovaného portfolia.

OCR běží místně v prohlížeči pomocí Tesseract (čeština a angličtina), PDF čte PDF.js. Skripty, worker i jazyková data se načítají ze stejného hostování. Dokumenty neodesíláme do externí AI ani na server. Jde o OCR a konzervativní strukturování, nikoli generativní AI. Nečitelný nebo složitý list může skončit upozorněním místo úplného přepisu. OCR neopravňuje považovat vlastnictví, čísla či výměry za úředně ověřené.

Limity: 20 souborů / 30 MB najednou, 10 MB jeden soubor. PDF nejvýše 30 stran; OCR skenovaných PDF jen na prvních třech stranách, další se výslovně ohlásí jako nepřečtené. Údaje lze dobrovolně pamatovat v tomto prohlížeči a odstranit. JSON kopie zachovává i původ a nejistoty; uložení v prohlížeči není záloha ani synchronizace.

## Interpretace

Katalog obsahuje 13 scénářů: 10 dotačních scénářů sdílejících programy a 3 cesty bez nové dotace. Není to 13 různých grantů. Uzavřené výzvy jsou standardně skryté. Primární zdroje, finanční sazby a jejich rozhodný základ: [docs/OPPORTUNITIES.md](docs/OPPORTUNITIES.md), další souvislosti [docs/SOURCES.md](docs/SOURCES.md).

Shoda s evidencí je tematická návaznost na druh pozemku. Není procentní pravděpodobnost schválení. Katastr sám nepotvrzuje hospodáře, LPIS, hydrologii ani biologický stav. Dotace může být podmíněna jiným výpočtovým základem než cenou dodavatele. Podpora 100 % základu neznamená nulové celkové vlastní náklady.

Reálné rodinné dokumenty ani soupis majetku nejsou ve veřejném repozitáři. Výchozí stránka obsahuje obecné možnosti, žádné smyšlené parcely. Aplikace nemá backend, analytiku ani AI klíč. Katalog se průběžně sám neaktualizuje; před rozhodnutím je nutné otevřít poskytovatele. Mapa a automatické GIS překryvy nejsou součástí tohoto výsledkového rozhraní.

## Vývoj

Node.js 24. `npm ci`, `npm run dev`. Ověření: `npm test`, `npm run build`. Příprava OCR/PDF assetů je součástí predev/prebuild; nekopíruje soukromé dokumenty. `dist/` se nasazuje přes GitHub Actions na Pages. Bez backendu nebo placených API.
