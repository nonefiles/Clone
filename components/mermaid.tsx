"use client";

import { useEffect, useRef } from "react";
import mermaid from "mermaid";

interface MermaidProps {
  content: string;
}

export const Mermaid = ({ content }: MermaidProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: "loose",
    });

    const renderDiagram = async () => {
      if (ref.current) {
        try {
          ref.current.innerHTML = content;
          ref.current.removeAttribute("data-processed");
          await mermaid.run({
            nodes: [ref.current],
          });
        } catch (error) {
          console.error("Mermaid render error:", error);
        }
      }
    };

    renderDiagram();
  }, [content]);

  return (
    <div className="flex justify-center my-4 overflow-x-auto bg-white p-4 rounded-lg">
      <div ref={ref} className="mermaid">
        {content}
      </div>
    </div>
  );
};
