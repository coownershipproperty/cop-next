
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

        const COP_FAV_KEY = 'cop_favourites';

        function getFavs() {
            return JSON.parse(localStorage.getItem(COP_FAV_KEY) || '{}');
        }

        function formatPrice(p) {
            const sym = p.currency === 'USD' ? '$' : p.currency === 'GBP' ? '£' : '€';
            if (!p.price) return '';
            return sym + p.price.toLocaleString('en-GB');
        }

        function removeFav(id) {
            const stored = getFavs();
            delete stored[id];
            localStorage.setItem(COP_FAV_KEY, JSON.stringify(stored));
            renderFavs();
            updateFavCount();
        }

        function updateFavCount() {
            const n = Object.keys(getFavs()).length;
            document.querySelectorAll('.cop-fav-count').forEach(el => {
                el.textContent = n > 0 ? n : '';
                el.style.display = n > 0 ? 'inline-flex' : 'none';
            });
        }

        function renderFavs() {
            const favs = getFavs();
            const keys = Object.keys(favs);
            const grid = document.getElementById('fav-grid');
            const empty = document.getElementById('fav-empty');
            const countEl = document.getElementById('fav-count');
            const clearBtn = document.getElementById('clear-favs');

            if (keys.length === 0) {
                grid.innerHTML = '';
                empty.style.display = 'block';
                countEl.innerHTML = '';
                clearBtn.style.display = 'none';
                return;
            }

            empty.style.display = 'none';
            countEl.innerHTML = '<strong>' + keys.length + '</strong> saved propert' + (keys.length === 1 ? 'y' : 'ies');
            clearBtn.style.display = 'inline-block';

            const bedSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20V10a2 2 0 012-2h16a2 2 0 012 2v10M2 14h20M7 10V8a1 1 0 011-1h8a1 1 0 011 1v2"/></svg>';
            const sizeSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 9h18M9 3v18"/></svg>';
            const heartSvg = '<svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" fill="#C9A84C" stroke="#C9A84C"/></svg>';

            grid.innerHTML = keys.map(id => {
                const p = favs[id];
                const badge = p.label ? '<span class="prop-badge ' + (p.status||'') + '">' + p.label + '</span>' : '';
                const img = p.img ? '<img src="' + p.img + '" alt="' + (p.title||'').replace(/"/g,'&quot;') + '" loading="lazy" class="prop-img">' : '<div class="prop-img" style="background:var(--blue-20);height:100%"></div>';
                const location = [p.region, p.country].filter(Boolean).join(', ');
                const beds = p.beds ? '<span class="prop-stat">' + bedSvg + p.beds + ' Bed' + (p.beds > 1 ? 's' : '') + '</span>' : '';
                const size = p.size ? '<span class="prop-stat">' + sizeSvg + p.size + ' m²</span>' : '';
                const sep = (p.beds && p.size) ? '<span class="prop-stat-sep"></span>' : '';
                const stats = (beds || size) ? '<div class="prop-stats">' + beds + sep + size + '</div>' : '';
                const price = formatPrice(p);

                return '<article class="prop-card" onclick="window.location=\'' + (p.url||'#') + '\'" role="link">' +
                    '<div class="prop-img-wrap">' + img + badge +
                    '<button class="prop-remove" onclick="event.stopPropagation();removeFav(\'' + id + '\')" aria-label="Remove from favourites">' + heartSvg + '</button>' +
                    '</div>' +
                    '<div class="prop-body">' +
                    (location ? '<p class="prop-location">' + location + '</p>' : '') +
                    '<h3 class="prop-title">' + (p.title||'') + '</h3>' +
                    stats +
                    (price ? '<p class="prop-price">' + price + '</p>' : '') +
                    '<a href="' + (p.url||'#') + '" class="prop-view-btn" onclick="event.stopPropagation()">View Property →</a>' +
                    '</div></article>';
            }).join('');
        }

        document.getElementById('clear-favs').addEventListener('click', function() {
            if (confirm('Remove all saved properties?')) {
                localStorage.removeItem(COP_FAV_KEY);
                renderFavs();
                updateFavCount();
            }
        });

        renderFavs();
        updateFavCount();

        // Sync count from any other tab
        window.addEventListener('storage', function(e) {
            if (e.key === COP_FAV_KEY) { renderFavs(); updateFavCount(); }
        });
    