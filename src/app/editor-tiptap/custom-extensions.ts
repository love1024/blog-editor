import { AnyExtension } from '@tiptap/core';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Strike from '@tiptap/extension-strike';
import Underline from '@tiptap/extension-underline';
import Blockquote from '@tiptap/extension-blockquote';
import { Injector } from '@angular/core';
import ListItem from '@tiptap/extension-list-item';
import { Plugin } from '@tiptap/pm/state';

export const getCustomExtension = (injector: Injector): AnyExtension[] => {
  return [
    Bold.extend({
      addKeyboardShortcuts() {
        return {
          'Mod-b': ({ editor }) => {
            if (editor.isActive('heading')) {
              return true;
            }
            return this.editor.chain().focus().toggleBold().run();
          },
        };
      },
    }),
    Italic.extend({
      addKeyboardShortcuts() {
        return {
          'Mod-i': ({ editor }) => {
            if (editor.isActive('heading')) {
              return true;
            }
            return this.editor.chain().focus().toggleItalic().run();
          },
        };
      },
    }),
    Underline.extend({
      addKeyboardShortcuts() {
        return {
          'Mod-u': ({ editor }) => {
            if (editor.isActive('heading')) {
              return true;
            }
            return this.editor.chain().focus().toggleUnderline().run();
          },
        };
      },
    }),
    Strike.extend({
      addKeyboardShortcuts() {
        return {
          'Mod-Shift-s': ({ editor }) => {
            if (editor.isActive('heading')) {
              return true;
            }
            return this.editor.chain().focus().toggleStrike().run();
          },
        };
      },
    }),
    Blockquote.extend({
      content: 'paragraph', // Only allow one paragraph
      addProseMirrorPlugins() {
        return [
          new Plugin({
            // Remove all marks
            appendTransaction(transactions, oldState, newState) {
              const tr = newState.tr;
              let modified = false;

              newState.doc.descendants((node, pos) => {
                if (node.type.name === 'blockquote') {
                  node.forEach((child) => {
                    if (child.type.name === 'paragraph') {
                      child.forEach((c, offset) => {
                        tr.removeMark(
                          pos + offset,
                          pos + offset + child.nodeSize,
                          null
                        );
                        modified = true;
                      });
                    }
                  });
                }
              });

              return modified ? tr : null;
            },
          }),
        ];
      },
      addKeyboardShortcuts() {
        return {
          'Mod-Shift-b': ({ editor }) => {
            if (editor.isActive('heading')) {
              return true;
            }
            return this.editor.chain().focus().toggleBlockquote().run();
          },
          Enter: ({ editor }) => {
            // Don't allow enter in the caption
            if (editor.isActive('blockquote')) {
              const { state, view } = editor;
              const { selection } = state;
              const { $from } = selection;

              let nextNodePos = $from.pos;
              for (let n of editor.$doc.children) {
                if (n.pos > nextNodePos) {
                  nextNodePos = n.pos;
                  break;
                }
              }

              editor.commands.focus(nextNodePos);
              return true;
            }
            return false;
          },
        };
      },
    }),
    ListItem.extend({
      // We only want paragraphs inside the list and not other nodes such as images
      content: 'paragraph+',
    }),
  ];
};