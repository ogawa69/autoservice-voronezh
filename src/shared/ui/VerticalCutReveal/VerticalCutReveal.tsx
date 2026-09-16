import { motion } from "motion/react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import type {
  VerticalCutRevealHandle,
  VerticalCutRevealProps,
} from "./types";

interface TextSegment {
  characters: string[];
  needsSpace: boolean;
}

const defaultTransition = {
  type: "spring" as const,
  stiffness: 190,
  damping: 22,
};

function splitIntoCharacters(text: string) {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
    return Array.from(segmenter.segment(text), ({ segment }) => segment);
  }

  return Array.from(text);
}

const VerticalCutReveal = forwardRef<
  VerticalCutRevealHandle,
  VerticalCutRevealProps
>(function VerticalCutReveal(
  {
    children,
    reverse = false,
    transition = defaultTransition,
    splitBy = "words",
    staggerDuration = 0.2,
    staggerFrom = "first",
    containerClassName,
    wordLevelClassName,
    elementLevelClassName,
    onClick,
    onStart,
    onComplete,
    autoStart = true,
    ...props
  },
  ref,
) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const text = typeof children === "string" ? children : children?.toString() || "";
  const [isAnimating, setIsAnimating] = useState(false);

  const elements = useMemo<TextSegment[]>(() => {
    const parts =
      splitBy === "lines"
        ? text.split("\n")
        : splitBy === "words" || splitBy === "characters"
          ? text.split(" ")
          : text.split(splitBy);

    return parts.map((part, index) => ({
      characters:
        splitBy === "characters" ? splitIntoCharacters(part) : [part],
      needsSpace: index !== parts.length - 1,
    }));
  }, [splitBy, text]);

  const getStaggerDelay = useCallback(
    (index: number) => {
      const total =
        splitBy === "characters"
          ? elements.reduce(
              (count, element) =>
                count +
                element.characters.length +
                (element.needsSpace ? 1 : 0),
              0,
            )
          : elements.length;

      if (staggerFrom === "first") return index * staggerDuration;
      if (staggerFrom === "last") {
        return (total - 1 - index) * staggerDuration;
      }
      if (staggerFrom === "center") {
        return Math.abs(Math.floor(total / 2) - index) * staggerDuration;
      }
      if (staggerFrom === "random") {
        const randomIndex = Math.floor(Math.random() * total);
        return Math.abs(randomIndex - index) * staggerDuration;
      }

      return Math.abs(staggerFrom - index) * staggerDuration;
    },
    [elements, splitBy, staggerDuration, staggerFrom],
  );

  const startAnimation = useCallback(() => {
    setIsAnimating(true);
    onStart?.();
  }, [onStart]);

  useImperativeHandle(ref, () => ({
    startAnimation,
    reset: () => setIsAnimating(false),
  }));

  useEffect(() => {
    if (autoStart) startAnimation();
  }, [autoStart, startAnimation]);

  const transitionDelay =
    "delay" in transition && typeof transition.delay === "number"
      ? transition.delay
      : 0;
  const variants = {
    hidden: { y: reverse ? "-100%" : "100%" },
    visible: (index: number) => ({
      y: 0,
      transition: {
        ...transition,
        delay: transitionDelay + getStaggerDelay(index),
      },
    }),
  };

  return (
    <span
      className={cn(
        containerClassName,
        "flex flex-wrap whitespace-pre-wrap",
        splitBy === "lines" && "flex-col",
      )}
      onClick={onClick}
      ref={containerRef}
      {...props}
    >
      <span className="sr-only">{text}</span>

      {elements.map((element, wordIndex, array) => {
        const previousCharacters = array
          .slice(0, wordIndex)
          .reduce(
            (count, previous) => count + previous.characters.length,
            0,
          );

        return (
          <span
            key={wordIndex}
            aria-hidden="true"
            className={cn("inline-flex overflow-hidden", wordLevelClassName)}
          >
            {element.characters.map((character, characterIndex) => (
              <span
                className={cn(
                  elementLevelClassName,
                  "whitespace-pre-wrap relative",
                )}
                key={characterIndex}
              >
                <motion.span
                  custom={previousCharacters + characterIndex}
                  initial="hidden"
                  animate={isAnimating ? "visible" : "hidden"}
                  variants={variants}
                  onAnimationComplete={
                    wordIndex === elements.length - 1 &&
                    characterIndex === element.characters.length - 1
                      ? onComplete
                      : undefined
                  }
                  className="inline-block"
                >
                  {character}
                </motion.span>
              </span>
            ))}
            {element.needsSpace && <span> </span>}
          </span>
        );
      })}
    </span>
  );
});

VerticalCutReveal.displayName = "VerticalCutReveal";

export default VerticalCutReveal;
