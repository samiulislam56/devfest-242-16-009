# Tender Document Package Builder

**AI DevFest 2026 — AI Vibe-Coding Contest**  
**Participant Name:** Md. Samiul Islam  
**Registration Number:** 242-16-009  
**Application Type:** Frontend-only browser web application  
**License:** [MIT License](LICENSE)  

---

## 📌 Project Overview

**Tender Document Package Builder** is an operational document-processing web application built for office and tender preparation staff. It streamlines the preparation of public procurement tender packages by:
- Ingesting tender requirement specifications via `requirements.json`.
- Uploading up to 30 PDF documents (under 50 MB total).
- Verifying file contents, computing browser-native SHA-256 hashes (`SubtleCrypto`) to detect exact duplicate documents even with altered filenames.
- Managing strict one-to-one mapping between requirements and PDF files.
- Enforcing document validity through a real-time status engine (`Missing`, `Expiry date needed`, `Expired`, `Not provided`, `OK`).
- Merging matched documents into an official submission-ready `<tender_id>_Package.pdf` complete with an English Cover Page, Table of Contents, and safety footers (`<tender_id> | Page X of Y`) on every page.
- Offering complete bilingual support (**English** & **বাংলা**), three-state theme management (Light / System / Dark), and WCAG 2.1 AA accessibility.

---

## 🚀 Live Demo & Deployment

