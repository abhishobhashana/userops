import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { SmoothScroll } from "@/components/providers/smooth-scroll";
import "@material-symbols/font-400";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://userops.vercel.app"),

  title: {
    default: "UserOps — User Operations Platform",
    template: "%s — UserOps",
  },

  description:
    "UserOps is a role-based user operations platform for managing users, access, activity, analytics, and audit trails.",

  applicationName: "UserOps",

  authors: [
    {
      name: "Abhi Shobhashana",
    },
  ],

  creator: "Abhi Shobhashana",

  keywords: [
    "UserOps",
    "user operations",
    "user management",
    "role based access control",
    "RBAC",
    "user analytics",
    "audit logs",
    "access management",
  ],

  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "UserOps",
    title: "UserOps — User Operations Platform",
    description:
      "Manage users, access, activity, analytics, and audit trails from one operational workspace.",
    url: "https://userops.vercel.app",
  },

  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetBrainsMono.variable} text-base font-medium tracking-tight`}
    >
      <body>
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
