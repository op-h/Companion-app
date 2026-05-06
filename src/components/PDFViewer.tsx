'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Home as HomeIcon,
  Columns2,
  Loader2,
  Maximize2,
  Minimize2,
  ScrollText,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import Link from 'next/link';
import { readLocalStorageJson, writeLocalStorage } from '@/lib/client-storage';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  url: string;
  subjectName: string;
  pdfName: string;
  onToggleZen: (isZen: boolean) => void;
}

export default function PDFViewer({ url, subjectName, pdfName, onToggleZen }: PDFViewerProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const pageNumberRef = useRef(1);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(() => {
    const savedPage = readLocalStorageJson<number>(`progress-${pdfName}`, 1);
    return Number.isFinite(savedPage) ? savedPage : 1;
  });
  const [scale, setScale] = useState(1);
  const [fitWidth, setFitWidth] = useState(760);
  const [zenMode, setZenMode] = useState(false);
  const [viewMode, setViewMode] = useState<'page' | 'scroll'>('page');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [bookmarks, setBookmarks] = useState<number[]>(() => {
    return readLocalStorageJson<number[]>(`bookmarks-${pdfName}`, []);
  });
  const isBookmarked = bookmarks.includes(pageNumber);
  const progressWidth = viewMode === 'scroll' ? scrollProgress : (pageNumber / (numPages || 1)) * 100;

  useEffect(() => {
    pageNumberRef.current = pageNumber;
  }, [pageNumber]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const observer = new ResizeObserver(([entry]) => {
      const nextWidth = Math.max(280, Math.min(980, entry.contentRect.width - 32));
      setFitWidth(nextWidth);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const toggleZen = useCallback(() => {
    setZenMode((current) => {
      onToggleZen(!current);
      return !current;
    });
  }, [onToggleZen]);

  useEffect(() => {
    const savedAt = Date.now();
    writeLocalStorage(`progress-${pdfName}`, pageNumber.toString());
    writeLocalStorage(
      'last-read-pdf',
      JSON.stringify({ subject: subjectName, name: pdfName, page: pageNumber, date: savedAt })
    );

    const progressMap = readLocalStorageJson<Record<string, Record<string, { page?: number; totalPages?: number; updatedAt?: number }>>>(
      'study-progress',
      {}
    );
    const subjectProgress = progressMap[subjectName] || {};
    const previous = subjectProgress[pdfName] || {};

    progressMap[subjectName] = {
      ...subjectProgress,
      [pdfName]: {
        page: pageNumber,
        totalPages: numPages || previous.totalPages || pageNumber,
        updatedAt: savedAt,
      },
    };

    writeLocalStorage('study-progress', JSON.stringify(progressMap));
  }, [numPages, pageNumber, pdfName, subjectName]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement).tagName === 'INPUT' || (event.target as HTMLElement).tagName === 'TEXTAREA') return;

      if (viewMode === 'page' && event.key === 'ArrowLeft') setPageNumber((current) => Math.max(current - 1, 1));
      if (viewMode === 'page' && event.key === 'ArrowRight') setPageNumber((current) => Math.min(current + 1, numPages || current));
      if (event.key === 'Escape' && zenMode) toggleZen();
      if (event.key === '+' || event.key === '=') setScale((current) => Math.min(current + 0.15, 2.5));
      if (event.key === '-') setScale((current) => Math.max(current - 0.15, 0.5));
      if (event.key === '0') setScale(1);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [numPages, toggleZen, viewMode, zenMode]);

  const handleScroll = useCallback(() => {
    if (viewMode !== 'scroll' || !scrollRef.current || !numPages) return;

    const container = scrollRef.current;
    const maxScroll = container.scrollHeight - container.clientHeight;
    const nextProgress = maxScroll > 0 ? (container.scrollTop / maxScroll) * 100 : 100;
    setScrollProgress(Math.min(100, Math.max(0, nextProgress)));

    const anchorY = container.getBoundingClientRect().top + Math.min(180, container.clientHeight * 0.35);
    let visiblePage = pageNumberRef.current;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (let page = 1; page <= numPages; page += 1) {
      const element = pageRefs.current[page];
      if (!element) continue;
      const rect = element.getBoundingClientRect();
      const distance = Math.abs(rect.top - anchorY);

      if (distance < closestDistance) {
        closestDistance = distance;
        visiblePage = page;
      }
    }

    setPageNumber((current) => (current === visiblePage ? current : visiblePage));
  }, [numPages, viewMode]);

  useEffect(() => {
    if (viewMode !== 'scroll') return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        pageRefs.current[pageNumberRef.current]?.scrollIntoView({ block: 'start' });
        handleScroll();
      });
    });
  }, [handleScroll, numPages, viewMode]);

  const toggleBookmark = () => {
    const next = isBookmarked
      ? bookmarks.filter((page: number) => page !== pageNumber)
      : [...bookmarks, pageNumber];

    writeLocalStorage(`bookmarks-${pdfName}`, JSON.stringify(next));
    setBookmarks(next);
  };

  const goToPage = (targetPage: number) => {
    const nextPage = Math.min(Math.max(targetPage, 1), numPages || 1);
    setPageNumber(nextPage);

    if (viewMode === 'scroll') {
      pageRefs.current[nextPage]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className={`pdf-frame ${zenMode ? 'is-zen' : ''}`}>
      {zenMode && (
        <button className="btn btn-primary btn-icon zen-exit" type="button" onClick={toggleZen} title="Exit focus mode">
          <Minimize2 size={18} />
        </button>
      )}

      <div className={`pdf-toolbar ${zenMode ? 'is-hidden' : ''}`}>
        <div className="crumbs">
          <Link href="/" title="Dashboard">
            <HomeIcon size={15} />
          </Link>
          <span>/</span>
          <Link className="truncate desktop-only" href={`/${encodeURIComponent(subjectName)}`}>
            {subjectName}
          </Link>
          <span className="desktop-only">/</span>
          <span className="truncate">{pdfName}</span>
        </div>

        <div className="toolbar-group desktop-reader-controls">
          <button className="btn btn-icon" type="button" disabled={pageNumber <= 1} onClick={() => goToPage(pageNumber - 1)}>
            <ChevronLeft size={18} />
          </button>
          <span className="page-counter">{pageNumber} / {numPages || '--'}</span>
          <button className="btn btn-icon" type="button" disabled={pageNumber >= (numPages || 1)} onClick={() => goToPage(pageNumber + 1)}>
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="toolbar-group desktop-reader-controls">
          <button
            className={`btn ${viewMode === 'page' ? 'is-active' : ''}`}
            type="button"
            onClick={() => setViewMode('page')}
            title="Page by page"
          >
            <Columns2 size={16} />
            Page
          </button>
          <button
            className={`btn ${viewMode === 'scroll' ? 'is-active' : ''}`}
            type="button"
            onClick={() => setViewMode('scroll')}
            title="Scrollable PDF"
          >
            <ScrollText size={16} />
            Scroll
          </button>
          <button className={`btn btn-icon ${isBookmarked ? 'is-active' : ''}`} type="button" onClick={toggleBookmark} title="Bookmark page">
            <Bookmark size={18} fill={isBookmarked ? 'var(--accent)' : 'none'} />
          </button>
          <button className="btn btn-icon" type="button" onClick={() => setScale((current) => Math.max(current - 0.15, 0.5))}>
            <ZoomOut size={18} />
          </button>
          <button className="btn" type="button" onClick={() => setScale(1)}>
            {Math.round(scale * 100)}%
          </button>
          <button className="btn btn-icon" type="button" onClick={() => setScale((current) => Math.min(current + 0.15, 2.5))}>
            <ZoomIn size={18} />
          </button>
          <button className="btn btn-icon" type="button" onClick={toggleZen} title="Focus mode">
            <Maximize2 size={18} />
          </button>
        </div>
      </div>

      <div className="progress-line">
        <div className="progress-fill" style={{ width: `${progressWidth}%` }} />
      </div>

      <div
        ref={scrollRef}
        className={`pdf-scroll ${viewMode === 'scroll' ? 'is-continuous' : ''}`}
        onScroll={handleScroll}
      >
        <Document
          file={url}
          onLoadSuccess={({ numPages: totalPages }) => setNumPages(totalPages)}
          loading={<div className="loading-state"><Loader2 size={16} className="spin" /> Loading PDF...</div>}
          error={<div className="error-state">Failed to load PDF. Check the file path.</div>}
        >
          {viewMode === 'page' ? (
            <Page
              pageNumber={pageNumber}
              width={fitWidth * scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="pdf-page"
            />
          ) : (
            <div className="pdf-page-stack">
              {Array.from({ length: numPages || 0 }, (_, index) => (
                <div
                  className="pdf-page-anchor"
                  key={index + 1}
                  ref={(element) => {
                    pageRefs.current[index + 1] = element;
                  }}
                >
                  <Page
                    pageNumber={index + 1}
                    width={fitWidth * scale}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    className="pdf-page"
                  />
                </div>
              ))}
            </div>
          )}
        </Document>
      </div>

      <div className="mobile-pdf-controls">
        <div className="mobile-control-row">
          <button className="btn btn-icon" type="button" disabled={pageNumber <= 1} onClick={() => goToPage(pageNumber - 1)}>
            <ChevronLeft size={18} />
          </button>
          <span className="page-counter">{pageNumber} / {numPages || '--'}</span>
          <button className="btn btn-icon" type="button" disabled={pageNumber >= (numPages || 1)} onClick={() => goToPage(pageNumber + 1)}>
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="mobile-control-row">
          <button className={`btn btn-icon ${viewMode === 'page' ? 'is-active' : ''}`} type="button" onClick={() => setViewMode('page')} title="Page by page">
            <Columns2 size={17} />
          </button>
          <button className={`btn btn-icon ${viewMode === 'scroll' ? 'is-active' : ''}`} type="button" onClick={() => setViewMode('scroll')} title="Scrollable PDF">
            <ScrollText size={17} />
          </button>
          <button className="btn btn-icon" type="button" onClick={() => setScale((current) => Math.max(current - 0.15, 0.5))}>
            <ZoomOut size={17} />
          </button>
          <button className="btn mobile-zoom-readout" type="button" onClick={() => setScale(1)}>
            {Math.round(scale * 100)}%
          </button>
          <button className="btn btn-icon" type="button" onClick={() => setScale((current) => Math.min(current + 0.15, 2.5))}>
            <ZoomIn size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
