export default function Newsletter() {
  return (
    <section className="newsletter-section" id="newsletter">
      <h2 className="newsletter-heading">Be The First To Know</h2>
      <p className="newsletter-subtitle">Join our community for exclusive listings and destination insights delivered straight to your inbox.</p>
      <form className="newsletter-form" id="cop-newsletter-form" noValidate>
        <input type="email" name="email" placeholder="Enter your email address" required />
        <button type="submit" className="newsletter-btn">Join Newsletter</button>
      </form>
      <p className="newsletter-form-msg" id="newsletter-form-msg"></p>
    </section>
  );
}
