import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(import.meta.dirname, "..");
const REPORT_PATH = resolve(ROOT, "temp", "kn-sandhi-candidates.json");

const DIRECT_PROPOSALS = {
  ಅವಿಕಾರ್ಯಮನಾಖ್ಯೇಯಮದ್ವೈತಮನುಭೂಯತೇ: {
    replacement: "ಅವಿಕಾರ್ಯಂ ಅನಾಖ್ಯೇಯಂ ಅದ್ವೈತಂ ಅನುಭೂಯತೇ",
    confidence: "high",
    method: "curated",
  },
  ದೇವೀವೈಭವಾಶ್ಚರ್ಯಾಷ್ಟೋತ್ತರಶತದಿವ್ಯನಾಮ: {
    replacement: "ದೇವೀ ವೈಭವ ಆಶ್ಚರ್ಯ ಅಷ್ಟೋತ್ತರ ಶತ ದಿವ್ಯ ನಾಮ",
    confidence: "high",
    method: "curated",
  },
  ಸ್ತೋತ್ರಮಹಾಮಂತ್ರಸ್ಯ: {
    replacement: "ಸ್ತೋತ್ರ ಮಹಾ ಮಂತ್ರಸ್ಯ",
    confidence: "high",
    method: "curated",
  },
  ಸರ್ವಜ್ಞಾನಸಮನ್ವಿತಮ್: {
    replacement: "ಸರ್ವ ಜ್ಞಾನ ಸಮನ್ವಿತಮ್",
    confidence: "high",
    method: "curated",
  },
  ಬ್ರಹ್ಮವಿಷ್ಣುಶಿವಾತ್ಮಕಮ್: {
    replacement: "ಬ್ರಹ್ಮ ವಿಷ್ಣು ಶಿವ ಆತ್ಮಕಮ್",
    confidence: "high",
    method: "curated",
  },
  ಶಸ್ತ್ರಾಸ್ತ್ರಧಾರಿಣೀ: {
    replacement: "ಶಸ್ತ್ರ ಅಸ್ತ್ರ ಧಾರಿಣೀ",
    confidence: "high",
    method: "curated",
  },
  ಶಸ್ತ್ರಾಸ್ತ್ರಾಯುಧಭಾಸುರಾ: {
    replacement: "ಶಸ್ತ್ರ ಅಸ್ತ್ರ ಆಯುಧ ಭಾಸುರಾ",
    confidence: "high",
    method: "curated",
  },
  ಮಧುರಾಮ್ಲತಿಕ್ತಕಟುಕಷಾಯಲವಣರಸಾಃ: {
    replacement: "ಮಧುರ ಆಮ್ಲ ತಿಕ್ತ ಕಟುಕ ಕಷಾಯ ಲವಣ ರಸಾಃ",
    confidence: "high",
    method: "curated",
  },
  ಅಖಂಡಸಚ್ಚಿದಾನಂದಶಿವಶಕ್ತ್ಯೈಕ್ಯರೂಪಿಣೀ: {
    replacement: "ಅಖಂಡ ಸಚ್ಚಿದಾನಂದ ಶಿವ ಶಕ್ತಿ ಏಕ್ಯ ರೂಪಿಣೀ",
    confidence: "medium",
    method: "curated",
  },
  ಪರಕಾಯಪ್ರವೇಶಾದಿಯೋಗಸಿದ್ಧಿಪ್ರದಾಯಿನೀ: {
    replacement: "ಪರಕಾಯ ಪ್ರವೇಶಾದಿ ಯೋಗ ಸಿದ್ಧಿ ಪ್ರದಾಯಿನೀ",
    confidence: "high",
    method: "curated",
  },
  ಉತ್ಪತ್ತಿಸ್ಥಿತಿಸಂಹಾರಕ್ರಮಚಕ್ರನಿವಾಸಿನೀ: {
    replacement: "ಉತ್ಪತ್ತಿ ಸ್ಥಿತಿ ಸಂಹಾರ ಕ್ರಮ ಚಕ್ರ ನಿವಾಸಿನೀ",
    confidence: "high",
    method: "curated",
  },
  ಗೃಹಗ್ರಾಮಮಹಾರಾಜ್ಯಸಾಮ್ರಾಜ್ಯಸುಖದಾಯಿನೀ: {
    replacement: "ಗೃಹ ಗ್ರಾಮ ಮಹಾರಾಜ್ಯ ಸಾಮ್ರಾಜ್ಯ ಸುಖ ದಾಯಿನೀ",
    confidence: "high",
    method: "curated",
  },
  ಧನಧಾನ್ಯಮಣೀವಸ್ತ್ರಭೂಷಾಲೇಪನಮಾಲ್ಯದಾ: {
    replacement: "ಧನ ಧಾನ್ಯ ಮಣೀ ವಸ್ತ್ರ ಭೂಷಾ ಲೇಪನ ಮಾಲ್ಯ ದಾ",
    confidence: "high",
    method: "curated",
  },
  ಲೀಲಾವಿನಿರ್ಮಿತಾನೇಕಕೋಟಿಬ್ರಹ್ಮಾಂಡಮಂಡಲಾ: {
    replacement: "ಲೀಲಾ ವಿನಿರ್ಮಿತ ಅನೇಕ ಕೋಟಿ ಬ್ರಹ್ಮಾಂಡ ಮಂಡಲಾ",
    confidence: "high",
    method: "curated",
  },
  ಸೃಷ್ಟಿಸ್ಥಿತಿಲಯಕಾರಣಮುಮಾಸಹಿತಂ: {
    replacement: "ಸೃಷ್ಟಿ ಸ್ಥಿತಿ ಲಯ ಕಾರಣಂ ಉಮಾ ಸಹಿತಂ",
    confidence: "high",
    method: "curated",
  },
};

