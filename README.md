# SIR Enumeration Form App

Local web app to help citizens fill the SIR Self-Enumeration form without mistakes. Select a voter from the 2025 list, map them (or their relative) to the 2002 SIR database, enter personal details, and generate a watermarked PDF overlaid on the official blank form.

## Prerequisites

- Node.js 20+
- CSV files (paths configurable in `.env`):
  - **2025 voter list**: `150_151_152_voters.csv`
  - **2002 SIR list**: `sir-search-backend/data.csv`
- Blank form PDF at `public/templates/Enumeration-Form_SIR_English.pdf`

## Setup

```bash
cd ~/Projects/sir-enum-app
npm install
cp .env.example .env   # edit CSV paths if needed
npm run db:import      # one-time import into data/app.db
npm run dev            # http://localhost:3000
```

## Workflow

1. **Select Voter** (`/`) — search the 2025 list by booth, name, EPIC, or house number; click **Start Form**.
2. **Edit Form** (`/forms/[id]`) — all 2025 fields are editable; map to 2002 SIR (voter or relative); enter DOB, Aadhaar, mobile, parents, spouse.
3. **Generate PDF** — Download, Print, or Send via WhatsApp (opens `wa.me` link; attach PDF manually).
4. **Drafts** (`/forms`) — resume or delete saved forms.
5. **Settings** (`/settings`) — AC constants, BLO name/contact per booth, dropdown options.
6. **Calibrate PDF** (`/admin/calibrate`) — open grid overlay PDF and tune `src/lib/formCoordinates.ts`.

## PDF notes

- Text is overlaid on the official blank form using coordinate mapping.
- Watermark: **DRAFT - FOR REVIEW** (diagonal, light gray).
- QR code, old photo, and current photo box are left blank.
- Aadhaar is masked by default (last 4 digits visible); override per form.
- Coordinates are approximate — use the calibration page to fine-tune alignment.

## WhatsApp

Enter a number with country code (e.g. `919876543210`). The app downloads the PDF and opens WhatsApp with a pre-filled message. **Attach the PDF manually** — `wa.me` links cannot attach files automatically.

## Data refresh

Re-run import after updating CSVs:

```bash
npm run db:import
```

This replaces all rows in `voters_2025` and `voters_2002`.

## Project structure

```
src/
  app/           # Pages and API routes
  components/    # VoterPicker, FormEditor, etc.
  lib/
    db.ts              # SQLite + settings
    forms.ts           # Form CRUD
    pdf.ts             # PDF generation
    formCoordinates.ts # Field x/y positions (tune here)
scripts/
  import-csv.ts  # CSV → SQLite import
data/
  app.db         # Local database (gitignored)
```

## Known limitations

- Local single-user only; no authentication.
- PDF field positions may need calibration for pixel-perfect alignment.
- WhatsApp requires manual PDF attachment.
- 2002 search loads full table in memory for filtering (fine for ~185K rows locally).
