import { AnyExtension, markInputRule } from '@tiptap/core';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Strike from '@tiptap/extension-strike';
import Blockquote from '@tiptap/extension-blockquote';
import ListItem from '@tiptap/extension-list-item';
import Code from '@tiptap/extension-code';
import { Plugin } from '@tiptap/pm/state';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import js from 'highlight.js/lib/languages/javascript';

// Create a lowlight instance with the common languages
export const lowlight = createLowlight(common);
lowlight.register(common);
lowlight.register('js', js);

export const getExtendedExtension = (): AnyExtension[] => {
  return [
    Bold.extend({
      inclusive: false,
    }),
    Italic.extend({
      inclusive: false,
    }),
    Strike.extend({
      inclusive: false,
    }),
    Code,
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
                  node.forEach(child => {
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
          Enter: ({ editor }) => {
            // Don't allow enter in the caption
            if (editor.isActive('blockquote')) {
              const { state } = editor;
              const { selection } = state;
              const { $from } = selection;

              let nextNodePos = $from.pos;
              for (const n of editor.$doc.children) {
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
    CodeBlockLowlight.extend({
      addKeyboardShortcuts() {
        return {
          Tab: () => {
            if (this.editor.isActive('codeBlock')) {
              return this.editor.commands.insertContent('\t');
            }
            return false;
          },
        };
      },
    }).configure({ lowlight: lowlight }),
  ];
};
