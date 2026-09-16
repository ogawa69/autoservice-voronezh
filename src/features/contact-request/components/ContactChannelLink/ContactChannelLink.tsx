import { MessageCircle, MessagesSquare, Phone, Send } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ContactChannelIcon } from "../../../../content/demo";
import type { ContactChannelLinkProps } from "./types";

const channelIcons: Record<ContactChannelIcon, LucideIcon> = {
  whatsapp: MessageCircle,
  telegram: Send,
  max: MessagesSquare,
  phone: Phone,
};

export function ContactChannelLink({ channel, actionRef }: ContactChannelLinkProps) {
  const Icon = channelIcons[channel.icon];
  const opensExternalPage = channel.href.startsWith("http");

  return (
    <a
      ref={actionRef}
      className={`channel-link channel-link-${channel.icon}`}
      href={channel.href}
      target={opensExternalPage ? "_blank" : undefined}
      rel={opensExternalPage ? "noreferrer" : undefined}
    >
      <Icon aria-hidden="true" size={22} strokeWidth={2} />
      <span>
        <strong>{channel.label}</strong>
        <small>{channel.meta}</small>
      </span>
    </a>
  );
}
