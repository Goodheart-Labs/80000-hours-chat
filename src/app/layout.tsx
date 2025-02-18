import type { Metadata } from "next";
import "./globals.css";
import { Mulish } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";

const fontSans = Mulish({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Career AI",
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
          <div className="grid grid-rows-[auto_minmax(0,1fr)]">
            <header className="bg-slate-700 text-white p-4">
              <div className="container mx-auto">
                <div className="grid md:flex md:items-center md:gap-2 md:justify-between">
                  <h1 className="text-2xl font-bold">Career AI</h1>
                  <p className="text-base text-white/60">
                    AI-powered career guidance based on 80,000 Hours research
                  </p>
                </div>
              </div>
            </header>
            {children}
          </div>
        </TooltipProvider>
      </body>
    </html>
  );
}
