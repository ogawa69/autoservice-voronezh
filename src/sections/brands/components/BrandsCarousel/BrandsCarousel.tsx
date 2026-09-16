import { useReducedMotion } from "motion/react";
import { brands } from "../../../../content/demo";
import { splitBrandRows } from "../../lib/splitBrandRows";
import { BrandRow } from "../BrandRow";

const brandRows = splitBrandRows(brands);

export function BrandsCarousel() {
  const reduceMotion = Boolean(useReducedMotion());

  return (
    <div className="brands-carousel" aria-label="Марки автомобилей, которые принимаем в работу">
      <BrandRow
        items={brandRows[0]}
        reverseDirection={false}
        label="Первая лента марок автомобилей"
        reduceMotion={reduceMotion}
      />
      <BrandRow
        items={brandRows[1]}
        reverseDirection
        label="Вторая лента марок автомобилей"
        reduceMotion={reduceMotion}
      />
    </div>
  );
}
