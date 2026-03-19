# JapaKosha Content PRD

> Audience: AI coding agents, content contributors, and maintainers.
> This document governs the canonical mantra content repository.

---

## 1. Vision

Build a trustworthy, open, multilingual mantra/prayer content base for India-context usage and global readers. Must scale to 10+ languages while remaining easy for contributors and machines to validate.

---

## 2. Product Goals

- Provide canonical mantra records with stable IDs.
- Support multilingual text, script variants, and transliterations.
- Enable safe public contribution with moderation.
- Publish deterministic, versioned artifacts for app (`japakosha-app`) and site (`japakosha-site`) sync.

---

## 3. Taxonomy Model (Hybrid)

A hybrid model supports both devotional and utility-first discovery.

### 3.1 Primary Dimensions

| Dimension        | Purpose                   | Example Values                                                       |
| ---------------- | ------------------------- | -------------------------------------------------------------------- |
| Deity/Theme      | Devotional filtering      | `ganesha`, `shiva`, `vishnu`, `devi`, `hanuman`, `universal`         |
| Purpose          | Intent-based discovery    | `peace`, `protection`, `health`, `wisdom`, `gratitude`, `prosperity` |
| Source/Tradition | Scholarly/lineage context | `vedic`, `puranic`, `stotra`, `agamic`, `sant-tradition`             |

### 3.2 Secondary Tags (Optional)

| Tag Group              | Example Values                                 |
| ---------------------- | ---------------------------------------------- |
| Ritual context         | `daily-japa`, `festival`, `puja`, `meditation` |
| Time/occasion          | `morning`, `evening`, `ekadashi`, `navaratri`  |
| Region/language origin | `karnataka`, `maharashtra`, `tamil-nadu`       |

### 3.3 Initial Category Set

These IDs must match between content artifacts and app database:

| ID          | Name      | Display Order |
| ----------- | --------- | ------------- |
| `ganesha`   | Ganesha   | 1             |
| `shiva`     | Shiva     | 2             |
| `vishnu`    | Vishnu    | 3             |
| `devi`      | Devi      | 4             |
| `hanuman`   | Hanuman   | 5             |
| `universal` | Universal | 10            |

---

## 4. Content Unit Model

### 4.1 Canonical Mantra Entity (`meta.json`)

Each mantra lives in `content/mantras/<canonical_id>/meta.json`:

```json
{
  "canonical_id": "om-gan-ganapataye",
  "slug": "om-gan-ganapataye-namaha",
  "deity_theme": ["ganesha"],
  "purpose": ["wisdom", "prosperity"],
  "source": {
    "text": "Ganapati Upanishad",
    "citation": "Ganapati Atharvashirsha, Verse 1",
    "url": null
  },
  "license": "public-domain",
  "attribution": null,
  "created_at": "2024-06-01T00:00:00Z",
  "updated_at": "2024-06-15T00:00:00Z"
}
```

**Field reference:**

| Field             | Type     | Required | Notes                                                                              |
| ----------------- | -------- | -------- | ---------------------------------------------------------------------------------- |
| `canonical_id`    | string   | ✅       | Stable, language-neutral. Format: lowercase kebab-case. Never rename.              |
| `slug`            | string   | ✅       | URL-friendly. Must be unique across all mantras.                                   |
| `deity_theme`     | string[] | ✅       | One or more IDs from §3.3 or custom tags.                                          |
| `purpose`         | string[] | ❌       | Zero or more purpose tags.                                                         |
| `source.text`     | string   | ✅       | Human-readable source name.                                                        |
| `source.citation` | string   | ❌       | Specific verse/chapter reference.                                                  |
| `source.url`      | string   | ❌       | Link to authoritative reference.                                                   |
| `license`         | string   | ✅       | `public-domain`, `cc-by-4.0`, `cc-by-sa-4.0`, or `contributor-owned`.              |
| `attribution`     | string   | ❌       | Required if license is `cc-by-*` or `contributor-owned`.                           |
| `created_at`      | ISO 8601 | ✅       |                                                                                    |
| `updated_at`      | ISO 8601 | ✅       |                                                                                    |

### 4.2 Localization Entity (`<lang>-<script>.json`)

Each language variant lives in `content/mantras/<canonical_id>/localizations/<lang>-<script>.json`:

```json
{
  "canonical_id": "om-gan-ganapataye",
  "language_code": "sa",
  "script": "Deva",
  "title": "ॐ गं गणपतये नमः",
  "body": "ॐ गं गणपतये नमः।\nवक्रतुण्ड महाकाय सूर्यकोटि समप्रभ।\nनिर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा॥",
  "phonetic": "Om Gam Ganapataye Namaha.\nVakratunda Mahakaya Suryakoti Samaprabha.\nNirvighnam Kuru Me Deva Sarvakaryeshu Sarvada.",
  "transliteration": null,
  "translator": null,
  "editor": null,
  "quality_level": "verified",
  "fallback_language": null,
  "created_at": "2024-06-01T00:00:00Z",
  "updated_at": "2024-06-15T00:00:00Z"
}
```

