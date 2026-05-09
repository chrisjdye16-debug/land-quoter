import "./globals.css";
import Link from "next/link";

export const metadata = { title: "Land Quoter", description: "Estimates + CRM for land developers" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto max-w-6xl px-4 py-6">
          <header className="mb-6 flex items-center justify-between border-b border-stone-200 pb-4">
            <Link href="/" className="text-xl font-bold tracking-tight">
              🏗️ Land Quoter
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/" className="hover:underline">Leads</Link>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
