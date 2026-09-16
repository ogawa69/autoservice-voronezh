import { useContactDialog } from "../../hooks/useContactDialog";
import type { ContactTriggerProps } from "../../types";

export function ContactTrigger({ className, children, id }: ContactTriggerProps) {
  const { open, openDialog } = useContactDialog();

  return (
    <button
      id={id}
      className={className}
      type="button"
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={(event) => openDialog(event.currentTarget)}
    >
      {children}
    </button>
  );
}
