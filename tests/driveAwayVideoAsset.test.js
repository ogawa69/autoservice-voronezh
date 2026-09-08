import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import * as MP4Box from "mp4box";

const videoPath = new URL(
  "../public/hero/drive-away-reviews.mp4",
  import.meta.url,
);

const readVideoSamples = async () => {
  const bytes = await readFile(videoPath);
  const data = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  );
  data.fileStart = 0;

  return new Promise((resolve, reject) => {
    const file = MP4Box.createFile();

    file.onError = reject;
    file.onReady = (info) => {
      const [videoTrack] = info.videoTracks;
      resolve(file.getTrackSamplesInfo(videoTrack.id));
    };

    file.appendBuffer(data);
    file.flush();
  });
};

test("drive-away video supports responsive reverse scrubbing", async () => {
  const samples = await readVideoSamples();
  const syncSamples = samples.filter((sample) => sample.is_sync);

  assert.ok(samples.length > 0, "expected the video to contain frames");
  assert.equal(
    syncSamples.length,
    samples.length,
    `expected every frame to be seekable, found ${syncSamples.length}/${samples.length}`,
  );
});
