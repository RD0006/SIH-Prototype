#!/usr/bin/env node
/**
 * Bulk-fetch freely-licensed video into the evaluation corpus.
 *
 * Source is Wikimedia Commons. It was chosen after testing the alternatives
 * from this machine:
 *
 *   www.pexels.com          403 — browsing blocked
 *   pixabay.com             403 — blocked
 *   videos.pexels.com       200 for older ids (< ~8,000,000), 403 for newer
 *   archive.org             works, but "traffic" returns municipal committee
 *                           recordings rather than road footage
 *   commons.wikimedia.org   open API, no blocking, real road footage, and
 *                           licence metadata attached to every file
 *
 * Commons is the only one of those that is both unblocked and bulk-queryable,
 * and it is the only one that hands back machine-readable licence and
 * attribution data — which matters because this corpus has to stay auditable.
 *
 * Search precision is poor (a query for "traffic" also returns brush turkeys),
 * so everything is filtered on resolution and duration, and the manifest
 * records what was actually kept.
 *
 * Usage:
 *   node eval/fetch-corpus.mjs <category> <budgetMB>
 *   node eval/fetch-corpus.mjs india 1500
 */

import { createWriteStream } from "node:fs";
import { mkdir, readdir, stat, appendFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { execFile } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const UA = "SIH-Prototype-ANPR-Research/1.0 (academic evaluation corpus)";

/** Search terms per category. Deliberately broad — filtering happens after. */
const CATEGORIES = {
  india: [
    "india traffic", "india road", "delhi street", "mumbai traffic",
    "bangalore road", "chennai street", "kolkata traffic", "india highway",
    "auto rickshaw", "india city street", "indian street scene", "india bus",
    "india truck", "india market street", "india railway crossing",
    "india motorcycle", "india street view", "india flyover",
  ],
  night: [
    "night traffic", "traffic rain", "night street cars", "highway night",
    "headlights night", "wet road night", "night city driving", "dusk traffic",
    "tunnel traffic", "parking garage", "night road", "fog road",
    "snow road cars", "rain windshield", "night intersection",
  ],
  fixed: [
    "security camera parking", "surveillance camera street", "toll booth",
    "parking lot surveillance", "traffic camera", "cctv street",
    "barrier gate vehicle", "petrol station", "gas station cars",
    "traffic light intersection", "road junction camera", "checkpoint vehicle",
    "border crossing cars", "weighbridge truck", "car park entrance",
  ],
  highway: [
    "highway traffic", "motorway cars", "freeway driving", "dashcam",
    "truck highway", "overtaking car", "car driving street", "road vehicles",
    "roundabout traffic", "interstate traffic", "lorry motorway",
    "vehicles passing", "country road cars", "bus highway", "car rear view",
  ],
};

/** Minimum vertical resolution. Below this a plate is unreadable — measured. */
const MIN_HEIGHT = 1080;
const MIN_BYTES = 3_000_000;
const MAX_BYTES = 400_000_000;
const VIDEO_MIME = /^(video|application\/ogg)/;

const category = process.argv[2];
const budgetMb = Number(process.argv[3] ?? 1000);

if (!CATEGORIES[category]) {
  console.error(
    `usage: node eval/fetch-corpus.mjs <${Object.keys(CATEGORIES).join("|")}> <budgetMB>`,
  );
  process.exit(1);
}

const outDir = path.join(root, "eval/footage/corpus", category);
const manifestPath = path.join(outDir, "MANIFEST.md");

await mkdir(outDir, { recursive: true });

async function api(params) {
  const url =
    "https://commons.wikimedia.org/w/api.php?" +
    new URLSearchParams({ ...params, format: "json" });

  const res = await fetch(url, { headers: { "User-Agent": UA } });

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }

  return res.json();
}

/** Everything Commons knows about candidate files for one search term. */
async function search(term, limit = 50) {
  const data = await api({
    action: "query",
    generator: "search",
    gsrsearch: `filetype:video ${term}`,
    gsrnamespace: 6,
    gsrlimit: String(limit),
    prop: "imageinfo",
    iiprop: "url|size|dimensions|mime|extmetadata",
  });

  const pages = data?.query?.pages ?? {};

  return Object.values(pages)
    .map((page) => {
      const info = page.imageinfo?.[0];

      if (!info) {
        return null;
      }

      const meta = info.extmetadata ?? {};

      return {
        title: page.title.replace(/^File:/, ""),
        url: info.url,
        width: info.width ?? 0,
        height: info.height ?? 0,
        bytes: info.size ?? 0,
        mime: info.mime ?? "",
        licence:
          meta.LicenseShortName?.value ?? meta.License?.value ?? "unknown",
        author: stripHtml(meta.Artist?.value ?? ""),
        descriptionUrl: info.descriptionurl ?? "",
      };
    })
    .filter(Boolean);
}

