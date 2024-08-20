import { Injector } from '@angular/core';
import { Node, mergeAttributes } from '@tiptap/core';
import { AngularNodeViewRenderer } from 'ngx-tiptap';
import { ImageComponent } from './image.component';
import { Plugin } from '@tiptap/pm/state';
import { Nodes } from '../../editor-tiptap.model';
import { ImageService } from './image.service';

interface ImageAttributes {
  src: File;
  alt?: string;
  width?: number;
  height?: number;
  isNew: boolean;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    image: {
      setImage: (options: ImageAttributes) => ReturnType;
    };
  }
}

export const ImageExtension = (injector: Injector): Node => {
  const imageService = injector.get(ImageService);

  return Node.create({
    name: Nodes.Image,
    group: 'block', // It is part of the block group
    content: 'inline*', // What content can go inside this node - Only inline nodes
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
        isNew: {
          default: false,
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

    ignoreMutation() {
      return true;
    },

    renderHTML({ HTMLAttributes }) {
      return ['app-image', mergeAttributes(HTMLAttributes), 'span'];
    },

    addNodeView() {
      return AngularNodeViewRenderer(ImageComponent, {
        injector,
        // Do not refresh the component when it is mutated: while showing tooltip
        ignoreMutation: () => {
          return true;
        },
      });
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
        // Take the user to the next node on enter click instead of inserting a new line
        Enter: ({ editor }) => {
          // Don't allow enter in the caption
          if (editor.isActive(Nodes.Image)) {
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
        // Take the user to the previous node
        ArrowUp: ({ editor }) => {
          // Don't allow enter in the caption
          if (editor.isActive(Nodes.Image)) {
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
        // Take the user to the next node
        ArrowDown: ({ editor }) => {
          // Don't allow enter in the caption
          if (editor.isActive(Nodes.Image)) {
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
        // Delete the image if the user is at the beginning of the image
        Backspace: ({ editor }) => {
          if (editor.isActive(Nodes.Image)) {
            const { state } = editor;
            const { selection } = state;

            if (editor.$pos(selection.from).from === selection.from) {
              imageService.deleteCurrentImage(editor);
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
                    const node = schema.nodes[Nodes.Image].create({
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
                    const node = schema.nodes[Nodes.Image].create({
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
