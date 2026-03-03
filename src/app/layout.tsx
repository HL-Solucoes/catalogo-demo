import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Header } from "@/components/global/header";
import { MobileBottomNav } from "@/components/global/mobile-bottom-nav";
import { FloatingCart } from "@/components/global/floating-cart";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: {
    default: "No Limite do Laço | Atacado Country",
    template: "%s | No Limite do Laço",
  },
  description:
    "Catálogo digital de atacado de moda country e acessórios. Bonés, carteiras, camisas e muito mais.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          <main className="min-h-screen pb-20 md:pb-0">{children}</main>
          <MobileBottomNav />
          <FloatingCart />
        </ThemeProvider>
      </body>
    </html>
  );
}
