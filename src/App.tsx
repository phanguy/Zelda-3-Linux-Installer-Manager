/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Check, Copy, Download, Terminal } from "lucide-react";
import { useState } from "react";
import { bashScript } from "./script";

export default function App() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(bashScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([bashScript], { type: "text/x-shellscript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "zelda3-installer.sh";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
              <Terminal size={28} />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
              Zelda 3 Universal Linux Installer
            </h1>
          </div>
          <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">
            Universal Linux installer and configuration hub for Zelda 3 (A Link to the Past PC Port). Features native package compilation, categorized settings for all <code className="bg-slate-200 px-1.5 py-0.5 rounded text-sm">zelda3.ini</code> options (Display, Gameplay QoL, Audio/MSU-1, and Bug Fixes with built-in explanation dialogs), and automatic desktop launcher generation.
          </p>
        </header>

        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-slate-300 border-b border-slate-800">
            <span className="font-mono text-sm">zelda3-installer.sh</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-700"
              >
                {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-500 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <Download size={16} />
                Download
              </button>
            </div>
          </div>
          <div className="p-4 bg-slate-950 overflow-x-auto">
            <pre className="text-slate-300 font-mono text-sm leading-relaxed whitespace-pre">
              <code>{bashScript}</code>
            </pre>
          </div>
        </section>
      </div>
    </div>
  );
}
