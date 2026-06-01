import type { Metadata } from "next";
import { Inter, Pacifico } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const logoFont = Pacifico({ subsets: ["latin"], weight: "400", variable: "--font-logo" });

export const metadata: Metadata = {
  title: "ReelFlow | Automate Your Instagram Growth",
  description:
    "AI powered reels scheduling, DM automation and engagement tools. Built specifically for creators, digital strategists, and modern brands.",
  keywords: ["social media", "instagram", "reels", "dm automation", "growth tools", "scheduler"],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "ReelFlow",
    description: "Automate Your Instagram Growth with AI powered reels scheduling and DM automation.",
    siteName: "ReelFlow",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ReelFlow",
    description: "Automate Your Instagram Growth with AI powered reels scheduling and DM automation.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${logoFont.variable}`}>
      <body className="font-sans text-foreground">
        <Providers>
          {children}
          <Toaster
            richColors
            position="top-right"
            toastOptions={{
              style: {
                borderRadius: "12px",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
