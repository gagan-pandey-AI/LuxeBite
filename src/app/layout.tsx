import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LuxeBite — An Experience Beyond Taste",
  description:
    "A neighborhood table for the beautifully curious. Discover seasonal cooking, thoughtful hospitality, and evenings worth lingering over at LuxeBite, New York.",
  applicationName: "LuxeBite",
  openGraph: {
    title: "LuxeBite — An Experience Beyond Taste",
    description:
      "Seasonal cooking, thoughtful hospitality, and evenings worth lingering over in New York.",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
