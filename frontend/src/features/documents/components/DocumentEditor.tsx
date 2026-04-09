import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { useEffect } from "react";

interface DocumentEditorProps {
  value: string;
  onChange: (value: string) => void;
}

interface ToolbarButtonProps {
  label: string;
  isActive?: boolean;
  onClick: () => void;
}

const ToolbarButton = ({
  label,
  isActive = false,
  onClick,
}: ToolbarButtonProps) => {
  return (
    <button
      type="button"
      onMouseDown={(event) => {
        event.preventDefault();
        onClick();
      }}
      className={[
        "rounded-xl px-3 py-2 text-sm font-medium transition",
        isActive
          ? "bg-primary-light text-primary"
          : "text-text-secondary hover:bg-background hover:text-text-primary",
      ].join(" ")}
    >
      {label}
    </button>
  );
};

const DocumentEditor = ({ value, onChange }: DocumentEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),
      Underline,
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "tiptap-editor min-h-[560px] px-10 py-8 text-[18px] leading-[1.85] text-text-primary focus:outline-none",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    if (editor.getHTML() === value) {
      return;
    }

    editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);

  if (!editor) {
    return (
      <div className="rounded-[28px] border border-dashed border-border bg-background p-6 text-sm text-text-secondary">
        Loading editor...
      </div>
    );
  }

  return (
    <div className="notion-editor-shell overflow-hidden rounded-[28px] border border-border bg-surface">
      <div className="flex flex-wrap gap-2 border-b border-border bg-background/70 px-4 py-3">
        <ToolbarButton
          label="H1"
          isActive={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        />
        <ToolbarButton
          label="H2"
          isActive={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        />
        <ToolbarButton
          label="H3"
          isActive={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        />
        <ToolbarButton
          label="Bold"
          isActive={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          label="Italic"
          isActive={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          label="Underline"
          isActive={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />
        <ToolbarButton
          label="Bullet"
          isActive={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          label="Numbered"
          isActive={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <ToolbarButton
          label="Link"
          isActive={editor.isActive("link")}
          onClick={() => {
            const previousUrl = editor.getAttributes("link").href as
              | string
              | undefined;
            const url = window.prompt("Enter a link URL", previousUrl ?? "https://");

            if (url === null) {
              return;
            }

            if (!url.trim()) {
              editor.chain().focus().unsetLink().run();
              return;
            }

            editor.chain().focus().setLink({ href: url.trim() }).run();
          }}
        />
        <ToolbarButton
          label="Code"
          isActive={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
        />
        <ToolbarButton
          label="Code Block"
          isActive={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        />
      </div>

      <EditorContent editor={editor} />
    </div>
  );
};

export default DocumentEditor;
