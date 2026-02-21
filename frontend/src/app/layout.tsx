import type { Metadata } from "next";
import { SettingsProvider } from "./context/SettingsContext";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
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
        <AuthProvider>
          <SettingsProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
