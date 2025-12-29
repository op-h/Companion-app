'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Folder, Search, Rocket, Zap, Clock, Play, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ExamCountdown from './ExamCountdown';

interface Subject {
  name: string;
  pdfCount: number;
}

interface LastRead {
  subject: string;
  name: string;
  page: number;
  date: number;
}

export default function DashboardClient({ subjects }: { subjects: Subject[] }) {
  const [search, setSearch] = useState('');
  const [lastRead, setLastRead] = useState<LastRead | null>(null);

  // Derived state - no need for effect
  const filteredSubjects = subjects.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    const saved = localStorage.getItem('last-read-pdf');
    if (saved) {
      setLastRead(JSON.parse(saved));
    }
  }, []);

  return (
    <div className="min-h-screen bg-[url('/grid.svg')] bg-fixed bg-center relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full bg-slate-950/90 -z-20"></div>
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] -z-10 animate-pulse-slow"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-cyan-600/20 rounded-full blur-[120px] -z-10 animate-pulse-slow delay-1000"></div>

      <main className="container mx-auto px-4 py-12 relative z-10">

        {/* Header */}
        <div className="flex flex-col items-center mb-16 text-center relative">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="p-4 rounded-full bg-gradient-to-tr from-purple-500/20 to-cyan-500/20 border border-white/10 mb-6 backdrop-blur-md relative"
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-500 blur-xl opacity-40 animate-pulse"></div>
            <Rocket className="w-12 h-12 text-white relative z-10" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 mb-4 drop-shadow-2xl"
          >
            Cosmic Companion
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-xl max-w-lg"
          >
            Welcome Back, <br />
            Search subjects...
          </motion.p>
        </div>

        {/* Continue Reading Shelf */}
        <AnimatePresence>
          {lastRead && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto mb-10"
            >
              <div className="flex items-center justify-between mb-2 px-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Continue Reading
                </span>
              </div>
              <Link
                href={`/${encodeURIComponent(lastRead.subject)}/${encodeURIComponent(lastRead.name)}`}
                className="block group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-xl p-4 flex items-center gap-4 hover:border-cyan-500/50 transition-all">
                  <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white truncate group-hover:text-cyan-300 transition-colors">
                      {lastRead.name}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {lastRead.subject} • Page {lastRead.page}
                    </p>
                  </div>
                  <div className="p-2 bg-white/5 rounded-full group-hover:bg-cyan-500 group-hover:text-white transition-all">
                    <Play className="w-5 h-5 fill-current" />
                  </div>
                </div>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-2xl mx-auto mb-16 relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition-opacity"></div>
          <div className="relative flex items-center bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4 shadow-2xl">
            <Search className="w-6 h-6 text-slate-400 mr-4" />
            <input
              type="text"
              placeholder="Search subjects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent flex-1 text-lg outline-none text-white placeholder-slate-500"
            />
          </div>
        </motion.div>

        {/* Exam Countdown */}
        <ExamCountdown />

        {/* Subjects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map((subject, index) => (
            <motion.div
              key={subject.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Link href={`/${encodeURIComponent(subject.name)}`} className="group block relative h-full">

                {/* Refined Card */}
                <div className="h-full bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden transition-all duration-300 group-hover:bg-slate-800/50 group-hover:border-white/10 group-hover:shadow-2xl group-hover:shadow-cyan-900/10 group-hover:-translate-y-1">

                  {/* Subtle Top Gradient Line */}
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-cyan-500/50 transition-all duration-500"></div>

                  <div className="flex items-start justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-slate-800/50 border border-white/5 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                      <Folder className="w-6 h-6 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                    </div>
                    {/* Hover Icon */}
                    <div className="p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
                      <ArrowRight className="w-4 h-4 text-cyan-500" />
                    </div>
                  </div>

                  <h2 className="text-xl font-semibold text-slate-100 mb-2 group-hover:text-white transition-colors">
                    {subject.name}
                  </h2>

                  <div className="flex items-center gap-3 text-slate-500 text-xs font-medium tracking-wide uppercase">
                    <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5">
                      <BookOpen className="w-3.5 h-3.5" /> {subject.pdfCount} Resources
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {filteredSubjects.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-500 text-lg">No signals detected matching that query.</p>
          </div>
        )}

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center py-8"
        >
          <div className="inline-block px-6 py-2 rounded-full bg-slate-900/50 backdrop-blur border border-white/5 text-slate-500 font-mono text-xs tracking-widest uppercase hover:text-cyan-400 hover:border-cyan-500/30 transition-all cursor-default">
            Designed by <span className="text-white font-bold">OPH</span>
          </div>
        </motion.footer>
      </main>
    </div>
  );
}
