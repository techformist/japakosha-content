# AI Instructions for JapaKosha Content

> Audience: AI coding agents generating or editing content in this repository.
> Read `docs/CONTENT_PRD.md` first for full context.

---

## 1. Objectives

- Preserve textual authenticity and attribution.
- Keep metadata consistent and machine-validated.
- Produce contributor-friendly, moderation-ready changes.

---

## 2. Mandatory Rules

1. **Never invent scripture sources.** If the source is unknown, set `source.text` to `"Traditional"` and `source.citation` to `null`.
2. **Never submit content without required metadata.** Every mantra needs `canonical_id`, `source`, `license`, and `status` in `meta.json`.
3. **Never rename existing `canonical_id` values.** These are permanent stable identifiers.
4. **Prefer minimal edits** to existing records. Do not rewrite content that is already correct.
5. **Keep localization files independent.** Each `<lang>-<script>.json` file is self-contained per mantra.
6. **Mark uncertain content honestly.** If unsure about authenticity, set `quality_level: "unverified"` and `status: "pending"`.

---

## 3. Naming Conventions

### 3.1 `canonical_id` Format

- Lowercase kebab-case.
- Derived from the most recognizable Sanskrit/English form of the mantra.
- Examples: `om-gan-ganapataye`, `om-namah-shivaya`, `gayatri-mantra`, `hanuman-chalisa`.
- Must be unique across all mantras.
- Once assigned, never change.

### 3.2 `slug` Format

- Same as `canonical_id` with optional suffix for disambiguation.
- Must be URL-safe and unique.
- Example: `om-gan-ganapataye-namaha`.

### 3.3 Folder Structure

```
content/mantras/<canonical_id>/
├── meta.json
└── localizations/
    ├── sa-Deva.json      # Sanskrit in Devanagari
    ├── hi-Deva.json      # Hindi in Devanagari
    ├── en-Latn.json      # English in Latin script
    ├── kn-Knda.json      # Kannada in Kannada script
    └── ...
```

File name pattern: `<BCP-47 language code>-<ISO 15924 script code>.json`

---

## 4. Language Codes Reference

Use these exact codes:

| Code | Language  | Script Code | Script Name |
| ---- | --------- | ----------- | ----------- |
| `sa` | Sanskrit  | `Deva`      | Devanagari  |
| `hi` | Hindi     | `Deva`      | Devanagari  |
| `kn` | Kannada   | `Knda`      | Kannada     |
| `en` | English   | `Latn`      | Latin       |
| `ta` | Tamil     | `Taml`      | Tamil       |
| `te` | Telugu    | `Telu`      | Telugu      |
| `mr` | Marathi   | `Deva`      | Devanagari  |
| `gu` | Gujarati  | `Gujr`      | Gujarati    |
| `pa` | Punjabi   | `Guru`      | Gurmukhi    |
| `bn` | Bengali   | `Beng`      | Bengali     |
| `ml` | Malayalam | `Mlym`      | Malayalam   |
| `or` | Odia      | `Orya`      | Odia        |

---

## 5. File Templates

### 5.1 `meta.json` Template

```json
{
  "canonical_id": "REPLACE-WITH-KEBAB-CASE-ID",
  "slug": "REPLACE-WITH-URL-SAFE-SLUG",
  "deity_theme": ["REPLACE"],
  "purpose": [],
  "source": {
    "text": "REPLACE with source name",
    "citation": null,
    "url": null
  },
  "license": "public-domain",
  "attribution": null,
  "status": "pending",
  "created_at": "REPLACE-ISO-8601",
  "updated_at": "REPLACE-ISO-8601"
}
```

Valid `deity_theme` values: `ganesha`, `shiva`, `vishnu`, `devi`, `hanuman`, `universal` (extensible).

Valid `purpose` values: `peace`, `protection`, `health`, `wisdom`, `gratitude`, `prosperity`, `devotion`, `meditation` (extensible).

Valid `license` values: `public-domain`, `cc-by-4.0`, `cc-by-sa-4.0`, `contributor-owned`.

Valid `status` values: `draft`, `pending`, `approved`, `flagged`.

### 5.2 Localization File Template

