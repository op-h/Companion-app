import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import PomodoroTimer from "@/components/PomodoroTimer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Study Companion",
  description: "Your personal study assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <PomodoroTimer />
      </body>
    </html>
  );
}
