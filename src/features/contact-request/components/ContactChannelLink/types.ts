import type { RefObject } from "react";
import type { ContactChannel } from "../../../../content/demo";

export interface ContactChannelLinkProps {
  channel: ContactChannel;
  actionRef?: RefObject<HTMLAnchorElement | null>;
}
