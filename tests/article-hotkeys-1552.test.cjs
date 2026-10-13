const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').resolve(__dirname,'../main.js'),'utf8');
const snippet=source.slice(source.indexOf('  createArticleNodeFromShortcut(kind, eventTarget) {'),source.indexOf('  /**\n   * 处理keydown',source.indexOf('  createArticleNodeFromShortcut(kind, eventTarget) {')));
assert(snippet.includes('handleArticleStructureShortcut(') && snippet.includes('focusCreatedStructureNode('));
const fakeWindow={requestAnimationFrame:(fn)=>fn(),setTimeout:(fn)=>fn()};
class HTMLElementFake {}
class MockElement extends HTMLElementFake {
 constructor(type='normal') {super();this.type=type; this.dataset={};this.contentEditable=type==='inline'?'true':'false'; this.isFocused=type==='inline'; this.nodeId='a'; this.blurCount=0;}
 closest(selector){
   if(selector.includes('modal-container') ||selector.includes('input, textarea, select'))return this.type==='input'?this:null;
   if(selector.includes(':not('))return this.type==='code'?this:null;
   if(selector.includes('data-mms-inline-editable'))return this.type==='inline'?this:null;
   if(selector.includes('data-node-id'))return {dataset:{nodeId:this.nodeId}};
   return null;
 }
 blur(){this.blurCount++;this.isFocused=false;this.dataset.mmsProtectInitialFocus=undefined;}
}
const nodeRoot=new MockElement();
const context={HTMLElement:HTMLElementFake,document:{activeElement:nodeRoot},window:fakeWindow,CSS:{escape:x=>x}};
vm.createContext(context);
const Example=vm.runInContext(`(class {${snippet}})`,context);
function makeMock(mode='article',editable=true){
 const obj=new Example();
 const target=new MockElement('inline');
 const a={id:'a',text:'',children:[]};const b={id:'b',text:'',children:[]};const root={id:'root',children:[a,b]};
 let events=[];
 obj.currentMode=mode;obj.readOnly=!editable;obj.rootEl={contains:x=>x instanceof MockElement,querySelector:(q)=>target.isFocused?target:null};
 obj.selectedId='a';obj.inlineEditingId='a';obj.callbacks={onDebugLog:(...items)=>events.push(items)};
 obj.ensureEditable=()=>editable;
 obj.document={root};obj.selectedNode=()=>root.children.find(x=>x.id===obj.selectedId)||a;
 obj.nodeById=(id)=>[root,...root.children,...root.children.flatMap(x=>x.children)].find(x=>x.id===id);
 obj.selectNode=id=>{obj.selectedId=id};obj.parentNodeById=id=>root;
 let nextNode=0;
 obj.createConfiguredNode=()=>({id:`new${++nextNode}`,children:[],text:''});
 obj.mutate=fn=>fn();
 // Actual addChild/addSibling methods from original code are tested separately below.
 obj.addSibling=()=>{const sel=obj.selectedNode();root.children.splice(root.children.indexOf(sel)+1,0,obj.createConfiguredNode());};
 obj.addChild=()=>{obj.selectedNode().children.push(obj.createConfiguredNode());};
 obj.articleRenderController=null;obj.articleEl={querySelector:()=>nodeRoot};
 obj.bringNodeIntoView=()=>{};obj.beginInlineEdit=()=>{};
 return {obj,target,root,events};
}
function key(kind, mods={}) {
 return {key:kind,code:kind,ctrlKey:false,metaKey:false,shiftKey:false,altKey:false,isComposing:false,repeat:false,...mods,
 target:new MockElement('inline'),preventDefault(){this.prevented=true},stopPropagation(){this.stopped=true},stopImmediatePropagation(){this.immediate=true}};
}
let tests=0;
function test(label,fn){fn();console.log('PASS',label);tests++}
test('Ctrl+Enter creates adjacent sibling, commits editor first',()=>{
 const {obj,root}=makeMock(); const ev=key('Enter',{ctrlKey:true});let wasBlurred=false;
 ev.target.blur=()=>{wasBlurred=true;obj.inlineEditingId=null;};obj.rootEl.querySelector=()=>ev.target;
 obj.addSibling=()=>{assert(wasBlurred);const sel=obj.selectedNode();root.children.splice(root.children.indexOf(sel)+1,0,{id:'new',children:[]})};
 assert.equal(obj.handleArticleStructureShortcut(ev),true);assert.equal(root.children[1].id,'new');assert.equal(ev.prevented,true);
});
test('Ctrl+Tab creates nested child',()=>{
 const {obj,root}=makeMock(); const ev=key('Tab',{ctrlKey:true});obj.rootEl.querySelector=()=>ev.target;
 assert.equal(obj.handleArticleStructureShortcut(ev),true);assert.equal(root.children[0].children.length,1);
});
test('Mod key state fallback handles missing ctrlKey in Enter',()=>{
 const {obj,root}=makeMock();const ev=key('Enter');obj.rootEl.querySelector=()=>ev.target;
 assert.equal(obj.handleArticleStructureShortcut(ev,true),true);assert.equal(root.children.length,3);
});
test('Ordinary Enter does not insert nodes',()=>{
 const {obj,root}=makeMock();assert.equal(obj.handleArticleStructureShortcut(key('Enter')),false);assert.equal(root.children.length,2);
});
test('Standalone Tab does not insert nodes',()=>{
 const {obj,root}=makeMock();assert.equal(obj.handleArticleStructureShortcut(key('Tab')),false);assert.equal(root.children[0].children.length,0);
});
test('Read-only mode does not intercept hotkeys',()=>{
 const {obj}=makeMock('article',false);assert.equal(obj.handleArticleStructureShortcut(key('Enter',{ctrlKey:true})),false);
});
test('Outline mode unaffected',()=>{
 const {obj}=makeMock('outline');assert.equal(obj.handleArticleStructureShortcut(key('Enter',{ctrlKey:true})),false);
});
test('Shift/Ctrl+Enter excluded',()=>{
 const {obj}=makeMock();assert.equal(obj.handleArticleStructureShortcut(key('Enter',{ctrlKey:true,shiftKey:true})),false);
});
test('Code editor is not hijacked',()=>{
 const {obj}=makeMock();const ev=key('Enter',{ctrlKey:true});ev.target=new MockElement('code');assert.equal(obj.handleArticleStructureShortcut(ev),false);
});
test('Ctrl+Tab key repeat not create duplicates',()=>{
 const {obj,root}=makeMock();const ev=key('Tab',{ctrlKey:true,repeat:true});assert.equal(obj.handleArticleStructureShortcut(ev),true);assert.equal(root.children[0].children.length,0);
});
test('Plugin commands register with Mod+Enter and Mod+Tab',()=>{
 for(const text of ['"article-create-sibling"','"article-create-child"','["Mod"], key'])assert(source.includes(text));
});
test('Only sibling/child scheduling invokes improved focus method',()=>{
 const region=source.slice(source.indexOf('  addChild() {'),source.indexOf('  /** Inserts a text block after'));
 assert.equal(region.match(/this\.focusCreatedStructureNode\(node\.id\)/g).length,2);
});
test('Focus waits for virtualized article node',()=>{
 const {obj}=makeMock(); obj.selectedId='a';let tries=0,focus=0;
 obj.articleRenderController={containsNode:()=>true};obj.articleEl={querySelector:()=>{tries++; return tries>3?{}:null;}};
 obj.bringNodeIntoView=()=>{};obj.beginInlineEdit=()=>focus++;
 obj.focusCreatedStructureNode('a');assert.equal(focus,1);assert.equal(tries,4);
});
console.log(`PASS ALL ${tests} tests`);
