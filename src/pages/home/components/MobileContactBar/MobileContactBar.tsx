import { MessageCircle, Phone } from "lucide-react";
import { siteProfile } from "@/content/demo";
import { ContactTrigger } from "@/features/contact-request";

export function MobileContactBar() {
  return (
    <aside className="mobile-contact-bar" aria-label="Быстрые действия">
      <a href={siteProfile.phoneHref} className="mobile-call">
        <Phone aria-hidden="true" size={20} strokeWidth={2} />
        Позвонить
      </a>
      <ContactTrigger className="mobile-write" id="mobile-contact-trigger">
        <MessageCircle aria-hidden="true" size={20} strokeWidth={2} />
        Написать
      </ContactTrigger>
    </aside>
  );
}
