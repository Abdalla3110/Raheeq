import type { Metadata } from "next";
import { Cairo, Amiri } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { CartProvider, FavoritesProvider, ComparisonProvider } from "@/lib/store";
import { UIPrefsProvider } from "@/lib/ui-prefs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/Toast";
import IntroScreen from "@/components/IntroScreen";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/constants";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
});

const amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-amiri",
});

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "متجر رحيق — عطور رجالية وحريميه وللجنسين بأرواق فاخرة. كاش عند الاستلام وتوصيل لكل المحافظات.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: SITE_NAME,
    description: SITE_TAGLINE,
    type: "website",
    locale: "ar_EG",
    siteName: SITE_NAME,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${amiri.variable}`} suppressHydrationWarning>
      <head>
        {/* منع وميض الثيم الغلط قبل تحميل React */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('misk-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <UIPrefsProvider>
          <CartProvider>
            <FavoritesProvider>
              <ComparisonProvider>
                <ToastProvider>
                  <ErrorBoundary>
                    <Suspense fallback={null}>
                      <IntroScreen />
                    </Suspense>
                    <Suspense fallback={null}>
                      <Header />
                    </Suspense>
                    <main className="flex-1">{children}</main>
                    <Footer />
                    <WhatsAppFloat />
                  </ErrorBoundary>
                </ToastProvider>
              </ComparisonProvider>
            </FavoritesProvider>
          </CartProvider>
        </UIPrefsProvider>
      </body>
    </html>
  );
}
