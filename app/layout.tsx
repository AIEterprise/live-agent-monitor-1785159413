import type { Metadata } from 'next';
import './globals.css';
import SmoothScrollProvider from '@/components/SmoothScrollProvider';
import { Activity, Terminal, Cpu, Sliders, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Live Agent Monitor — Antigravity CLI',
  description: 'Real-time telemetry and execution monitoring for Google Antigravity CLI agents.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body suppressHydrationWarning>
        <SmoothScrollProvider>
          {/* Dark Aesthetic Header/Navbar */}
          <header className="sticky top-0 z-50 backdrop-blur-md bg-charcoal/90 border-b border-charcoal-border px-4 lg:px-8 py-3 transition-colors duration-200">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              {/* Left Brand Identity */}
              <div className="flex items-center space-x-3">
                <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-charcoal-card border border-charcoal-border shadow-inner">
                  <Activity className="w-5 h-5 text-sea" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-mint animate-pulse ring-2 ring-charcoal" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold tracking-wider text-sm uppercase text-offwhite">
                      Live Agent Monitor
                    </span>
                    <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-sea/10 text-sea font-mono border border-sea/20">
                      v1.0
                    </span>
                  </div>
                  <p className="text-xs text-offwhite-dim hidden sm:block">
                    Google Antigravity Agent Telemetry Engine
                  </p>
                </div>
              </div>

              {/* Center Navigation Shortcuts */}
              <nav className="hidden md:flex items-center space-x-1 bg-charcoal-card/80 p-1 rounded-lg border border-charcoal-border text-xs font-medium text-offwhite-muted">
                <a
                  href="#terminal"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md hover:text-offwhite hover:bg-charcoal-surface transition-colors"
                >
                  <Terminal className="w-3.5 h-3.5 text-sea" />
                  <span>Terminal</span>
                </a>
                <a
                  href="#telemetry"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md hover:text-offwhite hover:bg-charcoal-surface transition-colors"
                >
                  <Cpu className="w-3.5 h-3.5 text-mint" />
                  <span>Telemetry</span>
                </a>
                <a
                  href="#control"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md hover:text-offwhite hover:bg-charcoal-surface transition-colors"
                >
                  <Sliders className="w-3.5 h-3.5 text-sea-light" />
                  <span>Control</span>
                </a>
              </nav>

              {/* Right System Health Badge */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-xs bg-charcoal-card px-3 py-1.5 rounded-full border border-charcoal-border font-mono">
                  <ShieldCheck className="w-4 h-4 text-mint" />
                  <span className="text-offwhite-muted hidden sm:inline">Status:</span>
                  <span className="text-mint font-semibold">ACTIVE</span>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>

          {/* Dark Footer */}
          <footer className="border-t border-charcoal-border py-4 px-6 text-center text-xs text-offwhite-dim font-mono bg-charcoal-card/30">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
              <span>Google Antigravity CLI • Live Agent Monitor</span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-mint inline-block" />
                Real-Time Firebase Telemetry Stream
              </span>
            </div>
          </footer>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
