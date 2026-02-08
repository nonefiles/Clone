"use client";

import {
  BlockNoteSchema,
  defaultBlockSpecs,
  PartialBlock,
  defaultInlineContentSpecs,
  defaultStyleSpecs,
} from "@blocknote/core";
import {
  useCreateBlockNote,
  createReactBlockSpec,
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
} from "@blocknote/react";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { BlockNoteView } from "@blocknote/mantine";
import { useTheme } from "next-themes";
import { createClient } from "@/utils/supabase/client";
import { Mermaid } from "./mermaid";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

const mermaidBlockSpec = createReactBlockSpec(
  {
    type: "mermaid",
    propSchema: {
      code: {
        default: "graph TD; A-->B;",
      },
    },
    content: "none",
  },
  {
    render: (props) => {
      return (
        <div className="flex flex-col w-full p-4 border rounded-lg bg-slate-50 dark:bg-slate-900 group">
          <Mermaid content={props.block.props.code} />
          <div className="hidden group-hover:flex mt-2 w-full">
            <textarea
              className="w-full p-2 text-xs font-mono border rounded bg-white dark:bg-slate-800 focus:ring-1 focus:ring-sky-500 outline-none"
              value={props.block.props.code}
              onChange={(e) =>
                props.editor.updateBlock(props.block, {
                  props: { ...props.block.props, code: e.target.value },
                })
              }
              rows={3}
            />
          </div>
        </div>
      );
    },
  }
);

const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    mermaid: mermaidBlockSpec(),
  },
  inlineContentSpecs: defaultInlineContentSpecs,
  styleSpecs: defaultStyleSpecs,
});

interface EditorProps {
  onChange: (value: string) => void;
  initialContent?: string;
  editable?: boolean;
}

const Editor = (props: EditorProps) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return <EditorContent {...props} />;
};

interface EditorContentProps extends EditorProps {}

const EditorContent = ({ onChange, initialContent, editable }: EditorContentProps) => {
  const { resolvedTheme } = useTheme();
  const supabase = createClient();
  const isFirstRender = useRef(true);

  const handleUpload = useCallback(async (file: File) => {
    const isImage = file.type.startsWith('image/');
    const bucket = isImage ? 'images' : 'files';
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
    const filePath = `${isImage ? 'editor' : 'attachments'}/${fileName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (error) {
      throw new Error(error.message);
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrl;
  }, [supabase.storage]);

  const editor = useCreateBlockNote({
    schema,
    initialContent: initialContent
      ? (() => {
          try {
            return JSON.parse(initialContent);
          } catch (e) {
            console.error("Initial content parse error:", e);
            return undefined;
          }
        })()
      : undefined,
    uploadFile: handleUpload,
  });

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (editor && initialContent) {
      try {
        const parsedContent = JSON.parse(initialContent);
        const currentContent = editor.document;

        // Optimize edilmiş içerik karşılaştırma mantığı
        // Eğer içerik yapısal olarak tamamen aynıysa replaceBlocks çağrılmaz, böylece focus korunur.
        if (JSON.stringify(currentContent) !== JSON.stringify(parsedContent)) {
          editor.replaceBlocks(editor.document, parsedContent);
        }
      } catch (error) {
        console.error("Editor content sync error:", error);
      }
    }
  }, [initialContent, editor]);

  const handleEditorChange = useCallback(() => {
    if (editor) {
      onChange(JSON.stringify(editor.document, null, 2));
    }
  }, [editor, onChange]);

  if (!editor) {
    return null;
  }

  return (
    <div className="relative group">
      <BlockNoteView
        editable={editable}
        editor={editor}
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        onChange={handleEditorChange}
        slashMenu={false}
      >
        <SuggestionMenuController
          triggerCharacter={"/"}
          getItems={async (query) => {
            const items = [
              ...getDefaultReactSlashMenuItems(editor),
              {
                title: "Mermaid",
                onItemClick: () => {
                  editor.insertBlocks(
                    [
                      {
                        type: "mermaid",
                        props: {
                          code: "graph TD; A-->B;",
                        },
                      },
                    ],
                    editor.getTextCursorPosition().block,
                    "after"
                  );
                },
                aliases: ["mermaid", "diagram", "chart"],
                group: "Advanced",
                icon: <div className="font-bold text-xs">M</div>,
              },
            ];
            return items.filter((item) =>
              item.title.toLowerCase().includes(query.toLowerCase()) ||
              item.aliases?.some((alias: string) =>
                alias.toLowerCase().includes(query.toLowerCase())
              )
            );
          }}
        />
      </BlockNoteView>
    </div>
  );
};

export default Editor;
