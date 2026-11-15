"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart, useFavorites } from "@/lib/store";
import { useUIPrefs } from "@/lib/ui-prefs";
import { t } from "@/lib/translations";

export default function Header() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { count } = useCart();
  const { favorites } = useFavorites();
  const { theme, toggleTheme, lang, toggleLang } = useUIPrefs();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{ name: string; slug: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const tr = t[lang];

  // منع scrolling عند فتح الـ menu
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // autocomplete suggestions
  useEffect(() => {
    let cancelled = false;
    const searchSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (!cancelled) {
          const data = await res.json();
          setSuggestions(data.slice(0, 5));
          setShowSuggestions(true);
        }
      } catch {
        if (!cancelled) {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }
    };

    const debounce = setTimeout(searchSuggestions, 300);
    return () => {
      clearTimeout(debounce);
      cancelled = true;
    };
  }, [query]);

  // click-outside handler للـ search bar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchOpen && searchBarRef.current && !searchBarRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };

    if (searchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchOpen]);

  // Escape key support للـ mobile drawer
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (menuOpen) setMenuOpen(false);
        if (searchOpen) setSearchOpen(false);
      }
    };

    if (menuOpen || searchOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpen, searchOpen]);

  // الهيدر مخفي في صفحات الأدمن
  if (pathname.startsWith("/admin")) return null;

  const navItems = [
    { id: "home", label: tr.home, href: "/" },
    { id: "products", label: lang === "ar" ? "كل العطور" : "All Perfumes", href: "/products" },
    { id: "men", label: tr.men, href: "/products?category=men" },
    { id: "women", label: tr.women, href: "/products?category=women" },
    { id: "unisex", label: tr.unisex, href: "/products?category=unisex" },
    { id: "offers", label: tr.offers, href: "/products?filter=offers" },
    { id: "contact", label: tr.contactUs, href: "/contact" },
  ];

  const isActive = (item: (typeof navItems)[number]) => {
    if (item.id === "home") return pathname === "/";
    if (item.id === "products")
      return (
        pathname === "/products" &&
        !searchParams.get("category") &&
        !searchParams.get("filter")
      );
    if (item.id === "offers") return pathname === "/products" && searchParams.get("filter") === "offers";
    if (item.id === "contact") return pathname === "/contact";
    return pathname === "/products" && searchParams.get("category") === item.id;
  };

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    setSearchOpen(false);
    setMenuOpen(false);
    router.push(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
  }

  return (
    <header className="sticky top-0 z-40 bg-cream/95 dark:bg-[#0E0D0C]/95 backdrop-blur-md border-b border-line transition-colors duration-300">
      {/* Top micro banner */}
      <div className="bg-[#1F1D1A] dark:bg-[#080706] text-[#E8DFD3] dark:text-[#C8C2B8] text-[11px] sm:text-xs py-1.5 px-4 text-center tracking-widest uppercase flex items-center justify-center gap-2 font-medium border-b border-[#2A2621] dark:border-[#1A1714]">
        <span className="text-[#C8A97E] dark:text-[#D4AF37]">✦</span>
        <span>
          {lang === "ar"
            ? "كاش عند الاستلام • توصيل لكل محافظات مصر • عينات فاخرة مع كل طلب"
            : "Cash on Delivery • Nationwide Shipping • Free Luxury Samples With Every Order"}
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden p-2 text-ink hover:text-gold-dark transition-colors"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
            ) : (
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>

        {/* Brand Logo — مركزي الشكل */}
        <Link href="/" className="text-center group cursor-pointer">
          <span className="block font-display text-2xl sm:text-3xl tracking-[0.22em] text-ink group-hover:text-gold-dark dark:group-hover:text-[#D4AF37] transition-colors uppercase font-medium">
            {tr.brand}
          </span>
          <span className="block text-[9px] tracking-[0.3em] text-muted dark:text-[#9E9589] uppercase mt-0.5">
            {lang === "ar" ? "باريس • عطور النخبة الفاخرة" : "PARIS • HAUTE PARFUMERIE"}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-7">
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`text-xs tracking-widest uppercase transition-all duration-200 py-2 border-b-2 font-medium ${
                  active
                    ? "border-gold-dark dark:border-[#D4AF37] text-ink font-semibold"
                    : "border-transparent text-charcoal dark:text-[#A8A096] hover:text-ink dark:hover:text-[#FAF8F5] hover:border-gold dark:hover:border-[#D4AF37]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-charcoal dark:text-[#C8C2B8] hover:text-ink dark:hover:text-[#D4AF37] transition-colors rounded-full hover:bg-surface-2"
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? (
              <svg className="w-5 h-5 text-[#D4AF37] transition-transform hover:rotate-45" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2M5.6 5.6l1.4 1.4m10 10 1.4 1.4M3 12h2m14 0h2M5.6 18.4 7 17m10-10 1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 transition-transform hover:-rotate-12" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
              </svg>
            )}
          </button>

          {/* Search toggle */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 text-charcoal dark:text-[#C8C2B8] hover:text-ink dark:hover:text-[#FAF8F5] transition-colors rounded-full hover:bg-surface-2"
            aria-label="Search"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" />
            </svg>
          </button>

          {/* Language toggle */}
          <button
            onClick={toggleLang}
            className="px-2.5 py-1 text-xs tracking-wider font-semibold border border-line-2 dark:border-[#38322B] hover:border-ink dark:hover:border-[#D4AF37] text-charcoal dark:text-[#C8C2B8] hover:text-ink dark:hover:text-[#FAF8F5] transition-colors"
          >
            {lang === "en" ? "عربي" : "EN"}
          </button>

          {/* Wishlist */}
          <Link
            href="/favorites"
            className="p-2 transition-colors relative rounded-full hover:bg-surface-2 text-charcoal dark:text-[#C8C2B8] hover:text-ink dark:hover:text-[#FAF8F5]"
            aria-label={tr.favorites}
          >
            <svg className={`w-5 h-5 ${pathname === "/favorites" ? "fill-gold-dark dark:fill-[#D4AF37]" : ""}`} fill={pathname === "/favorites" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.6c0 5-7.5 9.4-9 9.4s-9-4.4-9-9.4a4.6 4.6 0 0 1 9-1.4 4.6 4.6 0 0 1 9 1.4Z" />
            </svg>
            {favorites.length > 0 && (
              <span className="absolute top-1 end-1 bg-gold-dark dark:bg-[#D4AF37] text-white dark:text-[#0E0D0C] text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {favorites.length}
              </span>
            )}
          </Link>

          {/* Cart */}
          <Link
            href="/cart"
            className="p-2 transition-colors relative rounded-full hover:bg-surface-2 text-charcoal dark:text-[#C8C2B8] hover:text-ink dark:hover:text-[#FAF8F5]"
            aria-label={tr.cart}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12l1.5 13.5a1 1 0 0 1-1 1.1H5.5a1 1 0 0 1-1-1.1L6 7Zm3 0V5a3 3 0 0 1 6 0v2" />
            </svg>
            {count > 0 && (
              <span className="absolute top-1 end-1 bg-[#1A1816] dark:bg-[#D4AF37] text-[#FAF9F6] dark:text-[#0E0D0C] text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Expandable Search Bar */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            ref={searchBarRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-line bg-surface-2 dark:bg-[#151311] py-3 px-4 sm:px-6 transition-colors relative z-50 overflow-hidden"
          >
            <form onSubmit={submitSearch} className="max-w-2xl mx-auto relative flex items-center">
              <svg className="w-4 h-4 text-muted absolute start-3 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tr.searchPlaceholder}
                autoFocus
                className="w-full bg-surface dark:bg-[#1C1916] border border-line-2 dark:border-[#38322B] px-10 py-2 text-sm text-ink dark:text-[#FAF8F5] placeholder:text-muted focus:outline-none focus:border-gold-dark dark:focus:border-[#D4AF37] transition-colors"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setSuggestions([]);
                    setShowSuggestions(false);
                  }}
                  className="absolute end-3 text-xs text-muted hover:text-ink"
                  aria-label="Clear"
                >
                  ✕
                </button>
              )}
            </form>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="max-w-2xl mx-auto mt-2 bg-surface dark:bg-[#1C1916] border border-line-2 dark:border-[#38322B] rounded-sm shadow-lg">
                {suggestions.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/products/${s.slug}`}
                    onClick={() => {
                      setSearchOpen(false);
                      setQuery("");
                      setSuggestions([]);
                      setShowSuggestions(false);
                    }}
                    className="block px-4 py-2 text-sm text-ink dark:text-[#FAF8F5] hover:bg-surface-2 dark:hover:bg-[#26211C] transition-colors"
                  >
                    {s.name}
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden border-t border-line bg-cream dark:bg-[#12100E] overflow-hidden transition-colors"
          >
            <div className="px-6 py-6 space-y-4">
              <nav className="flex flex-col gap-3">
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={`block py-3 text-sm uppercase tracking-widest font-medium transition-colors ${
                        isActive(item)
                          ? "text-gold-dark dark:text-[#D4AF37] font-bold"
                          : "text-charcoal dark:text-[#C8C2B8] hover:text-gold-dark dark:hover:text-[#D4AF37]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
