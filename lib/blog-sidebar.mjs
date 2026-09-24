const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const contains = (text, term) => term.length >= 3 && ` ${text} `.includes(` ${term} `);
const groups = [
  ['italian riviera', 'riviera di ponente', 'liguria', 'alassio', 'loano', 'apricale', 'sanremo', 'san remo', 'portofino'],
  ['french riviera', 'cote d azur', 'south of france', 'southern france', 'provence', 'cannes', 'nice', 'antibes', 'grimaud', 'valbonne', 'fayence', 'mouans sartoux', 'les issambres', 'nartelle', 'saint tropez'],
  ['mallorca', 'majorca'], ['lake como', 'lago di como'],
  ['french alps', 'portes du soleil', 'morzine', 'chamonix', 'courchevel'],
  ['usa', 'united states', 'united states of america'], ['uk', 'united kingdom', 'england'],
];

// Infer geography from editorial metadata, not incidental destinations in body links.
export function pickSidebarProperties(rows, post) {
  const homes = (rows || []).filter(p => p.img);
  const heading = normalize(`${post.title || ''} ${post.slug || ''}`);
  const summary = normalize(`${post.subtitle || ''} ${post.excerpt || ''}`);
  const score = (p, text) => {
    const city = normalize(p.city), region = normalize(p.region), country = normalize(p.country);
    const aliases = groups.some(group => group.some(t => contains(text, t)) && group.some(t => contains(`${city} ${region} ${country}`, t)));
    return contains(text, city) ? 100 : aliases ? 70 : contains(text, region) ? 60 : contains(text, country) ? 20 : 0;
  };
  const source = homes.some(p => score(p, heading)) ? heading : summary;
  const ranked = homes.map(p => ({ p, score: score(p, source) })).sort((a,b) => b.score-a.score || a.p.slug.localeCompare(b.p.slug));
  const matches = ranked.filter(item => item.score > 0);
  if (matches.length) {
    // A city/region article must not be padded with unrelated homes elsewhere in the country.
    const regional = matches.some(item => item.score >= 60);
    return matches.filter(item => !regional || item.score >= 60).slice(0,3).map(item => item.p);
  }
  const offset = [...normalize(post.slug || post.title)].reduce((n,c) => (n * 31 + c.charCodeAt(0)) >>> 0, 0) % (homes.length || 1);
  return [...homes.slice(offset), ...homes.slice(0,offset)].slice(0,3);
}
