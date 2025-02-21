import type { Metadata } from "next";
import "./globals.css";
import { Mulish } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import Link from "next/link";
import { Plus } from "lucide-react";

const fontSans = Mulish({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "80k AI insights",
  description: "AI-powered career guidance based on 80,000 Hours research",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fontSans.variable} bg-slate-50`}>
      <body>
        <TooltipProvider>
          <div className="flex flex-col h-screen">
            {/* Header */}
            <header className="bg-slate-700 text-white p-4">
              <div className="container mx-auto">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">80k AI insights</h1>
                    <Link
                      href="/new"
                      className="md:hidden inline-flex items-center justify-center ml-4"
                    >
                      <Plus className="h-9 w-9 text-white/90 hover:text-white transition-colors" />
                    </Link>
                  </div>
                  <p className="text-base text-white/60 mt-2 max-w-[80%] md:mt-0 md:max-w-none">
                    AI search citing 80,000 Hours research
                  </p>
                </div>
              </div>
            </header>

            {/* Main three-column layout */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left sidebar */}
              <div className="w-80 p-4 hidden md:block md:pt-12">
                <Link
                  href="/new"
                  className="inline-flex items-center gap-2 px-12 py-2 rounded font-medium text-slate-600/75 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 w-full transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>New conversation</span>
                </Link>
              </div>

              {/* Main content */}
              <main className="flex-1 overflow-y-auto">{children}</main>

              {/* Right sidebar - visually integrated with main content */}
              <div className="w-64 hidden lg:block"></div>
            </div>
          </div>
        </TooltipProvider>
      </body>
    </html>
  );
}
