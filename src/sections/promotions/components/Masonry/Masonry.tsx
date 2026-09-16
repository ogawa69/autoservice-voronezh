import type { CSSProperties } from "react";
import { useMasonryLayout } from "./hooks/useMasonryLayout";
import { useMasonryReveal } from "./hooks/useMasonryReveal";
import { useMeasure } from "./hooks/useMeasure";
import type { MasonryItem, MasonryProps } from "./types";

type MasonryContainerStyle = CSSProperties & {
  "--masonry-hover-scale": number;
};

export function Masonry<T extends MasonryItem>({
  items,
  renderItem,
  ease = "power3.out",
  duration = 0.6,
  stagger = 0.055,
  animateFrom = "bottom",
  exitDuration = 0.2,
  visibleThreshold = 0.5,
  hiddenThreshold = 0.06,
  scaleOnHover = true,
  hoverScale = 0.985,
}: MasonryProps<T>) {
  const [containerRef, width] = useMeasure<HTMLDivElement>();
  const layout = useMasonryLayout(items, width);

  useMasonryReveal({
    animateFrom,
    containerRef,
    duration,
    ease,
    exitDuration,
    hiddenThreshold,
    itemCount: layout.items.length,
    stagger,
    visibleThreshold,
  });

  const containerStyle = {
    height: layout.height,
    "--masonry-hover-scale": hoverScale,
  } as MasonryContainerStyle;

  return (
    <div
      ref={containerRef}
      className={`promotion-masonry${scaleOnHover ? " promotion-masonry--hoverable" : ""}`}
      role="list"
      style={containerStyle}
    >
      {layout.items.map((item) => (
        <div
          key={item.id}
          className="promotion-masonry__item"
          role="listitem"
          style={{
            width: item.width,
            height: item.height,
            transform: `translate3d(${item.x}px, ${item.y}px, 0)`,
          }}
        >
          <div className="promotion-masonry__reveal" data-masonry-reveal>
            {renderItem(item)}
          </div>
        </div>
      ))}
    </div>
  );
}
