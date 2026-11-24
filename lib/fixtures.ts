import { CandidateEvaluationResult, Rubric } from './types';

export const DEMO_JOB_TITLE = 'Staff Full-Stack Engineer (AI Applications)';

export const DEMO_JOB_DESCRIPTION = `We are seeking an experienced Staff Full-Stack Engineer to lead the architecture and implementation of our next-generation AI-assisted workflow platform.

Responsibilities:
- Architect and develop scalable, responsive web applications using TypeScript, Next.js App Router, and Tailwind CSS.
- Design resilient integrations with Large Language Model APIs (Gemini, Claude, GPT), ensuring strict input validation, prompt safety, and structured JSON outputs.
- Build reliable client-side data processing pipelines, including client-side PDF text extraction and offline-tolerant state management.
- Establish comprehensive testing suites including unit, integration, and contract tests to maintain 99.9% application uptime.
- Collaborate with product managers and recruiters to deliver transparent, evidence-based user experiences that prioritize data privacy and eliminate AI bias.

Requirements:
- 6+ years of full-stack web engineering experience with modern TypeScript and React/Next.js frameworks.
- Demonstrated production experience integrating generative AI or LLM APIs into user-facing web products with prompt engineering and structured schema validation.
- Deep understanding of client-side web APIs, browser performance optimization, and document parsing (PDF.js / Web Workers).
- Proven track record of designing high-reliability automated testing suites with Vitest, Jest, or Playwright.
- Excellent communication skills and commitment to transparent, ethical engineering practices.`;

export const DEMO_MOCK_RUBRIC: Rubric = {
  rubric_id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  criteria: [
    {
      id: 'c1',
      label: 'TypeScript & Next.js Architecture',
      description: 'Production experience architecting scalable web applications using TypeScript and Next.js App Router.',
      weight: 30,
    },
    {
      id: 'c2',
      label: 'LLM & Generative AI Integration',
      description: 'Hands-on implementation of LLM APIs with structured output schema enforcement and prompt engineering.',
      weight: 30,
    },
    {
      id: 'c3',
      label: 'Client-side Document Extraction',
      description: 'Experience building client-side document processing, Web Workers, or PDF.js parsing pipelines.',
      weight: 20,
    },
    {
      id: 'c4',
      label: 'Automated Testing & Reliability',
      description: 'Demonstrated experience authoring unit, integration, or contract tests using modern test frameworks.',
      weight: 20,
    },
  ],
};

export interface SyntheticFixture {
  id: string;
  filename: string;
  fileSize: number;
  lastModified: number;
  pageCount: number;
  extractedText: string;
  isInvalid?: boolean;
  expectedCategory: 'strong' | 'partial' | 'limited' | 'invalid';
  mockEvaluation?: CandidateEvaluationResult;
}

