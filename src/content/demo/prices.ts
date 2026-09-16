export interface PriceService {
  title: string;
  category: string;
  description: string;
  price: string;
  note: string;
}

export const priceServices = [
  {
    title: "Диагностика",
    category: "Первичная проверка",
    description:
      "Считываем ошибки, проверяем симптомы и объясняем, с чего начать ремонт.",
    price: "от 1 500 ₽",
    note: "За первичную проверку",
  },
  {
    title: "Техническое обслуживание",
    category: "Плановые работы",
    description:
      "Меняем масло, фильтры и расходники по регламенту и текущему состоянию автомобиля.",
    price: "от 3 500 ₽",
    note: "Работа без учёта деталей",
  },
  {
    title: "Ремонт ходовой",
    category: "Подвеска и тормоза",
    description:
      "Проверяем подвеску, рулевое управление и тормозные узлы, затем согласуем объём работ.",
    price: "от 2 500 ₽",
    note: "За одну ремонтную операцию",
  },
  {
    title: "Шиномонтаж",
    category: "Колёса и балансировка",
    description:
      "Снимаем, устанавливаем и балансируем комплект колёс, перед сборкой проверяем состояние шин.",
    price: "от 2 800 ₽",
    note: "За комплект колёс",
  },
] satisfies readonly PriceService[];
