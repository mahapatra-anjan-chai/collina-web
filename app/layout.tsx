import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Collina — Team Balancer",
  description: "Balanced teams. Every game.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Collina",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${geist.className} min-h-full bg-zinc-950 text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
