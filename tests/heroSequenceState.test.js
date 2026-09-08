import assert from "node:assert/strict";
import test from "node:test";
import {
  HERO_SEQUENCE_PHASE,
  canEnterScrub,
  getMasterTargetTime,
  resolveEngineProgress,
} from "../src/components/heroSequenceState.js";

const scrollRange = {
  startProgress: 0.18,
  endProgress: 0.94,
};

test("scroll during intro cannot accumulate engine progress", () => {
  const engineProgress = resolveEngineProgress({
    phase: HERO_SEQUENCE_PHASE.INTRO,
    previousProgress: 0,
    scrollProgress: 0.8,
    ...scrollRange,
  });

  assert.equal(engineProgress, 0);
});

test("scrub starts only after the media intro and copy hold are complete", () => {
  assert.equal(
    canEnterScrub({
      phase: HERO_SEQUENCE_PHASE.INTRO,
      introMediaComplete: true,
      copyHoldComplete: false,
    }),
    false,
  );
  assert.equal(
    canEnterScrub({
      phase: HERO_SEQUENCE_PHASE.INTRO,
      introMediaComplete: true,
      copyHoldComplete: true,
    }),
    true,
  );
});

test("reverse scrub is clamped to the intro boundary", () => {
  const introEndTime = 5.041667;
  const targetTime = getMasterTargetTime({
    duration: 10.083333,
    introEndTime,
    engineProgress: -1,
  });

  assert.equal(targetTime, introEndTime);
});
