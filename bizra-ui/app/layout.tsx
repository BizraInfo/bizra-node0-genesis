import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { ErrorBoundary } from "@/components/error-boundary"
import "./globals.css"

export const metadata: Metadata = {
  title: "BIZRA — Expanding Human Consciousness Through Technology",
  description:
    "A decentralized ecosystem that expands human consciousness through cryptographically verifiable impact. Where ancient wisdom meets cutting-edge technology.",
  generator: "v0.app",
  keywords: [
    "consciousness",
    "decentralized",
    "sacred geometry",
    "blockchain",
    "human potential",
    "cryptographic verification",
  ],
  authors: [{ name: "BIZRA" }],
  openGraph: {
    title: "BIZRA — Expanding Human Consciousness Through Technology",
    description:
      "A decentralized ecosystem that expands human consciousness through cryptographically verifiable impact. Where ancient wisdom meets cutting-edge technology.",
    type: "website",
    url: "https://v0-bizra-apex-hud.vercel.app",
    siteName: "BIZRA APEX HUD",
  },
  twitter: {
    card: "summary_large_image",
    title: "BIZRA — Expanding Human Consciousness Through Technology",
    description:
      "A decentralized ecosystem that expands human consciousness through cryptographically verifiable impact.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add verification codes as needed
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <ErrorBoundary>
          <Suspense fallback={null}>{children}</Suspense>
          <Analytics />
        </ErrorBoundary>
      </body>
    </html>
  )
}
