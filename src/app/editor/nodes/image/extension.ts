import { Injector } from '@angular/core';
import { Node, mergeAttributes } from '@tiptap/core';
import { AngularNodeViewRenderer } from 'ngx-tiptap';
import { ImageComponent } from './image.component';
import { Plugin } from '@tiptap/pm/state';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    image: {
      setImage: (options: {
        src: File;
        alt?: string;
        width?: number;
        height?: number;
      }) => ReturnType;
    };
  }
}

export const ImageExtension = (injector: Injector): Node => {
  return Node.create({
    name: 'imageComponent',
    group: 'block',
    content: 'inline*',
    marks: 'bold link',
    draggable: true,
    isolating: true,
    selectable: true,

    addAttributes() {
      return {
        src: {
          default: '',
        },
        alt: {
          default: '',
        },
        height: {
          default: null,
        },
        width: {
          default: null,
        },
      };
    },

    parseHTML() {
      return [
        {
          tag: 'app-image',
        },
      ];
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toDOM(node: any) {
      return ['figure', ['img', node.attrs], ['figurecaption', 0]];
    },

    renderHTML({ HTMLAttributes }) {
      return ['app-image', mergeAttributes(HTMLAttributes)];
    },

    addNodeView() {
      return AngularNodeViewRenderer(ImageComponent, { injector });
    },

    addCommands() {
      return {
        setImage:
          options =>
          ({ commands }) => {
            return commands.insertContent({
              type: this.name,
              attrs: options,
            });
          },
      };
    },

    addKeyboardShortcuts() {
      return {
        Enter: ({ editor }) => {
          // Don't allow enter in the caption
          if (editor.isActive('imageComponent')) {
            const { state } = editor;
            const { selection } = state;
            const { $from } = selection;

            let nextNodePos = $from.pos;
            for (const n of editor.$doc.children) {
              if (n.pos > nextNodePos) {
                nextNodePos = n.to - 1;
                break;
              }
            }

            editor.commands.focus(nextNodePos);
            return true;
          }
          return false;
        },
        ArrowUp: ({ editor }) => {
          // Don't allow enter in the caption
          if (editor.isActive('imageComponent')) {
            const { state } = editor;
            const { selection } = state;
            const { $from } = selection;

            const currentPos = $from.pos;

            let prevNodePos = 0;
            for (const n of editor.$doc.children) {
              if (currentPos >= n.from && currentPos <= n.to) {
                break;
              } else {
                prevNodePos = n.to - 1;
              }
            }

            editor.commands.focus(prevNodePos);
            return true;
          }
          return false;
        },
        ArrowDown: ({ editor }) => {
          // Don't allow enter in the caption
          if (editor.isActive('imageComponent')) {
            const { state } = editor;
            const { selection } = state;
            const { $from } = selection;

            let nextNodePos = $from.pos;
            for (const n of editor.$doc.children) {
              if (n.pos > nextNodePos) {
                // For blockquote, we need to subtract one more
                nextNodePos =
                  n.from +
                  n.content.size -
                  (n.node.type.name === 'blockquote' ? 1 : 0);
                break;
              }
            }

            editor.commands.focus(nextNodePos);
            return true;
          }
          return false;
        },
        Backspace: ({ editor }) => {
          if (editor.isActive('imageComponent')) {
            const { state } = editor;
            const { selection } = state;
            const size = selection.$anchor.node().content.size;
            if (size === 0) {
              editor.commands.deleteNode('imageComponent');
            }
          }
          return false;
        },
      };
    },

    addProseMirrorPlugins() {
      return [
        new Plugin({
          props: {
            handleDOMEvents: {
              drop(view, event) {
                const hasFiles =
                  event.dataTransfer &&
                  event.dataTransfer.files &&
                  event.dataTransfer.files.length;

                if (!hasFiles) {
                  return;
                }

                const images = Array.from(event.dataTransfer.files).filter(
                  file => /image/i.test(file.type)
                );

                if (images.length === 0) {
                  return;
                }

                event.preventDefault();

                const { schema } = view.state;
                const coordinates = view.posAtCoords({
                  left: event.clientX,
                  top: event.clientY,
                });

                images.forEach(image => {
                  const reader = new FileReader();

                  reader.onload = readerEvent => {
                    const node = schema.nodes['imageComponent'].create({
                      src: readerEvent.target?.result,
                    });
                    const transaction = view.state.tr.insert(
                      coordinates?.pos || 0,
                      node
                    );
                    view.dispatch(transaction);
                  };
                  reader.readAsDataURL(image);
                });
              },
              paste(view, event) {
                const hasFiles =
                  event.clipboardData &&
                  event.clipboardData.files &&
                  event.clipboardData.files.length;

                if (!hasFiles) {
                  return;
                }

                const images = Array.from(event.clipboardData.files).filter(
                  file => /image/i.test(file.type)
                );

                if (images.length === 0) {
                  return;
                }

                event.preventDefault();

                const { schema } = view.state;

                images.forEach(image => {
                  const reader = new FileReader();

                  reader.onload = readerEvent => {
                    const node = schema.nodes['imageComponent'].create({
                      src: readerEvent.target?.result,
                    });
                    const transaction =
                      view.state.tr.replaceSelectionWith(node);
                    view.dispatch(transaction);
                  };
                  reader.readAsDataURL(image);
                });
              },
            },
          },
        }),
      ];
    },
  });
};
