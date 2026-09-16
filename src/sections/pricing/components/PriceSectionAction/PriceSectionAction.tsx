import { ArrowUpRight } from "lucide-react";
import { ContactTrigger } from "@/features/contact-request";
import type { PriceSectionActionProps } from "./types";

export function PriceSectionAction({ flow = false }: PriceSectionActionProps) {
  const className = `price-list__actions${
    flow ? " price-list__actions--flow" : ""
  }`;

  return (
    <div className={className}>
      <ContactTrigger
        className="price-list__all-prices"
        id="price-list-all-prices-trigger"
      >
        Все цены
        <ArrowUpRight aria-hidden="true" size={20} strokeWidth={2} />
      </ContactTrigger>
    </div>
  );
}
