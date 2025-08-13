import type { Metadata } from "next";
import { Figtree} from "next/font/google";
import "./globals.css";
import React from "react";

const figTree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "FCN playground",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <body
        className={`${figTree.variable} ${figTree.variable} antialiased`}
      >
      <div className="w-screen h-screen relative">
        {children}
      </div>
      </body>
    </html>
  );
}
