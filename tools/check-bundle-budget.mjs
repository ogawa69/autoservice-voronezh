import { readFile, stat } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import path from "node:path";

const DIST_DIRECTORY = path.resolve("dist");
const ENTRY_HTML = path.join(DIST_DIRECTORY, "index.html");
const MAX_INITIAL_JAVASCRIPT_BYTES = 700 * 1024;
const MAX_INITIAL_GZIP_BYTES = 225 * 1024;

const html = await readFile(ENTRY_HTML, "utf8");
const assetPaths = new Set(
  [...html.matchAll(/(?:src|href)="(\/assets\/[^"?]+\.js)"/g)].map(
    ([, assetPath]) => assetPath,
  ),
);

if (assetPaths.size === 0) {
  throw new Error("Initial JavaScript assets were not found in dist/index.html");
}

let rawBytes = 0;
let gzipBytes = 0;

for (const assetPath of assetPaths) {
  const filePath = path.join(DIST_DIRECTORY, assetPath.replace(/^\//, ""));
  const [file, metadata] = await Promise.all([readFile(filePath), stat(filePath)]);
  rawBytes += metadata.size;
  gzipBytes += gzipSync(file).byteLength;
}

const formatKilobytes = (bytes) => `${(bytes / 1024).toFixed(1)} kB`;
const summary = `Initial JavaScript: ${formatKilobytes(rawBytes)} raw, ${formatKilobytes(gzipBytes)} gzip`;

if (
  rawBytes > MAX_INITIAL_JAVASCRIPT_BYTES ||
  gzipBytes > MAX_INITIAL_GZIP_BYTES
) {
  throw new Error(
    `${summary}; budget is ${formatKilobytes(MAX_INITIAL_JAVASCRIPT_BYTES)} raw / ${formatKilobytes(MAX_INITIAL_GZIP_BYTES)} gzip`,
  );
}

console.log(summary);
