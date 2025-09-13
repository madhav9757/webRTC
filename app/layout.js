import './globals.css'

export const metadata = {
  title: 'P2P Video Call App',
  description: 'Secure peer-to-peer video calling application',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}