import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { globSync } from "glob";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const matter = require("gray-matter");

const ROOT = resolve(import.meta.dirname, "..");
const FILES = globSync("content/kn/*.kn.md", { cwd: ROOT }).sort();
const REPORT_PATH = resolve(ROOT, "temp", "kn-sandhi-candidates.json");
const KANNADA_TOKEN = /[\u0C80-\u0CFF]+/g;
const VIRAMA = "್";
const MIN_COMPLEX_TOKEN_LENGTH = 18;
const MIN_COMPLEX_CLUSTER_COUNT = 4;

function normalizeLine(line) {
  return line
    .replace(/\|\|[^|]*\|\|/g, " ")
    .replace(/[|,.;:!?()[\]{}"'“”‘’॥।]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function visibleLength(token) {
  return token.replace(/[\u0CBE-\u0CCC\u0CD5\u0CD6\u0C82\u0C83\u0C81]/g, "")
    .length;
}

function analyzeToken(token) {
  const viramaCount = [...token].filter((char) => char === VIRAMA).length;
  const tokenLength = visibleLength(token);
  const reasons = [];

  if (tokenLength >= MIN_COMPLEX_TOKEN_LENGTH) {
    reasons.push(`long-token:${tokenLength}`);
  }

  if (viramaCount >= MIN_COMPLEX_CLUSTER_COUNT) {
    reasons.push(`multi-cluster:${viramaCount}`);
  }

  if (reasons.length === 0) {
    return null;
  }

  return {
    token,
    reasons: [...new Set(reasons)],
  };
}

const files = [];
let totalCandidateLines = 0;
let totalCandidateTokens = 0;

for (const relPath of FILES) {
  const absPath = resolve(ROOT, relPath);
  const raw = readFileSync(absPath, "utf-8");
  const { content } = matter(raw);
  const candidateLines = [];
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    const normalized = normalizeLine(line);
    if (!normalized) {
      return;
    }

    const tokens = normalized.match(KANNADA_TOKEN) ?? [];
    const flagged = tokens.map(analyzeToken).filter(Boolean);

    if (flagged.length === 0) {
      return;
    }

    totalCandidateLines += 1;
    totalCandidateTokens += flagged.length;

    candidateLines.push({
      lineNumber: index + 1,
      text: line,
      tokens: flagged,
    });
  });

  if (candidateLines.length > 0) {
    files.push({
      path: relPath,
      candidateLineCount: candidateLines.length,
      candidateTokenCount: candidateLines.reduce(
        (sum, line) => sum + line.tokens.length,
        0,
      ),
      candidateLines,
    });
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  directory: "content/kn",
  fileCount: FILES.length,
  filesWithCandidates: files.length,
  totalCandidateLines,
  totalCandidateTokens,
  notes: [
    "This scanner is intentionally narrow and read-only.",
    "It highlights only very long fused tokens or tokens with unusually high cluster density.",
    "It does not attempt Sandhi-viccheda or phonetic rewrites automatically.",
  ],
  files,
};

mkdirSync(resolve(ROOT, "temp"), { recursive: true });
writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf-8");

console.log(`Scanned ${FILES.length} Kannada files.`);
console.log(
  `Flagged ${files.length} files, ${totalCandidateLines} lines, ${totalCandidateTokens} tokens.`,
);
console.log(`Wrote report to ${REPORT_PATH}`);
