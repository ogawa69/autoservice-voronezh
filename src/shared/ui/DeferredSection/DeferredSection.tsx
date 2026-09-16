import { Suspense } from "react";
import { useNearViewport } from "./hooks/useNearViewport";
import type { DeferredSectionProps } from "./types";
import "./styles.css";

const DEFAULT_ROOT_MARGIN = "1600px 0px";

export function DeferredSection({
  children,
  className = "",
  minHeight,
  rootMargin = DEFAULT_ROOT_MARGIN,
}: DeferredSectionProps) {
  const { isNearViewport, targetRef } = useNearViewport(rootMargin);

  return (
    <div
      ref={targetRef}
      className={`deferred-section ${className}`.trim()}
      style={{ minHeight }}
      data-loaded={isNearViewport}
    >
      {isNearViewport ? (
        <Suspense fallback={<div className="deferred-section__placeholder" aria-hidden="true" />}>
          {children}
        </Suspense>
      ) : (
        <div className="deferred-section__placeholder" aria-hidden="true" />
      )}
    </div>
  );
}
