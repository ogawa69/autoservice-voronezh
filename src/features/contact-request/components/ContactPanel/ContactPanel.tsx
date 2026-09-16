import { Dialog } from "@base-ui/react/dialog";
import { Drawer } from "@base-ui/react/drawer";
import { X } from "lucide-react";
import { contactChannels } from "../../../../content/demo";
import { ContactChannelLink } from "../ContactChannelLink";
import type { ContactPanelProps } from "./types";

export function ContactPanel({ mode, firstActionRef }: ContactPanelProps) {
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
        <Title className="dialog-title">Связь с нами</Title>
        <Description className="dialog-description">
          Позвоните или откройте готовое сообщение в удобном мессенджере.
        </Description>
      </header>

      <div className="contact-options" data-lenis-prevent>
        <div className="channel-grid">
          {contactChannels.map((channel, index) => (
            <ContactChannelLink
              key={channel.label}
              channel={channel}
              actionRef={index === 0 ? firstActionRef : undefined}
            />
          ))}
        </div>
        <p className="dialog-note">
          Мессенджер откроется с уже подготовленным текстом — останется нажать «Отправить».
        </p>
      </div>
    </>
  );
}
