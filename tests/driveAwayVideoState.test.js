import assert from "node:assert/strict";
import test from "node:test";
import {
  getDriveAwaySeekTarget,
  getDriveAwayTargetTime,
} from "../src/components/driveAwayVideoState.js";

test("reverse scrub seeks directly to the latest requested frame", () => {
  assert.equal(
    getDriveAwaySeekTarget({
      currentTime: 9.75,
      targetTime: 5.375,
      frameThreshold: 1 / 48,
      seeking: false,
    }),
    5.375,
  );
});

test("video sync coalesces updates while a frame is decoding", () => {
  assert.equal(
    getDriveAwaySeekTarget({
      currentTime: 9.75,
      targetTime: 5.375,
      frameThreshold: 1 / 48,
      seeking: true,
    }),
    null,
  );
});

test("story progress maps to stable 24 fps video frames", () => {
  assert.equal(
    getDriveAwayTargetTime({
      storyProgress: 0.29,
      duration: 10.041667,
      startSeconds: 4.15,
      endSeconds: 10,
      scrollEnd: 0.58,
      frameRate: 24,
    }),
    7.083333333333333,
  );
});
