
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
        document.querySelectorAll('a[href^="#"]').forEach(a=>{a.addEventListener('click',function(e){e.preventDefault();const t=document.querySelector(this.getAttribute('href'));if(t)t.scrollIntoView({behavior:'smooth'})})});
    