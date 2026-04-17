
        {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                {"@type":"Question","name":"What is fractional co-ownership?","acceptedAnswer":{"@type":"Answer","text":"Fractional co-ownership is the purchase of a deeded freehold share in a property — typically 1/8 or 1/4. You own your share outright, registered through a property-specific LLC, and can use the property for your allocated time each year (usually 45–90 days). It's genuine property ownership."}},
                {"@type":"Question","name":"How is it different from timeshare?","acceptedAnswer":{"@type":"Answer","text":"Co-ownership gives you a registered deed — real property that appreciates. Timeshare is a usage contract that typically depreciates. You can resell co-ownership shares freely; timeshare resales are notoriously difficult."}},
                {"@type":"Question","name":"What is the LLC structure?","acceptedAnswer":{"@type":"Answer","text":"Each property is held in its own LLC. When you buy a share, you purchase membership units in that LLC, giving you legal ownership proportional to your share size with liability protection."}},
                {"@type":"Question","name":"How much time can I use the property each year?","acceptedAnswer":{"@type":"Answer","text":"A 1/8 share gives you approximately 45 days per year. A 1/4 share provides about 90 days. A fair rotation calendar ensures equal distribution of peak and off-peak dates."}},
                {"@type":"Question","name":"Can I sell my share?","acceptedAnswer":{"@type":"Answer","text":"Yes. You can resell on the open market at any time, subject to a right-of-first-refusal clause for co-owners."}},
                {"@type":"Question","name":"Can I earn rental income from my share?","acceptedAnswer":{"@type":"Answer","text":"On many properties, yes. You can rent unused weeks and earn income, with management handling the process."}},
                {"@type":"Question","name":"What about home swapping?","acceptedAnswer":{"@type":"Answer","text":"Most properties offer a home exchange system. You can swap your allocated time at one property for time at another destination."}},
                {"@type":"Question","name":"What costs are shared among owners?","acceptedAnswer":{"@type":"Answer","text":"All running costs are divided proportionally: property taxes, insurance, utilities, maintenance, repairs, cleaning, and professional property management."}},
                {"@type":"Question","name":"Are there legal restrictions?","acceptedAnswer":{"@type":"Answer","text":"Non-residents face usage limits. Post-Brexit, UK citizens can spend 90 days per 180-day period across the EU. A 1/8 or 1/4 share fits within these limits."}},
                {"@type":"Question","name":"Can I transfer my share to family?","acceptedAnswer":{"@type":"Answer","text":"Yes. Your deeded share is a genuine asset you can pass to children or heirs. The LLC structure makes transfers straightforward."}}
            ]
        }
        


        /* ── Shared header JS ──────────────────────────────────────── */
(function () {
    var header = document.getElementById('cop-header');
    var btn    = document.getElementById('cop-hamburger');
    var nav    = document.getElementById('cop-nav');
    if (!header || !btn || !nav) return;


    // Mobile hamburger toggle
    btn.addEventListener('click', function () {
        nav.classList.toggle('active');
        btn.classList.toggle('open');
    });
    nav.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
            nav.classList.remove('active');
            btn.classList.remove('open');
        });
    });
}());
        /* Newsletter: handled by React component */
        /* Destination dropdown: handled by React component */

/* Expert form: handled by React component */
        document.querySelectorAll('a[href^="#"]').forEach(a => { a.addEventListener('click', function(e) { e.preventDefault(); const t = document.querySelector(this.getAttribute('href')); if (t) t.scrollIntoView({ behavior:'smooth' }); }); });
    