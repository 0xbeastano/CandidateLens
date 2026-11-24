# CandidateLens — AI-Assisted Resume Review

CandidateLens is a recruiter-facing interview prototype designed for evidence-based resume comparison. It enables a recruiter to calibrate job-relevant evaluation rubrics, extract text from candidate PDF resumes entirely on the client, and systematically evaluate candidates against documented evidence with verified quotations.

> **Permanent Prototype Disclaimer**  
> *AI-assisted review. Scores reflect documented resume evidence against confirmed criteria, not verified ability or a hiring decision.*

---

## Architecture Overview

```
                                      +------------------------------------+
                                      |         CandidateLens UI           |
                                      |   Next.js App Router (TypeScript)  |
                                      +-----------------+------------------+
                                                        |
                         +------------------------------+------------------------------+
                         |                                                             |
                         v                                                             v
        +----------------------------------+                        +------------------------------------+
        |      Client-side PDF Engine      |                        |       Backend API Routes (Node)    |
        |  pdfjs-dist + public/pdf.worker  |                        |  - POST /api/rubric                |
        |  - In-browser local extraction   |                        |  - POST /api/evaluate              |
        |  - 2 MB & 10-page bounds         |                        +-----------------+------------------+
        |  - Heuristic text sufficiency    |                                          |
        +----------------------------------+                                          v
                                                                    +------------------------------------+
                                                                    |     Gemini Structured Pipeline     |
                                                                    |   @google/genai (GEMINI_MODEL)     |
                                                                    |   - Low temperature (0.1)          |
                                                                    |   - JSON schema output mode        |
                                                                    |   - Bounded 25s timeout            |
                                                                    +-----------------+------------------+
                                                                                      |
                                                                                      v
                                                                    +------------------------------------+
                                                                    |     Strict Evidence Validation     |
                                                                    |   - Unicode & Whitespace Normaliz. |
                                                                    |   - Exact quote verification       |
                                                                    |   - Flag manual_review on failure  |
                                                                    |   - TypeScript weighted scoring    |
                                                                    +------------------------------------+
```

---

## Key Product Capabilities & Boundaries

### Supported Capabilities
- **Single Active Job Description:** Recruiter inputs job description (100 – 20,000 characters).
- **Recruiter Rubric Calibration:** Generates 4–6 criteria with editable labels, descriptions, and weights.
- **Strict Weight Enforcement:** Criteria weights must be positive integers totaling exactly 100%. Recruiter must confirm before evaluation.
- **Client-Side PDF Extraction:** Fast, private text extraction using `pdfjs-dist` in the browser. Server never ingests binary PDFs.
- **Batch Isolation:** Max 5 PDF resumes per batch. Candidates are evaluated sequentially (one candidate per request) to prevent token collisions and maintain partial results if one candidate fails.
- **Exact Quote Verification:** The backend verifies that every quotation provided by the model exists verbatim in the extracted resume text (using Unicode NFKC and whitespace normalization). Fabricated or mismatched quotes automatically downgrade the candidate to `manual_review` with no score.
- **Competition Ranking:** Tied scores share a rank (1, 2, 2, 4) while preserving original upload order.
- **CSV Summary Export:** RFC 4180-compliant CSV download with automatic formula-injection protection (CWE-1236).
- **Synthetic Demo Mode:** One-click offline/demo mode loaded with 3 realistic candidates (strong, partial, limited) and 1 invalid scanned fixture.

### Out of Scope & Limitations
- **Not a Production ATS:** No database or persistent storage. Refreshing the browser or clicking reset clears all data.
- **No Automated Hiring Decisions:** The tool explicitly does not offer "hire/reject" recommendations.
- **Text-Based PDFs Only:** Scanned/image-only PDFs or DOCX files are flagged for `manual_review` via an empirical text sufficiency heuristic (minimum 100 characters).
- **Data Retention Boundary:** Extracted resume text is sent to the configured Google Gemini model provider during live evaluation. The application itself does not persist resumes, but zero retention by the cloud provider is not guaranteed.

---

## Environment Variables & Configuration

Create a `.env.local` file in the project root:

```env
# Server-side Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# Prototype Protection Access Code (verified server-side on every live request)
DEMO_ACCESS_CODE=candidate-lens-demo-2025
```

### Model Selection Guide (`GEMINI_MODEL`)
CandidateLens utilizes the official Google Gen AI SDK (`@google/genai`) with JSON mode (`responseMimeType: 'application/json'`). Configure a model that supports structured JSON generation:
- **Recommended Default:** `gemini-2.5-flash` (fast, cost-effective, high instruction adherence).
- **Alternative:** `gemini-1.5-pro` (useful for complex, multi-page nuanced evaluations).

> [!NOTE]
> Never expose `GEMINI_API_KEY` or `DEMO_ACCESS_CODE` with a `NEXT_PUBLIC_` prefix. All model interactions occur strictly within server-side route handlers (`runtime = 'nodejs'`).

---

## Local Setup & Run Commands

### 1. Prerequisites
- **Node.js:** v18.17+ or v20+ (tested on Node v24)
- **NPM:** v9+

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Automated Test Suite
CandidateLens includes a comprehensive Vitest test suite covering weighted scoring, ranking ties, quote verification, schema boundaries, and CSV injection protection:
```bash
npm test
```

