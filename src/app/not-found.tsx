import { PageState } from "@/components/learning/page-state";
import { LearningLink } from "@/components/learning/learning-button";
export default function NotFound() { return <PageState title="Tato stránka není k dispozici" action={<LearningLink href="/learn">Zpět k učení</LearningLink>}>Tato lekce může být zatím jen v plánu. Pokračuj některou z dostupných lekcí o výnosech.</PageState>; }
