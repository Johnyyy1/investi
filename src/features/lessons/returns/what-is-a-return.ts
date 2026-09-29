import type { AuthoredLesson } from "../types";
import { returnsLessons } from "./manifest";

export const whatIsAReturnLesson: AuthoredLesson = {
  id: returnsLessons[0].id,
  moduleSlug: "returns",
  slug: returnsLessons[0].slug,
  title: returnsLessons[0].title,
  eyebrow: "Výnosy a složené zhodnocení",
  position: 1,
  estimatedMinutes: returnsLessons[0].estimatedMinutes,
  sections: [
    { id: "meaning", label: "Co výnos měří" },
    { id: "comparing", label: "Porovnání investic" },
    { id: "calculate", label: "Výpočet výnosu" },
    { id: "check", label: "Ověř si uvažování" },
  ],
  navigation: { next: { href: "/learn/returns/simple-returns", label: "Jednoduché výnosy" } },
  blocks: [
    { id: "meaning", type: "heading", title: "Výnos říká, co investice vydělala vzhledem k počáteční hodnotě.", body: "Pohyb ceny je fakt. Výnos mu dává souvislost. V této lekci počítáme cenový výnos: změnu ceny bez dividend, poplatků a dalších peněžních toků." },
    { id: "price-change", type: "paragraph", content: "Představ si aktivum, jehož cena vzroste ze 100 na 110. Cena se změnila o 10 jednotek. Tato absolutní změna je užitečná, ale sama neříká, jak velký byl zisk vzhledem k investovaným penězům." },
    { id: "formula-one", type: "formula", latex: "R = \\frac{P_{\\mathrm{end}} - P_{\\mathrm{start}}}{P_{\\mathrm{start}}}", expression: "R = (P_end − P_start) / P_start", variables: [{ symbol: "R", description: "jednoduchý výnos" }, { symbol: "P_start", description: "počáteční cena" }, { symbol: "P_end", description: "konečná cena" }] },
    { id: "formula-two", type: "formula", latex: "R = \\frac{P_{\\mathrm{end}}}{P_{\\mathrm{start}}} - 1", expression: "R = P_end / P_start − 1", variables: [{ symbol: "R", description: "stejný jednoduchý výnos" }, { symbol: "P_start", description: "počáteční cena" }, { symbol: "P_end", description: "konečná cena" }] },
    { id: "example-100", type: "workedExample", title: "Od 100 do 110", introduction: "Začni aktivem s cenou 100 a skonči na 110.", steps: [{ label: "Počáteční cena", value: "100" }, { label: "Konečná cena", value: "110" }, { label: "Absolutní změna", value: "+10" }, { label: "Výnos", value: "+10 %", emphasis: true }], conclusion: "Aktivum vydělalo 10 %, protože zisk 10 vztahujeme k počáteční ceně 100." },
    { id: "positive-negative", type: "conceptCallout", title: "Výnos může být kladný, záporný nebo nulový", content: "Když je konečná cena nad počáteční, je výnos kladný. Když je pod ní, je záporný. Například 100 → 110 znamená +10 %, 100 → 90 znamená −10 % a 100 → 100 znamená 0 %." },
    { id: "comparing", type: "heading", title: "Stejný růst ceny může znamenat něco úplně jiného.", body: "Procenta umožňují porovnávat výsledky aktiv s různými počátečními cenami." },
    { id: "compare-assets", type: "workedExample", title: "Zisk 10 není vždy výnos 10 %", steps: [{ label: "Aktivum A", value: "100 → 110 = +10 jednotek = +10 %", emphasis: true }, { label: "Aktivum B", value: "500 → 510 = +10 jednotek = +2 %", emphasis: true }], conclusion: "Obě aktiva získala 10 jednotek. Aktivum A mělo vyšší výnos, protože 10 tvoří ze 100 větší podíl než z 500." },
    { id: "prediction", type: "multipleChoiceQuestion", prompt: "Než odpověď odhalíš: Akcie A vzroste z 80 na 88. Akcie B vzroste z 300 na 318. Která investice měla vyšší procentní výnos?", options: [{ id: "a", label: "Akcie A" }, { id: "b", label: "Akcie B" }, { id: "c", label: "Měly stejný výnos" }], correctOptionId: "a", correctExplanation: "Akcie A získala 8 z počátečních 80, tedy 10 %. Akcie B získala více jednotek, ale 18 z 300 je jen 6 %.", incorrectExplanation: "Porovnej každý zisk s jeho vlastní počáteční cenou. Akcie A: 8 ÷ 80 = 10 %. Akcie B: 18 ÷ 300 = 6 %." },
    { id: "calculate", type: "interactiveFigure", figure: "return-calculator", title: "Vyzkoušej výpočet", description: "Změň jednu z cen. Kalkulačka zachová přesný výpočet a zaokrouhlí jen zobrazený výsledek." },
    { id: "numeric", type: "numericQuestion", prompt: "Akcie vzroste z 80 na 92. Jaký je její procentní výnos?", answer: 15, tolerance: 0.05, unit: "%", correctExplanation: "Absolutní změna je 12. Po vydělení počáteční cenou dostaneme 12 ÷ 80 = 0,15, tedy 15 %.", incorrectExplanation: "Nejprve najdi změnu: 92 − 80 = 12. Potom ji vyděl počáteční cenou, ne konečnou cenou: 12 ÷ 80 = 0,15 = 15 %." },
    { id: "why-percent", type: "multipleChoiceQuestion", prompt: "Proč jsou procentní výnosy při porovnávání investic obvykle užitečnější než absolutní změny ceny?", options: [{ id: "a", label: "Vždy zvětší zobrazený zisk." }, { id: "b", label: "Vztahují změnu k počáteční hodnotě každé investice." }, { id: "c", label: "Odstraňují možnost ztráty." }], correctOptionId: "b", correctExplanation: "Procentní výnos vztahuje zisk nebo ztrátu k počáteční hodnotě. Díky tomu lze změnu o 10 jednotek interpretovat u investic s různými cenami.", incorrectExplanation: "Absolutní změny opomíjejí počáteční měřítko. Procentní výnos dělí změnu počáteční hodnotou, takže jsou srovnání smysluplná." },
    { id: "check", type: "explanation", title: "Užitečný návyk", content: "Kdykoli vidíš pohyb ceny, zeptej se: ve srovnání s jakou počáteční hodnotou? Tato otázka odděluje absolutní změnu od výnosu." },
    { id: "takeaway", type: "takeaway", title: "Shrnutí", content: "Jednoduchý výnos je procentní zisk nebo ztráta mezi počáteční a konečnou cenou. Při porovnávání investic je obvykle užitečnější než absolutní změna." },
    { id: "checkpoint", type: "checkpoint", label: "Než budeš pokračovat", content: "Teď umíš rozlišit změnu ceny od výnosu, vypočítat jednoduchý výnos a vysvětlit, proč je procento lepším srovnáním." },
  ],
};
