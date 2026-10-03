import { ListItem } from '@tiptap/extension-list';

/** Nested journal blocks share the existing document format; folding never deletes content. */
export const JournalOutline = ListItem.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      collapsed: {
        default: false,
        parseHTML: (element) => element.getAttribute('data-collapsed') === 'true',
        renderHTML: (attrs) => ({ 'data-collapsed': attrs.collapsed ? 'true' : 'false' }),
      },
    };
  },
  addKeyboardShortcuts() {
    return {
      ...this.parent?.(),
      Tab: () => this.editor.commands.sinkListItem(this.name),
      'Shift-Tab': () => this.editor.commands.liftListItem(this.name),
      'Mod-Shift-.': () =>
        this.editor.commands.updateAttributes(this.name, {
          collapsed: !this.editor.getAttributes(this.name).collapsed,
        }),
      Enter: () =>
        this.editor
          .chain()
          .updateAttributes(this.name, { collapsed: false })
          .splitListItem(this.name)
          .run(),
    };
  },
  addNodeView() {
    return ({ node, editor, getPos }) => {
      const dom = document.createElement('li'),
        contentDOM = document.createElement('div'),
        button = document.createElement('button');
      contentDOM.className = 'outline-content';
      button.type = 'button';
      button.className = 'outline-bullet';
      button.contentEditable = 'false';
      const update = (current: typeof node) => {
        const nested = Array.from({ length: current.childCount }, (_, index) =>
          current.child(index),
        ).some((child) => child.type.name === 'bulletList' || child.type.name === 'orderedList');
        dom.dataset.collapsed = String(!!current.attrs.collapsed);
        button.textContent = nested ? (current.attrs.collapsed ? '›' : '⌄') : '•';
        button.disabled = !nested;
        button.setAttribute(
          'aria-label',
          current.attrs.collapsed ? 'Expand journal block' : 'Collapse journal block',
        );
        button.setAttribute('aria-expanded', String(!current.attrs.collapsed));
        button.title = nested ? 'Fold children · Ctrl+Shift+.' : '';
      };
      update(node);
      button.addEventListener('mousedown', (event) => event.preventDefault());
      button.addEventListener('click', () => {
        const position = getPos();
        if (typeof position !== 'number') return;
        const current = editor.state.doc.nodeAt(position);
        if (current)
          editor.view.dispatch(
            editor.state.tr.setNodeMarkup(position, undefined, {
              ...current.attrs,
              collapsed: !current.attrs.collapsed,
            }),
          );
      });
      dom.append(button, contentDOM);
      return {
        dom,
        contentDOM,
        update: (current) => {
          if (current.type.name !== this.name) return false;
          update(current);
          return true;
        },
        stopEvent: (event) => button.contains(event.target as Node),
        ignoreMutation: (mutation) =>
          mutation.type !== 'selection' &&
          (mutation.target === dom || button.contains(mutation.target)),
      };
    };
  },
});
