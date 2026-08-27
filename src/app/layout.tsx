import type { Metadata } from 'next'
import { IBM_Plex_Mono, IBM_Plex_Sans, Silkscreen } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

// Identity face. Reserved for the wordmark, headings and control labels -- a
// pixel face stops being readable at body sizes and at length.
const silkscreen = Silkscreen({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-silkscreen',
  display: 'swap',
})

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex-sans',
  display: 'swap',
})

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'PixelChat',
  description: 'Fast, simple, real-time chat.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${silkscreen.variable} ${plexSans.variable} ${plexMono.variable}`}
    >
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  )
}
