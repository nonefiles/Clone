"use client";

import { useState } from "react";
import { 
  Code2, 
  Cpu, 
  Settings2,
  ChevronDown
} from "lucide-react";

import { IDEEditor } from "./_components/IDEEditor";
import { IDERunner } from "./_components/IDERunner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const LANGUAGES = [
  { label: "JavaScript", value: "javascript", defaultCode: "console.log('Hello, none-notion IDE!');\n\nconst greet = (name) => {\n  return `Welcome to the IDE, ${name}!`;\n};\n\nconsole.log(greet('Developer'));" },
  { label: "TypeScript", value: "typescript", defaultCode: "interface User {\n  id: number;\n  name: string;\n}\n\nconst user: User = {\n  id: 1,\n  name: 'John Doe'\n};\n\nconsole.log(`User: ${user.name}`);" },
  { label: "HTML", value: "html", defaultCode: "<!DOCTYPE html>\n<html>\n<body>\n  <h1>Hello none-notion</h1>\n  <p>Start coding here...</p>\n</body>\n</html>" },
  { label: "CSS", value: "css", defaultCode: "body {\n  background-color: #f0f0f0;\n  font-family: sans-serif;\n}\n\nh1 {\n  color: #333;\n}" },
  { label: "JSON", value: "json", defaultCode: "{\n  \"name\": \"none-notion-ide\",\n  \"version\": \"1.0.0\",\n  \"features\": [\n    \"Code Editing\",\n    \"Live Preview\",\n    \"Multi-language\"\n  ]\n}" },
];

const IDEPage = () => {
  const [language, setLanguage] = useState(LANGUAGES[0].value);
  const [code, setCode] = useState(LANGUAGES[0].defaultCode);

  const onLanguageChange = (value: string) => {
    setLanguage(value);
    const selectedLang = LANGUAGES.find((l) => l.value === value);
    if (selectedLang) {
      setCode(selectedLang.defaultCode);
    }
  };

  return (
    <div className="flex h-full flex-col bg-background/50 p-4 md:p-6 lg:p-8">
      {/* Header Area */}
      <div className="mb-6 flex flex-col gap-y-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-x-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 shadow-sm">
            <Cpu className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Online IDE</h1>
            <p className="text-sm text-muted-foreground font-medium">
              Write, test and run your code snippets instantly.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-x-3">
          <div className="flex items-center gap-x-2 bg-background/60 backdrop-blur-sm p-1 rounded-xl border shadow-sm">
            <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-x-2 border-r pr-4">
              <Code2 className="h-3.5 w-3.5" />
              Language
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-[160px] justify-between h-9 font-medium hover:bg-transparent">
                  {LANGUAGES.find(l => l.value === language)?.label}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px] rounded-xl shadow-xl border-muted/20">
                {LANGUAGES.map((lang) => (
                  <DropdownMenuItem 
                    key={lang.value} 
                    onClick={() => onLanguageChange(lang.value)}
                    className="rounded-lg cursor-pointer"
                  >
                    {lang.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-5 min-h-0">
        {/* Editor Section */}
        <div className="lg:col-span-3 flex flex-col min-h-[400px]">
          <Card className="flex-1 border-none shadow-none bg-transparent overflow-hidden">
            <IDEEditor
              language={language}
              value={code}
              onChange={(val) => setCode(val || "")}
            />
          </Card>
        </div>

        {/* Runner Section */}
        <div className="lg:col-span-2 flex flex-col min-h-[300px]">
          <IDERunner language={language} code={code} />
          
          <div className="mt-4 flex flex-col gap-y-4">
             <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-x-2 text-primary">
                  <Settings2 className="h-4 w-4" />
                  IDE Tips
                </h4>
                <ul className="text-xs text-muted-foreground space-y-1.5 font-medium">
                  <li>• Use console.log() to see output for JavaScript</li>
                  <li>• Auto-save is enabled for your current session</li>
                  <li>• Switch languages to see template code</li>
                </ul>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IDEPage;
