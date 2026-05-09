import "./globals.css";

export const metadata = { title: "Land Quoter", description: "Fast estimates for land developers" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto max-w-6xl px-4 py-6">
          <header className="mb-6 flex items-center justify-between border-b border-stone-200 pb-4">
            <a href="#/" className="text-xl font-bold tracking-tight">🏗️ Land Quoter</a>
            <nav className="flex gap-4 text-sm">
              <a href="#/" className="hover:underline">Quick Quote</a>
              <a href="#/saved" className="hover:underline text-stone-500">Saved Quotes</a>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
