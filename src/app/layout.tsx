import "./globals.css";

export const metadata = {
  title: "Land Quoter",
  description: "Fast, confident dirt estimates for land developers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="font-sans">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#fbfaf7" />
      </head>
      <body>
        <div className="bg-paper relative min-h-dvh">
          <div className="mx-auto max-w-md px-5 pb-20 pt-7 sm:max-w-2xl sm:px-8 sm:pt-10">
            <header className="mb-8 flex items-center justify-between">
              <a href="#/" className="flex items-center gap-2.5">
                <span
                  className="grid h-9 w-9 place-items-center rounded-xl text-sm font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, #0e4d3e, #064e3b)" }}
                >
                  LQ
                </span>
                <span className="font-display text-xl font-semibold tracking-tight text-stone-900">
                  Land Quoter
                </span>
              </a>
              <nav className="flex items-center gap-1 text-sm">
                <a
                  href="#/"
                  className="rounded-lg px-3 py-1.5 font-medium text-stone-700 hover:bg-stone-100"
                >
                  Quote
                </a>
                <a
                  href="#/saved"
                  className="rounded-lg px-3 py-1.5 font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                >
                  Saved
                </a>
              </nav>
            </header>
            {children}
            <footer className="mt-16 flex items-center justify-between border-t border-stone-200 pt-5 text-[11px] text-stone-400">
              <span>Land Quoter</span>
              <span>Local-only · Your data never leaves this device</span>
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
