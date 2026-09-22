/**
 * scripts/render-emails.mjs
 *
 * Renders every React Email template in emails/ to .email-render/out/*.html,
 * using each template's own sample props. Written 22 Sep 2026 during the
 * black/white/grey re-skin, because twenty-one templates were being re-coloured
 * in one sweep and there was no way to see the result without sending
 * twenty-one emails.
 *
 *   node scripts/render-emails.mjs
 *
 * esbuild does the TSX, because Next's own compiler is not available outside a
 * build and `node --experimental-strip-types` does not do JSX. Output is
 * gitignored. For a version you can look at in a browser with the admin
 * chrome around it, use /admin/email-previews instead.
 */
import esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const files = fs.readdirSync("emails").filter(f=>f.endsWith(".tsx") && !f.startsWith("_"));
const outdir = process.cwd() + '/.email-render/out';
fs.mkdirSync(outdir,{recursive:true});
fs.mkdirSync(process.cwd()+'/.email-render/tmp',{recursive:true});
const { render } = require('@react-email/render');
const React = require('react');
for (const f of files) {
  const tmp = process.cwd() + '/.email-render/tmp/' + f.replace('.tsx','.cjs');
  try {
    await esbuild.build({ entryPoints:['emails/'+f], outfile:tmp, bundle:true, platform:'node', format:'cjs',
      jsx:'automatic', external:['react','react-dom','@react-email/*'], logLevel:'silent',
      alias:{ '@': process.cwd() } });
    const mod = require(tmp);
    const Comp = mod.default || mod;
    const html = await render(React.createElement(Comp, {}));
    fs.writeFileSync(path.join(outdir, f.replace('.tsx','.html')), html);
    console.log('OK  ' + f + '  ' + Math.round(html.length/1024) + 'KB');
  } catch (e) {
    console.log('ERR ' + f + '  ' + String(e.message).split('\n')[0].slice(0,120));
  }
}
