'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, FileText, Search } from 'lucide-react';
import { useLocalStorageJson } from '@/lib/client-storage';

interface MaterialProgress {
  page: number;
  totalPages: number;
  updatedAt: number;
}

type ProgressMap = Record<string, Record<string, MaterialProgress>>;

const EMPTY_PROGRESS_MAP: ProgressMap = {};

export default function SubjectMaterialsClient({
  subjectName,
  pdfs,
}: {
  subjectName: string;
  pdfs: string[];
}) {
  const [search, setSearch] = useState('');
  const progressMap = useLocalStorageJson<ProgressMap>('study-progress', EMPTY_PROGRESS_MAP);

  const filteredPdfs = useMemo(
    () => pdfs.filter((pdf) => pdf.toLowerCase().includes(search.toLowerCase())),
    [pdfs, search]
  );

  const subjectProgress = progressMap[subjectName] || {};

  return (
    <section className="panel">
      <div className="panel-head material-panel-head">
        <div>
          <p className="label">Subject Archive</p>
          <h2 className="card-title">Lecture materials</h2>
        </div>
        <span className="card-meta">{filteredPdfs.length}/{pdfs.length} files</span>
      </div>

      <div className="material-search">
        <div className="search-wrap">
          <Search className="search-icon" />
          <input
            className="search-box"
            type="text"
            placeholder="Search material names..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      <div className="materials-panel">
        {filteredPdfs.length > 0 ? (
          <div className="materials-list">
            {filteredPdfs.map((pdf, index) => {
              const progress = subjectProgress[pdf];
              const percent = getMaterialPercent(progress);

              return (
                <Link
                  key={pdf}
                  href={`/${encodeURIComponent(subjectName)}/${encodeURIComponent(pdf)}`}
                  className="material-card"
                  style={{ animationDelay: `${index * 28}ms` }}
                >
                  <div className="card-icon">
                    <FileText size={20} />
                  </div>
                  <div className="card-copy">
                    <div className="subject-card-head">
                      <h3 className="card-title truncate">{pdf}</h3>
                      <span className="progress-percent">{percent}%</span>
                    </div>
                    <p className="card-meta">
                      {progress ? `page ${progress.page}/${progress.totalPages}` : 'not opened yet'}
                    </p>
                    <div className="subject-progress" aria-label={`${pdf} reading progress`}>
                      <span style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                  <ArrowRight size={18} color="var(--accent)" />
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">No materials match your search.</div>
        )}
      </div>
    </section>
  );
}

function getMaterialPercent(progress?: MaterialProgress) {
  if (!progress?.totalPages) return 0;
  return Math.min(100, Math.round((Math.min(progress.page, progress.totalPages) / progress.totalPages) * 100));
}
