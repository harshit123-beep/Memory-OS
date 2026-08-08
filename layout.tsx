import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "MemoryOS | Organizational Memory Platform",
  description: "AI-powered exit interviews, knowledge audits, and automated SOP generation.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full bg-background text-foreground flex flex-col select-none">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
