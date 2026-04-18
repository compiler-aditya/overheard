import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Overheard",
  description: "The world has overheard if you listen.",
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
            <h1 className="font-serif text-2xl tracking-wide">Overheard</h1>
            <p className="text-sm opacity-70">The world has overheard if you listen.</p>
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
