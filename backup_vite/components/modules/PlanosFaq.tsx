import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import type { FaqItem } from "@/lib/plans-data";

export function PlanosFaq({ items }: { items: FaqItem[] }) {
  return (
    <Accordion type="single" collapsible className="space-y-2">
      {items.map((item, i) => (
        <AccordionItem
          key={i}
          value={`faq-${i}`}
          className="border border-border rounded-xl bg-card px-5 data-[state=open]:shadow-sm"
        >
          <AccordionTrigger className="text-sm font-semibold text-foreground text-left hover:no-underline py-4">
            {item.q}
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
            {item.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