- **GitHub Repository:** [https://github.com/samiulislam56/devfest-242-16-009](https://github.com/samiulislam56/devfest-242-16-009)
- **Live URL (GitHub Pages):** [https://samiulislam56.github.io/devfest-242-16-009/](https://samiulislam56.github.io/devfest-242-16-009/)
- **Local Dev Server:** `http://localhost:3000`

---

## 🛠️ Run & Build Instructions

### Prerequisites
- Node.js (v18+ or v24 LTS)
- npm (v10+)

### Setup & Run Locally
```bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev

# 3. Open in Google Chrome
# Navigate to http://localhost:3000
```

### Production Build
```bash
# Build the optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🎯 Main Features (FR-01 to FR-14)

1. **FR-01: Requirements JSON Ingestion & Validation**
   - Upload any custom `requirements.json` or load preset sample packs.
   - Strictly validates `tender_id`, `title`, `procuring_entity`, `bidder`, `submission_deadline`, and requirements structure.
2. **FR-02: Ordered Requirements Display**
   - Automatically sorts requirements according to their numeric `order` field.
3. **FR-03 & FR-04: Multi-PDF Upload & Inspection**
   - Drag-and-drop or file picker for multiple PDF documents.
   - Enforces 30 files / 50 MB limits with human-readable error messages.
   - Rejects non-PDF files immediately.
   - Inspects page counts safely using `pdf-lib`.
4. **FR-05 & FR-06: Strict 1-to-1 Matching & Undo**
   - Each uploaded file matches at most one requirement.
   - Each requirement matches at most one uploaded file.
   - Clear unmatch and re-assignment controls.
5. **FR-07 & FR-08: Expiry Tracking & Real-Time Status Engine**
   - For items with `has_expiry: true`, captures expiry date.
   - Status transitions instantly:
     - `Missing` (Required document without file — **Blocks generation**)
     - `Expiry date needed` (File matched, missing expiry date — **Blocks generation**)
     - `Expired` (Expiry date is before submission deadline — **Blocks generation**)
     - `Not provided` (Optional document without file — **Allowed**)
     - `OK` (Valid file; expiry is on or after submission deadline — **Allowed**)
   - Same-day expiry rule: If expiry date equals submission deadline, it is treated as **OK**.
6. **FR-09 & FR-10: Cryptographic Duplicate Detection**
   - Computes SHA-256 hash using browser `crypto.subtle.digest`.
   - Visibly flags duplicate files even when filenames differ.
   - Strictly blocks package generation if duplicate content is assigned to multiple requirements.
7. **FR-11: Blocking Protection & Compliance Panel**
   - Package generation is disabled while any blocking issue exists, with full breakdown explaining why.
8. **FR-12 & FR-13: Combined PDF Assembly & Download**
   - **Cover Page (Page 1):** Official English cover page containing Tender ID, Title, Procuring Entity, Bidder, Deadline, generation timestamp, and full Table of Contents.
   - **Document Order:** All source PDFs appended strictly in requirement `order`.
   - **Page Preservation:** All pages and orientations from source files preserved intact.
   - **Safety Footers:** `<tender_id> | Page X of Y` stamped on every single page (including cover).
   - **Download:** Automatically downloads as `<tender_id>_Package.pdf`.
9. **FR-14: Bilingual Interface (English & বাংলা)**
   - Instant toggle switching all UI labels, table headers, document titles (`title_bn`/`title_en`), and validation explanations.

---

## ⭐ Bonus Features (FR-15 to FR-21)

- **FR-15: Protected / Corrupted File Handling:** Safely detects password-encrypted or corrupt PDFs and displays recoverable error banners without crashing.
- **FR-16: Table of Contents / Index with Starting Pages:** Included on Page 1 cover with starting page numbers for each document.
- **FR-17: Digital Seal / Signature Embedding:** Upload a PNG seal/stamp and choose to apply it to Cover, Last page, or All pages.
- **FR-18: Export Checklist as Excel & CSV:** Export full audit sheets (`<tender_id>_Checklist.xlsx` / `.csv`) via `xlsx`.
- **FR-19: Browser Session Persistence:** Save and reload tender state and mappings to browser `localStorage`.
- **FR-20: Auto-Match by Filename:** Smart substring matching algorithm automatically maps uploaded files to requirement items based on name similarity.
- **Restrained Three.js 3D Visual Shell:** Lightweight 3D animated identity element in header respecting `prefers-reduced-motion`.
- **One-Click Sample PDF Generator:** Generates valid multi-page PDF documents and duplicate pairs in browser for instant evaluation.

---

## 📁 Repository Structure

```
.
├── output/
│   └── T-2026-0417_Package.pdf        # Generated 15-page test package
├── screenshots/
│   ├── 01_tender_overview.png         # Tender details & overview KPI
│   ├── 02_requirements_initial.png    # Initial requirements table
│   ├── 03_files_uploaded.png          # Uploaded PDFs & duplicate detection
│   ├── 04_requirements_matched_status.png # Matched docs with OK statuses
│   ├── 05_validation_panel.png        # Validation status engine
│   ├── 06_package_generated_preview.png  # Package assembly & live preview
│   └── 07_bangla_mode.png             # Bilingual Bangla UI
├── scripts/
│   ├── generate_sample_output.js      # CLI sample package generator
│   ├── capture_screenshots.js         # Headless Chrome screenshot runner
│   └── capture_package_complete.js    # Automated workflow verification
├── src/
│   ├── app/
│   │   └── App.tsx                    # Main orchestration & state engine
│   ├── components/
│   │   ├── navigation/                # Header & Sidebar components
│   │   └── ui/                        # Button, StatusBadge, ThemeToggle, Toast, 3D
│   ├── features/
│   │   ├── tender/                    # Tender Overview & defaultData
│   │   ├── matching/                  # RequirementsTable & 1-to-1 matching
│   │   ├── upload/                    # FileUploader & drag-drop
│   │   ├── validation/                # ValidationPanel & blocking explanations
│   │   ├── package/                   # PackageGenerator & live preview
│   │   ├── bonus/                     # BonusTools (Excel/CSV export, Seal)
│   │   └── i18n/                      # English & Bangla translation dictionary
│   ├── lib/
│   │   ├── hashing/                   # SubtleCrypto SHA-256 hash
│   │   ├── pdf/                       # pdf-lib merger, parser & sample generator
│   │   └── validation/                # Status engine implementation
│   ├── styles/                        # CSS design tokens & Tailwind setup
│   └── types/                         # TypeScript strict data contracts
├── public/
│   └── requirements.json              # Sample requirements schema
├── LICENSE                            # MIT License
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🤖 AI Coding Tools & Prompts

- **Primary AI Tool:** Antigravity (Google DeepMind)
- **Most Useful AI Prompt:**
  > *"Build a React 19 + TypeScript strict + Tailwind frontend-only tender workspace. Implement typed requirements.json loading, SubtleCrypto SHA-256 duplicate detection, one-to-one document matching with undo, exact status engine (Missing / Expiry date needed / Expired / Not provided / OK), English cover page with Table of Contents, page footers (<tender_id> | Page X of Y), and bilingual English/Bangla switch."*

---

## ⚠️ Known Issues / Limitations
- **Browser Memory for Massive Files:** While total limit is set to 50 MB / 30 files, memory usage is managed by processing files sequentially using `pdf-lib` to avoid browser tab crashes.
- **Protected PDFs:** Password-protected PDFs cannot be merged without password input; the application safely detects this and alerts the user without crashing.
