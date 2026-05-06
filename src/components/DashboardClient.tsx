'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Folder, Play, Search } from 'lucide-react';
import ExamCountdown from './ExamCountdown';
import { useLocalStorageJson } from '@/lib/client-storage';

interface Subject {
  name: string;
  pdfCount: number;
  pdfs: string[];
}

interface LastRead {
  subject: string;
  name: string;
  page: number;
  date: number;
}

interface MaterialProgress {
  page: number;
  totalPages: number;
  updatedAt: number;
}

type ProgressMap = Record<string, Record<string, MaterialProgress>>;

const EMPTY_PROGRESS_MAP: ProgressMap = {};

export default function DashboardClient({ subjects }: { subjects: Subject[] }) {
  const [search, setSearch] = useState('');
  const lastRead = useLocalStorageJson<LastRead | null>('last-read-pdf', null);
  const progressMap = useLocalStorageJson<ProgressMap>('study-progress', EMPTY_PROGRESS_MAP);

  const filteredSubjects = useMemo(
    () => subjects.filter((subject) => subject.name.toLowerCase().includes(search.toLowerCase())),
    [subjects, search]
  );

  const totalMaterials = subjects.reduce((sum, subject) => sum + subject.pdfCount, 0);

  return (
    <main className="app-shell">
      <div className="dashboard">
        <header className="topbar">
          <div>
            <div className="brand-kicker">Study Companion</div>
            <h1 className="brand-title">
              course terminal<span className="cursor-block">█</span>
            </h1>
          </div>
          <div className="terminal-status">
            <span className="status-dot" />
            {subjects.length} subjects / {totalMaterials} materials
          </div>
        </header>

        <div className="control-row">
          <div className="search-wrap">
            <Search className="search-icon" />
            <input
              className="search-box"
              type="text"
              placeholder="Search subjects..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Link className="btn btn-primary" href={lastRead ? `/${encodeURIComponent(lastRead.subject)}/${encodeURIComponent(lastRead.name)}` : '#'}>
            <Play size={16} />
            Resume
          </Link>
        </div>

        {lastRead && (
          <Link
            className="continue-card"
            href={`/${encodeURIComponent(lastRead.subject)}/${encodeURIComponent(lastRead.name)}`}
          >
            <div className="card-icon">
              <BookOpen size={20} />
            </div>
            <div className="card-copy">
              <p className="label">Continue Reading</p>
              <h2 className="card-title truncate">{lastRead.name}</h2>
              <p className="card-meta">{lastRead.subject} / page {lastRead.page}</p>
            </div>
            <ArrowRight size={18} color="var(--accent)" />
          </Link>
        )}

        <div className="section-stack">
          <ExamCountdown />

          <section className="panel">
            <div className="panel-head">
              <div>
                <p className="label">Library</p>
                <h2 className="card-title">Subjects</h2>
              </div>
              <span className="card-meta">{filteredSubjects.length} visible</span>
            </div>
            <div className="panel-body">
              {filteredSubjects.length > 0 ? (
                <div className="dashboard-grid">
                  {filteredSubjects.map((subject, index) => (
                    <SubjectCard
                      key={subject.name}
                      subject={subject}
                      index={index}
                      progress={getSubjectProgress(subject, progressMap)}
                    />
                  ))}
                </div>
              ) : (
                <div className="empty-state">No subjects match your search.</div>
              )}
            </div>
          </section>
        </div>

        <footer className="site-footer">
          Create by <span>OPH</span>
        </footer>
      </div>
    </main>
  );
}

function SubjectCard({
  subject,
  index,
  progress,
}: {
  subject: Subject;
  index: number;
  progress: { opened: number; percent: number };
}) {
  return (
    <Link
      href={`/${encodeURIComponent(subject.name)}`}
      className="subject-card subject-card-progress"
      style={{ animationDelay: `${index * 35}ms` }}
    >
      <div className="card-icon">
        <Folder size={20} />
      </div>
      <div className="card-copy">
        <div className="subject-card-head">
          <h3 className="card-title truncate">{subject.name}</h3>
          <span className="progress-percent">{progress.percent}%</span>
        </div>
        <p className="card-meta">
          {progress.opened}/{subject.pdfCount} opened / {subject.pdfCount} PDF resources
        </p>
        <div className="subject-progress" aria-label={`${subject.name} study progress`}>
          <span style={{ width: `${progress.percent}%` }} />
        </div>
      </div>
      <ArrowRight size={18} color="var(--text-muted)" />
    </Link>
  );
}

function getSubjectProgress(subject: Subject, progressMap: ProgressMap) {
  const subjectProgress = progressMap[subject.name] || {};
  const pdfs = subject.pdfs || [];
  const opened = pdfs.filter((pdf) => subjectProgress[pdf]?.page > 0).length;
  const knownProgress = pdfs
    .map((pdf) => subjectProgress[pdf])
    .filter((progress): progress is MaterialProgress => Boolean(progress?.totalPages));

  const totalPages = knownProgress.reduce((sum, progress) => sum + progress.totalPages, 0);
  const readPages = knownProgress.reduce((sum, progress) => sum + Math.min(progress.page, progress.totalPages), 0);
  const fallbackPercent = subject.pdfCount > 0 ? Math.round((opened / subject.pdfCount) * 100) : 0;
  const percent = totalPages > 0 ? Math.round((readPages / totalPages) * 100) : fallbackPercent;

  return { opened, percent };
}
