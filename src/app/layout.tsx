import type { Metadata } from "next";
import "./globals.css";
import { Mulish } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NewButton } from "@/components/NewButton";

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
                <div className="flex items-center justify-between lg:block">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between grow">
                    <h1 className="text-2xl font-bold">80k AI insights</h1>
                    <p className="text-base text-white/60 mt-2 max-w-[80%] lg:mt-0 lg:max-w-none">
                      AI search citing 80,000 Hours research
                    </p>
                  </div>
                  <NewButton />
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
