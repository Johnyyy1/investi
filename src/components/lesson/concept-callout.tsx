export function ConceptCallout({ title, content }: { title: string; content: string }) {
  return <aside className="my-8 border-l-2 border-positive bg-[#f0f6f2] px-5 py-4"><h3 className="text-sm font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-neutral-700">{content}</p></aside>;
}
