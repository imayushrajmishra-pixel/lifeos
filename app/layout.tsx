import type { Metadata } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeScript } from '@/components/theme-script';
import { MusicPlayerProvider } from '@/components/music-player-provider';
import './globals.css';

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
});

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: {
    default: 'Ayush — Building, learning, becoming',
    template: '%s — Ayush',
  },
  description: 'A personal digital life OS: projects, skills, and a growing record of what I\'m building and learning.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'Ayush',
    description: 'A personal digital life OS: projects, skills, and a growing record of what I\'m building and learning.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={`${display.variable} ${sans.variable} font-sans antialiased`}>
        <ThemeProvider><MusicPlayerProvider>{children}</MusicPlayerProvider></ThemeProvider>
      </body>
    </html>
  );
}