export const SYNTHETIC_FIXTURES: SyntheticFixture[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    filename: 'Alex_Chen_Staff_Engineer_Resume.pdf',
    fileSize: 142000,
    lastModified: 1732400000000,
    pageCount: 2,
    expectedCategory: 'strong',
    extractedText: `Alex Chen
Senior Staff Software Engineer | San Francisco, CA | alex.chen@example.com

SUMMARY
Full-stack software architect with 8 years of experience building mission-critical enterprise applications. Specialist in TypeScript, Next.js App Router architecture, and production LLM integrations.

PROFESSIONAL EXPERIENCE
Lead AI Systems Architect | Apex Cloud Solutions (2022 - Present)
- Architected enterprise Next.js App Router portal handling over 1.2M monthly active sessions with TypeScript, React Server Components, and Tailwind CSS.
- Integrated Gemini and Claude models using structured JSON schemas and Zod validation, cutting prompt parsing failures to zero across 4M daily queries.
- Developed client-side PDF document parsing engine utilizing pdfjs-dist and Web Workers, offloading compute from backend servers and saving $45k annually.
- Mentored a team of 10 engineers in test-driven development, achieving 92% code coverage with Vitest and Playwright regression suites.

Senior Full-Stack Engineer | DataStream Inc (2019 - 2022)
- Replatformed legacy dashboard to TypeScript and Next.js, improving Core Web Vitals (LCP) from 4.2s to 1.1s.
- Authored automated end-to-end testing pipeline reducing deployment rollback rate by 75%.
- Implemented real-time streaming data ingestion with robust error recovery.

TECHNICAL SKILLS
Languages & Frameworks: TypeScript, JavaScript, Next.js (App Router), React, Tailwind CSS, Node.js
AI & Data: Google Gemini SDK, OpenAI API, Structured Schema Validation, Prompt Engineering
Browser & Testing: PDF.js, Web Workers, Vitest, Playwright, Jest, CI/CD GitHub Actions`,
    mockEvaluation: {
      candidate_id: '11111111-1111-4111-8111-111111111111',
      status: 'complete',
      summary: 'Candidate demonstrates 8 years of full-stack engineering with direct, documented leadership across Next.js App Router, structured LLM API integrations, PDF.js web workers, and Vitest test suites.',
      criteria: [
        {
          criterion_id: 'c1',
          evidence_level: 'clear',
          quotes: [
            'Architected enterprise Next.js App Router portal handling over 1.2M monthly active sessions with TypeScript, React Server Components, and Tailwind CSS.',
          ],
          explanation: 'Direct evidence of architecting enterprise applications using TypeScript and Next.js App Router with high traffic scale.',
        },
        {
          criterion_id: 'c2',
          evidence_level: 'clear',
          quotes: [
            'Integrated Gemini and Claude models using structured JSON schemas and Zod validation, cutting prompt parsing failures to zero across 4M daily queries.',
          ],
          explanation: 'Demonstrated direct production experience integrating Gemini with structured JSON schemas and Zod.',
        },
        {
          criterion_id: 'c3',
          evidence_level: 'clear',
          quotes: [
            'Developed client-side PDF document parsing engine utilizing pdfjs-dist and Web Workers, offloading compute from backend servers and saving $45k annually.',
          ],
          explanation: 'Explicit documented implementation of client-side PDF parsing using pdfjs-dist and Web Workers.',
        },
        {
          criterion_id: 'c4',
          evidence_level: 'clear',
          quotes: [
            'Mentored a team of 10 engineers in test-driven development, achieving 92% code coverage with Vitest and Playwright regression suites.',
          ],
          explanation: 'Clear evidence of establishing high-coverage test suites using Vitest and Playwright.',
        },
      ],
      evidence_score: 100,
      missing_information: [],
      interview_questions: [
        'How did you structure the error handling and retry mechanisms when integrating Gemini API with Zod validation in production?',
        'Can you walk through how you configured PDF.js worker threads to prevent main thread UI blocking during large document extraction?',
        'What architectural trade-offs did you encounter when migrating client components to React Server Components in Next.js App Router?',
      ],
    },
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    filename: 'Jordan_Taylor_FullStack_Resume.pdf',
    fileSize: 118000,
    lastModified: 1732401000000,
    pageCount: 2,
    expectedCategory: 'partial',
    extractedText: `Jordan Taylor
Full-Stack Web Developer | Chicago, IL | jtaylor@example.org

PROFESSIONAL SUMMARY
Full-Stack Developer with 5 years of commercial experience in React, Node.js, and TypeScript. Interested in expanding into generative AI tooling.

EXPERIENCE
Full-Stack Engineer | Omnitech Labs (2021 - Present)
- Developed customer analytics dashboards using React, TypeScript, and Express.
- Experimented with OpenAI completions API for internal Slack bot prototyping.
- Wrote unit tests for core financial calculation logic using Jest.
- Maintained legacy document download services generating PDF reports on backend.

Web Developer | Crescent Media (2019 - 2021)
- Built interactive marketing websites with JavaScript and CSS.
- Participated in bi-weekly sprint planning and code reviews.

SKILLS
TypeScript, React, Node.js, Express, Jest, REST APIs, HTML/CSS, Git`,
    mockEvaluation: {
      candidate_id: '22222222-2222-4222-8222-222222222222',
      status: 'complete',
      summary: 'Candidate has 5 years of web development with TypeScript, React, and Jest, but shows only internal prototype exposure to LLMs and no documented client-side PDF extraction experience.',
      criteria: [
        {
          criterion_id: 'c1',
          evidence_level: 'limited',
          quotes: [
            'Developed customer analytics dashboards using React, TypeScript, and Express.',
          ],
          explanation: 'Documented TypeScript and React experience, but lacks Next.js App Router or architectural scale evidence.',
        },
        {
          criterion_id: 'c2',
          evidence_level: 'limited',
          quotes: [
            'Experimented with OpenAI completions API for internal Slack bot prototyping.',
          ],
          explanation: 'Prototype exploration of OpenAI API documented, but lacks production schema enforcement or Gemini experience.',
        },
        {
          criterion_id: 'c3',
          evidence_level: 'none',
          quotes: [],
          explanation: 'No evidence found for client-side document extraction, pdfjs-dist, or Web Workers.',
        },
        {
          criterion_id: 'c4',
          evidence_level: 'limited',
          quotes: [
            'Wrote unit tests for core financial calculation logic using Jest.',
          ],
          explanation: 'Mentions unit testing with Jest, but lacks documentation of comprehensive integration or contract testing suites.',
        },
      ],
      evidence_score: 40,
      missing_information: [
        'No documented experience with Next.js App Router architecture.',
        'No production experience with structured LLM output schemas or prompt validation.',
        'No documented experience with client-side PDF text extraction or Web Workers.',
      ],
      interview_questions: [
        'How would you transition from standard React/Express to Next.js App Router server and client components?',
        'In your OpenAI Slack bot prototype, how did you handle unexpected model outputs or rate limits?',
        'Have you worked with browser-based document parsing or Web Workers for heavy computational tasks?',
      ],
    },
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    filename: 'Casey_Morgan_Junior_Developer_Resume.pdf',
    fileSize: 95000,
    lastModified: 1732402000000,
    pageCount: 1,
    expectedCategory: 'limited',
    extractedText: `Casey Morgan
Junior Frontend Developer | Austin, TX | casey.m@example.com

EDUCATION
B.S. in Computer Science, University of Texas at Austin (2023)

PROJECTS
Personal Portfolio & Blog (2023)
- Built personal portfolio site using React and Tailwind CSS.
- Hosted on Vercel with automated GitHub deployments.

E-Commerce Mock Store (2023)
- Developed shopping cart prototype with JavaScript and CSS.
- Used mock JSON server to display product catalogs.

SKILLS
HTML, CSS, JavaScript, React basics, Git, Figma`,
    mockEvaluation: {
      candidate_id: '33333333-3333-4333-8333-333333333333',
      status: 'complete',
      summary: 'Early career graduate with basic React portfolio projects. Shows no documented evidence for Next.js App Router architecture, LLM integrations, client-side PDF extraction, or automated testing.',
      criteria: [
        {
          criterion_id: 'c1',
          evidence_level: 'limited',
          quotes: [
            'Built personal portfolio site using React and Tailwind CSS.',
          ],
          explanation: 'Basic React portfolio project documented, but no TypeScript, Next.js App Router, or production experience.',
        },
        {
          criterion_id: 'c2',
          evidence_level: 'none',
          quotes: [],
          explanation: 'No evidence found regarding LLM integrations or AI APIs.',
        },
        {
          criterion_id: 'c3',
          evidence_level: 'none',
          quotes: [],
          explanation: 'No evidence found for client-side document extraction or PDF parsing.',
        },
        {
          criterion_id: 'c4',
          evidence_level: 'none',
          quotes: [],
          explanation: 'No automated testing or reliability experience documented.',
        },
      ],
      evidence_score: 15,
      missing_information: [
        'No professional software engineering experience.',
        'No documented experience with TypeScript or Next.js.',
        'No documented experience with LLM/AI APIs.',
        'No documented experience with automated test frameworks.',
      ],
      interview_questions: [
        'Can you describe your experience learning TypeScript and how type safety affects your development process?',
        'What steps would you take to learn and implement automated unit tests in your React projects?',
        'Have you explored Next.js or server-side rendering in any coursework or personal projects?',
      ],
    },
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    filename: 'Scanned_Image_Only_Resume.pdf',
    fileSize: 850000,
    lastModified: 1732403000000,
    pageCount: 1,
    isInvalid: true,
    expectedCategory: 'invalid',
    extractedText: '   [SCANNED IMAGE ONLY - NO EXTRACTABLE TEXT FOUND]   ',
    mockEvaluation: {
      candidate_id: '44444444-4444-4444-8444-444444444444',
      status: 'manual_review',
      error_message: 'Insufficient readable text extracted (heuristic threshold not met). Document appears to be a scanned image or empty PDF.',
    },
  },
];
