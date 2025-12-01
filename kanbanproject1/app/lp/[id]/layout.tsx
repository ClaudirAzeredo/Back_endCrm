import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Landing Page - UniCRM",
  description: "Página de captação de leads",
}

export default function LandingPageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
