import { Dialog } from "@base-ui/react/dialog";
import { Drawer } from "@base-ui/react/drawer";
import { ContactPanel } from "../ContactPanel";
import type { ContactDialogRootProps } from "./types";

export function ContactDialogRoot({
  firstActionRef,
  isMobile,
  open,
  setOpen,
}: ContactDialogRootProps) {
  if (isMobile) {
    return (
      <Drawer.Root open={open} onOpenChange={setOpen} modal swipeDirection="down">
        <Drawer.VirtualKeyboardProvider>
          <Drawer.Portal>
            <Drawer.Backdrop className="contact-backdrop" />
            <Drawer.Viewport className="contact-drawer-viewport">
              <Drawer.Popup
                className="contact-dialog contact-drawer"
                initialFocus={firstActionRef}
                data-lenis-prevent
              >
                <Drawer.Content className="contact-dialog-content">
                  <ContactPanel mode="drawer" firstActionRef={firstActionRef} />
                </Drawer.Content>
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.VirtualKeyboardProvider>
      </Drawer.Root>
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen} modal>
      <Dialog.Portal>
        <Dialog.Backdrop className="contact-backdrop" />
        <Dialog.Viewport className="contact-viewport">
          <Dialog.Popup
            className="contact-dialog contact-dialog-desktop"
            initialFocus={firstActionRef}
            data-lenis-prevent
          >
            <ContactPanel mode="dialog" firstActionRef={firstActionRef} />
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
