
    {"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"What is fractional or co-ownership of a holiday home?","acceptedAnswer":{"@type":"Answer","text":"Co-ownership means you and a small number of other owners each purchase a deeded share of a fully managed luxury property. You own a real fraction of the home — typically one-eighth — and unlike a timeshare, you hold genuine legal ownership of the property itself. It combines the pride and financial benefits of real property ownership with the ease of a five-star hotel experience, at a fraction of the cost of buying outright."}},{"@type":"Question","name":"How is co-ownership different from timeshare?","acceptedAnswer":{"@type":"Answer","text":"Unlike a timeshare, co-ownership gives you a real share of the property deed, meaning you benefit from any appreciation in value and can sell your share on the open market whenever you choose. Because these are luxury properties in high-demand locations, prices typically do rise over time. There is no membership club, no points system, and no long-term contractual lock-in. You are a genuine property owner with full legal rights over your fraction."}},{"@type":"Question","name":"What does the purchase price include?","acceptedAnswer":{"@type":"Answer","text":"Your purchase price covers your deeded share of the property along with its full furnishings, interior design, and equipment. Many of our homes are professionally styled to a turnkey standard, so they are move-in ready from day one. Ongoing costs such as maintenance, insurance, property management, and local taxes are shared proportionally among all co-owners, keeping individual running costs very low."}},{"@type":"Question","name":"How is usage time divided between owners?","acceptedAnswer":{"@type":"Answer","text":"Every one-eighth share gives you 45 days — roughly six weeks — which is one-eighth of a year. Each property has a clear usage schedule that rotates fairly so all owners enjoy peak-season access over time. Many operators also offer a digital booking platform so you can swap, extend, or exchange weeks with fellow owners flexibly."}},{"@type":"Question","name":"Can I rent out my weeks when I'm not using them?","acceptedAnswer":{"@type":"Answer","text":"In many cases, yes. Many of our properties allow owners to place unused weeks into a managed rental programme. The property management company handles guest screening, check-in, cleaning, and maintenance, while rental income is returned to you. This can offset your annual running costs significantly and, in popular destinations, even generate a net return."}},{"@type":"Question","name":"Who manages the property day to day?","acceptedAnswer":{"@type":"Answer","text":"Every home on our platform is looked after by a professional property management company. They handle everything from routine maintenance and housekeeping to landscaping, pool care, and emergency repairs. You arrive to a pristine, hotel-quality home every visit — without lifting a finger."}},{"@type":"Question","name":"Can I sell my share later?","acceptedAnswer":{"@type":"Answer","text":"Absolutely. Because you hold a deeded share, you can sell it at any time on the open market — just like any other property. If the home has appreciated in value, you benefit from that growth in proportion to your ownership share. Our team can also assist with resales to our network of qualified buyers."}},{"@type":"Question","name":"Which destinations and property types do you offer?","acceptedAnswer":{"@type":"Answer","text":"We curate luxury co-ownership homes across Europe and the United States, including France, Spain, Italy, Portugal, Austria, England, and several US destinations. Properties range from coastal villas and Parisian apartments to Alpine chalets and Tuscan farmhouses. Every home is hand-selected for its location, build quality, and lifestyle appeal."}},{"@type":"Question","name":"Is co-ownership a good investment?","acceptedAnswer":{"@type":"Answer","text":"Co-ownership allows you to access a high-value property at a fraction of the cost of buying outright, freeing capital for other investments. You enjoy potential property appreciation, possible rental income, and the personal value of a luxury holiday home — all while sharing costs with fellow owners. It is increasingly recognised as one of the most financially sensible ways to own a second home."}},{"@type":"Question","name":"How do I get started?","acceptedAnswer":{"@type":"Answer","text":"Simply browse our collection or speak to one of our property specialists using the enquiry form. We will walk you through available homes, answer any questions, and guide you through the purchase process from start to finish — with full legal and financial transparency at every step."}}]}
    


        /* Header (shared partial) */
        /* ── Shared header JS ──────────────────────────────────────── */
(function () {
    var header = document.getElementById('cop-header');
    var btn    = document.getElementById('cop-hamburger');
    var nav    = document.getElementById('cop-nav');
    if (!header || !btn || !nav) return;

    // Scroll: transparent → solid
    window.addEventListener('scroll', function () {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

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

        // Destination tabs
        document.querySelectorAll('.dest-tab-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var dest = this.dataset.dest;
                document.querySelectorAll('.dest-tab-btn').forEach(function(b) { b.classList.remove('active'); });
                document.querySelectorAll('.dest-panel').forEach(function(p) { p.classList.remove('active'); });
                this.classList.add('active');
                var panel = document.getElementById('dest-' + dest);
                if (panel) panel.classList.add('active');
            });
        });

        // Properties carousel — Slick, exactly as August Collections uses it
        jQuery(document).ready(function($) {
            var $slider = $('#prop-list');
            var $current = $('#prop-current');
            var totalSlides; // set on init

            function updateCounter(slick, index) {
                // With infinite:true index can be negative (clones) — normalise it
                var real = ((index % slick.slideCount) + slick.slideCount) % slick.slideCount;
                // See More card is the last slide — keep counter at the last property number
                if (real >= slick.slideCount - 1) real = slick.slideCount - 2;
                $current.text(real + 1);
            }

            $slider.on('init', function(e, slick) {
                totalSlides = slick.slideCount;
                updateCounter(slick, slick.currentSlide);
            });

            $slider.on('beforeChange', function(e, slick, current, next) {
                updateCounter(slick, next);
            });

            $slider.slick({
                dots:            false,
                speed:           500,
                infinite:        true,
                slidesToShow:    3,
                slidesToScroll:  1,
                arrows:          false,
                touchThreshold:  300,
                centerMode:      true,
                centerPadding:   '0px',
                cssEase:         'ease',
                responsive: [{
                    breakpoint: 992,
                    settings: {
                        slidesToShow:   1,
                        slidesToScroll: 1,
                        centerMode:     false,
                        centerPadding:  '0px'
                    }
                }]
            });

            $('#prop-prev').on('click', function() { $slider.slick('slickPrev'); });
            $('#prop-next').on('click', function() { $slider.slick('slickNext'); });

            // Click a side card to jump to it (not the See More card)
            $slider.on('click', '.prop-card:not(.prop-card-see-more)', function() {
                var $slide = $(this).closest('.slick-slide');
                if (!$slide.hasClass('slick-center')) {
                    var idx = $slide.data('slick-index');
                    $slider.slick('slickGoTo', idx);
                }
            });
        });

        // Hero tab click handlers
        const heroTabs = document.querySelectorAll('.hero-tab');
        heroTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                heroTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            });
        });

        /* Newsletter form (shared partial) */
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

        /* Expert form + multi-select dropdown (shared partial) */
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

        // Smooth scroll for internal links (already enabled in CSS)
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (href !== '#' && document.querySelector(href)) {
                    e.preventDefault();
                    document.querySelector(href).scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            });
        });
    