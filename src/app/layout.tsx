import type { Metadata, Viewport } from 'next'
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

// cover: draw under the notch and home bar, then pad back in with
// env(safe-area-inset-*). resizes-content: on Android the keyboard shrinks the
// layout viewport, so an h-dvh chat keeps its composer above the keyboard.
export const viewport: Viewport = {
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${silkscreen.variable} ${plexSans.variable} ${plexMono.variable}`}
    >
      <head>
        {/* Same trick next-themes uses for the `dark` class: set it before the
            first paint, or the backdrop animates for a frame on every load. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('pixelchat-motion')==='off')document.documentElement.classList.add('reduce-motion')}catch(e){}`,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  )
}
