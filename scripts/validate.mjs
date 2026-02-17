/**
 * Content validation script.
 * Validates all markdown files in content/ against metadata.json.
 * Usage: node scripts/validate.mjs
 * Exit code: 0 = pass, 1 = failures found
 */
import { readFileSync } from 'fs';
import { resolve, basename, dirname, relative } from 'path';
import { globSync } from 'glob';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const matter = require('gray-matter');

const ROOT = resolve(import.meta.dirname, '..');
const METADATA = JSON.parse(readFileSync(resolve(ROOT, 'metadata.json'), 'utf-8'));

// Build lookup sets from metadata
const VALID_DEITY_IDS = new Set(METADATA.deity_themes.map(d => d.id));
const VALID_PURPOSES = new Set(METADATA.purposes);
const VALID_TRADITIONS = new Set(METADATA.traditions);
const VALID_LANGUAGES = new Set(Object.keys(METADATA.languages));
const VALID_LICENSES = new Set(METADATA.licenses);
const VALID_STATUSES = new Set(METADATA.statuses);
const VALID_QUALITY_LEVELS = new Set(METADATA.quality_levels);
const VALID_TAGS = {};
for (const [group, values] of Object.entries(METADATA.tags)) {
  VALID_TAGS[group] = new Set(values);
}

const errors = [];
const warnings = [];

function error(file, msg) {
  errors.push(`ERROR [${file}]: ${msg}`);
}

function warn(file, msg) {
  warnings.push(`WARN  [${file}]: ${msg}`);
}

// Find all markdown files
const mdFiles = globSync('content/**/*.md', { cwd: ROOT }).map(f => f.replace(/\\/g, '/'));

if (mdFiles.length === 0) {
  console.log('No content files found.');
  process.exit(0);
}

console.log(`Validating ${mdFiles.length} files...\n`);

const seenIds = new Map();        // id -> filepath
const seenMantraLang = new Map(); // mantra_id+lang -> filepath
const mantraMetadata = new Map(); // mantra_id -> { deity_theme, purpose, ... } from first file seen

