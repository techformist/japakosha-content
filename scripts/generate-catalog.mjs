/**
 * Catalog generation script.
 * Scans content/ and generates browsable catalog/ pages grouped by deity, purpose, ritual, occasion.
 * Usage: node scripts/generate-catalog.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { resolve, basename, dirname, relative } from 'path';
import { globSync } from 'glob';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const matter = require('gray-matter');

const ROOT = resolve(import.meta.dirname, '..');
const CATALOG_DIR = resolve(ROOT, 'catalog');
const METADATA = JSON.parse(readFileSync(resolve(ROOT, 'metadata.json'), 'utf-8'));

// Clean and recreate catalog dir
rmSync(CATALOG_DIR, { recursive: true, force: true });
mkdirSync(resolve(CATALOG_DIR, 'by-deity'), { recursive: true });
mkdirSync(resolve(CATALOG_DIR, 'by-purpose'), { recursive: true });
mkdirSync(resolve(CATALOG_DIR, 'by-ritual'), { recursive: true });
mkdirSync(resolve(CATALOG_DIR, 'by-occasion'), { recursive: true });
mkdirSync(resolve(CATALOG_DIR, 'by-tradition'), { recursive: true });

// Language display names
const LANG_NAMES = {};
for (const [code, info] of Object.entries(METADATA.languages)) {
  LANG_NAMES[code] = info.name;
}

// Collect all content
const mdFiles = globSync('content/**/*.md', { cwd: ROOT }).map(f => f.replace(/\\/g, '/'));

// Group by mantra_id
const mantras = new Map(); // mantra_id -> { languages: { code: { data, relPath } }, data (from first file) }

for (const relPath of mdFiles) {
  const absPath = resolve(ROOT, relPath);
  const raw = readFileSync(absPath, 'utf-8');
  const { data } = matter(raw);

  const mantraId = data.mantra_id;
  if (!mantraId) continue;

  if (!mantras.has(mantraId)) {
    mantras.set(mantraId, { data, languages: {} });
  }

  const lang = data.language_code || 'unknown';
  mantras.get(mantraId).languages[lang] = { data, relPath };
}

console.log(`Found ${mantras.size} unique mantras across ${mdFiles.length} files.`);

// Helper: generate a mantra entry for a catalog page
function mantraEntry(mantraId, info) {
  const d = info.data;
  const title = d.title || mantraId;
  const deity = (d.deity_theme || []).join(', ');
  const purpose = (d.purpose || []).join(', ');
  const tradition = d.tradition || '';
  const source = d.source?.text || '';
  const keywords = (d.keywords || []).slice(0, 8).join(', ');

  let entry = `## ${title}\n`;
  entry += `**mantra_id:** \`${mantraId}\``;
  if (deity) entry += ` · **Deity:** ${deity}`;
  if (purpose) entry += ` · **Purpose:** ${purpose}`;
  if (tradition) entry += ` · **Tradition:** ${tradition}`;
  if (source) entry += ` · **Source:** ${source}`;
  entry += '\n\n';

  entry += 'Available in:\n';
  for (const [lang, langInfo] of Object.entries(info.languages).sort()) {
    const langName = LANG_NAMES[lang] || lang;
    const langTitle = langInfo.data.title || title;
    entry += `- [${langName} — ${langTitle}](../${langInfo.relPath})\n`;
  }

  if (keywords) {
    entry += `\n**Keywords:** ${keywords}\n`;
  }

  return entry;
}

// Group mantras by various dimensions
function groupBy(field, isArray = true) {
  const groups = new Map();
  for (const [mantraId, info] of mantras) {
    const values = isArray
      ? (info.data[field] || [])
      : [info.data[field]].filter(Boolean);

    for (const val of values) {
      if (!groups.has(val)) groups.set(val, []);
      groups.get(val).push([mantraId, info]);
    }
  }
  return groups;
}

function groupByTag(tagGroup) {
  const groups = new Map();
  for (const [mantraId, info] of mantras) {
    const tags = info.data.tags?.[tagGroup] || [];
    for (const val of tags) {
      if (!groups.has(val)) groups.set(val, []);
      groups.get(val).push([mantraId, info]);
    }
  }
  return groups;
}

