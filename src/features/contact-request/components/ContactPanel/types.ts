import type { RefObject } from "react";

export type ContactPanelMode = "dialog" | "drawer";

export interface ContactPanelProps {
  mode: ContactPanelMode;
  firstActionRef: RefObject<HTMLAnchorElement | null>;
}