for (const relPath of mdFiles) {
  const absPath = resolve(ROOT, relPath);
  const fileName = basename(relPath, '.md'); // e.g. "ganesha-pancharatnam.kn"
  const parentDir = basename(dirname(relPath)); // e.g. "kn"

  let raw, data, content;
  try {
    raw = readFileSync(absPath, 'utf-8');
    const parsed = matter(raw);
    data = parsed.data;
    content = parsed.content;
  } catch (e) {
    error(relPath, `Failed to parse frontmatter: ${e.message}`);
    continue;
  }

  // --- Required fields ---
  const required = ['id', 'mantra_id', 'language_code', 'title', 'deity_theme', 'license', 'status', 'quality_level', 'created_at', 'updated_at'];
  for (const field of required) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      error(relPath, `Missing required field: ${field}`);
    }
  }

  // --- id format: mantra_id.language_code ---
  const expectedId = `${data.mantra_id}.${data.language_code}`;
  if (data.id !== expectedId) {
    error(relPath, `id "${data.id}" should be "${expectedId}" (mantra_id.language_code)`);
  }

  // --- id matches filename ---
  if (data.id && data.id !== fileName) {
    error(relPath, `id "${data.id}" does not match filename "${fileName}.md"`);
  }

  // --- language_code matches parent folder ---
  if (data.language_code && data.language_code !== parentDir) {
    error(relPath, `language_code "${data.language_code}" does not match parent folder "${parentDir}"`);
  }

  // --- mantra_id matches filename prefix ---
  const expectedPrefix = fileName.replace(/\.[^.]+$/, ''); // remove last .xx
  if (data.mantra_id && data.mantra_id !== expectedPrefix) {
    error(relPath, `mantra_id "${data.mantra_id}" does not match filename prefix "${expectedPrefix}"`);
  }

  // --- Enum validations ---
  if (data.language_code && !VALID_LANGUAGES.has(data.language_code)) {
    error(relPath, `Invalid language_code: "${data.language_code}". Valid: ${[...VALID_LANGUAGES].join(', ')}`);
  }

  if (Array.isArray(data.deity_theme)) {
    for (const dt of data.deity_theme) {
      if (!VALID_DEITY_IDS.has(dt)) {
        error(relPath, `Invalid deity_theme: "${dt}". Valid: ${[...VALID_DEITY_IDS].join(', ')}`);
      }
    }
  } else if (data.deity_theme !== undefined) {
    error(relPath, `deity_theme must be an array`);
  }

  if (Array.isArray(data.purpose)) {
    for (const p of data.purpose) {
      if (!VALID_PURPOSES.has(p)) {
        error(relPath, `Invalid purpose: "${p}". Valid: ${[...VALID_PURPOSES].join(', ')}`);
      }
    }
  }

  if (data.tradition && !VALID_TRADITIONS.has(data.tradition)) {
    error(relPath, `Invalid tradition: "${data.tradition}". Valid: ${[...VALID_TRADITIONS].join(', ')}`);
  }

  if (data.license && !VALID_LICENSES.has(data.license)) {
    error(relPath, `Invalid license: "${data.license}". Valid: ${[...VALID_LICENSES].join(', ')}`);
  }

  if (data.status && !VALID_STATUSES.has(data.status)) {
    error(relPath, `Invalid status: "${data.status}". Valid: ${[...VALID_STATUSES].join(', ')}`);
  }

  if (data.quality_level && !VALID_QUALITY_LEVELS.has(data.quality_level)) {
    error(relPath, `Invalid quality_level: "${data.quality_level}". Valid: ${[...VALID_QUALITY_LEVELS].join(', ')}`);
  }

  // --- Tag validation ---
  if (data.tags && typeof data.tags === 'object') {
    for (const [group, values] of Object.entries(data.tags)) {
      if (!VALID_TAGS[group]) {
        error(relPath, `Invalid tag group: "${group}". Valid: ${Object.keys(VALID_TAGS).join(', ')}`);
        continue;
      }
      if (Array.isArray(values)) {
        for (const v of values) {
          if (!VALID_TAGS[group].has(v)) {
            error(relPath, `Invalid tag "${v}" in group "${group}". Valid: ${[...VALID_TAGS[group]].join(', ')}`);
          }
        }
      }
    }
  }

  // --- Body non-empty ---
  if (!content || content.trim().length === 0) {
    error(relPath, `Body content is empty`);
  }

  // --- Title non-empty ---
  if (!data.title || data.title.trim().length === 0) {
    error(relPath, `Title is empty`);
  }

  // --- Keywords present ---
  if (!data.keywords || !Array.isArray(data.keywords) || data.keywords.length === 0) {
    warn(relPath, `No keywords defined — reduces discoverability`);
  }

  // --- Source present ---
  if (!data.source || !data.source.text) {
    error(relPath, `Missing source.text`);
  }

  // --- Uniqueness: id ---
  if (data.id) {
    if (seenIds.has(data.id)) {
      error(relPath, `Duplicate id "${data.id}" — also in ${seenIds.get(data.id)}`);
    } else {
      seenIds.set(data.id, relPath);
    }
  }

  // --- Uniqueness: mantra_id + language_code ---
  const mlKey = `${data.mantra_id}|${data.language_code}`;
  if (seenMantraLang.has(mlKey)) {
    error(relPath, `Duplicate mantra_id+language "${mlKey}" — also in ${seenMantraLang.get(mlKey)}`);
  } else {
    seenMantraLang.set(mlKey, relPath);
  }

  // --- Cross-file consistency for mantra-level metadata ---
  const mantraKey = data.mantra_id;
  if (mantraKey) {
    const mantraMeta = {
      deity_theme: JSON.stringify(data.deity_theme || []),
      purpose: JSON.stringify(data.purpose || []),
      tradition: data.tradition || '',
      license: data.license || '',
    };

    if (mantraMetadata.has(mantraKey)) {
      const prev = mantraMetadata.get(mantraKey);
      for (const field of ['deity_theme', 'purpose', 'tradition', 'license']) {
        if (mantraMeta[field] !== prev.meta[field]) {
          error(relPath, `Inconsistent ${field} for mantra "${mantraKey}" — differs from ${prev.file}`);
        }
      }
    } else {
      mantraMetadata.set(mantraKey, { meta: mantraMeta, file: relPath });
    }
  }

  // --- ISO 8601 date format ---
  for (const dateField of ['created_at', 'updated_at']) {
    if (data[dateField]) {
      const d = new Date(data[dateField]);
      if (isNaN(d.getTime())) {
        error(relPath, `Invalid date in ${dateField}: "${data[dateField]}"`);
      }
    }
  }
}

// --- Summary ---
console.log('');
if (warnings.length > 0) {
  console.log(`--- Warnings (${warnings.length}) ---`);
  warnings.forEach(w => console.log(w));
  console.log('');
}

if (errors.length > 0) {
  console.log(`--- Errors (${errors.length}) ---`);
  errors.forEach(e => console.log(e));
  console.log(`\n❌ Validation FAILED: ${errors.length} error(s) found.`);
  process.exit(1);
} else {
  console.log(`✅ Validation PASSED: ${mdFiles.length} files, 0 errors.`);
  if (warnings.length > 0) {
    console.log(`   (${warnings.length} warning(s))`);
  }
  process.exit(0);
}
