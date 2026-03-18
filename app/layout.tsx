import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import { PWASetup } from "@/components/features/PWASetup";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title:       "MyWrapper Technologies — AI 客服控制台",
  description: "MyWrapper Technologies AI Agent 管理平台",
  manifest:    "/manifest.json",
  themeColor:  "#1a56db",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body className={`${inter.variable} antialiased`}>
        <AuthProvider>
          <PWASetup />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