const batchNumber = Number.parseInt(process.argv[2] ?? "1", 10);
const batchSize = Number.parseInt(process.argv[3] ?? "10", 10);

if (!Number.isInteger(batchNumber) || batchNumber < 1) {
  console.error("batchNumber must be a positive integer.");
  process.exit(1);
}

if (!Number.isInteger(batchSize) || batchSize < 1) {
  console.error("batchSize must be a positive integer.");
  process.exit(1);
}

const report = JSON.parse(readFileSync(REPORT_PATH, "utf-8"));
const start = (batchNumber - 1) * batchSize;
const end = start + batchSize;
const files = report.files.slice(start, end);

function getProposal(token) {
  const directProposal = DIRECT_PROPOSALS[token];

  if (directProposal) {
    return {
      replacement: directProposal.replacement,
      confidence: directProposal.confidence,
      method: directProposal.method,
      note: null,
    };
  }

  return {
    replacement: null,
    confidence: "unresolved",
    method: "none",
    note: "No deterministic replacement rule has been approved for this token yet.",
  };
}

function applyLineProposals(line) {
  let proposedText = line.text;
  let proposedCount = 0;

  const tokens = line.tokens.map((token) => {
    const proposal = getProposal(token.token);
    if (proposal.replacement) {
      proposedText = proposedText.replace(token.token, proposal.replacement);
      proposedCount += 1;
    }

    return {
      ...token,
      proposal,
    };
  });

  const hasFullProposal = proposedCount === line.tokens.length;
  const hasAnyProposal = proposedCount > 0;

  return {
    ...line,
    tokens,
    proposedText: hasAnyProposal ? proposedText : null,
    proposalCoverage: hasFullProposal
      ? "full"
      : hasAnyProposal
        ? "partial"
        : "none",
  };
}

if (files.length === 0) {
  console.error(`No files available for batch ${batchNumber}.`);
  process.exit(1);
}

const batch = {
  batchId: `kn-sandhi-review-batch-${String(batchNumber).padStart(2, "0")}`,
  generatedAt: new Date().toISOString(),
  sourceReport: "temp/kn-sandhi-candidates.json",
  directory: "content/kn",
  batchNumber,
  batchSize,
  startIndex: start + 1,
  endIndex: start + files.length,
  totalFilesInCorpus: report.files.length,
  reviewInstructions: [
    "Approve per file or per line after checking phonetic equivalence.",
    "Use this batch only as a review artifact, not as canonical content.",
    "After approval, replacements should be applied only to the approved subset.",
    "Proposed replacements are deterministic suggestions; unresolved tokens remain null.",
  ],
  files: files.map((file, index) => ({
    batchIndex: start + index + 1,
    path: file.path.replace(/\\/g, "/"),
    candidateLineCount: file.candidateLineCount,
    candidateTokenCount: file.candidateTokenCount,
    reviewStatus: "pending",
    replacementApproved: false,
    proposedTokenCount: file.candidateLines
      .flatMap((line) => line.tokens)
      .filter((token) => DIRECT_PROPOSALS[token.token]).length,
    notes: [
      "Review candidate lines before any source modification.",
      "No automatic replacements have been applied in this batch.",
      "Unresolved tokens require manual linguistic review before application.",
    ],
    candidateLines: file.candidateLines.map(applyLineProposals),
  })),
};

const outputPath = resolve(ROOT, "temp", `${batch.batchId}.json`);

mkdirSync(resolve(ROOT, "temp"), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(batch, null, 2)}\n`, "utf-8");

console.log(`Wrote review batch ${batch.batchId} to ${outputPath}`);
console.log(
  `Included files ${batch.startIndex}-${batch.endIndex} of ${batch.totalFilesInCorpus}.`,
);
