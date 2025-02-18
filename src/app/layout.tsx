import type { Metadata } from "next";
import "./globals.css";
import { Mulish } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";

const fontSans = Mulish({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Career AI",
  description: "Career AI",
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
            <header>
              <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold">Career AI</h1>
                <span>About</span>
              </div>
            </header>
            {children}
          </div>
        </TooltipProvider>
      </body>
    </html>
  );
}
