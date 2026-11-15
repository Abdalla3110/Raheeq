"use client";

import { useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Heart, Instagram, Menu, Search, ShoppingBag, X } from "lucide-react";

const products = [
  { name: "Bleu de Chanel", type: "Eau de Parfum", price: "1,850 EGP", image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=700&q=85" },
  { name: "Miss Dior", type: "Eau de Parfum", price: "1,750 EGP", image: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=700&q=85" },
  { name: "Oud Wood", type: "Eau de Parfum", price: "2,200 EGP", image: "https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=700&q=85" },
  { name: "Signature Noir", type: "Eau de Parfum", price: "1,950 EGP", image: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=700&q=85" },
];

const collections = [
  { title: "PERFUMES", subtitle: "Find your signature scent", image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=1200&q=85" },
  { title: "BEAUTY", subtitle: "Glow with confidence", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1200&q=85" },
  { title: "NATURAL OILS", subtitle: "Pure from nature", image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=1200&q=85" },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [cartCount, setCartCount] = useState(0);

  const toggleFavorite = (index: number) => {
    setFavorites((current) => current.includes(index) ? current.filter((i) => i !== index) : [...current, index]);
  };

  return (
    <main className="site-shell">
      <video className="background-video" autoPlay muted loop playsInline preload="metadata" poster="/images/hero-poster.jpg">
        <source src="/videos/hero-smoke.mp4" type="video/mp4" />
      </video>
      <div className="video-overlay" />
      <div className="smoke-glow" />

      <header className="navbar">
        <a href="#" className="brand">
          <span className="brand-mark">♢</span>
          <span className="brand-name">NOIR</span>
          <span className="brand-sub">FRAGRANCES & BEAUTY</span>
        </a>

        <nav className={`nav-links ${menuOpen ? "open" : ""}`}>
          <a className="active" href="#home" onClick={() => setMenuOpen(false)}>Home</a>
          <a href="#shop" onClick={() => setMenuOpen(false)}>Shop</a>
          <a href="#perfumes" onClick={() => setMenuOpen(false)}>Perfumes</a>
          <a href="#beauty" onClick={() => setMenuOpen(false)}>Beauty</a>
          <a href="#oils" onClick={() => setMenuOpen(false)}>Oils</a>
          <a href="#offers" onClick={() => setMenuOpen(false)}>Offers</a>
        </nav>

        <div className="nav-actions">
          <button aria-label="Search"><Search size={19} strokeWidth={1.5} /></button>
          <button aria-label="Favorites" className="icon-count"><Heart size={20} strokeWidth={1.5} fill={favorites.length ? "currentColor" : "none"} /><span>{favorites.length}</span></button>
          <button aria-label="Cart" className="icon-count"><ShoppingBag size={20} strokeWidth={1.5} /><span>{cartCount}</span></button>
          <button className="menu-button" aria-label="Menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={22}/> : <Menu size={22}/>}</button>
        </div>
      </header>

      <section id="home" className="hero section-pad">
        <div className="hero-copy reveal">
          <p className="eyebrow">THE ESSENCE OF YOU</p>
          <h1>Luxury Scents<br />Beauty &amp; Natural Oils</h1>
          <p className="hero-description">Discover a world of exquisite fragrances, premium beauty products and pure natural oils — crafted for your unique story.</p>
          <a className="primary-button" href="#shop">Explore Collection <ArrowRight size={16}/></a>
          <a className="scroll-cue" href="#shop">SCROLL DOWN <ArrowRight size={14}/></a>
        </div>
        <div className="hero-number"><span>01</span><i /><span>04</span></div>
      </section>

      <section id="shop" className="products-section content-panel">
        <div className="section-heading">
          <div><p className="eyebrow">FEATURED PRODUCTS</p><h2>Best Sellers</h2></div>
          <a href="#">View All <ArrowRight size={16}/></a>
        </div>
        <div className="product-grid">
          {products.map((product, index) => (
            <article className="product-card" key={product.name}>
              <div className="product-image-wrap">
                <img src={product.image} alt={product.name} />
                <button className="favorite-button" onClick={() => toggleFavorite(index)} aria-label="Add to favorites">
                  <Heart size={18} fill={favorites.includes(index) ? "currentColor" : "none"}/>
                </button>
              </div>
              <div className="product-info">
                <h3>{product.name}</h3><p>{product.type}</p><strong>{product.price}</strong>
                <button className="add-button" onClick={() => setCartCount((n) => n + 1)}>ADD TO CART <ShoppingBag size={15}/></button>
              </div>
            </article>
          ))}
        </div>
        <div className="slider-controls"><button><ChevronLeft size={18}/></button><button><ChevronRight size={18}/></button></div>
      </section>

      <section className="collection-grid content-panel" id="perfumes">
        {collections.map((item, index) => (
          <a className="collection-card" id={index === 1 ? "beauty" : index === 2 ? "oils" : undefined} href="#shop" key={item.title}>
            <img src={item.image} alt={item.title}/><div className="collection-shade" />
            <div className="collection-copy"><h3>{item.title}</h3><p>{item.subtitle}</p><span>SHOP NOW <ArrowRight size={14}/></span></div>
          </a>
        ))}
      </section>

      <section id="offers" className="offer-banner content-panel">
        <div><p className="eyebrow">SPECIAL OFFER</p><h2>UP TO 30% OFF</h2><p>On selected perfumes &amp; beauty products</p><a className="primary-button" href="#shop">Shop The Sale <ArrowRight size={16}/></a></div>
        <div className="offer-image" />
      </section>

      <section className="instagram-section content-panel">
        <div className="section-heading"><div><p className="eyebrow">FOLLOW US</p><h2>On Instagram</h2></div><a href="#">Be part of our journey <Instagram size={16}/></a></div>
        <div className="instagram-grid">
          {[
            "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1487412912498-0447578fcca8?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1498842812179-c81beecf902c?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80",
          ].map((src, i) => <a href="#" key={i}><img src={src} alt="Noir Instagram"/></a>)}
        </div>
      </section>

      <footer className="footer content-panel">
        <div className="footer-brand"><span className="brand-mark">♢</span><span className="brand-name">NOIR</span><span className="brand-sub">FRAGRANCES & BEAUTY</span></div>
        <div><h4>Quick Links</h4><a href="#home">Home</a><a href="#shop">Shop</a><a href="#">About Us</a><a href="#">Contact</a></div>
        <div><h4>Categories</h4><a href="#perfumes">Perfumes</a><a href="#beauty">Beauty</a><a href="#oils">Oils</a><a href="#offers">Offers</a></div>
        <div className="newsletter"><h4>Subscribe to our newsletter</h4><p>Get the latest updates, offers and more.</p><form onSubmit={(e) => e.preventDefault()}><input type="email" placeholder="Your email address"/><button aria-label="Subscribe"><ArrowRight size={17}/></button></form><div className="socials"><Instagram size={17}/><span>f</span><span>♪</span><span>▶</span></div></div>
        <div className="footer-bottom"><span>© 2026 NOIR. All rights reserved.</span><span>Privacy Policy&nbsp;&nbsp;|&nbsp;&nbsp; Terms &amp; Conditions</span></div>
      </footer>
    </main>
  );
}
