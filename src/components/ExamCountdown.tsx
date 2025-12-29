'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const exams = [
  { subject: 'Information Security', date: '2026-01-04T09:00:00' },
  { subject: 'Digital Signal Processing', date: '2026-01-07T09:00:00' },
  { subject: 'Computer Network', date: '2026-01-11T09:00:00' },
  { subject: 'Python', date: '2026-01-13T09:00:00' },
  { subject: 'Software Eng', date: '2026-01-17T09:00:00' },
  { subject: 'Digital Forensics', date: '2026-01-19T09:00:00' },
];

export default function ExamCountdown() {
  const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [selectedExamName, setSelectedExamName] = useState<string | null>(null);

  // Auto-Next Logic
  useEffect(() => {
    const checkUpcoming = () => {
      const now = new Date();
      // Filter exams that are in the future
      const futureExams = exams.filter(e => new Date(e.date).getTime() > now.getTime());

      // If no selected exam or selected is past, pick first future one
      if (!selectedExamName || (selectedExamName && new Date(exams.find(e => e.subject === selectedExamName)?.date || '').getTime() <= now.getTime())) {
        if (futureExams.length > 0) {
          setSelectedExamName(futureExams[0].subject);
        }
      } else if (!selectedExamName && futureExams.length > 0) {
        setSelectedExamName(futureExams[0].subject);
      }
    }

    checkUpcoming();
    const interval = setInterval(checkUpcoming, 1000 * 60); // Check every minute
    return () => clearInterval(interval);
  }, [selectedExamName]);


  const selectedExam = exams.find(e => e.subject === selectedExamName) || exams[0];

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!selectedExam) return;

      const now = new Date();
      const difference = new Date(selectedExam.date).getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000); // Update every SECOND

    return () => clearInterval(timer);
  }, [selectedExam]);

  if (!selectedExam) return null;

  return (
    <div className="w-full bg-slate-950/50 rounded-xl border border-white/10 p-6 mb-8 shadow-xl relative overflow-hidden group">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10 group-hover:bg-cyan-500/15 transition-all duration-700" />

      <div className="flex flex-col lg:flex-row gap-8">

        {/* Left: Countdown Display */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-6 h-6 text-cyan-400 animate-pulse" />
            <h2 className="text-xl font-bold text-white tracking-wide">Exam Countdown</h2>
          </div>

          <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 p-6 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-purple-500" />

            <h3 className="text-2xl font-bold text-white mb-1">{selectedExam.subject}</h3>
            <div className="text-sm text-cyan-400 font-mono mb-6">{selectedExam.date.split('T')[0]}</div>

            <div className="grid grid-cols-4 gap-2 md:gap-4">
              <div className="flex flex-col">
                <span className="text-3xl md:text-5xl font-bold text-white">{timeLeft.days}</span>
                <span className="text-[10px] uppercase text-slate-500 tracking-widest">Days Left</span>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl md:text-5xl font-bold text-white">{timeLeft.hours}</span>
                <span className="text-[10px] uppercase text-slate-500 tracking-widest">Hrs</span>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl md:text-5xl font-bold text-white">{timeLeft.minutes}</span>
                <span className="text-[10px] uppercase text-slate-500 tracking-widest">Min</span>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl md:text-5xl font-bold text-cyan-400">{timeLeft.seconds}</span>
                <span className="text-[10px] uppercase text-cyan-500/70 tracking-widest">Sec</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Exam List */}
        <div className="lg:w-80 flex flex-col gap-2 relative">
          <h3 className="text-sm font-semibold text-slate-400 mb-2 px-1">Select Subject</h3>
          <div className="flex-1 overflow-auto max-h-[250px] custom-scrollbar space-y-2 pr-1">
            {exams.map((exam) => {
              const isSelected = selectedExamName === exam.subject;
              const isPast = new Date(exam.date).getTime() < new Date().getTime();
              return (
                <button
                  key={exam.subject}
                  onClick={() => setSelectedExamName(exam.subject)}
                  disabled={isPast}
                  className={`w-full text-left p-3 rounded-xl border transition-all duration-300 group flex items-center justify-between
                            ${isSelected
                      ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                      : isPast
                        ? 'opacity-50 border-transparent cursor-not-allowed'
                        : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/20'
                    }
                        `}
                >
                  <div className="min-w-0">
                            <div className={`text-sm font-medium truncate ${isSelected ? 'text-cyan-300' : 'text-slate-300'}`}>{exam.subject}</div>
                            <div className="text-xs text-slate-500 font-mono flex gap-2">
                               <span>{exam.date.split('T')[0]}</span>
                               <span className="text-slate-600">|</span>
                               <span>09:00 AM</span>
                            </div>
                         </div>
                         {isSelected && <motion.div layoutId="active-indicator" className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_cyan]" />}
                </button>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