**Field reference:**

| Field               | Type   | Required | Notes                                                                                           |
| ------------------- | ------ | -------- | ----------------------------------------------------------------------------------------------- |
| `canonical_id`      | string | ✅       | Must match parent folder.                                                                       |
| `language_code`     | string | ✅       | BCP-47: `sa`, `hi`, `kn`, `en`, `ta`, `te`, `mr`, `gu`, etc.                                    |
| `script`            | string | ✅       | ISO 15924: `Deva` (Devanagari), `Knda` (Kannada), `Latn` (Latin), `Taml`, `Telu`, etc.          |
| `title`             | string | ✅       | Short recognizable title in this script.                                                        |
| `body`              | string | ✅       | Full mantra text. Preserve meaningful line breaks with `\n`.                                    |
| `phonetic`          | string | ❌       | Latin-script pronunciation guide.                                                               |
| `transliteration`   | string | ❌       | Transliteration from another script (specify source in notes).                                  |
| `translator`        | string | ❌       | Attribution for non-canonical translations.                                                     |
| `editor`            | string | ❌       | Who reviewed/edited this variant.                                                               |
| `quality_level`     | enum   | ✅       | `verified` (expert-checked), `community` (contributor-provided), `unverified` (auto-generated). |
| `fallback_language` | string | ❌       | Suggested fallback if this localization is incomplete.                                          |

### 4.3 Language Codes Reference

| Code | Language | Primary Script | ISO 15924 |
| ---- | -------- | -------------- | --------- |
| `sa` | Sanskrit | Devanagari     | `Deva`    |
| `hi` | Hindi    | Devanagari     | `Deva`    |
| `kn` | Kannada  | Kannada        | `Knda`    |
| `en` | English  | Latin          | `Latn`    |
| `ta` | Tamil    | Tamil          | `Taml`    |
| `te` | Telugu   | Telugu         | `Telu`    |
| `mr` | Marathi  | Devanagari     | `Deva`    |
| `gu` | Gujarati | Gujarati       | `Gujr`    |

---

## 5. Repository Information Architecture

```
japakosha-content/
├── content/
│   ├── mantras/
│   │   ├── om-gan-ganapataye/
│   │   │   ├── meta.json
│   │   │   └── localizations/
│   │   │       ├── sa-Deva.json
│   │   │       ├── hi-Deva.json
│   │   │       └── en-Latn.json
│   │   ├── om-namah-shivaya/
│   │   │   ├── meta.json
│   │   │   └── localizations/
│   │   │       ├── sa-Deva.json
│   │   │       └── en-Latn.json
│   │   └── ...
│   └── categories/
│       └── categories.json          # Flat list of all categories (see §3.3)
├── schemas/
│   ├── manifest.schema.json         # Published manifest contract
│   ├── meta.schema.json             # Validates meta.json files
│   └── localization.schema.json     # Validates localization files
├── artifacts/                        # Generated (gitignored or CI-only)
│   ├── manifest.json
│   └── bundles/
│       ├── categories.json
│       ├── mantras-full.json
│       └── mantras-delta-from-*.json
├── scripts/
│   ├── validate.sh                  # Run schema validation on all content
│   └── build-artifacts.sh           # Generate manifest + bundles from content/
├── docs/
│   ├── CONTENT_PRD.md               # This file
│   └── AI_CONTENT_INSTRUCTIONS.md   # AI agent rules
└── README.md
```

### 5.1 `categories.json` Format

```json
[
  {
    "id": "ganesha",
    "name": "Ganesha",
    "description": "Prayers to Lord Ganesha, remover of obstacles",
    "display_order": 1
  },
  {
    "id": "shiva",
    "name": "Shiva",
    "description": "Prayers to Lord Shiva, the transformer",
    "display_order": 2
  },
  {
    "id": "vishnu",
    "name": "Vishnu",
    "description": "Prayers to Lord Vishnu, the preserver",
    "display_order": 3
  },
  {
    "id": "devi",
    "name": "Devi",
    "description": "Prayers to the Divine Mother",
    "display_order": 4
  },
  {
    "id": "hanuman",
    "name": "Hanuman",
    "description": "Prayers to Lord Hanuman",
    "display_order": 5
  },
  {
    "id": "universal",
    "name": "Universal",
    "description": "Prayers transcending specific deity traditions",
    "display_order": 10
  }
]
```

---

## 6. Sync Artifact Contract

### 6.1 Manifest (`artifacts/manifest.json`)

