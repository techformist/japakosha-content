/**
 * Artifact generation script.
 * Generates publishable JSON artifacts from content markdown on main.
 * Usage: node scripts/generate-artifacts.mjs
 */
import { execSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { resolve } from "path";
import { globSync } from "glob";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const matter = require("gray-matter");

const ROOT = resolve(import.meta.dirname, "..");
const DIST_DIR = resolve(ROOT, "dist");
const LATEST_DIR = resolve(DIST_DIR, "latest");
const MANTRAS_DIR = resolve(LATEST_DIR, "mantras");
const METADATA = JSON.parse(
  readFileSync(resolve(ROOT, "metadata.json"), "utf-8"),
);

const LICENSE_LABELS = {
  "public-domain": "Public Domain",
  "cc-by-4.0": "CC BY 4.0",
  "cc-by-sa-4.0": "CC BY-SA 4.0",
};

const SCRIPT_DISPLAY_NAMES = {
  Beng: "Bengali",
  Deva: "Devanagari",
  Gujr: "Gujarati",
  Guru: "Gurmukhi",
  Knda: "Kannada",
  Latn: "Latin",
  Mlym: "Malayalam",
  Orya: "Odia",
  Taml: "Tamil",
  Telu: "Telugu",
};

function titleCase(value) {
  return String(value)
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function stableCompare(a, b) {
  return String(a).localeCompare(String(b), "en");
}

function orderCompare(a, b) {
  const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
  const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
  if (orderA !== orderB) {
    return orderA - orderB;
  }
  return stableCompare(a.id, b.id);
}

function uniqueSorted(values) {
  return [...new Set(values)].sort(stableCompare);
}

function getGitSha() {
  if (process.env.GITHUB_SHA) {
    return process.env.GITHUB_SHA;
  }

  try {
    return execSync("git rev-parse HEAD", {
      cwd: ROOT,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "unknown";
  }
}

function toCategoryId(prefix, value) {
  return `${prefix}-${value}`;
}

function buildCategories() {
  const categories = [];

  for (const deity of METADATA.deity_themes || []) {
    categories.push({
      id: toCategoryId("deity", deity.id),
      name: deity.name,
      type: "deity",
      ...(deity.description ? { description: deity.description } : {}),
      ...(deity.display_order !== undefined
        ? { order: deity.display_order }
        : {}),
    });
  }

  for (const [index, purpose] of (METADATA.purposes || []).entries()) {
    categories.push({
      id: toCategoryId("purpose", purpose),
      name: titleCase(purpose),
      type: "purpose",
      order: index + 1,
    });
  }

  for (const [index, tradition] of (METADATA.traditions || []).entries()) {
    categories.push({
      id: toCategoryId("tradition", tradition),
      name: titleCase(tradition),
      type: "tradition",
      order: index + 1,
    });
  }

  for (const [index, contentType] of (
    (METADATA.tags && METADATA.tags.content_type) ||
    []
  ).entries()) {
    categories.push({
      id: toCategoryId("type", contentType),
      name: titleCase(contentType),
      type: "type",
      order: index + 1,
    });
  }

  return categories.sort(orderCompare);
}

function resolveScript(languageCode) {
  const scriptCode = METADATA.languages?.[languageCode]?.script;
  if (!scriptCode) {
    return "Unknown";
  }
  return SCRIPT_DISPLAY_NAMES[scriptCode] || scriptCode;
}

function buildCategoryIds(data) {
  const categoryIds = [
    ...(Array.isArray(data.deity_theme)
      ? data.deity_theme.map((value) => toCategoryId("deity", value))
      : []),
    ...(Array.isArray(data.purpose)
      ? data.purpose.map((value) => toCategoryId("purpose", value))
      : []),
    ...(data.tradition ? [toCategoryId("tradition", data.tradition)] : []),
    ...(Array.isArray(data.tags?.content_type)
      ? data.tags.content_type.map((value) => toCategoryId("type", value))
      : []),
  ];

  return uniqueSorted(categoryIds);
}

function buildTags(data) {
  const tags = {};

  for (const [tagGroup, rawValues] of Object.entries(data.tags || {})) {
    if (!Array.isArray(rawValues)) {
      continue;
    }

    const values = uniqueSorted(rawValues.filter(Boolean));
    if (values.length > 0) {
      tags[tagGroup] = values;
    }
  }

  return Object.keys(tags).length > 0 ? tags : undefined;
}

function parseContentFile(relPath) {
  const absPath = resolve(ROOT, relPath);
  const raw = readFileSync(absPath, "utf-8");
  const parsed = matter(raw);
  const data = parsed.data || {};

  if (!data.mantra_id) {
    throw new Error(`Missing mantra_id in ${relPath}`);
  }

  if (!data.language_code) {
    throw new Error(`Missing language_code in ${relPath}`);
  }

  return {
    relPath: relPath.replace(/\\/g, "/"),
    data,
    body: parsed.content.trim(),
  };
}

function buildLocalization(entry) {
  const localization = {
    language_code: entry.data.language_code,
    script: resolveScript(entry.data.language_code),
    title: entry.data.title,
    body: entry.body,
    quality_level: entry.data.quality_level,
  };

  if (entry.data.phonetic) {
    localization.phonetic = entry.data.phonetic;
  }

  return localization;
}

function buildMantraArtifact(mantraId, entries) {
  if (entries.length === 0) {
    throw new Error(`No localizations available for ${mantraId}`);
  }

  const primary = entries[0].data;
  const tags = buildTags(primary);
  const artifact = {
    canonical_id: mantraId,
    slug: mantraId,
    category_ids: buildCategoryIds(primary),
    ...(tags ? { tags } : {}),
    localizations: entries
      .slice()
      .sort((a, b) => stableCompare(a.data.language_code, b.data.language_code))
      .map(buildLocalization),
    source: primary.source,
    license: LICENSE_LABELS[primary.license] || primary.license,
  };

  if (primary.date_added) {
    artifact.date_added = primary.date_added;
  }

  return artifact;
}

function writeJson(filePath, value) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

function writeRootIndex() {
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>JapaKosha Content Artifacts</title>
</head>
<body>
  <main>
    <h1>JapaKosha Content Artifacts</h1>
    <p>This host publishes machine-readable content artifacts for JapaKosha downstream consumers.</p>
    <ul>
      <li><a href="/latest/manifest.json">Latest manifest</a></li>
      <li><a href="/latest/categories.json">Latest categories</a></li>
    </ul>
  </main>
</body>
</html>
`;

  writeFileSync(resolve(DIST_DIR, "index.html"), html, "utf-8");
}

const mdFiles = globSync("content/**/*.md", { cwd: ROOT })
  .map((file) => file.replace(/\\/g, "/"))
  .sort(stableCompare);

const parsedFiles = mdFiles.map(parseContentFile);

const grouped = new Map();
for (const entry of parsedFiles) {
  const mantraId = entry.data.mantra_id;
  if (!grouped.has(mantraId)) {
    grouped.set(mantraId, []);
  }
  grouped.get(mantraId).push(entry);
}

const canonicalIds = [...grouped.keys()].sort(stableCompare);
const categories = buildCategories();
const manifestEntries = [];
const languageCodes = new Set();

rmSync(DIST_DIR, { recursive: true, force: true });
mkdirSync(MANTRAS_DIR, { recursive: true });

for (const canonicalId of canonicalIds) {
  const artifact = buildMantraArtifact(canonicalId, grouped.get(canonicalId));
  writeJson(resolve(MANTRAS_DIR, `${canonicalId}.json`), artifact);

  for (const localization of artifact.localizations) {
    languageCodes.add(localization.language_code);
  }

  manifestEntries.push({
    canonical_id: artifact.canonical_id,
    slug: artifact.slug,
    languages: artifact.localizations.map(
      (localization) => localization.language_code,
    ),
    path: `/latest/mantras/${artifact.canonical_id}.json`,
  });
}

writeJson(resolve(LATEST_DIR, "categories.json"), categories);
writeRootIndex();

const manifest = {
  contentVersion: getGitSha(),
  generatedAt: new Date().toISOString(),
  mantraCount: manifestEntries.length,
  languageCount: languageCodes.size,
  categoriesPath: "/latest/categories.json",
  mantrasBasePath: "/latest/mantras",
  mantras: manifestEntries,
};

writeJson(resolve(LATEST_DIR, "manifest.json"), manifest);
writeFileSync(resolve(DIST_DIR, ".nojekyll"), "", "utf-8");

if (
  !existsSync(resolve(DIST_DIR, "index.html")) ||
  !existsSync(resolve(LATEST_DIR, "manifest.json")) ||
  !existsSync(resolve(LATEST_DIR, "categories.json"))
) {
  throw new Error(
    "Artifact generation did not produce the required output files.",
  );
}

console.log(
  `Generated ${manifest.mantraCount} mantra artifact(s) in dist/latest/.`,
);
console.log(`Languages represented: ${manifest.languageCount}`);
console.log(`Categories generated: ${categories.length}`);
