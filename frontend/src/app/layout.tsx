import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AptiRush | Mindful Aptitude Duels & Competitive Cognitive Training",
  description: "Real-time 1v1 aptitude battles, AI-powered syllabus question banks, synchronized cohort examinations, and deep placement analytics.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <head>
        <link href="https://fonts.googleapis.com" rel="preconnect"/>
        <link crossOrigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet"/>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      </head>
      <body className="bg-surface font-body-md text-on-surface min-h-screen relative antialiased">{children}</body>
    </html>
  );
}
