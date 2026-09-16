import { createContext } from "react";

export interface ContactDialogContextValue {
  open: boolean;
  openDialog: (trigger: HTMLButtonElement) => void;
}

export const ContactDialogContext = createContext<ContactDialogContextValue | null>(null);
