import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
// This runs the actual app module with a minimal DOM, not a visual browser.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
class Element {
  constructor(tag='div') { this.tagName=tag; this.children=[]; this.className=''; this.dataset={}; this.listeners={}; this.disabled=false; this.value=''; }
  get classList() { const self=this; return {
    contains(c){return self.className.split(/\s+/).includes(c);},
    add(c){self.className=[...new Set([...self.className.split(/\s+/).filter(Boolean),c])].join(' ');},
    remove(c){self.className=self.className.split(/\s+/).filter(x=>x!==c).join(' ');},
    toggle(c,force){const on=force===undefined?!this.contains(c):force; if(on)this.add(c);else this.remove(c);return on;}
  }; }
  set innerHTML(value){this.children=[];this._html=value;}
  get innerHTML(){return this._html??'';}
  append(...children){this.children.push(...children);}
  setAttribute(k,v){this[k]=v;}
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
  async emit(type){if(this.disabled)return;const event={preventDefault(){}};if(this['on'+type])await this['on'+type](event);for(const fn of this.listeners[type]??[])await fn(event);}
  click(){return this.emit('click');}
  remove(){}
}
const html=await readFile(path.join(root,'apps/web/index.html'),'utf8');
const elements=new Map();
for(const match of html.matchAll(/<([a-z]+)\b[^>]*\bid="([^"]+)"[^>]*>/g)) {
  const e=new Element(match[1]);e.className=match[0].match(/class="([^"]*)"/)?.[1]??'';elements.set(match[2],e);
}
const saved=new Map();
globalThis.document={getElementById:id=>elements.get(id),createElement:tag=>new Element(tag),body:new Element('body')};
globalThis.localStorage={getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)};
globalThis.fetch=async url=>{
  if(String(url).startsWith('/api/'))return {ok:false,status:503,json:async()=>({})};
  const relative=String(url).replace(/^\.\.\/\.\.\//,'');
  const data=JSON.parse(await readFile(path.join(root,relative),'utf8'));
  return {ok:true,status:200,json:async()=>data};
};
await import('../apps/web/app.js');
for(let i=0;i<500 && elements.get('preset-grid').children.length===0;i++)await new Promise(r=>setTimeout(r,10));
await new Promise(r=>setTimeout(r,30));
const $=id=>elements.get(id);
assert.equal($('preset-grid').children.length,3,'Runner must finish loading its real data');
$('auto-advance-toggle').checked=false;
await $('auto-advance-toggle').emit('change');
$('packet-seed').value='academic-dom-smoke';
await $('preset-grid').children[0].click();
assert.equal($('question-screen').classList.contains('hidden'),false,'Starting must show the question screen');
let answered=0;
while(!$('question-screen').classList.contains('hidden') && answered<170) {
  const controls=$('answer-area').children;
  if(answered===0)await $('special-area').children[0].click();
  else {
    const ranking=controls.find(e=>e.classList.contains('primary'));
    if(ranking)await ranking.click();
    else await controls[Math.floor(controls.length/2)].click();
  }
  assert.equal($('next-button').disabled,false,'Selecting a response must enable manual Next');
  await $('next-button').click();
  answered++;
}
assert.equal($('complete-screen').classList.contains('hidden'),false);
const state=JSON.parse([...saved.values()][0]);
assert.equal(state.session.completionStatus,'completed');
assert.equal(state.session.responses.length+state.session.presentedItems.filter(e=>e.skippedByBranch).length,80);
assert.ok(state.session.responses.some(r=>r.state==='no_view' && r.value===null));
assert.ok(state.session.responses.some(r=>r.state==='answered' && r.value===0));
console.log('App DOM smoke passed: preset, visible question, manual responses, special/neutral distinction, complete session and export-ready raw data.');