```json
{
  "canonical_id": "MUST-MATCH-PARENT-FOLDER",
  "language_code": "sa",
  "script": "Deva",
  "title": "REPLACE with title in this script",
  "body": "REPLACE with full mantra text.\nPreserve meaningful line breaks.",
  "phonetic": null,
  "transliteration": null,
  "translator": null,
  "editor": null,
  "quality_level": "community",
  "fallback_language": null,
  "created_at": "REPLACE-ISO-8601",
  "updated_at": "REPLACE-ISO-8601"
}
```

Valid `quality_level` values:

- `verified` — Expert-checked, authoritative source confirmed.
- `community` — Contributor-provided, appears correct.
- `unverified` — Auto-generated or unconfirmed.

---

## 6. Content Style Rules

- **Titles**: Concise, recognizable. Use the most common name for the mantra.
- **Body text**: Preserve line breaks where they mark verse boundaries (`\n`). Do not add decorative line breaks.
- **Phonetic**: Latin-script pronunciation guide. Use IAST or a simplified phonetic that an English speaker can follow.
- **Transliteration**: Explicit about source script. Only include if the transliteration adds value beyond the phonetic field.
- **No doctrinal reinterpretation**: Reproduce text faithfully. Commentary belongs in separate fields (not yet defined).

---

## 7. Translation Rules

- Translations must be **semantically faithful**, not poetic rewrites, unless explicitly marked.
- Include `translator` metadata when adding non-canonical translations.
- If a translation is partial or draft, set `quality_level: "unverified"`.
- Add `fallback_language` recommendation when translation is incomplete (e.g., body is present but title is missing → set `fallback_language: "sa"`).

---

## 8. Validation

### 8.1 Schema Files

All content must validate against:

- `schemas/meta.schema.json` — for `meta.json` files
- `schemas/localization.schema.json` — for localization files
- `schemas/manifest.schema.json` — for generated `manifest.json`

### 8.2 Running Validation Locally

```bash
# From repo root
./scripts/validate.sh
```

### 8.3 Pre-Submission Checklist

Before creating a PR, verify:

- [ ] `canonical_id` is unique (not used by any existing mantra).
- [ ] `slug` is unique.
- [ ] `meta.json` passes `schemas/meta.schema.json`.
- [ ] Every localization file passes `schemas/localization.schema.json`.
- [ ] `source.text` is set (never empty).
- [ ] `license` is set.
- [ ] `status` is `pending` (not `approved` — maintainers approve).
- [ ] `canonical_id` in localization files matches the parent folder name.
- [ ] `language_code` and `script` are from the reference table (§4).
- [ ] `body` and `title` are non-empty.
- [ ] No duplicate `canonical_id` or `slug` across the repo.

---

## 9. PR Template

When creating a pull request, include:

```markdown
## What changed

<!-- Brief description of mantras added/modified -->

## Canonical IDs

<!-- List all canonical_id values touched -->

- `example-mantra-id`

## Source citations

<!-- For each new mantra, cite the source -->

- `example-mantra-id`: Source Name, Verse X

## License confirmation

- [ ] All content is public-domain, CC-BY-4.0, CC-BY-SA-4.0, or contributor-owned
- [ ] Source attribution is included where required

## Translation notes

<!-- Any notes about translation approach, quality level, or fallback -->

## Checklist

- [ ] JSON schema validation passes
- [ ] No duplicate canonical_id or slug
- [ ] Status is `pending` for new content
- [ ] Source citation exists for all new mantras
```

---

## 10. Common Mistakes to Avoid

| Mistake                                                    | Correct Approach                                                                    |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Inventing a `canonical_id` that duplicates an existing one | Search existing `content/mantras/` first                                            |
| Setting `status: "approved"` on new content                | Always use `pending`; maintainers approve                                           |
| Putting multiple mantras in one localization file          | One localization file per mantra per language                                       |
| Using `en` script code instead of `Latn`                   | Language code ≠ script code. Use ISO 15924 for scripts.                             |
| Mixing languages within a single localization file         | Each file is one language only                                                      |
| Omitting `source.text`                                     | Required even for well-known mantras; use "Traditional" if origin is oral tradition |
| Using smart quotes or typographic characters in JSON       | Use plain ASCII quotes in JSON; Unicode is fine in text values                      |
