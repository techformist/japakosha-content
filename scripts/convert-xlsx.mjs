/**
 * One-time conversion script: xlsx crawl data → markdown content files.
 * Usage: node scripts/convert-xlsx.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const ROOT = resolve(import.meta.dirname, '..');
const CONTENT_DIR = join(ROOT, 'content', 'kn');
const METADATA = JSON.parse(readFileSync(join(ROOT, 'metadata.json'), 'utf-8'));

// Map Stotranidhi articleSection to our deity_theme ids
const SECTION_TO_DEITY = {
  'Ganesha - ಗಣೇಶ': ['ganesha'],
  'Vishnu - ವಿಷ್ಣು': ['vishnu'],
  'Devi - ದೇವೀ': ['devi'],
  'Surya - ಸೂರ್ಯ': ['surya'],
  'Navagraha - ನವಗ್ರಹ': ['navagraha'],
  'Narasimha - ನೃಸಿಂಹ ಸ್ತೋತ್ರಾಣಿ': ['narasimha'],
  'Subrahmanya - ಸುಬ್ರಹ್ಮಣ್ಯ': ['subrahmanya'],
  'Dattatreya - ದತ್ತಾತ್ರೇಯ': ['dattatreya'],
  'Ayyappa - ಅಯ್ಯಪ್ಪ': ['ayyappa'],
  'Venkateshwara - ವೇಂಕಟೇಶ್ವರ': ['venkateshwara'],
  'Lalitha - ಲಲಿತಾ': ['lalitha'],
  'Gayatri - ಗಾಯತ್ರೀ': ['surya', 'universal'],
  'Sundarakanda - ಸುಂದರಕಾಂಡ': ['hanuman', 'rama'],
  'Ramayanam - ರಾಮಾಯಣಂ': ['rama'],
  'Upanishad - ಉಪನಿಷತ್ತುಗಳು': ['universal'],
  'Vividha - ವಿವಿಧ': ['universal'],
  'Dasa Mahavidya - ದಶಮಹಾವಿದ್ಯಾ': ['devi'],
  'Puja Vidhi - ಪೂಜಾ ವಿಧಿ': ['universal'],
  '108 - ಅಷ್ಟೋತ್ತರಶತನಾಮಾವಳೀ': ['universal'],
  '1008 - ಸಹಸ್ರನಾಮಾವಳಿಃ': ['universal'],
  'Uncategorized': ['universal'],
};

// Guess tradition from section
const SECTION_TO_TRADITION = {
  'Upanishad - ಉಪನಿಷತ್ತುಗಳು': 'upanishadic',
  'Ramayanam - ರಾಮಾಯಣಂ': 'puranic',
  'Sundarakanda - ಸುಂದರಕಾಂಡ': 'puranic',
  'Dasa Mahavidya - ದಶಮಹಾವಿದ್ಯಾ': 'tantric',
};

// Guess content_type from slug/title
function guessContentType(slug) {
  if (slug.includes('kavacham')) return 'kavacham';
  if (slug.includes('ashtakam')) return 'ashtakam';
  if (slug.includes('ashtottara') || slug.includes('shatanamavali')) return 'ashtottara';
  if (slug.includes('sahasranama')) return 'sahasranama';
  if (slug.includes('pancharatnam')) return 'pancharatnam';
  if (slug.includes('upanishad')) return 'upanishad';
  if (slug.includes('stuti')) return 'stuti';
  if (slug.includes('puja')) return 'puja-vidhi';
  if (slug.includes('mantra')) return 'mantra';
  if (slug.includes('stotram') || slug.includes('stava')) return 'stotra';
  return 'stotra';
}

// Refine deity for 108/1008 based on title
function refineDeityFor108(title, section) {
  const t = title.toLowerCase();
  if (t.includes('lakshmi') || t.includes('lakshm')) return ['lakshmi'];
  if (t.includes('ganga')) return ['universal'];
  if (t.includes('vishwaksena')) return ['vishnu'];
  if (t.includes('veerabhadra') || t.includes('virabhadra')) return ['shiva'];
  if (t.includes('arunachal')) return ['shiva'];
  if (t.includes('devi')) return ['devi'];
  return SECTION_TO_DEITY[section] || ['universal'];
}

function decodeHtmlEntities(str) {
  return str
    .replace(/&#038;/g, '&')
    .replace(/&#8211;/g, '–')
    .replace(/&#8217;/g, "'")
    .replace(/&amp;/g, '&');
}

function cleanMarkdownBody(md) {
  if (!md) return '';
  // Extract text after the first heading (which is the title)
  const lines = md.split('\n');
  let startIdx = 0;
  // Skip the first line if it's a heading
  if (lines[0]?.startsWith('# ')) {
    startIdx = 1;
  }
  // Skip empty lines after heading
  while (startIdx < lines.length && lines[startIdx].trim() === '') {
    startIdx++;
  }

  let body = lines.slice(startIdx).join('\n');

  // Remove trailing Stotranidhi boilerplate
  body = body.replace(/\*\*Did you see any mistake.*$/s, '').trim();

  // Remove markdown link artifacts but keep text
  body = body.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');

  // Clean up excessive backslashes from escape sequences
  body = body.replace(/\\\\/g, '');

  // Remove trailing pipe characters that appear in some entries
  body = body.replace(/\|$/gm, '');

  return body.trim();
}

function slugToMantraId(urlSlug) {
  // Remove language suffix like "-in-kannada"
  return urlSlug
    .replace(/-in-kannada$/, '')
    .replace(/-in-sanskrit$/, '')
    .replace(/-in-english$/, '')
    .replace(/-in-hindi$/, '')
    .replace(/-in-telugu$/, '')
    .replace(/-in-tamil$/, '');
}

function extractKannadaTitle(headline) {
  // headline format: "English Title – ಕನ್ನಡ ಶೀರ್ಷಿಕೆ"
  const decoded = decodeHtmlEntities(headline || '');
  const parts = decoded.split(/\s*–\s*/);
  return parts.length > 1 ? parts[parts.length - 1].trim() : decoded.trim();
}

