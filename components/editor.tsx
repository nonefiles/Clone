"use client";

import {
  BlockNoteSchema,
  defaultBlockSpecs,
} from "@blocknote/core";
import { 
  useCreateBlockNote, 
  createReactBlockSpec, 
  getDefaultReactSlashMenuItems,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { useTheme } from "next-themes";
import { createClient } from "@/utils/supabase/client";
import { Mermaid } from "./mermaid";
import { useMemo } from "react";

interface EditorProps {
  onChange: (value: string) => void;
  initialContent?: string;
  editable?: boolean;
}

const Editor = ({ onChange, initialContent, editable }: EditorProps) => {
  const { resolvedTheme } = useTheme();
  const supabase = createClient();

  const schema = useMemo(() => {
    const MermaidBlock = createReactBlockSpec(
      {
        type: "mermaid",
        propSchema: {
          // DÜZELTME: 'content' yerine 'code' kullanıyoruz
          code: {
            default: "graph TD; A-->B;",
          },
        },
        content: "none",
      },
      {
        render: (props) => {
          return (
            <div className="flex flex-col gap-y-2">
              {props.editor.isEditable && (
                <textarea
                  className="w-full p-2 text-xs font-mono bg-secondary rounded-md resize-none"
                  value={props.block.props.code} // DÜZELTME: props.content -> props.code
                  onChange={(e) =>
                    props.editor.updateBlock(props.block, {
                      props: { ...props.block.props, code: e.target.value }, // DÜZELTME
                    })
                  }
                  rows={3}
                />
              )}
              {/* Mermaid bileşeni muhtemelen 'content' veya 'chart' prop'u bekliyordur. 
                  Eğer Mermaid bileşeniniz 'content' prop'u alıyorsa, ona 'code' değerini gönderiyoruz. */}
              <Mermaid content={props.block.props.code} />
            </div>
          );
        },
      }
    );

    return BlockNoteSchema.create({
      blockSpecs: {
        ...defaultBlockSpecs,
        mermaid: MermaidBlock,
      },
    } as any);
  }, []);

  const handleUpload = async (file: File) => {
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
  };

  const editor = useCreateBlockNote({
    initialContent: initialContent
      ? (JSON.parse(initialContent))
      : undefined,
    uploadFile: handleUpload,
    schema,
  });

  const handleEditorChange = () => {
    onChange(JSON.stringify(editor.document, null, 2));
  };

  const insertMermaid = (editor: any) => {
    editor.insertBlocks(
      [
        {
          type: "mermaid",
        },
      ],
      editor.getTextCursorPosition().block,
      "after"
    );
  };

  return (
    <div className="relative group">
      <BlockNoteView
        editable={editable}
        editor={editor}
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        onChange={handleEditorChange}
        slashMenuItems={[
          ...getDefaultReactSlashMenuItems(editor),
          {
            name: "Mermaid",
            aliases: ["mermaid", "diagram", "chart"],
            group: "Advanced",
            icon: <div className="font-bold text-xs">M</div>,
            onItemClick: () => insertMermaid(editor),
          },
        ]}
      />
    </div>
  );
};

export default Editor;