```json
{
  "manifestVersion": "1",
  "contentVersion": "2024.06.15.1",
  "publishedAt": "2024-06-15T10:30:00Z",
  "minAppVersion": "1.0.0",
  "bundles": [
    {
      "name": "categories",
      "path": "bundles/categories.json",
      "sha256": "...",
      "sizeBytes": 2048
    },
    {
      "name": "mantras-full",
      "path": "bundles/mantras-full.json",
      "sha256": "...",
      "sizeBytes": 102400
    },
    {
      "name": "mantras-delta",
      "path": "bundles/mantras-delta-from-2024.06.01.json",
      "sha256": "...",
      "sizeBytes": 4096,
      "deltaFrom": "2024.06.01.1"
    }
  ]
}
```

Schema: `schemas/manifest.schema.json`

### 6.2 Bundle Strategy

- **Full bundles** for bootstrap sync: contains all mantras on `main` with all localizations.
- **Delta bundles** (optional): keyed by `deltaFrom` contentVersion. Contains only added/modified/deleted mantras since that version.
- **Deletion handling**: delta bundles include a `deletions` array of `canonical_id` values.

### 6.3 Bundle Generation (CI Pipeline)

The `scripts/build-artifacts.sh` script:

1. Scans all content files on `main`.
2. For each, collects all `localizations/*.json`.
3. Writes `bundles/categories.json` from `content/categories/categories.json`.
4. Writes `bundles/mantras-full.json` as a flat array of mantra objects with embedded localizations.
5. Computes SHA-256 for each bundle file.
6. Generates `manifest.json` with current timestamp and version.
7. Optionally generates delta bundle by diffing against previous manifest.

---

## 7. Governance and Moderation

- **PR-only** contribution model. No direct pushes to `main`.
- Source attribution and license declaration required in every PR.
- Maintainer review is enforced through the PR and merge flow.
- Flag/revert workflow for inaccuracies or abuse.
- PR template enforces: canonical ID, source citation, license confirmation, translation notes.

---

## 8. Copyright and Safety Constraints

- Accept only: public-domain, Creative Commons (BY/BY-SA 4.0), or verified contributor-owned text.
- Require explicit `source` declaration in `meta.json`.
- Takedown requests handled within 48 hours — documented process in `CONTRIBUTING.md`.
- No doctrinal reinterpretation in canonical text fields.

---

## 9. Quality Gates (CI)

Every PR must pass:

| Check                                                  | Tool/Method                                         | Blocks Merge?     |
| ------------------------------------------------------ | --------------------------------------------------- | ----------------- |
| JSON schema validation (meta + localizations)          | `ajv` or equivalent against `schemas/*.schema.json` | ✅                |
| Duplicate `canonical_id` or `slug` check               | Script scan                                         | ✅                |
| Required metadata fields present                       | Schema `required` enforcement                       | ✅                |
| `language_code` is valid BCP-47                        | Regex or validation lib                             | ✅                |
| `script` is valid ISO 15924                            | Validation against known list                       | ✅                |
| No empty `body` or `title`                             | Schema `minLength: 1`                               | ✅                |
| Optional: profanity/spam heuristic                     | Lightweight keyword filter                          | ❌ (warning only) |

---

## 10. Milestones

### M1: Schema + Structure

| Task                                        | Acceptance                                        |
| ------------------------------------------- | ------------------------------------------------- |
| Create `schemas/meta.schema.json`           | Validates `meta.json` files                       |
| Create `schemas/localization.schema.json`   | Validates localization files                      |
| Create `content/categories/categories.json` | Initial 6 categories                              |
| Create `scripts/validate.sh`                | Runs schema validation, exits non-zero on failure |
| Set up CI (GitHub Actions) with validation  | PR checks pass/fail correctly                     |

### M2: Initial Content (50+ Mantras)

| Task                                                | Acceptance                               |
| --------------------------------------------------- | ---------------------------------------- |
| Seed 50+ mantras with `meta.json`                   | All pass schema validation               |
| Each has at least Sanskrit (`sa-Deva`) localization | Body + title present                     |
| At least 20 have Hindi (`hi-Deva`)                  | Quality level: `community` or `verified` |
| At least 10 have English (`en-Latn`)                | Quality level: `community`               |
| Coverage across all 6 initial categories            | At least 5 per category                  |

### M3: Artifact Pipeline

| Task                                                                | Acceptance                          |
| ------------------------------------------------------------------- | ----------------------------------- |
| `scripts/build-artifacts.sh` generates `manifest.json` + `bundles/` | Deterministic output                |
| CI runs build on merge to `main`                                    | Artifacts published to `artifacts/` |
| `manifest.json` passes `manifest.schema.json` validation            | Checksum + version correct          |
| App and site can consume bundles                                    | End-to-end test documented          |

### M4: Delta Artifacts + Scale

| Task                                            | Acceptance                |
| ----------------------------------------------- | ------------------------- |
| Delta bundle generation from previous version   | `deltaFrom` field correct |
| 200+ mantras with 3+ languages                  | Broad coverage            |
| Contributor guide (`CONTRIBUTING.md`) published | First external PR merged  |
