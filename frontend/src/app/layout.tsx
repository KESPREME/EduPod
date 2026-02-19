import type { Metadata } from "next";
import { SettingsProvider } from "./context/SettingsContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduPod - Learn Better",
  description: "Transform PDFs into immersive classroom experiences.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SettingsProvider>
          {children}
        </SettingsProvider>
      </body>
    </html>
  );
}
