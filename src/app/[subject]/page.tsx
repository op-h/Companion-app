import Link from 'next/link';
import { getSubjectPDFs } from '@/lib/content';
import { ArrowLeft, FileText, PlayCircle } from 'lucide-react';

interface Params {
  subject: Promise<string>;
}

export default async function SubjectPage(props: { params: Promise<{ subject: string }> }) {
  const params = await props.params;
  const subjectName = decodeURIComponent(params.subject);
  const pdfs = await getSubjectPDFs(subjectName);

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-cyan-500/30">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pointer-events-none" />

      <main className="relative z-10 container mx-auto px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>

        <header className="mb-12">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-200 via-white to-blue-200 mb-2">
            {subjectName}
          </h1>
          <p className="text-slate-400">
            {pdfs.length} study materials available
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pdfs.map((pdf) => (
            <Link
              key={pdf}
              href={`/${encodeURIComponent(subjectName)}/${encodeURIComponent(pdf)}`}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl blur-lg opacity-0 group-hover:opacity-15 transition-opacity duration-300" />
              <div className="relative p-4 bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-xl hover:border-cyan-500/30 transition-colors flex items-center gap-4">
                <div className="p-3 bg-red-500/10 rounded-lg text-red-400 group-hover:bg-red-500/20 transition-colors">
                  <FileText className="w-6 h-6" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-200 truncate group-hover:text-cyan-300 transition-colors">
                    {pdf}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500 font-mono">PDF</span>
                  </div>
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <PlayCircle className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
            </Link>
          ))}

          {pdfs.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 border border-dashed border-white/10 rounded-xl">
              No PDF files found in this folder.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
