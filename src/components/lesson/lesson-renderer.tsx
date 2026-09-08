"use client";

import type { AuthoredLesson, LessonBlock } from "@/features/lessons/types";
import { ConceptCallout } from "./concept-callout";
import { Formula, LessonHeading } from "./formula";
import { Question } from "./question";
import { ReturnCalculator } from "./return-calculator";
import { WorkedExample } from "./worked-example";

function renderBlock(block: LessonBlock) {
  switch (block.type) {
    case "heading": return <LessonHeading key={block.id} id={block.id} title={block.title} body={block.body} />;
    case "paragraph": return <p key={block.id} className="mt-5 text-base leading-7 text-neutral-700">{block.content}</p>;
    case "formula": return <Formula key={block.id} expression={block.expression} variables={block.variables} />;
    case "workedExample": return <WorkedExample key={block.id} {...block} />;
    case "conceptCallout": return <ConceptCallout key={block.id} title={block.title} content={block.content} />;
    case "interactiveFigure": return <div key={block.id}><p className="mt-8 text-base leading-7 text-neutral-700">{block.description}</p><ReturnCalculator /></div>;
    case "multipleChoiceQuestion": case "numericQuestion": return <Question key={block.id} block={block} />;
    case "explanation": return <section key={block.id} className="my-9 border-l border-neutral-400 pl-5"><h3 className="text-base font-semibold">{block.title}</h3><p className="mt-2 text-sm leading-6 text-neutral-700">{block.content}</p></section>;
    case "takeaway": return <aside key={block.id} className="my-10 bg-neutral-950 px-6 py-6 text-white"><p className="text-xs font-medium uppercase tracking-[0.15em] text-neutral-400">{block.title}</p><p className="mt-3 text-base leading-7">{block.content}</p></aside>;
    case "checkpoint": return <section key={block.id} className="my-10 border-y border-line py-6"><p className="text-xs font-medium uppercase tracking-[0.15em] text-muted">{block.label}</p><p className="mt-3 text-sm leading-6 text-neutral-700">{block.content}</p></section>;
  }
}

export function LessonRenderer({ lesson }: { lesson: AuthoredLesson }) {
  return <>{lesson.blocks.map(renderBlock)}</>;
}
