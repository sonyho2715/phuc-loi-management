import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'vietnamese'],
});

export const metadata: Metadata = {
  title: {
    default: 'Phúc Lợi Management - Quản lý kinh doanh xi măng',
    template: '%s | Phúc Lợi',
  },
  description: 'Hệ thống quản lý kinh doanh xi măng rời cho Công ty TNHH Phúc Lợi - Hải Phòng',
  keywords: ['xi măng', 'quản lý', 'công nợ', 'bê tông', 'Hải Phòng'],
  authors: [{ name: 'Phúc Lợi' }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
