import type { AuthoredLesson } from "../types";
import { returnsLessons } from "./manifest";

export const simpleReturnsLesson: AuthoredLesson = {
  id: returnsLessons[1].id,
  moduleSlug: "returns",
  slug: returnsLessons[1].slug,
  title: returnsLessons[1].title,
  eyebrow: "Výnosy a složené zhodnocení",
  position: 2,
  estimatedMinutes: returnsLessons[1].estimatedMinutes,
  sections: [
    { id: "periods", label: "Jedno období po druhém" },
    { id: "series", label: "Čtení časové řady ceny" },
    { id: "representation", label: "Desetinná čísla a procenta" },
    { id: "practice", label: "Procvičení" },
  ],
  navigation: { previous: { href: "/learn/returns/what-is-a-return", label: "Co je výnos?" }, next: { href: "/learn/returns/compounding-and-cumulative-returns", label: "Složené a kumulativní výnosy" } },
  blocks: [
    { id: "periods", type: "heading", title: "Výnos za období měří vždy jeden pohyb.", body: "U denní řady každý výnos porovnává dnešní cenu se včerejší — ne s první cenou v řadě." },
    { id: "period-intro", type: "paragraph", content: "Finanční analýza pracuje s výnosy, protože převádějí každý pohyb ceny na srovnatelnou škálu. Jmenovatel se v každém období mění: vždy jde o předchozí cenu." },
    { id: "period-formula-one", type: "formula", latex: "R_t = \\frac{P_t - P_{t-1}}{P_{t-1}}", expression: "R_t = (P_t − P_(t−1)) / P_(t−1)", variables: [{ symbol: "R_t", description: "výnos v období t" }, { symbol: "P_t", description: "aktuální cena" }, { symbol: "P_(t−1)", description: "cena v předchozím období" }] },
    { id: "period-formula-two", type: "formula", latex: "R_t = \\frac{P_t}{P_{t-1}} - 1", expression: "R_t = P_t / P_(t−1) − 1", variables: [{ symbol: "R_t", description: "výnos za stejné období" }, { symbol: "P_t", description: "aktuální cena" }, { symbol: "P_(t−1)", description: "cena v předchozím období" }] },
    { id: "period-example", type: "workedExample", title: "Od dne 0 ke dni 1", introduction: "Když cena vzroste ze 100 na 105, první denní výnos používá jako jmenovatel 100.", steps: [{ label: "Předchozí cena", value: "100" }, { label: "Aktuální cena", value: "105" }, { label: "Denní změna", value: "+5" }, { label: "Výnos za den 1", value: "+5%", emphasis: true }], conclusion: "Další období začne na 105. Jako jmenovatel už nepoužívá 100." },
    { id: "series", type: "heading", title: "Čti řadu jako dvojice po sobě.", body: "Krátká časová řada ceny může obsahovat kladné, záporné i nulové výnosy. Projdi si každý řádek a přesnou dvojici, která za ním stojí." },
    { id: "series-figure", type: "interactiveFigure", figure: "price-series-explorer", title: "Průzkumník denních výnosů", description: "Vyber v tabulce libovolné období. Zvýrazněný interval ukáže, která předchozí cena se pro výnos používá." },
    { id: "first-calculation", type: "numericQuestion", prompt: "Cena vzroste z 80 na 84. Jaký je jednoduchý výnos?", answer: 5, tolerance: 0.05, unit: "%", correctExplanation: "Změna je 4. Vyděl ji předchozí cenou 80: 4 ÷ 80 = 0,05, tedy 5 %.", incorrectExplanation: "Jako jmenovatel použij předchozí cenu: (84 − 80) ÷ 80 = 0,05 = 5 %." },
    { id: "negative-return", type: "numericQuestion", prompt: "Cena klesne ze 120 na 108. Jaký je jednoduchý výnos?", answer: -10, tolerance: 0.05, unit: "%", correctExplanation: "Změna je −12. Po vydělení předchozí cenou dostaneme −12 ÷ 120 = −0,10, tedy −10 %.", incorrectExplanation: "Ztráta je 12 vzhledem k počáteční ceně 120: (108 − 120) ÷ 120 = −0,10 = −10 %." },
    { id: "representation", type: "heading", title: "Ukládej výnosy jako desetinná čísla, zobrazuj je jako procenta.", body: "Kvantitativní výpočty běžně používají desetinná čísla. Při zobrazení k nim pro přehlednost přidáme znak procenta." },
    { id: "decimal-callout", type: "conceptCallout", title: "Stejná hodnota, jiný zápis", content: "0,05 znamená 5 %. Stejně tak −0,12 znamená −12 %. Vynásobením desetinného čísla 100 ho převedeš na zobrazené procento." },
    { id: "decimal-practice", type: "numericQuestion", prompt: "Výnos je uložen jako −0,12. Jak ho zapíšeme v procentech?", answer: -12, tolerance: 0.05, unit: "%", correctExplanation: "Vynásob desetinné číslo 100: −0,12 × 100 = −12 %. Záporné znaménko zůstává.", incorrectExplanation: "Desetinný výnos převedeš na procenta vynásobením 100. Z −0,12 tak vznikne −12 %." },
    { id: "comparison", type: "multipleChoiceQuestion", prompt: "Aktivum A vzroste z 50 na 55. Aktivum B vzroste z 200 na 210. Které mělo vyšší výnos a proč?", options: [{ id: "a", label: "Aktivum A, protože 5 tvoří z 50 větší podíl než 10 z 200." }, { id: "b", label: "Aktivum B, protože získalo více cenových jednotek." }, { id: "c", label: "Výnosy jsou stejné, protože obě ceny vzrostly." }], correctOptionId: "a", correctExplanation: "Aktivum A mělo výnos 5 ÷ 50 = 10 %. Aktivum B mělo 10 ÷ 200 = 5 %. Stejná nebo větší změna ceny neznamená vyšší výnos.", incorrectExplanation: "Porovnej každý pohyb s předchozí cenou. Aktivum A získalo 10 %, aktivum B 5 %. Jmenovatel určuje měřítko výnosu." },
    { id: "practice", type: "heading", title: "Vypočítej každé období zvlášť.", body: "Pohyby zatím nekombinuj. Kumulativní výnosy probereme v další lekci." },
    { id: "two-periods", type: "multiNumericQuestion", prompt: "Časová řada ceny se pohne 100 → 110 → 99. Vypočítej oba výnosy za období.", answers: [{ id: "first", label: "100 → 110", answer: 10, tolerance: 0.05, unit: "%" }, { id: "second", label: "110 → 99", answer: -10, tolerance: 0.05, unit: "%" }], correctExplanation: "První období: (110 − 100) ÷ 100 = 10 %. Druhé období: (99 − 110) ÷ 110 = −10 %. Každé období používá svou vlastní předchozí cenu.", incorrectExplanation: "Vnímej to jako dvě oddělená porovnání. U druhého výnosu je jmenovatelem 110, ne původních 100." },
    { id: "raw-differences", type: "explanation", title: "Proč nepoužít prosté rozdíly cen?", content: "Rozdíly cen ignorují měřítko. Zisk 10 má jiný význam po růstu ze 100 než po růstu z 200. Výnosy za jednotlivá období tento kontext zachovávají a umožňují srovnávat řady." },
    { id: "takeaway", type: "takeaway", title: "Shrnutí", content: "Jednoduchý výnos za období porovnává aktuální cenu s bezprostředně předchozí cenou. Výnosy se ukládají jako desetinná čísla, často se zobrazují v procentech a jmenovatel se při pohybu řady mění." },
    { id: "checkpoint", type: "checkpoint", label: "Než budeš pokračovat", content: "Teď umíš vypočítat výnos za období z po sobě jdoucích cen, převádět mezi desetinným a procentním zápisem a vysvětlit, proč záleží na předchozí ceně." },
  ],
};
