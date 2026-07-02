import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  preload: false,
});

export const metadata: Metadata = {
  title: "POS Inflix - Point of Sale System",
  description: "Modern point of sale system for your business",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('app-theme');if(t==='emerald'||t==='violet')document.documentElement.setAttribute('data-theme',t);})();`,
          }}
        />
      </head>
      <body className={`${roboto.className} font-medium`} suppressHydrationWarning>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
