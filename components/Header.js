import React, { useEffect, useState } from 'react';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header className="cop-header" id="cop-header">
    <div className="cop-logo">
        <a href="/">
            <img src="/wp-content/uploads/MAIN-LOGO-COP.svg" alt="Co-Ownership Property" />
        </a>
    </div>
    <nav className="cop-nav" id="cop-nav">
        <a href="/" className="cop-nav-active">Home</a>
        <a href="/our-homes/">Our Homes</a>
        <a href="/how-it-works/">How It Works</a>
        <a href="/about-us/">About Us</a>
        <a href="/all-our-blog/">Our Blog</a>
        <a href="/favourites" className="cop-nav-favourites">My Favourites</a>
        <a href="/contact">Contact</a>
    </nav>
    <button className="cop-hamburger" id="cop-hamburger" aria-label="Toggle menu">
        <span></span><span></span><span></span>
    </button>
</header>
    </>
  );
}
