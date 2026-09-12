import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Outfit, Prompt } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { NavigationLoadingProvider } from "@/components/loading_screen";
import { NotificationProvider } from "@/context/NotificationContext";
import { DAWH_LOGOS } from "@/config/brand";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const prompt = Prompt({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["thai", "latin"],
  variable: "--font-prompt",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#2C2C2C" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

const ICON_URL = DAWH_LOGOS.square2048.light;

export const metadata: Metadata = {
  title: "dawh",
  description:
    "dawh Enterprise Operations & Management Platform",
  icons: {
    icon: [
      {
        url: ICON_URL,
        sizes: "any",
        type: "image/png",
      },
      {
        url: "/icon.png?v=2",
        sizes: "any",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: ICON_URL,
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: [ICON_URL],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "dawh",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} ${prompt.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" href={ICON_URL} sizes="any" type="image/png" />
        <link rel="shortcut icon" href={ICON_URL} />
        <link rel="apple-touch-icon" href={ICON_URL} />
        <title>dawh</title>
      </head>
      <body className="min-h-full flex flex-col bg-[#2C2C2C] text-white antialiased transition-colors duration-300">
        <ThemeProvider>
          <NotificationProvider>
            <NavigationLoadingProvider>
              {children}
            </NavigationLoadingProvider>
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
