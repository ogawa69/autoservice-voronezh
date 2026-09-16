export type ContactChannelIcon = "phone" | "whatsapp" | "telegram" | "max";

export interface ContactChannel {
  label: string;
  meta: string;
  href: string;
  icon: ContactChannelIcon;
}

export interface SiteProfile {
  mode: "demo";
  name: string;
  address: string;
  addressLabel: string;
  heroDescription: string;
  phoneLabel: string;
  phoneHref: string;
  workingHours: string;
  mapScreenshot: string;
  mapPage: string;
}

export const siteProfile: SiteProfile = {
  mode: "demo",
  name: "АВТОСЕРВИС/01",
  address: "Воронеж · демонстрационный адрес",
  addressLabel: "Воронеж, демонстрационный адрес",
  heroDescription:
    "Диагностика, обслуживание и ремонт · демонстрационный проект.",
  phoneLabel: "+7 (999) 999-99-99",
  phoneHref: "tel:+79999999999",
  workingHours: "10:00–21:00",
  mapScreenshot: "/maps/contact-map-voronezh.png",
  mapPage: "https://yandex.ru/maps/193/voronezh/",
};

const contactMessage = encodeURIComponent(
  "Здравствуйте! Хочу записаться на диагностику или ремонт. Подскажите, пожалуйста, ближайшее свободное время.",
);

export const contactChannels = [
  {
    label: "Позвонить",
    meta: siteProfile.phoneLabel,
    href: siteProfile.phoneHref,
    icon: "phone",
  },
  {
    label: "WhatsApp",
    meta: "Сообщение готово",
    href: `https://wa.me/79999999999?text=${contactMessage}`,
    icon: "whatsapp",
  },
  {
    label: "Telegram",
    meta: "Сообщение готово",
    href: `https://t.me/+79999999999?text=${contactMessage}`,
    icon: "telegram",
  },
  {
    label: "MAX",
    meta: "Сообщение готово",
    href: `https://max.ru/:share?text=${contactMessage}`,
    icon: "max",
  },
] satisfies readonly ContactChannel[];
