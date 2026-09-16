import { useContext } from "react";
import { ContactDialogContext } from "../model/contactDialogContext";

export function useContactDialog() {
  const context = useContext(ContactDialogContext);

  if (!context) {
    throw new Error("ContactTrigger must be rendered inside ContactRequest");
  }

  return context;
}
