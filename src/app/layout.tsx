import type { Metadata } from "next";
import { Lato } from "next/font/google";

import "./globals.scss";
import "./globals.css"; // Tailwind + shadcn tokens (scoped reset; MUI unaffected)
import Providers from "./providers";

// Brand font (old FE used Lato).
const lato = Lato({
  weight: ["300", "400", "700", "900"],
  subsets: ["latin"],
  variable: "--font-lato",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AZI Admin UI",
  description: "AdvanzInnovation Admin — migrated frontend (Next.js)",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={lato.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
