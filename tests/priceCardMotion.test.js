import assert from "node:assert/strict";
import test from "node:test";
import {
  PRICE_CARD_CHASE_EASING,
  PRICE_CARD_HALF_TURN_DEGREES,
  PRICE_CARD_MAX_DEGREES_PER_FRAME,
  PRICE_CARD_MAX_DEGREES_PER_SECOND,
  PRICE_CARD_MAX_FRAME_DELTA_MS,
  advancePriceCardProgress,
} from "../src/components/priceCardMotion.js";

const degreesBetween = (fromProgress, toProgress, serviceCount) =>
  Math.abs(toProgress - fromProgress) *
  Math.max(0, serviceCount - 1) *
  PRICE_CARD_HALF_TURN_DEGREES;

const assertClose = (actual, expected, tolerance = 1e-12) => {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `Expected ${actual} to be within ${tolerance} of ${expected}`,
  );
};

test("small errors keep the existing eased chase", () => {
  const renderedProgress = 0.4;
  const targetProgress = 0.45;

  const nextProgress = advancePriceCardProgress({
    renderedProgress,
    targetProgress,
    serviceCount: 5,
    deltaMs: PRICE_CARD_MAX_FRAME_DELTA_MS,
  });

  assert.equal(
    nextProgress,
    renderedProgress +
      (targetProgress - renderedProgress) * PRICE_CARD_CHASE_EASING,
  );
});

test("a rendered frame cannot rotate farther than ten degrees", () => {
  const serviceCount = 5;
  const renderedProgress = 0;
  const nextProgress = advancePriceCardProgress({
    renderedProgress,
    targetProgress: 1,
    serviceCount,
    deltaMs: 500,
  });

  assert.equal(
    degreesBetween(renderedProgress, nextProgress, serviceCount),
    PRICE_CARD_MAX_DEGREES_PER_FRAME,
  );
});

test("the speed limit scales with a short frame delta", () => {
  const serviceCount = 5;
  const renderedProgress = 0;
  const deltaMs = 8;
  const nextProgress = advancePriceCardProgress({
    renderedProgress,
    targetProgress: 1,
    serviceCount,
    deltaMs,
  });

  assert.equal(
    degreesBetween(renderedProgress, nextProgress, serviceCount),
    (PRICE_CARD_MAX_DEGREES_PER_SECOND * deltaMs) / 1000,
  );
});

test("a long frame delta is clamped to one 60 fps frame", () => {
  const serviceCount = 8;
  const renderedProgress = 0.2;
  const nextAfterNormalFrame = advancePriceCardProgress({
    renderedProgress,
    targetProgress: 1,
    serviceCount,
    deltaMs: PRICE_CARD_MAX_FRAME_DELTA_MS,
  });
  const nextAfterDelayedFrame = advancePriceCardProgress({
    renderedProgress,
    targetProgress: 1,
    serviceCount,
    deltaMs: 2_000,
  });

  assert.equal(nextAfterDelayedFrame, nextAfterNormalFrame);
});

test("the angular cap accounts for service count", () => {
  const renderedProgress = 0;
  const targetProgress = 1;
  const threeServices = advancePriceCardProgress({
    renderedProgress,
    targetProgress,
    serviceCount: 3,
    deltaMs: PRICE_CARD_MAX_FRAME_DELTA_MS,
  });
  const sixServices = advancePriceCardProgress({
    renderedProgress,
    targetProgress,
    serviceCount: 6,
    deltaMs: PRICE_CARD_MAX_FRAME_DELTA_MS,
  });

  assert.equal(
    degreesBetween(renderedProgress, threeServices, 3),
    PRICE_CARD_MAX_DEGREES_PER_FRAME,
  );
  assert.equal(
    degreesBetween(renderedProgress, sixServices, 6),
    PRICE_CARD_MAX_DEGREES_PER_FRAME,
  );
  assert.ok(sixServices < threeServices);
});

test("forward and reverse movement are symmetric and do not overshoot", () => {
  const forward = advancePriceCardProgress({
    renderedProgress: 0.2,
    targetProgress: 0.9,
    serviceCount: 5,
    deltaMs: PRICE_CARD_MAX_FRAME_DELTA_MS,
  });
  const reverse = advancePriceCardProgress({
    renderedProgress: 0.8,
    targetProgress: 0.1,
    serviceCount: 5,
    deltaMs: PRICE_CARD_MAX_FRAME_DELTA_MS,
  });

  assertClose(forward - 0.2, 0.8 - reverse);
  assert.ok(forward <= 0.9);
  assert.ok(reverse >= 0.1);

  assert.equal(
    advancePriceCardProgress({
      renderedProgress: 0.99999,
      targetProgress: 1,
      serviceCount: 5,
      deltaMs: PRICE_CARD_MAX_FRAME_DELTA_MS,
    }),
    1,
  );
  assert.equal(
    advancePriceCardProgress({
      renderedProgress: 0.00001,
      targetProgress: 0,
      serviceCount: 5,
      deltaMs: PRICE_CARD_MAX_FRAME_DELTA_MS,
    }),
    0,
  );
});

test("settling never snaps a remainder beyond the angular cap", () => {
  const serviceCount = 4;
  const renderedProgress = 0;
  const targetProgress = 0.00011;
  const nextProgress = advancePriceCardProgress({
    renderedProgress,
    targetProgress,
    serviceCount,
    deltaMs: 0.01,
  });

  assert.ok(nextProgress < targetProgress);
  assertClose(
    degreesBetween(renderedProgress, nextProgress, serviceCount),
    (PRICE_CARD_MAX_DEGREES_PER_SECOND * 0.01) / 1000,
  );
});

test("a single-service card settles immediately because it has no rotation span", () => {
  assert.equal(
    advancePriceCardProgress({
      renderedProgress: 0.25,
      targetProgress: 0.75,
      serviceCount: 1,
      deltaMs: 0,
    }),
    0.75,
  );
});
