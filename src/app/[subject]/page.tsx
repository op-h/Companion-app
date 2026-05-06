import Link from 'next/link';
import { getSubjectPDFs } from '@/lib/content';
import { ArrowLeft } from 'lucide-react';
import SubjectMaterialsClient from '@/components/SubjectMaterialsClient';

export default async function SubjectPage(props: { params: Promise<{ subject: string }> }) {
  const params = await props.params;
  const subjectName = decodeURIComponent(params.subject);
  const pdfs = await getSubjectPDFs(subjectName);

  return (
    <main className="app-shell">
      <div className="subject-page">
        <header className="topbar">
          <div>
            <Link href="/" className="btn">
              <ArrowLeft size={16} />
              Dashboard
            </Link>
            <div className="subject-heading">
              <div className="brand-kicker">Materials</div>
              <h1 className="page-title">
                {subjectName}<span className="cursor-block">█</span>
              </h1>
            </div>
          </div>
          <div className="terminal-status">
            <span className="status-dot" />
            {pdfs.length} PDFs indexed
          </div>
        </header>

        <p className="intro-copy">
          Scroll the material stack, open a lecture, and your reading page will be saved automatically.
        </p>

        <SubjectMaterialsClient subjectName={subjectName} pdfs={pdfs} />
      </div>
    </main>
  );
}
