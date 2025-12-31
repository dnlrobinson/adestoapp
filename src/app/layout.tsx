import type { Metadata } from 'next'
import { AuthProvider } from '@/components/AuthProvider'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Adesto',
  description: 'Find your spaces and connect with communities',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50">
            {children}
          </div>
        </AuthProvider>
        <SpeedInsights />
      </body>
    </html>
  )
}

