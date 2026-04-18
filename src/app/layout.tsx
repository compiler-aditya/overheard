import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Auris",
  description: "Photograph anything. Hear what it has to say.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          <header className="px-6 py-4 border-b border-ember/20">
            <h1 className="font-serif text-2xl tracking-wide">Auris</h1>
            <p className="text-sm opacity-70">Photograph anything. Hear what it has to say.</p>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="px-6 py-3 text-xs opacity-60 border-t border-ember/20">
            Built with Kiro + ElevenLabs · MIT
          </footer>
        </div>
      </body>
    </html>
  );
}
