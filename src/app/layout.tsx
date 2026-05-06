import type { Metadata } from "next";
import "./globals.css";
import StudyDock from "@/components/StudyDock";

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
      <body>
        {children}
        <StudyDock />
      </body>
    </html>
  );
}
