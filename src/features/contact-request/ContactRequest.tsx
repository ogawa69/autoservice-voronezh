import { lazy, Suspense } from "react";
import { useContactDialogController } from "./hooks/useContactDialogController";
import { ContactDialogContext } from "./model/contactDialogContext";
import type { ContactRequestProps } from "./types";
import "./styles.css";

const ContactDialogRoot = lazy(() =>
  import("./components/ContactDialogRoot").then(({ ContactDialogRoot: Component }) => ({
    default: Component,
  })),
);

export function ContactRequest({ children, scrollControllerRef }: ContactRequestProps) {
  const { firstActionRef, isMobile, open, openDialog, setOpen } =
    useContactDialogController(scrollControllerRef);

  return (
    <ContactDialogContext.Provider value={{ open, openDialog }}>
      {children}
      {open ? (
        <Suspense fallback={null}>
          <ContactDialogRoot
            firstActionRef={firstActionRef}
            isMobile={isMobile}
            open={open}
            setOpen={setOpen}
          />
        </Suspense>
      ) : null}
    </ContactDialogContext.Provider>
  );
}
