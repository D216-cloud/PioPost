import type { Metadata } from "next";
import { Inter, Pacifico } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const logoFont = Pacifico({ subsets: ["latin"], weight: "400", variable: "--font-logo" });

export const metadata: Metadata = {
  title: "PinPost | Social Post Preview Platform",
  description:
    "Preview your content across Instagram, LinkedIn, X, and Facebook before publishing.",
  keywords: ["social media", "post preview", "instagram", "linkedin", "x", "facebook"],
  openGraph: {
    title: "PinPost",
    description: "See exactly how your post looks before the world does.",
    siteName: "PinPost",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PinPost",
    description: "Preview your content across every platform in one editor.",
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
