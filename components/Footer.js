export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">

        <div className="footer-brand">
          <div className="footer-logo-text">Co-Ownership<br />Property</div>
          <p className="footer-tagline">The independent guide to luxury fractional ownership — Europe &amp; the USA.</p>
        </div>

        <div className="footer-col">
          <h4 className="footer-col-heading">Explore</h4>
          <ul>
            <li><a href="/our-homes/">All Properties</a></li>
            <li><a href="/spain-fractional-ownership-properties/">Spain</a></li>
            <li><a href="/france-fractional-ownership-properties/">France</a></li>
            <li><a href="/italy-fractional-ownership-properties/">Italy</a></li>
            <li><a href="/usa-fractional-ownership-properties/">USA</a></li>
            <li><a href="/austria-fractional-ownership-properties/">Austria</a></li>
            <li><a href="/germany-fractional-ownership-properties/">Germany</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-col-heading">Learn</h4>
          <ul>
            <li><a href="/how-it-works/">How It Works</a></li>
            <li><a href="/all-our-blog/">Our Blog</a></li>
            <li><a href="/about-us/">About Us</a></li>
            <li><a href="/buying-a-co-ownership-property-faqs/">FAQs</a></li>
            <li><a href="/privacy-policy/">Privacy Policy</a></li>
            <li><a href="/terms-and-conditions/">Terms &amp; Conditions</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-col-heading">Contact</h4>
          <ul>
            <li><a href="/contact/">Get in Touch</a></li>
            <li><a href="/favourites/">My Favourites</a></li>
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
