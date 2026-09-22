/**
 * scripts/check-email-contrast.mjs
 *
 * Reads the HTML that scripts/render-emails.mjs produced and reports every text
 * node whose colour fails WCAG AA against the background it actually sits on,
 * resolving inherited colours and blending rgba over the parent.
 *
 *   node scripts/render-emails.mjs && node scripts/check-email-contrast.mjs
 *
 * This exists because of a specific failure. The re-skin repointed the palette
 * tokens — navy and gold both became black — and that silently turned every
 * footer link, badge and stat that had been gold-on-navy into black on black:
 * 55 invisible strings across 16 templates, none of which a diff would show
 * you. Run it after any change to lib/email/brand.js or to a template's
 * colours. It should print TOTAL 0.
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const cheerio = require('cheerio');
const dir = process.cwd() + '/.email-render/out';
const hex = s => { if(!s) return null; s=s.trim();
  let m=s.match(/^#([0-9a-f]{6})$/i); if(m) return [parseInt(m[1].slice(0,2),16),parseInt(m[1].slice(2,4),16),parseInt(m[1].slice(4,6),16)];
  m=s.match(/^#([0-9a-f]{3})$/i); if(m) return m[1].split('').map(c=>parseInt(c+c,16));
  m=s.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?/i);
  if(m){ const a=m[4]===undefined?1:+m[4]; return [+m[1],+m[2],+m[3],a]; }
  const named={white:[255,255,255],black:[0,0,0],transparent:null}; return named[s.toLowerCase()]??null; };
const over=(fg,bg)=>{ if(fg.length<4||fg[3]>=1) return fg.slice(0,3); const a=fg[3]; return [0,1,2].map(i=>Math.round(fg[i]*a+bg[i]*(1-a))); };
const lum=c=>{const [r,g,b]=c.map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)});return .2126*r+.7152*g+.0722*b};
const cr=(a,b)=>{const L1=lum(a),L2=lum(b);return (Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05)};
const styleOf=el=>{const s=(el.attribs&&el.attribs.style)||'';const o={};for(const part of s.split(';')){const i=part.indexOf(':');if(i<0)continue;o[part.slice(0,i).trim().toLowerCase()]=part.slice(i+1).trim();}return o};
let total=0;
for (const f of fs.readdirSync(dir).filter(f=>f.endsWith('.html'))) {
  const $ = cheerio.load(fs.readFileSync(dir+'/'+f,'utf8'));
  const problems=[];
  const walk=(node, color, bg, bgSrc)=>{
    for (const el of node.children||[]) {
      if (el.type==='text') {
        const t=el.data.replace(/\s+/g,' ').trim();
        if (t.length>2 && color && bg) {
          const ratio=cr(over(color,bg),bg);
          const st=styleOf(el.parent||{});
          const size=parseFloat(st['font-size']||'16');
          const weight=parseInt(st['font-weight']||'400',10);
          const need=(size>=24||(size>=18.66&&weight>=700))?3:4.5;
          if (ratio<need) problems.push(ratio.toFixed(2)+' need'+need+' '+Math.round(size)+'px fg#'+color.map(v=>v.toString(16).padStart(2,'0')).join('')+' bg#'+bg.map(v=>v.toString(16).padStart(2,'0')).join('')+' :: '+t.slice(0,40));
        }
        continue;
      }
      if (el.type!=='tag') continue;
      const st=styleOf(el);
      let c=hex(st.color)||color;
      let b=bg, src=bgSrc;
      const bgc=hex(st['background-color']||st.background);
      if (bgc) { b=over(bgc,bg); src=el.name; }
      if (el.attribs && el.attribs.bgcolor) { const x=hex(el.attribs.bgcolor); if(x){b=over(x,bg);src=el.name+'[bgcolor]';} }
      walk(el, c, b, src);
    }
  };
  const bodyEl=$('body')[0];
  const bst=styleOf(bodyEl||{});
  walk(bodyEl, hex(bst.color)||[17,17,17], hex(bst['background-color']||bst.background)||[255,255,255], 'body');
  const uniq=[...new Set(problems)];
  total+=uniq.length;
  if (uniq.length) console.log('\n== '+f+' ('+uniq.length+')\n  '+uniq.slice(0,12).join('\n  '));
}
console.log('\nTOTAL '+total);
