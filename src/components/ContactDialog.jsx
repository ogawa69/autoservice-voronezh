import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Drawer } from "@base-ui/react/drawer";
import { MessageCircle, MessagesSquare, Phone, Send, X } from "lucide-react";
import { contactChannels } from "../data/siteContent";

const ContactDialogContext = createContext(null);

const channelIcons = {
  whatsapp: MessageCircle,
  telegram: Send,
  max: MessagesSquare,
  phone: Phone,
};

function useMobileDialog() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 47.999rem)");
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return isMobile;
}

export function ContactTrigger({ className, children, id }) {
  const context = useContext(ContactDialogContext);

  if (!context) {
    throw new Error("ContactTrigger must be rendered inside ContactDialog");
  }

  return (
    <button
      id={id}
      className={className}
      type="button"
      aria-haspopup="dialog"
      aria-expanded={context.open}
      onClick={(event) => context.openDialog(event.currentTarget)}
    >
      {children}
    </button>
  );
}

function ContactPanel({ mode, firstActionRef }) {
  const isDrawer = mode === "drawer";
  const Title = isDrawer ? Drawer.Title : Dialog.Title;
  const Description = isDrawer ? Drawer.Description : Dialog.Description;
  const Close = isDrawer ? Drawer.Close : Dialog.Close;

  return (
    <>
      {isDrawer && <span className="drawer-handle" aria-hidden="true" />}
      <Close className="dialog-close" aria-label="Закрыть окно связи">
        <X aria-hidden="true" size={20} strokeWidth={2} />
      </Close>

      <header className="dialog-intro">
        <p className="dialog-index">Связь / запись</p>
        <Title className="dialog-title">Способ связи</Title>
        <Description className="dialog-description">
          Позвоните или откройте готовое сообщение в удобном мессенджере.
        </Description>
      </header>

      <div className="contact-options" data-lenis-prevent>
        <div className="channel-grid">
          {contactChannels.map((channel, index) => {
            const Icon = channelIcons[channel.icon];

            return (
              <a
                ref={index === 0 ? firstActionRef : undefined}
                key={channel.label}
                className={`channel-link channel-link-${channel.icon}`}
                href={channel.href}
                target={channel.href.startsWith("http") ? "_blank" : undefined}
                rel={channel.href.startsWith("http") ? "noreferrer" : undefined}
              >
                <Icon aria-hidden="true" size={22} strokeWidth={2} />
                <span>
                  <strong>{channel.label}</strong>
                  <small>{channel.meta}</small>
                </span>
              </a>
            );
          })}
        </div>
        <p className="dialog-note">Мессенджер откроется с уже подготовленным текстом — останется нажать «Отправить».</p>
      </div>
    </>
  );
}

export function ContactDialog({ children, scrollControllerRef }) {
  const [open, setOpen] = useState(false);
  const isMobile = useMobileDialog();
  const firstActionRef = useRef(null);
  const lastTriggerRef = useRef(null);
  const wasOpenRef = useRef(false);

  const openDialog = (trigger) => {
    lastTriggerRef.current = trigger;
    setOpen(true);
  };

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

  return (
    <ContactDialogContext.Provider value={{ open, openDialog }}>
      {children}

      {isMobile ? (
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
      ) : (
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
      )}
    </ContactDialogContext.Provider>
  );
}
