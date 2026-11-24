import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CandidateLens — AI-Assisted Resume Review',
  description: 'Recruiter-facing evidence-based resume comparison prototype powered by Gemini',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
