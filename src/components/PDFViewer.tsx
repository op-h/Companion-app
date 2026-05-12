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

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const pdfjsWithVerbosity = pdfjs as typeof pdfjs & {
  setVerbosityLevel?: (level: number) => void;
  VerbosityLevel?: { ERRORS: number };
};

pdfjsWithVerbosity.setVerbosityLevel?.(pdfjsWithVerbosity.VerbosityLevel?.ERRORS ?? 0);

const PAGE_PRELOAD_RADIUS = 1;
const SCROLL_RENDER_RADIUS = 4;
const AUTO_REFRESH_INTERVAL_MS = 15 * 60 * 1000;
const REFRESH_NOTICE_MS = 1200;
const PDF_LOAD_OPTIONS = {
  disableAutoFetch: false,
  disableStream: false,
  rangeChunkSize: 1024 * 1024,
};

interface ReaderViewState {
  pageNumber: number;
  scale: number;
  scrollProgress: number;
  scrollTop: number;
  updatedAt: number;
  viewMode: 'page' | 'scroll';
}

interface PDFViewerProps {
  url: string;
  subjectName: string;
  pdfName: string;
  onToggleZen: (isZen: boolean) => void;
}

export default function PDFViewer({ url, subjectName, pdfName, onToggleZen }: PDFViewerProps) {
  const readerStateKey = `reader-view-state:${subjectName}:${pdfName}`;
  const [initialReaderState] = useState(() => readLocalStorageJson<ReaderViewState | null>(readerStateKey, null));
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const pageNumberRef = useRef(1);
  const pendingScrollTopRef = useRef(
    initialReaderState?.viewMode === 'scroll' && Number.isFinite(initialReaderState.scrollTop)
      ? initialReaderState.scrollTop
      : null
  );
  const refreshTimeoutRef = useRef<number | null>(null);
  const isRefreshingRef = useRef(false);
  const nextRefreshAtRef = useRef<number | null>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(() => {
    if (initialReaderState?.pageNumber) return Math.max(1, Math.round(initialReaderState.pageNumber));
    const savedPage = readLocalStorageJson<number>(`progress-${pdfName}`, 1);
    return Number.isFinite(savedPage) ? savedPage : 1;
  });
  const [scale, setScale] = useState(() => clampNumber(initialReaderState?.scale, 0.5, 2.5, 1));
  const [fitWidth, setFitWidth] = useState(760);
  const [zenMode, setZenMode] = useState(false);
  const [viewMode, setViewMode] = useState<'page' | 'scroll'>(() =>
    initialReaderState?.viewMode === 'scroll' ? 'scroll' : 'page'
  );
  const [scrollProgress, setScrollProgress] = useState(() => clampNumber(initialReaderState?.scrollProgress, 0, 100, 0));
  const [renderedScrollPages, setRenderedScrollPages] = useState<Set<number>>(() => new Set([1]));
  const [pageHeights, setPageHeights] = useState<Record<number, number>>({});
  const [refreshSeconds, setRefreshSeconds] = useState(Math.round(AUTO_REFRESH_INTERVAL_MS / 1000));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>(() => {
    return readLocalStorageJson<number[]>(`bookmarks-${pdfName}`, []);
  });
  const isBookmarked = bookmarks.includes(pageNumber);
  const progressWidth = viewMode === 'scroll' ? scrollProgress : (pageNumber / (numPages || 1)) * 100;
  const pageWidth = fitWidth * scale;
  const estimatedPageHeight = Math.max(360, Math.round(pageWidth * 1.32));
  const cappedDevicePixelRatio =
    typeof window === 'undefined' ? 1 : Math.max(1, Math.min(window.devicePixelRatio || 1, 2));

  const renderScrollWindow = useCallback((centerPage: number) => {
    if (!numPages) return;

    setRenderedScrollPages((current) => {
      const next = getPageWindow(centerPage, numPages, SCROLL_RENDER_RADIUS);
      return arePageSetsEqual(current, next) ? current : next;
    });
  }, [numPages]);

  useEffect(() => {
    pageNumberRef.current = pageNumber;
  }, [pageNumber]);

  useEffect(() => {
    return () => {
      if (scrollFrameRef.current !== null) {
        cancelAnimationFrame(scrollFrameRef.current);
      }

      if (refreshTimeoutRef.current !== null) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

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

  const saveReaderViewState = useCallback(() => {
    const container = scrollRef.current;

    writeLocalStorage(
      readerStateKey,
      JSON.stringify({
        pageNumber: pageNumberRef.current,
        scale,
        scrollProgress,
        scrollTop: container?.scrollTop || 0,
        updatedAt: Date.now(),
        viewMode,
      } satisfies ReaderViewState)
    );
  }, [readerStateKey, scale, scrollProgress, viewMode]);

  useEffect(() => {
    const timeout = window.setTimeout(saveReaderViewState, 180);
    return () => window.clearTimeout(timeout);
  }, [pageNumber, saveReaderViewState, scale, scrollProgress, viewMode]);

  useEffect(() => {
    window.addEventListener('beforeunload', saveReaderViewState);
    return () => {
      saveReaderViewState();
      window.removeEventListener('beforeunload', saveReaderViewState);
    };
  }, [saveReaderViewState]);

  useEffect(() => {
    nextRefreshAtRef.current = Date.now() + AUTO_REFRESH_INTERVAL_MS;

    const timer = window.setInterval(() => {
      const nextRefreshAt = nextRefreshAtRef.current || Date.now() + AUTO_REFRESH_INTERVAL_MS;
      const remainingMs = nextRefreshAt - Date.now();
      setRefreshSeconds(Math.max(0, Math.ceil(remainingMs / 1000)));

      if (remainingMs > 0 || isRefreshingRef.current) return;

      if (shouldDelayMemoryRefresh()) {
        nextRefreshAtRef.current = Date.now() + 30 * 1000;
        return;
      }

      isRefreshingRef.current = true;
      saveReaderViewState();
      setIsRefreshing(true);

      refreshTimeoutRef.current = window.setTimeout(() => {
        window.location.reload();
      }, REFRESH_NOTICE_MS);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [saveReaderViewState]);

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

  const measureScrollPosition = useCallback(() => {
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
    renderScrollWindow(visiblePage);
  }, [numPages, renderScrollWindow, viewMode]);

  const handleScroll = useCallback(() => {
    if (scrollFrameRef.current !== null) return;

    scrollFrameRef.current = requestAnimationFrame(() => {
      scrollFrameRef.current = null;
      measureScrollPosition();
    });
  }, [measureScrollPosition]);

  useEffect(() => {
    if (viewMode !== 'scroll') return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const pendingScrollTop = pendingScrollTopRef.current;

        if (pendingScrollTop !== null && scrollRef.current) {
          scrollRef.current.scrollTop = pendingScrollTop;
          pendingScrollTopRef.current = null;
        } else {
          pageRefs.current[pageNumberRef.current]?.scrollIntoView({ block: 'start' });
        }

        measureScrollPosition();
      });
    });
  }, [measureScrollPosition, numPages, viewMode]);

  useEffect(() => {
    if (viewMode !== 'scroll' || !numPages || !scrollRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const page = Number((entry.target as HTMLElement).dataset.page);
          if (Number.isFinite(page)) renderScrollWindow(page);
        });
      },
      {
        root: scrollRef.current,
        rootMargin: '900px 0px',
      }
    );

    for (let page = 1; page <= numPages; page += 1) {
      const element = pageRefs.current[page];
      if (element) observer.observe(element);
    }

    return () => observer.disconnect();
  }, [numPages, renderScrollWindow, viewMode]);

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
    renderScrollWindow(nextPage);

    if (viewMode === 'scroll') {
      pageRefs.current[nextPage]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const updateViewMode = (nextViewMode: 'page' | 'scroll') => {
    if (nextViewMode === 'page') {
      setRenderedScrollPages(getPageWindow(pageNumber, numPages || pageNumber, SCROLL_RENDER_RADIUS));
    } else {
      pendingScrollTopRef.current = null;
      renderScrollWindow(pageNumber);
    }

    setViewMode(nextViewMode);
  };

  const recordPageHeight = (targetPage: number, page: { height: number }) => {
    setPageHeights((current) => {
      const nextHeight = Math.round(page.height);
      return current[targetPage] === nextHeight ? current : { ...current, [targetPage]: nextHeight };
    });
  };

  const renderPdfPage = (targetPage: number) => (
    <Page
      pageNumber={targetPage}
      width={pageWidth}
      devicePixelRatio={cappedDevicePixelRatio}
      renderTextLayer={true}
      renderAnnotationLayer={false}
      onRenderSuccess={(page) => recordPageHeight(targetPage, page)}
      onRenderTextLayerError={() => undefined}
      className="pdf-page"
      loading={<div className="pdf-page pdf-page-loading" style={{ width: pageWidth, height: estimatedPageHeight }}>Loading page {targetPage}...</div>}
    />
  );

  return (
    <div className={`pdf-frame ${zenMode ? 'is-zen' : ''}`}>
      {zenMode && (
        <button className="btn btn-primary btn-icon zen-exit" type="button" onClick={toggleZen} title="Exit focus mode">
          <Minimize2 size={18} />
        </button>
      )}

      <div className={`pdf-toolbar ${zenMode ? 'is-hidden' : ''}`}>
        <div className="crumbs">
          <Link href="/" prefetch={false} title="Dashboard">
            <HomeIcon size={15} />
          </Link>
          <span>/</span>
          <Link className="truncate desktop-only" href={`/${encodeURIComponent(subjectName)}`} prefetch={false}>
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
          <span className={`auto-refresh-chip ${isRefreshing ? 'is-refreshing' : ''}`}>
            {isRefreshing ? 'Refreshing' : `MEM ${formatRefreshTime(refreshSeconds)}`}
          </span>
          <button
            className={`btn ${viewMode === 'page' ? 'is-active' : ''}`}
            type="button"
            onClick={() => updateViewMode('page')}
            title="Page by page"
          >
            <Columns2 size={16} />
            Page
          </button>
          <button
            className={`btn ${viewMode === 'scroll' ? 'is-active' : ''}`}
            type="button"
            onClick={() => updateViewMode('scroll')}
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
          options={PDF_LOAD_OPTIONS}
          onLoadSuccess={({ numPages: totalPages }) => {
            setNumPages(totalPages);
            setPageNumber((current) => Math.min(Math.max(current, 1), totalPages));
            setRenderedScrollPages(getPageWindow(pageNumberRef.current, totalPages, SCROLL_RENDER_RADIUS));
          }}
          loading={<div className="loading-state"><Loader2 size={16} className="spin" /> Loading PDF...</div>}
          error={<div className="error-state">Failed to load PDF. Check the file path.</div>}
        >
          {viewMode === 'page' ? (
            <div className="pdf-single-page-stack">
              {Array.from(getPageWindow(pageNumber, numPages || pageNumber, PAGE_PRELOAD_RADIUS)).map((targetPage) => {
                const isActivePage = targetPage === pageNumber;

                return (
                  <div
                    aria-hidden={!isActivePage}
                    className={isActivePage ? 'pdf-single-page-active' : 'pdf-single-page-preload'}
                    key={targetPage}
                  >
                    {renderPdfPage(targetPage)}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="pdf-page-stack">
              {Array.from({ length: numPages || 0 }, (_, index) => {
                const targetPage = index + 1;
                const shouldRenderPage = renderedScrollPages.has(targetPage);

                return (
                  <div
                    className="pdf-page-anchor"
                    data-page={targetPage}
                    key={targetPage}
                    ref={(element) => {
                      pageRefs.current[targetPage] = element;
                    }}
                  >
                    {shouldRenderPage ? (
                      renderPdfPage(targetPage)
                    ) : (
                      <div
                        className="pdf-page pdf-page-placeholder"
                        style={{ width: pageWidth, height: pageHeights[targetPage] || estimatedPageHeight }}
                      >
                        <span>Page {targetPage}</span>
                      </div>
                    )}
                  </div>
                );
              })}
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
          <button
            className={`btn btn-icon ${viewMode === 'page' ? 'is-active' : ''}`}
            type="button"
            onClick={() => updateViewMode('page')}
            title="Page by page"
          >
            <Columns2 size={17} />
          </button>
          <button
            className={`btn btn-icon ${viewMode === 'scroll' ? 'is-active' : ''}`}
            type="button"
            onClick={() => updateViewMode('scroll')}
            title="Scrollable PDF"
          >
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

      {isRefreshing && (
        <div className="memory-refresh-overlay" role="status" aria-live="polite">
          <Loader2 size={16} className="spin" />
          Refreshing reader memory...
        </div>
      )}
    </div>
  );
}

function getPageWindow(centerPage: number, totalPages: number, radius: number) {
  const pages = new Set<number>();

  for (
    let page = Math.max(1, centerPage - radius);
    page <= Math.min(totalPages, centerPage + radius);
    page += 1
  ) {
    pages.add(page);
  }

  return pages;
}

function arePageSetsEqual(first: Set<number>, second: Set<number>) {
  if (first.size !== second.size) return false;

  for (const page of first) {
    if (!second.has(page)) return false;
  }

  return true;
}

function clampNumber(value: number | undefined, min: number, max: number, fallback: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function formatRefreshTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function shouldDelayMemoryRefresh() {
  const activeElement = document.activeElement;
  const activeTag = activeElement?.tagName;

  if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeElement?.getAttribute('contenteditable') === 'true') {
    return true;
  }

  return Boolean(window.getSelection()?.toString());
}
