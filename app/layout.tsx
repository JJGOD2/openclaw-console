import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import { PWASetup } from "@/components/features/PWASetup";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title:       "MyWrapper Technologies — AI 客服控制台",
  description: "MyWrapper Technologies AI Agent 管理平台",
  manifest:    "/manifest.json",
  themeColor:  "#1a56db",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <PWASetup />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
