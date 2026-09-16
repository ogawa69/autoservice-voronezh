import { ContactRequest } from "@/features/contact-request";
import { useSmoothScroll } from "../../hooks/useSmoothScroll";
import type { AppProvidersProps } from "../../types";

export function AppProviders({ children }: AppProvidersProps) {
  const scrollControllerRef = useSmoothScroll();

  return (
    <ContactRequest scrollControllerRef={scrollControllerRef}>
      {children}
    </ContactRequest>
  );
}
