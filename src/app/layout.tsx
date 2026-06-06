import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mission Mahjong Tracker | Mahjong Scoring",
  description: "Mission Mahjong session tracking.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html 
      lang="en" 
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      {/* Adding 'bg-white' and 'selection' styles here ensures a 
          consistent look across every single route. 
      */}
      <body className="min-h-full flex flex-col bg-white selection:bg-emerald-100 selection:text-emerald-900">
        {children}
      </body>
    </html>
  );
}