import { useRef } from "react";
import { useReducedMotion } from "motion/react";
import { Quote } from "lucide-react";
import { A11y, Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { reviewExamples } from "../data/siteContent";
import { RevealHeading } from "./RevealHeading";

export function ReviewsCarousel() {
  const swiperRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const pause = () => swiperRef.current?.autoplay?.pause();
  const resume = () => swiperRef.current?.autoplay?.resume();

  return (
    <section className="reviews-section" aria-labelledby="reviews-title">
      <div className="reviews-copy">
        <RevealHeading id="reviews-title">Отзывы</RevealHeading>
        <p>
          Ниже — примеры оформления. Перед публикацией заменим их отзывами реальных клиентов с их согласия.
        </p>
      </div>

      <Swiper
        className="reviews-swiper"
        modules={[A11y, Autoplay]}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        onFocus={pause}
        onBlur={resume}
        slidesPerView={1.08}
        spaceBetween={12}
        loop={!reduceMotion}
        speed={650}
        grabCursor
        autoplay={
          reduceMotion
            ? false
            : {
                delay: 4600,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }
        }
        breakpoints={{
          640: { slidesPerView: 1.55, spaceBetween: 16 },
          960: { slidesPerView: 2.35, spaceBetween: 20 },
        }}
        a11y={{
          containerMessage: "Примеры отзывов об автосервисе",
          slideLabelMessage: "Отзыв {{index}} из {{slidesLength}}",
        }}
      >
        {reviewExamples.map((item) => (
          <SwiperSlide key={`${item.author}-${item.car}`}>
            <article className="review-card">
              <div className="review-card-meta">
                <span>Пример отзыва</span>
                <Quote aria-hidden="true" size={22} strokeWidth={1.6} />
              </div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <footer>
                <span className="review-avatar" aria-hidden="true" />
                <div>
                  <strong>{item.author}</strong>
                  <span>{item.car} · {item.service}</span>
                </div>
              </footer>
            </article>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
