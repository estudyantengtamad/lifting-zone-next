import './globals.css'
import { Montserrat, Inter, Fraunces } from 'next/font/google'
import SmoothScroll from '../components/SmoothScroll'

import type { Viewport } from 'next'

const mont = Montserrat({ subsets: ['latin'], variable: '--font-mont' })
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', axes: ['opsz', 'SOFT', 'WONK'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#050806'
}

export const metadata = {
  title: 'Lifting Zone Obrero — Editorial & High Performance',
  description: 'Authentic supplements, architectural iron & commercial gym equipment in Butuan City.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('lz-theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var theme=t==='light'||t==='dark'?t:(d?'dark':'light');if(!t)theme='dark';document.documentElement.setAttribute('data-theme',theme);if(theme==='dark')document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark');}catch(e){}})();`
          }}
        />
      </head>
      <body className={`${mont.variable} ${inter.variable} ${fraunces.variable} antialiased`}>
        <SmoothScroll>
          {children}
        </SmoothScroll>
      </body>
    </html>
  )
}
