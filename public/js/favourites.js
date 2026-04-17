
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
    