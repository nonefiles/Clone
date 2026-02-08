"use client";

import { Editor } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { Spinner } from "@/components/spinner";

interface IDEEditorProps {
  language: string;
  value: string;
  onChange: (value: string | undefined) => void;
}

export const IDEEditor = ({
  language,
  value,
  onChange,
}: IDEEditorProps) => {
  const { resolvedTheme } = useTheme();

  return (
    <div className="h-full w-full overflow-hidden rounded-lg border bg-background shadow-sm">
      <Editor
        height="100%"
        language={language}
        value={value}
        theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
        onChange={onChange}
        loading={<Spinner size="lg" />}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 16, bottom: 16 },
        }}
      />
    </div>
  );
};
