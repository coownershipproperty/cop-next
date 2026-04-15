export default function Footer() {
  return (
    <footer>
      <div className="footer-content">
        <div className="footer-logo">
          <a href="/" className="footer-logo-link" style={{textDecoration: 'none'}}>
            <div style={{fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontStyle: 'italic', color: '#fff', letterSpacing: '.02em', marginBottom: '6px', lineHeight: '1.2'}}>Co-Ownership<br />Properties</div>
          </a>
          <p className="footer-tagline" style={{fontSize: '.82rem', lineHeight: '1.7', color: 'rgba(255,255,255,.55)', maxWidth: '220px', marginBottom: '24px'}}>The independent guide to luxury fractional ownership — Europe &amp; the USA.</p>
          <div className="footer-social"></div>
        </div>
        <div className="footer-col">
          <h4>Explore</h4>
          <ul>
            <li><a href="/our-homes/">All Properties</a></li>
            <li><a href="/spain-fractional-ownership-properties/">Spain</a></li>
            <li><a href="/france-fractional-ownership-properties/">France</a></li>
            <li><a href="/italy-fractional-ownership-properties/">Italy</a></li>
            <li><a href="/usa-fractional-ownership-properties/">USA</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Learn</h4>
          <ul>
            <li><a href="/how-it-works/">How It Works</a></li>
            <li><a href="/all-our-blog/">Our Blog</a></li>
            <li><a href="/about-us/">About Us</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Contact</h4>
          <ul>
            <li><a href="/contact/">Get in Touch</a></li>
            <li><a href="/favourites/">My Favourites</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Legal</h4>
          <ul>
            <li><a href="/privacy-policy/">Privacy Policy</a></li>
            <li><a href="/terms-and-conditions/">Terms &amp; Conditions</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Co-Ownership Property. All rights reserved.</p>
      </div>
    </footer>
  );
}