function extractEnglishTitle(headline) {
  const decoded = decodeHtmlEntities(headline || '');
  const parts = decoded.split(/\s*–\s*/);
  return parts[0].trim();
}

function buildKeywords(englishTitle, kannadaTitle, section, slug) {
  const keywords = new Set();
  // Add english words
  englishTitle.toLowerCase().split(/\s+/).forEach(w => {
    if (w.length > 2 && !['the', 'and', 'for', 'from'].includes(w)) {
      keywords.add(w);
    }
  });
  // Add kannada title
  if (kannadaTitle) keywords.add(kannadaTitle);
  // Add slug parts
  slug.split('-').forEach(w => {
    if (w.length > 2 && !['in', 'kannada', 'the'].includes(w)) {
      keywords.add(w);
    }
  });
  return [...keywords];
}

// Process all xlsx files
const xlsxFiles = [
  join(ROOT, 'temp', 'dataset_website-content-crawler_2025-02-23_16-17-59-725.xlsx'),
  join(ROOT, 'temp', 'dataset_website-content-crawler_2025-02-23_16-28-10-284.xlsx'),
];

mkdirSync(CONTENT_DIR, { recursive: true });

const now = new Date().toISOString();
const seen = new Set();
let count = 0;
let skipped = 0;

for (const file of xlsxFiles) {
  if (!existsSync(file)) {
    console.warn(`Skipping missing file: ${file}`);
    continue;
  }

  const wb = XLSX.readFile(file);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws);

  for (const row of rows) {
    const url = row['crawl/loadedUrl'] || '';
    const section = row['metadata/jsonLd/0/@graph/0/articleSection/0'] || 'unknown';
    const headline = row['metadata/jsonLd/0/@graph/0/headline'] || row['metadata/title'] || '';
    const langCode = row['metadata/languageCode'] || 'kn';
    const markdown = row['markdown'] || '';
    const sourceUrl = row['metadata/canonicalUrl'] || url;

    // Skip index pages and non-content pages
    if (!headline || section === 'unknown' || url.endsWith('stotras-list-kannada/')) {
      skipped++;
      continue;
    }

    // Derive mantra_id from URL slug
    const urlSlug = url
      .replace(/^https:\/\/stotranidhi\.com\/kn\//, '')
      .replace(/\/$/, '')
      .replace(/#.*$/, '')       // remove fragment identifiers
      .replace(/\?.*$/, '');     // remove query strings
    const mantraId = slugToMantraId(urlSlug);

    // Skip if mantraId contains invalid characters for a filename
    if (!mantraId || /[\/\\#?]/.test(mantraId)) {
      console.warn(`Invalid mantra_id: ${mantraId} from ${url}, skipping`);
      skipped++;
      continue;
    }

    if (seen.has(mantraId)) {
      console.warn(`Duplicate mantra_id: ${mantraId}, skipping`);
      skipped++;
      continue;
    }
    seen.add(mantraId);

    const lang = langCode === 'kn' ? 'kn' : langCode;
    const id = `${mantraId}.${lang}`;
    const kannadaTitle = extractKannadaTitle(headline);
    const englishTitle = extractEnglishTitle(headline);
    const body = cleanMarkdownBody(markdown);

    if (!body) {
      console.warn(`Empty body for ${mantraId}, skipping`);
      skipped++;
      continue;
    }

    // Map section to deity_theme
    let deityTheme = SECTION_TO_DEITY[section] || ['universal'];
    if (section.startsWith('108') || section.startsWith('1008')) {
      deityTheme = refineDeityFor108(headline, section);
    }

    const tradition = SECTION_TO_TRADITION[section] || 'stotra';
    const contentType = guessContentType(mantraId);

    const keywords = buildKeywords(englishTitle, kannadaTitle, section, mantraId);

    // Build frontmatter
    const frontmatter = {
      id,
      mantra_id: mantraId,
      language_code: lang,
      title: kannadaTitle,
      deity_theme: deityTheme,
      purpose: ['devotion'],
      tradition,
      tags: {
        content_type: [contentType],
      },
      keywords,
      source: {
        text: 'Stotranidhi',
        citation: null,
        url: sourceUrl,
      },
      license: 'public-domain',
      status: 'pending',
      quality_level: 'community',
      phonetic: null,
      created_at: now,
      updated_at: now,
    };

    // Build markdown file
    const yamlLines = [
      '---',
      `id: "${frontmatter.id}"`,
      `mantra_id: "${frontmatter.mantra_id}"`,
      `language_code: "${frontmatter.language_code}"`,
      `title: "${frontmatter.title.replace(/"/g, '\\"')}"`,
      `deity_theme: [${frontmatter.deity_theme.map(d => `"${d}"`).join(', ')}]`,
      `purpose: [${frontmatter.purpose.map(p => `"${p}"`).join(', ')}]`,
      `tradition: "${frontmatter.tradition}"`,
      `tags:`,
      `  content_type: [${frontmatter.tags.content_type.map(t => `"${t}"`).join(', ')}]`,
      `keywords:`,
      ...frontmatter.keywords.map(k => `  - "${k.replace(/"/g, '\\"')}"`),
      `source:`,
      `  text: "Stotranidhi"`,
      `  citation: null`,
      `  url: "${frontmatter.source.url}"`,
      `license: "${frontmatter.license}"`,
      `status: "${frontmatter.status}"`,
      `quality_level: "${frontmatter.quality_level}"`,
      `phonetic: null`,
      `created_at: "${frontmatter.created_at}"`,
      `updated_at: "${frontmatter.updated_at}"`,
      '---',
      '',
      body,
      '',
    ];

    const filePath = join(CONTENT_DIR, `${mantraId}.${lang}.md`);
    writeFileSync(filePath, yamlLines.join('\n'), 'utf-8');
    count++;
  }
}

console.log(`\nConversion complete: ${count} files created, ${skipped} skipped`);
console.log(`Output: ${CONTENT_DIR}`);
