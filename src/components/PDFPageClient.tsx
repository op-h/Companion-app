'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import StudySidebar from '@/components/StudySidebar';
import { ArrowLeft, Home } from 'lucide-react';
import { clsx } from 'clsx';

const PDFViewer = dynamic(() => import('@/components/PDFViewer'), {
  ssr: false,
  loading: () => <div className="text-white p-4">Loading Viewer...</div>
});

interface PDFPageClientProps {
  subjectName: string;
  pdfName: string;
  pdfUrl: string;
}

export default function PDFPageClient({ subjectName, pdfName, pdfUrl }: PDFPageClientProps) {
  const [zenMode, setZenMode] = useState(false);

  return (
    <div className="h-screen bg-slate-950 flex flex-col text-white overflow-hidden selection:bg-cyan-500/30">

      {/* Navbar - Hidden in Zen Mode */}
      <header className={clsx(
        "h-14 bg-slate-900 border-b border-white/10 flex items-center justify-between px-4 z-20 shrink-0 transition-all duration-500",
        zenMode ? "-mt-14" : "mt-0"
      )}>
        <div className="flex items-center gap-4">
          <Link href={`/${encodeURIComponent(subjectName)}`} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-sm font-semibold truncate max-w-md text-slate-200">
              {pdfName}
            </h1>
            <span className="text-xs text-slate-500">
              {subjectName}
            </span>
          </div>
        </div>

        <Link href="/" className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white">
          <Home className="w-5 h-5" />
        </Link>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* PDF Area */}
        <div className={clsx(
          "flex-1 overflow-hidden relative transition-all duration-500",
          zenMode ? "p-0" : "p-4"
        )}>
          <PDFViewer
            url={pdfUrl}
            subjectName={subjectName}
            pdfName={pdfName}
            onToggleZen={setZenMode}
          />
        </div>

        {/* Sidebar - Hidden in Zen Mode */}
        <div className={clsx(
          "border-l border-white/10 bg-slate-900/50 backdrop-blur-md flex flex-col transition-all duration-500 overflow-hidden",
          zenMode ? "w-0 opacity-0" : "w-96 opacity-100 p-4"
        )}>
          <div className="h-full w-96"> {/* Fixed width container to prevent content reflow during transition */}
            <StudySidebar subject={subjectName} pdf={pdfName} />
          </div>
        </div>
      </div>
    </div>
  );
}
