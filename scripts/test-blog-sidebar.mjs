import assert from 'node:assert/strict';
import { pickSidebarProperties } from '../lib/blog-sidebar.mjs';
const rows = [
  { slug:'paris', city:'Paris', region:'Paris', country:'France', img:'paris.jpg' },
  { slug:'cannes', city:'Cannes', region:"Côte d'Azur", country:'France', img:'cannes.jpg' },
  { slug:'antibes', city:'Antibes', region:"Côte d'Azur", country:'France', img:'antibes.jpg' },
  { slug:'aspen', city:'Aspen', region:'Colorado', country:'USA', img:'aspen.jpg' },
  { slug:'palma', city:'Palma', region:'Mallorca', country:'Spain', img:'palma.jpg' },
];
const select = title => pickSidebarProperties(rows,{title}).map(p => p.slug);
assert.deepEqual(select('Paris, one week at a time'), ['paris']);
for (const title of ['French Riviera guide','South of France homes','Côte d’Azur ownership']) {
  assert.deepEqual(select(title), ['antibes','cannes']);
}
assert.deepEqual(select('Majorca holidays'), ['palma']);
assert.deepEqual(pickSidebarProperties(rows, {title:'Paris ownership', subtitle:'Compared with Aspen'}).map(p=>p.slug), ['paris']);
assert.deepEqual(select('France property guide').sort(), ['antibes','cannes','paris']);
assert.equal(select('Ownership costs').length,3);
assert.deepEqual(pickSidebarProperties([], {title:'Paris'}), []);
console.log('Blog sidebar location checks passed.');
