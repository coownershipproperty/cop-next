export default function ExpertForm() {
  return (
    <section className="expert-section" id="speak-to-expert">
      <div className="expert-inner">
        <p className="expert-eyebrow">Get in Touch</p>
        <h2 className="expert-heading">Speak to an <em>expert</em></h2>
        <p className="expert-sub">Tell us what you&apos;re looking for and one of our co-ownership specialists will be in touch within 24 hours.</p>
        <form className="expert-form" id="expert-enquiry-form" noValidate>
          <div className="expert-form-grid">
            <div className="expert-form-field">
              <label htmlFor="ef-name">Name <span>*</span></label>
              <input type="text" id="ef-name" name="name" placeholder="Your full name" required />
            </div>
            <div className="expert-form-field">
              <label htmlFor="ef-email">Email <span>*</span></label>
              <input type="email" id="ef-email" name="email" placeholder="your@email.com" required />
            </div>
            <div className="expert-form-field">
              <label htmlFor="ef-phone">Phone</label>
              <input type="tel" id="ef-phone" name="phone" placeholder="+44 or +1..." />
            </div>
            <div className="expert-form-field">
              <label htmlFor="ef-budget">Approximate Budget</label>
              <select id="ef-budget" name="budget">
                <option value="">Select range</option>
                <option value="under-100k">Under €100,000</option>
                <option value="100-250k">€100,000 – €250,000</option>
                <option value="250-500k">€250,000 – €500,000</option>
                <option value="500k-plus">€500,000+</option>
              </select>
            </div>
            <div className="expert-form-field expert-form-field--wide">
              <label htmlFor="ef-message">Message</label>
              <textarea id="ef-message" name="message" rows={4} placeholder="Tell us about the destination, property type, or anything else..."></textarea>
            </div>
          </div>
          <button type="submit" className="expert-submit-btn">Send Enquiry</button>
          <p className="expert-form-msg" id="expert-form-msg"></p>
        </form>
      </div>
    </section>
  );
}
