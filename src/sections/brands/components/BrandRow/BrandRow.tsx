import { A11y, Autoplay, FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { useBrandPlayback } from "../../hooks/useBrandPlayback";
import type { BrandRowProps } from "./types";

export function BrandRow({
  items,
  reverseDirection,
  label,
  reduceMotion,
}: BrandRowProps) {
  const attachSwiper = useBrandPlayback(reduceMotion);

  return (
    <div className="brand-row">
      <Swiper
        className="brands-swiper"
        modules={[A11y, Autoplay, FreeMode]}
        onSwiper={attachSwiper}
        slidesPerView="auto"
        spaceBetween={12}
        loop={!reduceMotion}
        freeMode={{ enabled: true, momentum: false }}
        speed={6800}
        allowTouchMove={false}
        observer
        observeParents
        autoplay={
          reduceMotion
            ? false
            : {
                delay: 0,
                disableOnInteraction: false,
                pauseOnMouseEnter: false,
                reverseDirection,
                stopOnLastSlide: false,
              }
        }
        a11y={{ containerMessage: label }}
      >
        {items.map((brand) => (
          <SwiperSlide key={brand} className="brand-slide">
            <span>{brand}</span>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