function stripHtml(value) {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function slug(title) {
  return title
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function usable(file) {
  return (
    VIDEO_MIME.test(file.mime) &&
    file.height >= MIN_HEIGHT &&
    file.bytes >= MIN_BYTES &&
    file.bytes <= MAX_BYTES
  );
}

async function currentMb() {
  const entries = await readdir(outDir).catch(() => []);
  let total = 0;

  for (const name of entries) {
    if (/\.(mp4|webm|ogv|mov|mkv)$/i.test(name)) {
      total += (await stat(path.join(outDir, name))).size;
    }
  }

  return total / 1e6;
}

async function download(file, index) {
  const ext = path.extname(new URL(file.url).pathname) || ".webm";
  const name = `wm-${String(index).padStart(3, "0")}-${slug(file.title)}${ext}`;
  const dest = path.join(outDir, name);

  if (existsSync(dest)) {
    return null;
  }

  const res = await fetch(file.url, { headers: { "User-Agent": UA } });

  if (!res.ok) {
    throw new Error(`${res.status}`);
  }

  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));

  // Confirm it actually decodes and really is the resolution Commons claimed.
  let probed = "";

  try {
    const { stdout } = await run("ffprobe", [
      "-v", "error", "-select_streams", "v:0",
      "-show_entries", "stream=width,height,duration",
      "-of", "csv=p=0", dest,
    ]);

    probed = stdout.trim();
  } catch {
    probed = "unreadable";
  }

  return { name, dest, probed };
}

console.log(`corpus/${category} — target ${budgetMb} MB`);
console.log(`starting at ${(await currentMb()).toFixed(0)} MB\n`);

if (!existsSync(manifestPath)) {
  await writeFile(
    manifestPath,
    `# ${category} — source manifest\n\n` +
      `Fetched from Wikimedia Commons by \`eval/fetch-corpus.mjs\`. Every row is a\n` +
      `freely-licensed file; the licence column is Commons' own metadata.\n\n` +
      `| File | Commons title | Licence | Author | Dimensions | Source |\n` +
      `| --- | --- | --- | --- | --- | --- |\n`,
  );
}

const seen = new Set(
  (await readdir(outDir).catch(() => [])).map((n) =>
    n.replace(/^wm-\d+-/, "").replace(/\.[^.]+$/, ""),
  ),
);

let index = seen.size;
let kept = 0;
let skipped = 0;

for (const term of CATEGORIES[category]) {
  const used = await currentMb();

  if (used >= budgetMb) {
    console.log(`\nbudget reached (${used.toFixed(0)} MB)`);
    break;
  }

  let files = [];

  try {
    files = await search(term);
  } catch (error) {
    console.log(`  ${term}: search failed — ${error.message}`);
    continue;
  }

  const candidates = files.filter(usable);

  console.log(
    `${term.padEnd(28)} ${String(files.length).padStart(3)} hits, ${String(candidates.length).padStart(2)} usable`,
  );

  for (const file of candidates) {
    if ((await currentMb()) >= budgetMb) {
      break;
    }

    if (seen.has(slug(file.title))) {
      skipped += 1;
      continue;
    }

    seen.add(slug(file.title));
    index += 1;

    try {
      const result = await download(file, index);

      if (!result) {
        continue;
      }

      kept += 1;

      console.log(
        `   + ${result.name.slice(0, 56).padEnd(56)} ${(file.bytes / 1e6).toFixed(0).padStart(4)} MB  ${result.probed}`,
      );

      await appendFile(
        manifestPath,
        `| \`${result.name}\` | ${file.title.replace(/\|/g, "-")} | ${file.licence} | ${file.author || "—"} | ${file.width}x${file.height} | ${file.descriptionUrl} |\n`,
      );
    } catch (error) {
      console.log(`   ! ${file.title.slice(0, 44)} — ${error.message}`);
    }
  }
}

console.log(
  `\ncorpus/${category}: ${kept} new, ${skipped} already held, ${(await currentMb()).toFixed(0)} MB total`,
);
