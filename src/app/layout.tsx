import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { Header } from "@/components/layout/Header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Transit Systems | Public Transit Information Database",
  description: "Comprehensive information about public transit systems worldwide including WMATA, Sound Transit, and BART.",
  keywords: ["transit", "metro", "subway", "WMATA", "Sound Transit", "BART", "public transportation"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <ThemeProvider>
          <Header />
          <main className="max-w-7xl mx-auto px-4 py-6">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
