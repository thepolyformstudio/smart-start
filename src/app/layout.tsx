import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { ToastProvider } from '@/components/ui/toast'

export const metadata: Metadata = {
  title: 'Smart Start - Your Personal Study Companion',
  description: 'Plan, Learn, and Achieve with Smart Start. Track your study progress, manage subjects, build better study habits, and prepare for exams effectively.',
  keywords: ['study planner', 'student productivity', 'study tracker', 'exam preparation', 'revision schedule'],
  authors: [{ name: 'Smart Start' }],
  openGraph: {
    title: 'Smart Start - Your Personal Study Companion',
    description: 'Plan, Learn, and Achieve with Smart Start.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F0F2FF' },
    { media: '(prefers-color-scheme: dark)', color: '#0F0F1A' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var theme = localStorage.getItem('smart-start-theme');
                if (!theme) theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                document.documentElement.classList.toggle('dark', theme === 'dark');
              })();
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }

              // Study reminder scheduler
              (function() {
                function checkReminder() {
                  if (localStorage.getItem('smart-start-reminder-enabled') !== 'true') return;
                  if (Notification.permission !== 'granted') return;
                  var time = localStorage.getItem('smart-start-reminder-time') || '19:00';
                  var now = new Date();
                  var h = now.getHours().toString().padStart(2, '0');
                  var m = now.getMinutes().toString().padStart(2, '0');
                  var currentTime = h + ':' + m;
                  var lastShown = localStorage.getItem('smart-start-reminder-last');
                  var today = now.toISOString().split('T')[0];
                  if (currentTime === time && lastShown !== today) {
                    new Notification('Smart Start \\u{1F4DA}', { body: 'Time to study! Open Smart Start and start your session.', icon: '/icons/icon-192x192.png' });
                    localStorage.setItem('smart-start-reminder-last', today);
                  }
                }
                setInterval(checkReminder, 60000);
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased bg-bg-light dark:bg-bg-dark text-text-primary-light dark:text-text-primary-dark min-h-screen">
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
