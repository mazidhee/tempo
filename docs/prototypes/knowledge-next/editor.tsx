import React from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { EditorContent, useEditor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import * as Icons from 'lucide-react';

let root: ReturnType<typeof createRoot> | undefined;
// Export only the block and mark types exposed by this preview's StarterKit.
// Production migration still needs attachment/link and round-trip coverage.
function toMarkdown(content: any): string {
  if (typeof content === 'string') {
    const doc = new DOMParser().parseFromString(content, 'text/html');
    const convert = (node: Node): any => {
      if (node.nodeType === Node.TEXT_NODE) return { type: 'text', text: node.textContent || '' };
      const element = node as HTMLElement;
      const tags: Record<string,string> = { P:'paragraph',H1:'heading',H2:'heading',H3:'heading',UL:'bulletList',OL:'orderedList',LI:'listItem',PRE:'codeBlock',BLOCKQUOTE:'blockquote',HR:'horizontalRule',BR:'hardBreak' };
      const children = Array.from(node.childNodes).map(convert);
      const mark = element.tagName==='STRONG' ? {type:'bold'} : element.tagName==='EM' ? {type:'italic'} : element.tagName==='CODE' && element.parentElement?.tagName!=='PRE' ? {type:'code'} : element.tagName==='A' ? {type:'link',attrs:{href:element.getAttribute('href')}} : null;
      if (mark) { const apply=(n:any):any=>n.type==='text'?{...n,marks:[...(n.marks||[]),mark]}:{...n,content:n.content?.map(apply)}; return {type:'inline',content:children.map(apply)}; }
      return {type:tags[element.tagName]||'inline',attrs:{level:Number(element.tagName?.slice(1))||2},content:children};
    };
    content = {type:'doc',content:Array.from(doc.body.childNodes).map(convert)};
  }
  const inlineEscape=(text:string)=>text.replace(/([\\`*_[\]<>])/g,'\\$1');
  const write=(n:any,raw=false):string=>{
    if(n.type==='text'){let text=raw?n.text:inlineEscape(n.text||'');for(const mark of n.marks||[]){if(mark.type==='bold')text='**'+text+'**';if(mark.type==='italic')text='*'+text+'*';if(mark.type==='code')text='`'+(n.text||'').replace(/`/g,'\\`')+'`';if(mark.type==='link')text='['+text+']('+String(mark.attrs.href).replace(/\)/g,'%29')+')';}return text;}
    const children=(n.content||[]).map((c:any)=>write(c,raw)).join('');
    if(n.type==='heading')return '#'.repeat(n.attrs?.level||2)+' '+children+'\n\n';
    if(n.type==='paragraph')return children+'\n\n';
    if(n.type==='codeBlock') {const body=(n.content||[]).map((c:any)=>write(c,true)).join('');const fence='`'.repeat(Math.max(3,...(body.match(/`+/g)||[]).map((m:string)=>m.length+1)));return fence+(n.attrs?.language||'')+'\n'+body+'\n'+fence+'\n\n';}
    if(n.type==='bulletList'||n.type==='orderedList')return (n.content||[]).map((c:any,i:number)=>{const marker=n.type==='bulletList'?'- ':((n.attrs?.start||1)+i)+'. ';return marker+write(c).trim().replace(/\n/g,'\n'+' '.repeat(marker.length));}).join('\n')+'\n\n';
    if(n.type==='blockquote')return children.trim().split('\n').map((s:string)=>'> '+s).join('\n')+'\n\n';
    if(n.type==='horizontalRule')return '---\n\n';
    if(n.type==='hardBreak')return '  \n';
    return children;
  };
  return write(content).trim();
}
function Writer({ content, save }: { content: object | string; save: (json: object) => void }) {
  const [slash, setSlash] = React.useState(false);
  const editor = useEditor({ extensions: [StarterKit], content, editorProps: { attributes: { class: 'prose', 'aria-label': 'Note content' } }, onUpdate: ({ editor }) => { save(editor.getJSON()); setSlash(editor.state.doc.textBetween(Math.max(0, editor.state.selection.from - 1), editor.state.selection.from) === '/'); } });
  const format = (kind: string) => { if (!editor) return; const chain = editor.chain().focus(); if (kind === 'bold') chain.toggleBold().run(); if (kind === 'italic') chain.toggleItalic().run(); if (kind === 'code') chain.toggleCode().run(); if (kind === 'heading') chain.toggleHeading({ level: 2 }).run(); };
  const insert = (kind: string) => { if (!editor) return; const pos = editor.state.selection.from; if (editor.state.doc.textBetween(pos - 1, pos) === '/') editor.commands.deleteRange({ from: pos - 1, to: pos }); const chain = editor.chain().focus(); if (kind === 'heading') chain.setHeading({ level: 2 }).run(); if (kind === 'list') chain.toggleBulletList().run(); if (kind === 'code') chain.toggleCodeBlock().run(); if (kind === 'quote') chain.toggleBlockquote().run(); if (kind === 'divider') chain.setHorizontalRule().run(); setSlash(false); };
  return <div className="writer"><EditorContent editor={editor} />{editor && <BubbleMenu editor={editor} options={{ placement: 'top' }}><div className="yoopta-ui-floating-toolbar">{(['bold', 'italic', 'heading', 'code'] as const).map(kind => <button className="yoopta-ui-floating-toolbar-button" key={kind} aria-label={kind} onMouseDown={e => e.preventDefault()} onClick={() => format(kind)}>{kind === 'bold' ? <Icons.Bold /> : kind === 'italic' ? <Icons.Italic /> : kind === 'heading' ? <Icons.Heading2 /> : <Icons.Code />}</button>)}</div></BubbleMenu>}{slash && <div className="slash-menu" role="menu" aria-label="Insert block">{['heading','list','code','quote','divider'].map(kind => <button role="menuitem" key={kind} onMouseDown={e => e.preventDefault()} onClick={() => insert(kind)}>{kind[0].toUpperCase() + kind.slice(1)}</button>)}</div>}</div>;
}
(window as any).KnowledgeEditor = {
  markdown: toMarkdown,
  mount: (element: HTMLElement, content: object | string, save: (json: object) => void) => { root?.unmount(); root = createRoot(element); root.render(<Writer content={content} save={save} />); },
  destroy: () => { root?.unmount(); root = undefined; },
  icon: (name: string) => { const Component = (Icons as any)[name] || Icons.FileText; return renderToStaticMarkup(<Component size={18} strokeWidth={1.65} aria-hidden="true" />); }
};
