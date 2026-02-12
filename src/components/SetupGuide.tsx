import { Info, ExternalLink, Copy, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/utils/cn';

export function SetupGuide() {
  const [copied, setCopied] = useState(false);

  const sampleItem = `{
  "name": "Diamond Sword",
  "value": 15000,
  "demand": 8,
  "trend": "rising",
  "imageUrl": "https://mc.nerothe.com/img/1.20.4/diamond_sword.png",
  "category": "Weapons",
  "lastUpdated": ${Date.now()}
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sampleItem);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn(
      "bg-slate-900/60 backdrop-blur-xl",
      "border border-amber-500/30 rounded-2xl p-5",
      "shadow-lg shadow-amber-500/5"
    )}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
          <Info className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Setup Required</h3>
          <p className="text-xs text-slate-400">Configure Firebase to enable live data</p>
        </div>
      </div>

      <div className="space-y-3 text-sm text-slate-300">
        <div className="flex items-start gap-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-500/30 text-purple-300 flex items-center justify-center text-xs font-bold">1</span>
          <p>Create a Firebase project at <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline inline-flex items-center gap-1">console.firebase.google.com <ExternalLink className="w-3 h-3" /></a></p>
        </div>
        
        <div className="flex items-start gap-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-500/30 text-purple-300 flex items-center justify-center text-xs font-bold">2</span>
          <p>Enable Firestore Database in your project</p>
        </div>
        
        <div className="flex items-start gap-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-500/30 text-purple-300 flex items-center justify-center text-xs font-bold">3</span>
          <p>Create a collection named <code className="px-1.5 py-0.5 bg-slate-800 rounded text-amber-400">market</code></p>
        </div>
        
        <div className="flex items-start gap-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-500/30 text-purple-300 flex items-center justify-center text-xs font-bold">4</span>
          <p>Update <code className="px-1.5 py-0.5 bg-slate-800 rounded text-amber-400">src/lib/firebase.ts</code> with your config</p>
        </div>

        <div className="flex items-start gap-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-500/30 text-purple-300 flex items-center justify-center text-xs font-bold">5</span>
          <p>Visit <code className="px-1.5 py-0.5 bg-slate-800 rounded text-amber-400">#/admin</code> to add items (password: <code className="px-1.5 py-0.5 bg-slate-800 rounded text-emerald-400">fakepixel2024</code>)</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sample Item Document</span>
          <button
            onClick={handleCopy}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all",
              copied
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-slate-800 text-slate-400 hover:text-white"
            )}
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <pre className="bg-slate-800/60 rounded-xl p-3 text-xs text-slate-300 overflow-x-auto">
          {sampleItem}
        </pre>
      </div>
    </div>
  );
}
