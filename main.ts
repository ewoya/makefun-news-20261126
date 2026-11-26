// "The world on 26 November 2026, on one page" — a news-image-daily entry.
//
// The deliverable is the front page drawn in entry.png beside this file; this
// program is the whole of the runnable entry, and all it does is hand that
// image to the harness: it validates the PNG we ship, then writes the same
// bytes to /output/entry.png. No network, no clock, no randomness, so two runs
// produce identical bytes.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PNG_MAGIC = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const PNG_TAIL = Buffer.from([0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]); // the IEND chunk
const LIMIT_BYTES = 1024 * 1024;
const LIMIT_EDGE = 1024;

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const source = resolve(dirname(fileURLToPath(import.meta.url)), 'entry.png');
const page = readFileSync(source);

if (page.length < 45 || page.length > LIMIT_BYTES) {
  throw new Error(`entry.png must be a whole PNG under 1 MiB, got ${page.length} bytes`);
}
if (!page.subarray(0, 8).equals(PNG_MAGIC) || page.toString('latin1', 12, 16) !== 'IHDR') {
  throw new Error('entry.png is not a PNG with an IHDR chunk first');
}
if (!page.subarray(-12).equals(PNG_TAIL)) {
  throw new Error('entry.png is truncated: its IEND chunk is missing');
}

const width = page.readUInt32BE(16);
const height = page.readUInt32BE(20);
if (width !== height || width < 1 || width > LIMIT_EDGE) {
  throw new Error(`entry.png must be square and at most ${LIMIT_EDGE}px, got ${width}x${height}`);
}

mkdirSync(outDir, { recursive: true });
const target = join(outDir, 'entry.png');
writeFileSync(target, page);

// Prove the write, don't assume it: the grader compares the two runs' bytes.
const written = readFileSync(target);
if (written.length !== page.length || !written.equals(page)) {
  throw new Error('the written entry.png does not match the bytes we ship');
}
console.log(`entry.png ${width}x${height}, ${page.length} bytes -> ${target}`);
