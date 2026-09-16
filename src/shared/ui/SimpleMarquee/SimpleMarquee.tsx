import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";
import { cn } from "@/lib/utils";
import type { SimpleMarqueeProps } from "./types";

function wrap(minimum: number, maximum: number, value: number) {
  const range = maximum - minimum;
  return ((((value - minimum) % range) + range) % range) + minimum;
}

export default function SimpleMarquee({
  children,
  className,
  direction = "right",
  baseVelocity = 5,
  slowdownOnHover = false,
  slowDownFactor = 0.3,
  slowDownSpringConfig = { damping: 50, stiffness: 400 },
  useScrollVelocity = false,
  scrollAwareDirection = false,
  scrollSpringConfig = { damping: 50, stiffness: 400 },
  scrollContainer,
  active = true,
  repeat = 3,
  draggable = false,
  dragSensitivity = 0.2,
  dragVelocityDecay = 0.96,
  dragAwareDirection = false,
  dragAngle = 0,
  grabCursor = false,
  easing,
}: SimpleMarqueeProps) {
  const baseX = useMotionValue(0);
  const baseY = useMotionValue(0);
  const { scrollY } = useScroll({
    ...(scrollContainer && { container: scrollContainer }),
  });
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, scrollSpringConfig);
  const hoverFactorValue = useMotionValue(1);
  const isDragging = useRef(false);
  const dragVelocity = useRef(0);
  const smoothHoverFactor = useSpring(
    hoverFactorValue,
    slowDownSpringConfig,
  );
  const velocityFactor = useTransform(smoothVelocity, (value) =>
    useScrollVelocity ? Math.min(Math.abs(value) / 250, 5) : 0,
  );
  const isHorizontal = direction === "left" || direction === "right";
  const actualBaseVelocity =
    direction === "left" || direction === "up"
      ? -baseVelocity
      : baseVelocity;
  const isHovered = useRef(false);
  const directionFactor = useRef(1);
  const transform = useTransform(isHorizontal ? baseX : baseY, (value) => {
    const wrappedValue = wrap(0, -100, value);
    const percentage = easing
      ? easing(wrappedValue / -100) * -100
      : wrappedValue;

    return isHorizontal
      ? `translate3d(${percentage}%, 0, 0)`
      : `translate3d(0, ${percentage}%, 0)`;
  });

  useAnimationFrame((_time, delta) => {
    if (!active) return;

    if (isDragging.current && draggable) {
      if (isHorizontal) {
        baseX.set(baseX.get() + dragVelocity.current);
      } else {
        baseY.set(baseY.get() + dragVelocity.current);
      }

      dragVelocity.current *= 0.9;
      if (Math.abs(dragVelocity.current) < 0.01) {
        dragVelocity.current = 0;
      }
      return;
    }

    hoverFactorValue.set(
      isHovered.current && slowdownOnHover ? slowDownFactor : 1,
    );

    let moveBy =
      directionFactor.current *
      actualBaseVelocity *
      (delta / 1000) *
      smoothHoverFactor.get();

    if (scrollAwareDirection && !isDragging.current) {
      if (smoothVelocity.get() < 0) {
        directionFactor.current = -1;
      } else if (smoothVelocity.get() > 0) {
        directionFactor.current = 1;
      }
    }

    moveBy *= 1 + velocityFactor.get();

    if (draggable) {
      moveBy += dragVelocity.current;

      if (dragAwareDirection && Math.abs(dragVelocity.current) > 0.1) {
        directionFactor.current = Math.sign(dragVelocity.current);
      }

      if (!isDragging.current && Math.abs(dragVelocity.current) > 0.01) {
        dragVelocity.current *= dragVelocityDecay;
      } else if (!isDragging.current) {
        dragVelocity.current = 0;
      }
    }

    if (isHorizontal) {
      baseX.set(baseX.get() + moveBy);
    } else {
      baseY.set(baseY.get() + moveBy);
    }
  });

  const lastPointerPosition = useRef({ x: 0, y: 0 });

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggable) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    if (grabCursor) event.currentTarget.style.cursor = "grabbing";

    isDragging.current = true;
    lastPointerPosition.current = { x: event.clientX, y: event.clientY };
    dragVelocity.current = 0;
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggable || !isDragging.current) return;

    const currentPosition = { x: event.clientX, y: event.clientY };
    const deltaX = currentPosition.x - lastPointerPosition.current.x;
    const deltaY = currentPosition.y - lastPointerPosition.current.y;
    const angleInRadians = (dragAngle * Math.PI) / 180;
    const directionX = Math.cos(angleInRadians);
    const directionY = Math.sin(angleInRadians);
    const projectedDelta = deltaX * directionX + deltaY * directionY;

    dragVelocity.current = projectedDelta * dragSensitivity;
    lastPointerPosition.current = currentPosition;
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggable) return;

    event.currentTarget.releasePointerCapture(event.pointerId);
    isDragging.current = false;
  };

  return (
    <motion.div
      className={cn("flex", isHorizontal ? "flex-row" : "flex-col", className)}
      onHoverStart={() => {
        isHovered.current = true;
      }}
      onHoverEnd={() => {
        isHovered.current = false;
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {Array.from({ length: repeat }, (_, index) => index).map((index) => (
        <motion.div
          key={index}
          className={cn(
            "shrink-0",
            isHorizontal && "flex",
            draggable && grabCursor && "cursor-grab",
          )}
          style={{ transform }}
          aria-hidden={index > 0}
        >
          {children}
        </motion.div>
      ))}
    </motion.div>
  );
}
