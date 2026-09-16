export type PromotionTone = "accent" | "light" | "dark" | "steel";

export interface Promotion {
  id: string;
  category: string;
  mark: string;
  title: string;
  description: string;
  image: string;
  imageWidth: number;
  imageHeight: number;
  imagePosition: string;
  aspect: number;
  tone: PromotionTone;
}

export const promotions = [
  {
    id: "first-visit",
    category: "Для новых клиентов",
    mark: "−15%",
    title: "На работы в первый визит",
    description: "Скидка действует на работы при первом обращении в сервис.",
    image: "/illustrations/engine-detail.png",
    imageWidth: 1672,
    imageHeight: 941,
    imagePosition: "center",
    aspect: 1.42,
    tone: "accent",
  },
  {
    id: "wheel-storage",
    category: "Шины и диски",
    mark: "СЕЗОН",
    title: "Месяц хранения колёс в подарок",
    description: "При сезонном шиномонтаже оставьте комплект у нас до следующей замены.",
    image: "/illustrations/wheel-balance.png",
    imageWidth: 1672,
    imageHeight: 941,
    imagePosition: "center",
    aspect: 0.88,
    tone: "light",
  },
  {
    id: "suspension-check",
    category: "Диагностика",
    mark: "0 ₽",
    title: "Проверка подвески при ремонте",
    description: "Если ремонтируете ходовую у нас, диагностика входит в стоимость работ.",
    image: "/illustrations/suspension-detail.png",
    imageWidth: 1672,
    imageHeight: 941,
    imagePosition: "right",
    aspect: 1.64,
    tone: "dark",
  },
  {
    id: "battery-trade-in",
    category: "Аккумуляторы",
    mark: "ОБМЕН",
    title: "Скидка за старый аккумулятор",
    description: "Примем старый аккумулятор и уменьшим стоимость нового.",
    image: "/illustrations/engine-detail.png",
    imageWidth: 1672,
    imageHeight: 941,
    imagePosition: "left",
    aspect: 1.02,
    tone: "steel",
  },
  {
    id: "brake-check",
    category: "Шиномонтаж",
    mark: "+",
    title: "Проверка тормозов в подарок",
    description: "Осмотрим диски, колодки и суппорты после сезонной замены колёс.",
    image: "/illustrations/brake-assembly.png",
    imageWidth: 1536,
    imageHeight: 1024,
    imagePosition: "center",
    aspect: 1.04,
    tone: "light",
  },
  {
    id: "oil-service",
    category: "Техническое обслуживание",
    mark: "ТО",
    title: "Экспресс-проверка при замене масла",
    description: "Проверим жидкости и основные узлы вместе с заменой масла.",
    image: "/illustrations/engine-detail.png",
    imageWidth: 1672,
    imageHeight: 941,
    imagePosition: "right",
    aspect: 1.4,
    tone: "dark",
  },
  {
    id: "air-conditioning",
    category: "Кондиционер",
    mark: "−10%",
    title: "Проверка до жары",
    description: "Скидка на диагностику системы кондиционирования перед сезоном.",
    image: "/illustrations/suspension-detail.png",
    imageWidth: 1672,
    imageHeight: 941,
    imagePosition: "left",
    aspect: 0.9,
    tone: "steel",
  },
  {
    id: "computer-diagnostics",
    category: "Компьютерная диагностика",
    mark: "0 ₽",
    title: "При ремонте у нас",
    description: "Вычтем стоимость проверки из ремонта, если продолжите работы в сервисе.",
    image: "/illustrations/brake-assembly.png",
    imageWidth: 1536,
    imageHeight: 1024,
    imagePosition: "right",
    aspect: 1.26,
    tone: "accent",
  },
] satisfies readonly Promotion[];
