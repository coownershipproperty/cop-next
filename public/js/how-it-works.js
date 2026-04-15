
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
        /* ── Newsletter form (shared partial) ──────────────────────── */
(function() {
    var form = document.getElementById('cop-newsletter-form');
    if (!form) return;
    var msg = document.getElementById('newsletter-form-msg');

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        var emailInput = form.querySelector('input[type="email"]');
        var btn = form.querySelector('.newsletter-btn');
        if (!emailInput.value) return;

        btn.disabled = true;
        btn.textContent = 'Subscribing\u2026';
        msg.className = 'newsletter-form-msg';
        msg.textContent = '';

        var data = new FormData();
        data.append('action', 'cop_newsletter_subscribe');
        data.append('email', emailInput.value);

        fetch('https://co-ownership-property.com/wp-admin/admin-ajax.php', {
            method: 'POST',
            body: data
        })
        .then(function(r) { return r.json(); })
        .then(function(res) {
            if (res.success) {
                msg.className = 'newsletter-form-msg success';
                msg.textContent = res.data || 'Thank you for subscribing!';
                form.reset();
                btn.textContent = 'Subscribed!';
            } else {
                msg.className = 'newsletter-form-msg error';
                msg.textContent = res.data || 'Something went wrong. Please try again.';
                btn.disabled = false;
                btn.textContent = 'Join Newsletter';
            }
        })
        .catch(function() {
            msg.className = 'newsletter-form-msg error';
            msg.textContent = 'Network error. Please try again.';
            btn.disabled = false;
            btn.textContent = 'Join Newsletter';
        });
    });
})();
        /* ── Multi-select destination dropdown (shared partial) ────── */
(function() {
    var wrap     = document.getElementById('dest-multiselect');
    var trigger  = document.getElementById('dest-trigger');
    var dropdown = document.getElementById('dest-dropdown');
    var hidden   = document.getElementById('ef-destination');
    if (!wrap || !trigger || !dropdown || !hidden) return;

    var placeholder = trigger.querySelector('.dest-placeholder');
    var selected = [];

    function render() {
        /* Remove old tags */
        trigger.querySelectorAll('.dest-tag').forEach(function(t) { t.remove(); });

        if (selected.length === 0) {
            placeholder.style.display = '';
        } else {
            placeholder.style.display = 'none';
            selected.forEach(function(val) {
                var tag = document.createElement('span');
                tag.className = 'dest-tag';
                tag.innerHTML = val + ' <span class="dest-tag-x" data-val="' + val + '">&times;</span>';
                trigger.insertBefore(tag, placeholder);
            });
        }

        /* Update hidden field */
        hidden.value = selected.join('; ');

        /* Update option highlights */
        dropdown.querySelectorAll('.dest-option').forEach(function(opt) {
            if (selected.indexOf(opt.dataset.value) !== -1) {
                opt.classList.add('selected');
            } else {
                opt.classList.remove('selected');
            }
        });
    }

    /* Toggle dropdown */
    trigger.addEventListener('click', function(e) {
        /* If clicking a tag X, remove that item */
        if (e.target.classList.contains('dest-tag-x')) {
            var val = e.target.dataset.val;
            selected = selected.filter(function(v) { return v !== val; });
            render();
            e.stopPropagation();
            return;
        }
        wrap.classList.toggle('open');
    });

    /* Click an option */
    dropdown.addEventListener('click', function(e) {
        var opt = e.target.closest('.dest-option');
        if (!opt) return;
        var val = opt.dataset.value;
        var idx = selected.indexOf(val);
        if (idx === -1) {
            selected.push(val);
        } else {
            selected.splice(idx, 1);
        }
        render();
        e.stopPropagation();
    });

    /* Close on outside click */
    document.addEventListener('click', function(e) {
        if (!wrap.contains(e.target)) {
            wrap.classList.remove('open');
        }
    });
})();

/* ── Expert enquiry form AJAX (shared partial) ─────────────── */
(function() {
    var form = document.getElementById('expert-enquiry-form');
    if (!form) return;
    var btn = form.querySelector('.expert-submit-btn');
    var msg = document.getElementById('expert-form-msg');

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        btn.disabled = true;
        btn.textContent = 'Sending\u2026';
        msg.className = 'expert-form-msg';
        msg.textContent = '';

        var data = new FormData();
        data.append('action', 'cop_expert_enquiry');
        data.append('nonce',       form.querySelector('[name="nonce"]').value);
        data.append('name',        form.querySelector('[name="name"]').value);
        data.append('email',       form.querySelector('[name="email"]').value);
        data.append('phone',       form.querySelector('[name="phone"]').value);
        data.append('destination', form.querySelector('[name="destination"]').value);
        data.append('budget',      form.querySelector('[name="budget"]').value);
        data.append('message',     form.querySelector('[name="message"]').value);

        fetch('https://co-ownership-property.com/wp-admin/admin-ajax.php', {
            method: 'POST',
            body: data
        })
        .then(function(r) { return r.json(); })
        .then(function(res) {
            if (res.success) {
                msg.className = 'expert-form-msg success';
                msg.textContent = res.data || 'Thank you! We\'ll be in touch within 24 hours.';
                form.reset();
                btn.textContent = 'Sent!';
                /* Clear destination tags */
                var wrap = document.getElementById('dest-multiselect');
                if (wrap) {
                    wrap.querySelectorAll('.dest-tag').forEach(function(t) { t.remove(); });
                    var ph = wrap.querySelector('.dest-placeholder');
                    if (ph) ph.style.display = '';
                    wrap.querySelectorAll('.dest-option').forEach(function(o) { o.classList.remove('selected'); });
                }
            } else {
                msg.className = 'expert-form-msg error';
                msg.textContent = res.data || 'Something went wrong. Please try again.';
                btn.disabled = false;
                btn.textContent = 'Send Enquiry';
            }
        })
        .catch(function() {
            msg.className = 'expert-form-msg error';
            msg.textContent = 'Network error. Please try again.';
            btn.disabled = false;
            btn.textContent = 'Send Enquiry';
        });
    });
})();
        document.querySelectorAll('a[href^="#"]').forEach(a => { a.addEventListener('click', function(e) { e.preventDefault(); const t = document.querySelector(this.getAttribute('href')); if (t) t.scrollIntoView({ behavior:'smooth' }); }); });
    