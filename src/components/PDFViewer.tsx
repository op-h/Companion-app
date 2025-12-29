'use client';

import { useState, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, Maximize2, Minimize2, Bookmark, Home as HomeIcon } from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// Set worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  url: string;
  subjectName: string;
  pdfName: string;
  onToggleZen: (isZen: boolean) => void;
}

export default function PDFViewer({ url, subjectName, pdfName, onToggleZen }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [zenMode, setZenMode] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Load progress/bookmark from localStorage
  useEffect(() => {
    const savedPage = localStorage.getItem(`progress-${pdfName}`);
    if (savedPage) {
      // Avoid effect race conditions by functional update if needed, but here simple set is fine. 
      // If linter complains about sync set in effect, it's because it behaves like mount.
      setPageNumber(parseInt(savedPage));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps

    const bookmarks = JSON.parse(localStorage.getItem(`bookmarks-${pdfName}`) || '[]');
    setIsBookmarked(bookmarks.includes(pageNumber));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfName]);

  // Save progress on page change
  useEffect(() => {
    if (pageNumber > 0) {
      localStorage.setItem(`progress-${pdfName}`, pageNumber.toString());
      localStorage.setItem(`last-read-pdf`, JSON.stringify({ subject: subjectName, name: pdfName, page: pageNumber, date: Date.now() }));

      const bookmarks = JSON.parse(localStorage.getItem(`bookmarks-${pdfName}`) || '[]');
      setIsBookmarked(bookmarks.includes(pageNumber));
    }
  }, [pageNumber, pdfName, subjectName]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;

      switch (e.key) {
        case 'ArrowLeft':
          setPageNumber(prev => Math.max(prev - 1, 1));
          break;
        case 'ArrowRight':
          setPageNumber(prev => Math.min(prev + 1, numPages || prev));
          break;
        case 'Escape':
          if (zenMode) {
            setZenMode(false);
            onToggleZen(false);
          }
          break;
        case '+':
        case '=': // Check for = because + often requires Shift
          setScale(prev => Math.min(prev + 0.2, 2.5));
          break;
        case '-':
          setScale(prev => Math.max(prev - 0.2, 0.5));
          break;
        case '0':
          setScale(1.0);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [numPages, zenMode, onToggleZen]); // Dependencies needed for state access

  const toggleBookmark = () => {
    const bookmarks = JSON.parse(localStorage.getItem(`bookmarks-${pdfName}`) || '[]');
    let newBookmarks;
    if (isBookmarked) {
      newBookmarks = bookmarks.filter((p: number) => p !== pageNumber);
    } else {
      newBookmarks = [...bookmarks, pageNumber];
    }
    localStorage.setItem(`bookmarks-${pdfName}`, JSON.stringify(newBookmarks));
    setIsBookmarked(!isBookmarked);

    // Force re-render of bookmark status by updating state
    // (Already handled by the first useEffect but logic was slightly circular, this direct set is better for toggle)
  };

  const toggleZen = useCallback(() => { // Wrap in callback
    const newState = !zenMode;
    setZenMode(newState);
    onToggleZen(newState);
  }, [zenMode, onToggleZen]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
  }

  return (
    <div className={clsx("flex flex-col h-full bg-slate-900 overflow-hidden relative transition-all duration-500", zenMode ? "fixed inset-0 z-50 rounded-none" : "rounded-2xl border border-white/10")}>

      {/* Zen Mode Exit Button (Floating) - Only visible when header is HIDDEN/Hovered out in Zen Mode? 
          Actually, let's make it always visible in the corner if Zen is active, or rely on the header hover.
          User asked for "button to undo", so a persistent floating button is safest if they don't discover hover.
      */}
      <AnimatePresence>
        {zenMode && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={toggleZen}
            className="absolute top-4 right-4 z-50 p-3 bg-red-500/80 hover:bg-red-500 text-white rounded-full shadow-lg backdrop-blur-md transition-all group"
            title="Exit Full Screen (Esc)"
          >
            <Minimize2 className="w-6 h-6" />
            <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
              Exit Zen Mode (Esc)
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Navigation / Header Bar */}
      <div className={clsx("flex items-center justify-between p-4 bg-slate-800/90 backdrop-blur border-b border-white/10 z-20 absolute top-0 left-0 right-0 transition-transform duration-300", zenMode && "-translate-y-full hover:translate-y-0")}>

        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-slate-400">
          {!zenMode && (
            <>
              <Link href="/" className="hover:text-cyan-400 transition-colors"><HomeIcon className="w-4 h-4" /></Link>
              <span>/</span>
              <Link href={`/${encodeURIComponent(subjectName)}`} className="hover:text-cyan-400 transition-colors truncate max-w-[100px]">{subjectName}</Link>
              <span>/</span>
            </>
          )}
          <span className="text-slate-200 font-medium truncate max-w-[150px]">{pdfName}</span>
        </div>

        {/* Page Control */}
        <div className="flex items-center gap-2 bg-slate-950/50 rounded-lg p-1 border border-white/5">
          <button
            onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
            disabled={pageNumber <= 1}
            className="p-1.5 hover:bg-white/10 rounded-md disabled:opacity-50 transition-colors"
            title="Previous Page (Left Arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono w-20 text-center">
            {pageNumber} / {numPages || '--'}
          </span>
          <button
            onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages || prev))}
            disabled={pageNumber >= (numPages || 1)}
            className="p-1.5 hover:bg-white/10 rounded-md disabled:opacity-50 transition-colors"
            title="Next Page (Right Arrow)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleBookmark}
            className={clsx("p-2 rounded-lg transition-colors", isBookmarked ? "text-yellow-400" : "text-slate-400 hover:bg-white/10")}
            title="Bookmark this page"
          >
            <Bookmark className={clsx("w-5 h-5", isBookmarked && "fill-yellow-400")} />
          </button>

          <div className="h-6 w-px bg-white/10 mx-1" />

          <button
            onClick={() => setScale(prev => Math.max(prev - 0.2, 0.5))}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-5 h-5" />
          </button>

          <button
            onClick={() => setScale(1.0)}
            className="text-xs font-medium w-12 text-center hover:text-cyan-400 transition-colors"
            title="Reset Zoom (0)"
          >
            {Math.round(scale * 100)}%
          </button>

          <button
            onClick={() => setScale(prev => Math.min(prev + 0.2, 2.5))}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-5 h-5" />
          </button>

          <div className="h-6 w-px bg-white/10 mx-1" />

          <button
            onClick={toggleZen}
            className={clsx("p-2 rounded-lg transition-colors", zenMode ? "text-cyan-400 bg-cyan-900/20" : "text-slate-400 hover:bg-white/10")}
            title={zenMode ? "Exit Zen Mode (Esc)" : "Enter Zen Mode"}
          >
            {zenMode ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Reading Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-slate-950 z-30">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-500 to-cyan-500"
          initial={{ width: 0 }}
          animate={{ width: `${(pageNumber / (numPages || 1)) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className={clsx("flex-1 overflow-auto flex justify-center bg-slate-950 relative custom-scrollbar", zenMode ? "p-0" : "p-8 pt-16")}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          </div>
        )}

        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          className={clsx("shadow-2xl transition-all duration-300", zenMode ? "my-0" : "my-4")}
          loading={
            <div className="flex items-center gap-2 text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading PDF...
            </div>
          }
          error={
            <div className="text-red-400 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              Failed to load PDF. Please check if the file exists.
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            onRenderError={() => { }} // Suppress harmless render cancellation errors
            className="rounded-lg overflow-hidden shadow-2xl border border-white/5 bg-white"
          />
        </Document>
      </div>
    </div>
  );
}
