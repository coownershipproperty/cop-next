export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">

        {/* Brand */}
        <div className="footer-brand">
          <div className="footer-logo-text">Co-Ownership<br />Properties</div>
          <p className="footer-tagline">
            The independent guide to luxury fractional ownership across Europe &amp; the USA.
          </p>
          <div className="footer-social">
            <a href="https://www.facebook.com/coownershipproperties" aria-label="Facebook" className="footer-social-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
            </a>
            <a href="https://www.linkedin.com/company/co-ownership-property" aria-label="LinkedIn" className="footer-social-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>
            </a>
            <a href="https://twitter.com/coownershipProp" aria-label="X / Twitter" className="footer-social-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
          </div>
        </div>

        {/* Discover */}
        <div className="footer-col">
          <h4 className="footer-col-heading">Discover</h4>
          <ul>
            <li><a href="/our-homes/">All Properties</a></li>
            <li><a href="/how-it-works/">How It Works</a></li>
            <li><a href="/about-us/">About Us</a></li>
            <li><a href="/all-our-blog/">Our Blog</a></li>
            <li><a href="/favourites/">♥ My Favourites</a></li>
          </ul>
        </div>

        {/* Destinations */}
        <div className="footer-col">
          <h4 className="footer-col-heading">Destinations</h4>
          <ul>
            <li><a href="/spain-fractional-ownership-properties/">Spain</a></li>
            <li><a href="/france-fractional-ownership-properties/">France</a></li>
            <li><a href="/italy-fractional-ownership-properties/">Italy</a></li>
            <li><a href="/usa-fractional-ownership-properties/">USA</a></li>
            <li><a href="/portugal-fractional-ownership-properties/">Portugal</a></li>
            <li><a href="/austria-fractional-ownership-properties/">Austria</a></li>
          </ul>
        </div>

        {/* Company */}
        <div className="footer-col">
          <h4 className="footer-col-heading">Company</h4>
          <ul>
            <li><a href="/about-us/">About COP</a></li>
            <li><a href="/how-it-works/">How It Works</a></li>
            <li><a href="/all-our-blog/">Our Blog</a></li>
            <li><a href="/contact/">Contact</a></li>
          </ul>
        </div>

        {/* Support */}
        <div className="footer-col">
          <h4 className="footer-col-heading">Support</h4>
          <ul>
            <li><a href="/contact/">Get in Touch</a></li>
            <li><a href="/buying-a-co-ownership-property-faqs/">FAQ</a></li>
            <li><a href="/favourites/">Saved Properties</a></li>
          </ul>
        </div>

      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Co-Ownership Property. All rights reserved.</p>
        <p className="footer-bottom-right">Independent. Unbiased. Expert.</p>
      </div>
    </footer>
  );
}
