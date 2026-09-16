import type { Dispatch, RefObject, SetStateAction } from "react";

export interface ContactDialogRootProps {
  firstActionRef: RefObject<HTMLAnchorElement | null>;
  isMobile: boolean;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}
