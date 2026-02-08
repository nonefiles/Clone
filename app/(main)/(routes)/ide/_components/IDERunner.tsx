"use client";

import { useState, useEffect } from "react";
import { Play, RotateCcw, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface IDERunnerProps {
  language: string;
  code: string;
}

export const IDERunner = ({ language, code }: IDERunnerProps) => {
  const [output, setOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runCode = () => {
    setIsRunning(true);
    setOutput([]);

    if (language === "javascript") {
      try {
        const logs: string[] = [];
        const customConsole = {
          log: (...args: any[]) => {
            logs.push(args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '));
          },
          error: (...args: any[]) => {
            logs.push(`Error: ${args.map(arg => String(arg)).join(' ')}`);
          },
          warn: (...args: any[]) => {
            logs.push(`Warning: ${args.map(arg => String(arg)).join(' ')}`);
          }
        };

        // Create a function from the code and execute it with custom console
        const executeCode = new Function('console', code);
        executeCode(customConsole);
        
        if (logs.length === 0) {
          setOutput(["Code executed successfully (no output)"]);
        } else {
          setOutput(logs);
        }
      } catch (error: any) {
        setOutput([`Error: ${error.message}`]);
      }
    } else {
      setOutput([`Execution for ${language} is not supported in the browser yet.`]);
    }

    setIsRunning(false);
  };

  const clearOutput = () => {
    setOutput([]);
  };

  return (
    <div className="flex h-full flex-col rounded-lg border bg-background shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-x-2 text-sm font-medium">
          <Terminal className="h-4 w-4" />
          Output
        </div>
        <div className="flex items-center gap-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={clearOutput}
            className="h-8 px-2"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            onClick={runCode}
            disabled={isRunning}
            className="h-8 gap-x-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Play className="h-4 w-4 fill-current" />
            Run
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 font-mono text-sm">
        {output.length === 0 ? (
          <span className="text-muted-foreground italic">Click run to see output...</span>
        ) : (
          <div className="space-y-1">
            {output.map((line, i) => (
              <div 
                key={i} 
                className={cn(
                  "whitespace-pre-wrap",
                  line.startsWith("Error:") ? "text-red-500" : 
                  line.startsWith("Warning:") ? "text-yellow-500" : 
                  "text-foreground"
                )}
              >
                {line}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