// Generate catalog pages
function writeCatalogPages(groupedData, subdir, dimensionName) {
  let count = 0;
  for (const [value, entries] of groupedData) {
    const displayName = value.charAt(0).toUpperCase() + value.slice(1);
    let md = `<!-- AUTO-GENERATED — do not edit manually -->\n`;
    md += `# ${displayName} ${dimensionName}\n\n`;
    md += `${entries.length} mantra(s) found.\n\n---\n\n`;

    for (const [mantraId, info] of entries) {
      md += mantraEntry(mantraId, info);
      md += '\n---\n\n';
    }

    const filePath = resolve(CATALOG_DIR, subdir, `${value}.md`);
    writeFileSync(filePath, md, 'utf-8');
    count++;
  }
  return count;
}

// By deity
const byDeity = groupBy('deity_theme', true);
const deityCount = writeCatalogPages(byDeity, 'by-deity', 'Mantras');

// By purpose
const byPurpose = groupBy('purpose', true);
const purposeCount = writeCatalogPages(byPurpose, 'by-purpose', 'Mantras');

// By tradition
const byTradition = groupBy('tradition', false);
const traditionCount = writeCatalogPages(byTradition, 'by-tradition', 'Mantras');

// By ritual tag
const byRitual = groupByTag('ritual');
const ritualCount = writeCatalogPages(byRitual, 'by-ritual', 'Mantras');

// By occasion tag
const byOccasion = groupByTag('occasion');
const occasionCount = writeCatalogPages(byOccasion, 'by-occasion', 'Mantras');

// Generate main index
let indexMd = `<!-- AUTO-GENERATED — do not edit manually -->\n`;
indexMd += `# JapaKosha Content Index\n\n`;
indexMd += `**${mantras.size}** mantras across **${mdFiles.length}** files.\n\n`;

// Deity section
indexMd += `## By Deity\n`;
for (const [deity, entries] of [...byDeity].sort((a, b) => a[0].localeCompare(b[0]))) {
  const displayName = deity.charAt(0).toUpperCase() + deity.slice(1);
  indexMd += `- [${displayName}](by-deity/${deity}.md) (${entries.length})\n`;
}
indexMd += '\n';

// Purpose section
if (byPurpose.size > 0) {
  indexMd += `## By Purpose\n`;
  for (const [purpose, entries] of [...byPurpose].sort((a, b) => a[0].localeCompare(b[0]))) {
    const displayName = purpose.charAt(0).toUpperCase() + purpose.slice(1);
    indexMd += `- [${displayName}](by-purpose/${purpose}.md) (${entries.length})\n`;
  }
  indexMd += '\n';
}

// Tradition section
if (byTradition.size > 0) {
  indexMd += `## By Tradition\n`;
  for (const [tradition, entries] of [...byTradition].sort((a, b) => a[0].localeCompare(b[0]))) {
    const displayName = tradition.charAt(0).toUpperCase() + tradition.slice(1);
    indexMd += `- [${displayName}](by-tradition/${tradition}.md) (${entries.length})\n`;
  }
  indexMd += '\n';
}

// Full listing
indexMd += `## All Mantras\n\n`;
for (const [mantraId, info] of [...mantras].sort((a, b) => a[0].localeCompare(b[0]))) {
  const title = info.data.title || mantraId;
  const langs = Object.keys(info.languages).sort().map(l => LANG_NAMES[l] || l).join(', ');
  const firstLangPath = Object.values(info.languages)[0].relPath;
  indexMd += `- **[${title}](../${firstLangPath})** — ${langs}\n`;
}

writeFileSync(resolve(CATALOG_DIR, 'index.md'), indexMd, 'utf-8');

console.log(`\nCatalog generated:`);
console.log(`  catalog/index.md`);
console.log(`  catalog/by-deity/    — ${deityCount} pages`);
console.log(`  catalog/by-purpose/  — ${purposeCount} pages`);
console.log(`  catalog/by-tradition/ — ${traditionCount} pages`);
console.log(`  catalog/by-ritual/   — ${ritualCount} pages`);
console.log(`  catalog/by-occasion/ — ${occasionCount} pages`);
