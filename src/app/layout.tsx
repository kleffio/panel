import type { Metadata } from "next";
import { Providers } from "./providers";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Kleff Panel",
    template: "%s — Kleff",
  },
  description: "Kleff game server management panel",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
          <Toaster position="bottom-right" richColors theme="dark" />
        </Providers>
      </body>
    </html>
  );
}
