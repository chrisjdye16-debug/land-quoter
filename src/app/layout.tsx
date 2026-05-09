import "./globals.css";

export const metadata = { title: "Land Quoter", description: "Fast estimates for land developers" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="font-sans">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0c0a09" />
      </head>
      <body>
        <div className="bg-grid relative min-h-dvh">
          <div className="mx-auto max-w-md px-4 pb-16 pt-8 sm:max-w-lg sm:pt-12">
            <header className="mb-8 flex items-center justify-between">
              <a href="#/" className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-lg shadow-lg shadow-amber-900/20">
                  🏗️
                </span>
                <span className="font-display text-xl font-bold tracking-tight text-stone-50">
                  Land Quoter
                </span>
              </a>
              <nav className="flex gap-3 text-xs font-medium">
                <a href="#/" className="text-stone-300 hover:text-white">Quote</a>
                <a href="#/saved" className="text-stone-500 hover:text-white">Saved</a>
              </nav>
            </header>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
