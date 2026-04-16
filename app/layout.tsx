import type { Metadata } from "next";
import { Orbitron } from "next/font/google";

import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
});

export const metadata: Metadata = {
  title: "Spaceship Experience",
  description: "A 3D spaceship experience built with Next.js and React Three Fiber.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${orbitron.variable} bg-black text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
