import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "JobOS — 就活・転職活動管理ツール",
  description: "応募した求人をカンバンボードで一元管理し、Gmailと連携して選考状況を自動追跡する転職活動サポートツール。",
  metadataBase: new URL('https://job-os-mvp.vercel.app'),
  openGraph: {
    title: "JobOS — 就活・転職活動管理ツール",
    description: "応募した求人をカンバンボードで一元管理し、Gmailと連携して選考状況を自動追跡するツール。",
    url: 'https://job-os-mvp.vercel.app',
    siteName: 'JobOS',
    locale: 'ja_JP',
    type: 'website',
  },
  verification: {
    google: 'SwNiERQQlsjz1WsqXEAi1U1BkSzh865rd0jgpNRgpuY',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
