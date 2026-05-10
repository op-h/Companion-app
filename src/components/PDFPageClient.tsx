'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, Home } from 'lucide-react';

const PDFViewer = dynamic(() => import('@/components/PDFViewer'), {
  ssr: false,
  loading: () => <div className="loading-state">Loading reader...</div>,
});

interface PDFPageClientProps {
  subjectName: string;
  pdfName: string;
  pdfUrl: string;
}

export default function PDFPageClient({ subjectName, pdfName, pdfUrl }: PDFPageClientProps) {
  const [zenMode, setZenMode] = useState(false);

  return (
    <div className="reader-shell">
      <header className={`reader-topbar ${zenMode ? 'is-hidden' : ''}`}>
        <div className="crumbs">
          <Link className="btn btn-icon" href={`/${encodeURIComponent(subjectName)}`} prefetch={false} title="Back to materials">
            <ArrowLeft size={18} />
          </Link>
          <div className="card-copy">
            <p className="label truncate">{subjectName}</p>
            <h1 className="card-title truncate">{pdfName}</h1>
          </div>
        </div>

        <Link className="btn btn-icon" href="/" prefetch={false} title="Dashboard">
          <Home size={18} />
        </Link>
      </header>

      <div className="reader-main reader-main-single">
        <section className="reader-content">
          <PDFViewer
            url={pdfUrl}
            subjectName={subjectName}
            pdfName={pdfName}
            onToggleZen={setZenMode}
          />
        </section>
      </div>
    </div>
  );
}