### 5. Production Build
```bash
npm run build
npm start
```

---

## Backend API Contracts

### `POST /api/rubric`
Generates a draft 4–6 criteria rubric from a job description.

- **Headers:** `x-demo-access-code: <string>`
- **Request Body:**
  ```json
  {
    "job_description": "We are seeking a Staff Engineer with 6+ years of TypeScript..."
  }
  ```
- **Response (`200 OK`):**
  ```json
  {
    "rubric_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "criteria": [
      {
        "id": "c1",
        "label": "TypeScript & Next.js Architecture",
        "description": "Production experience architecting scalable web applications...",
        "weight": 30
      }
    ]
  }
  ```

---

### `POST /api/evaluate`
Extracts resume evidence against confirmed rubric criteria, verifies quotes, and calculates the weighted score.

- **Headers:** `x-demo-access-code: <string>`
- **Request Body:**
  ```json
  {
    "candidate_id": "11111111-1111-4111-8111-111111111111",
    "filename": "Alex_Chen_Staff_Resume.pdf",
    "resume_text": "Alex Chen... Lead AI Systems Architect...",
    "rubric": {
      "rubric_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "criteria": [
        {
          "id": "c1",
          "label": "TypeScript & Next.js Architecture",
          "description": "Production experience...",
          "weight": 30
        }
      ]
    }
  }
  ```
- **Response (`200 OK`):**
  ```json
  {
    "candidate_id": "11111111-1111-4111-8111-111111111111",
    "status": "complete",
    "summary": "Candidate demonstrates 8 years of full-stack engineering...",
    "criteria": [
      {
        "criterion_id": "c1",
        "evidence_level": "clear",
        "quotes": [
          "Architected enterprise Next.js App Router portal handling over 1.2M monthly active sessions..."
        ],
        "explanation": "Direct evidence of architecting enterprise applications..."
      }
    ],
    "evidence_score": 100,
    "missing_information": [],
    "interview_questions": [
      "How did you structure the error handling when integrating Gemini API?",
      "Can you walk through how you configured PDF.js web workers?",
      "What architectural trade-offs did you encounter with Next.js App Router?"
    ]
  }
  ```

---

## Scoring & Evidence Methodology

1. **Evidence Multipliers:**
   - **`clear` (1.0x):** Explicit, documented project or role accomplishments matching the criterion. Requires at least one verified quote from the resume text.
   - **`limited` (0.5x):** Skills mentions or partial context without documented outcomes. Requires verified quote.
   - **`none` (0.0x):** No evidence found in the resume. Quotes array must be empty.

2. **Formula:**
   $$\text{Score} = \sum (\text{weight}_i \times \text{multiplier}_i)$$
   Rounded once at the end to one decimal place.

3. **Strict Quote Verification:**
   The backend applies Unicode NFKC normalization and whitespace collapse to both the resume text and the model's reported quotes. If a quote cannot be found in the resume, the response is marked `manual_review` and assigned **no score**, preventing fabricated hallucination.

4. **Competition Ranking:**
   Candidates with identical scores share a rank (e.g. 1, 2, 2, 4), and ties preserve original upload order.

---

## Deploying to Vercel

CandidateLens is configured for frictionless deployment on Vercel:

1. Push code to your Git repository (GitHub/GitLab/Bitbucket).
2. Import the project into the [Vercel Dashboard](https://vercel.com).
3. Set Environment Variables in Project Settings:
   - `GEMINI_API_KEY`: Your Google AI Studio API key.
   - `GEMINI_MODEL`: `gemini-2.5-flash`
   - `DEMO_ACCESS_CODE`: Secret access code for prototype protection.
4. Deploy. The `public/pdf.worker.min.js` asset is automatically served statically by Next.js.

---

## Interview Demonstration Script (3-Minute Walkthrough)

1. **Introduction (30s):**
   - *"CandidateLens addresses the problem of recruiter bias and hallucinated AI evaluations. Instead of asking an LLM to 'hire or reject', CandidateLens extracts verified evidence against recruiter-approved criteria."*
2. **Step 1: Calibration (45s):**
   - Click **"Load Synthetic Demo"** (or paste a job description and click **"Prepare Criteria"**).
   - Point out the 4 calibrated criteria and weights totaling 100%. Explain that the recruiter maintains full editorial control and must confirm the rubric before any evaluations occur.
3. **Step 2: Transparent Ingestion (30s):**
   - Show Stage 2: 4 candidates are ingested. Point out `Scanned_Image_Only_Resume.pdf`, which is automatically detected by the text-sufficiency heuristic and flagged for `manual_review` rather than crashing the batch.
4. **Step 3: Sequential Evidence Evaluation & Ranking (45s):**
   - Click **"Evaluate Candidates"**.
   - Note the sequential execution and batch isolation.
   - Show the final ranked table: Alex Chen (#1, 100/100), Jordan Taylor (#2, 40/100), Casey Morgan (#3, 15/100).
5. **Step 4: Auditability & Detail Drawer (30s):**
   - Click **"Details"** on Alex Chen.
   - Highlight the verified quotations in callout boxes. Explain that the backend performs strict substring verification, ensuring the model cannot invent credentials.
   - Review the 3 suggested interview questions and download the CSV summary.
