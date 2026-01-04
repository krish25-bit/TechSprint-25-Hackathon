import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { EmergencyProvider } from "@/context/EmergencyContext";
import { GoogleMapsProvider } from "@/context/GoogleMapsContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TechSprint Emergency System",
  description: "Smart Disaster & Emergency Response Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* 🔥 ORDER DOES NOT MATTER, BOTH MUST EXIST */}
        <GoogleMapsProvider>
          <EmergencyProvider>
            {children}
          </EmergencyProvider>
        </GoogleMapsProvider>
      </body>
    </html>
  );
}
