import { A11y, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { RevealHeading } from "./RevealHeading";

const galleryItems = [
  {
    kind: "image",
    src: "/hero/dark.png",
    alt: "Автомобиль в затемнённой зоне сервиса с включёнными фарами",
    caption: "Осмотр автомобиля при направленном свете",
  },
  {
    kind: "image",
    src: "/hero/light.png",
    alt: "Автомобиль в светлой чистой зоне сервиса",
    caption: "Чистая зона приёмки и диагностики",
  },
];

export function Gallery() {
  return (
    <section className="gallery-section" aria-labelledby="gallery-title">
      <div className="section-heading gallery-heading">
        <div>
          <RevealHeading as="h2" id="gallery-title">
            Пространство и работа
          </RevealHeading>
          <p>Свет, чистота и порядок помогают внимательно осмотреть автомобиль и ничего не упустить.</p>
        </div>
        <div className="gallery-controls" aria-hidden="true">
          <ArrowLeft size={20} strokeWidth={2} />
          <span>Листайте</span>
          <ArrowRight size={20} strokeWidth={2} />
        </div>
      </div>

      <Swiper
        className="service-gallery"
        modules={[A11y, Navigation, Pagination]}
        navigation
        pagination={{ clickable: true }}
        slidesPerView={1.08}
        spaceBetween={12}
        watchSlidesProgress
        grabCursor
        breakpoints={{
          640: { slidesPerView: 1.45, spaceBetween: 16 },
          960: { slidesPerView: 2.15, spaceBetween: 20 },
        }}
        a11y={{
          prevSlideMessage: "Предыдущая фотография",
          nextSlideMessage: "Следующая фотография",
          paginationBulletMessage: "Перейти к фотографии {{index}}",
        }}
      >
        {galleryItems.map((item) => (
          <SwiperSlide key={item.caption}>
            <figure className="gallery-card">
              <img src={item.src} alt={item.alt} width="1448" height="1086" loading="lazy" />
              <figcaption>{item.caption}</figcaption>
            </figure>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
