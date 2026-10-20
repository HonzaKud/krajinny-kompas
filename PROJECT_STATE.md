# Stav projektu

Cíl: užitečné možnosti péče a financování ihned po otevření, bez formulářů. Podklady jsou nepovinný vstup, který automaticky přizpůsobí pořadí a odůvodnění. Veřejný GitHub Pages web nemá obsahovat soukromý soupis majetku.

Rozhodnutí po uživatelské zpětné vazbě 20. 10. 2026: původní evidenční rozhraní nahrazeno výsledkovými kartami. Výchozí nabídka funguje bez dat. Každý scénář ukazuje základ podpory a vlastní podíl, pracnost s důvodem, rizika, zdroje a konkrétní další krok. Srovnání nejvýše tří variant. Žádná vymyšlená procentní šance schválení. Třináct scénářů sdílí programy: 10 dotačních a 3 alternativy bez nové dotace. Uzavřené výzvy jsou standardně skryté.

Architektura: statické Vite/vanilla JS, žádný backend ani placené AI API. Markdown/JSON/TXT/CSV se strukturuje místně; PDF.js a Tesseract ces+eng pracují v prohlížeči se selfhostovanými assety. Importy se slučují, rozporné záznamy se nepřepisují. Export zachovává nejistoty a historické datum. Paměť prohlížeče je volitelná a má mazání dat.

Ověření aktuálního kódu: 27 automatických testů prošlo, build prošel. Nezávislá kontrola bezpečnosti a testování; opraveny víceúzemní dokumenty, zachování původu, přidávání dokumentů, stavební prefixy, přípona Markdown a oddělení zastavěných/neznámých druhů od ostatních ploch. Browserový import syntetického PNG přes OCR, textového PDF i skenovaného PDF prošel; opravena kompatibilita ukončení PDF.js loading task. Nezávislá vizuální kontrola prošla na 1440 × 900, 390 × 844 a 320 × 844; finance a náročnost prvních desktopových karet jsou vidět bez scrollování. Porovnání, dialogy, fokus a export ověřeny.

Publikace: https://honzakud.github.io/krajinny-kompas/ ; kód https://github.com/HonzaKud/krajinny-kompas . Nasazování probíhá přes workflow s testy a produkčním sestavením. Rodinné údaje se importují a případně pamatují výhradně místně.

Omezení: výběrový ručně ověřovaný katalog, žádný automatický monitoring výzev, GIS překryvy ani odborný posudek. PDF text do 30 stran, OCR skenovaných PDF do prvních 3 stran s upozorněním na neúplnost; složitý nebo nečitelný list nemusí dát úplný přepis. OCR a tematická shoda nejsou ověření práv či nároku na dotaci. Skutečné hydrologické a biologické závěry vyžadují podklady z místa.


