import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { ScrollController } from "../types";
import { useMobileDialog } from "./useMobileDialog";

export function useContactDialogController(
  scrollControllerRef?: RefObject<ScrollController | null>,
) {
  const [open, setOpen] = useState(false);
  const isMobile = useMobileDialog();
  const firstActionRef = useRef<HTMLAnchorElement>(null);
  const lastTriggerRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  const openDialog = useCallback((trigger: HTMLButtonElement) => {
    lastTriggerRef.current = trigger;
    setOpen(true);
  }, []);

  useEffect(() => {
    if (open) {
      wasOpenRef.current = true;
      scrollControllerRef?.current?.stop();
      document.documentElement.dataset.contactOpen = "true";
      return undefined;
    }

    if (wasOpenRef.current) {
      wasOpenRef.current = false;
      scrollControllerRef?.current?.start();
      delete document.documentElement.dataset.contactOpen;
      requestAnimationFrame(() => lastTriggerRef.current?.focus({ preventScroll: true }));
    }

    return undefined;
  }, [open, scrollControllerRef]);

  useEffect(
    () => () => {
      scrollControllerRef?.current?.start();
      delete document.documentElement.dataset.contactOpen;
    },
    [scrollControllerRef],
  );

  return {
    firstActionRef,
    isMobile,
    open,
    openDialog,
    setOpen,
  };
}
