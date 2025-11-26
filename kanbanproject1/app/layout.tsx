import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "UniCRM - Plataforma de Gestão e Comunicação",
  description: "Plataforma completa de CRM com integração WhatsApp, gestão de leads e dashboard inteligente",
  generator: "v0.app",
  icons: {
    icon: "/unicrm-logo.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
