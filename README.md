# JapaKosha Content Repository

Canonical source of mantra/prayer content for JapaKosha — an open, multilingual collection of Hindu stotras, mantras, and prayers.

## Browse Mantras

- [Full Index](catalog/index.md) — all mantras, searchable
- **By Deity:** [Ganesha](catalog/by-deity/ganesha.md) · [Shiva](catalog/by-deity/shiva.md) · [Vishnu](catalog/by-deity/vishnu.md) · [Devi](catalog/by-deity/devi.md) · [Surya](catalog/by-deity/surya.md) · [Navagraha](catalog/by-deity/navagraha.md) · [more...](catalog/index.md#by-deity)
- **By Tradition:** [Vedic](catalog/by-tradition/vedic.md) · [Upanishadic](catalog/by-tradition/upanishadic.md) · [Stotra](catalog/by-tradition/stotra.md) · [Tantric](catalog/by-tradition/tantric.md)
- **By Purpose:** [Devotion](catalog/by-purpose/devotion.md) · [Peace](catalog/by-purpose/peace.md) · [Wisdom](catalog/by-purpose/wisdom.md)

## Content Structure

```
content/
  <lang>/                           # Language folder (sa, hi, kn, en, ta, te, ...)
    <mantra-id>.<lang>.md           # One file = one complete contribution
```

Each markdown file is **self-contained** with all metadata in front matter and mantra text as the body. Files with the same `mantra_id` across language folders are translations of the same mantra.

## Key Files

| File | Purpose |
|------|----------|
| [`metadata.json`](metadata.json) | All valid categories, purposes, traditions, languages, tags |
| `content/<lang>/` | Mantra content by language |
| `catalog/` | Auto-generated browsable index (do not edit) |
| `scripts/validate.mjs` | Validates content against metadata.json |
| `scripts/generate-catalog.mjs` | Generates catalog/ from content |
| `docs/CONTENT_PRD.md` | Product and governance spec |
| `docs/AI_CONTENT_INSTRUCTIONS.md` | AI agent content guidelines |

## Contributing

1. Create a file in `content/<lang>/<mantra-id>.<lang>.md`
2. Fill in all required front matter fields (see `docs/AI_CONTENT_INSTRUCTIONS.md`)
3. Ensure values exist in [`metadata.json`](metadata.json)
4. Set `status: "pending"` — maintainers approve
5. Open a PR — validation runs automatically via GitHub Actions

### Validation

```bash
pnpm run validate    # Check all content against metadata.json
pnpm run catalog     # Regenerate catalog/ pages
```

## CI/CD

- **PR validation** — runs `validate.mjs` on every PR touching `content/` or `metadata.json`
- **Catalog generation** — on merge to `main`, catalog is regenerated and committed

## Non-Goals

- App UI code
- Android-specific business logic
- User account/private data
