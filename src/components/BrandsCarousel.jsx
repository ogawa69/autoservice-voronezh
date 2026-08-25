import { useCallback, useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { A11y, Autoplay, FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { brands } from "../data/siteContent";

const splitIndex = Math.ceil(brands.length / 2);
const brandRows = [brands.slice(0, splitIndex), brands.slice(splitIndex)];

function BrandRow({ items, reverseDirection, label, reduceMotion }) {
  const swiperRef = useRef(null);

  const syncPlayback = useCallback(() => {
    const swiper = swiperRef.current;
    if (!swiper || swiper.destroyed || reduceMotion || document.hidden) return;

    if (!swiper.autoplay?.running) swiper.autoplay?.start();
    if (swiper.autoplay?.paused) swiper.autoplay?.resume();
  }, [reduceMotion]);

  useEffect(() => {
    const resumeWhenVisible = () => {
      if (!document.hidden) syncPlayback();
    };
    const watchdog = window.setInterval(syncPlayback, 2200);

    document.addEventListener("visibilitychange", resumeWhenVisible);
    window.addEventListener("focus", resumeWhenVisible);
    window.addEventListener("pageshow", resumeWhenVisible);
    syncPlayback();

    return () => {
      window.clearInterval(watchdog);
      document.removeEventListener("visibilitychange", resumeWhenVisible);
      window.removeEventListener("focus", resumeWhenVisible);
      window.removeEventListener("pageshow", resumeWhenVisible);
    };
  }, [syncPlayback]);

  return (
    <div className="brand-row">
      <Swiper
        className="brands-swiper"
        modules={[A11y, Autoplay, FreeMode]}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
          window.requestAnimationFrame(syncPlayback);
        }}
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

export function BrandsCarousel() {
  const reduceMotion = useReducedMotion();

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
