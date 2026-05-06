'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

const exams = [
  { subject: 'Computer Network Protocols', date: '2026-05-11T09:00:00' },
  { subject: 'Artificial Intelligence', date: '2026-05-14T09:00:00' },
  { subject: 'Cybersecurity Essentials', date: '2026-05-17T09:00:00' },
  { subject: 'Operating Systems', date: '2026-05-19T09:00:00' },
  { subject: 'Information Theory and Coding', date: '2026-05-21T09:00:00' },
  { subject: 'Web Design', date: '2026-05-24T09:00:00' },
];

export default function ExamCountdown() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [now, setNow] = useState(() => Date.now());
  const [selectedExamName, setSelectedExamName] = useState<string | null>(() => {
    const currentTime = Date.now();
    return exams.find((exam) => new Date(exam.date).getTime() > currentTime)?.subject || exams[0].subject;
  });

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const selectedExam = exams.find((exam) => exam.subject === selectedExamName) || exams[0];

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(selectedExam.date).getTime() - Date.now();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [selectedExam]);

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="label">Exam Schedule</p>
          <h2 className="card-title icon-title">
            <Clock size={16} aria-hidden="true" /> Countdown
          </h2>
        </div>
        <span className="card-meta">{selectedExam.date.split('T')[0]} / 09:00</span>
      </div>

      <div className="panel-body exam-layout">
        <div>
          <p className="label">Selected</p>
          <h3 className="card-title">{selectedExam.subject}</h3>
          <div className="countdown-grid stack-gap-md">
            <CountdownCell label="Days" value={timeLeft.days} />
            <CountdownCell label="Hours" value={timeLeft.hours} />
            <CountdownCell label="Min" value={timeLeft.minutes} />
            <CountdownCell label="Sec" value={timeLeft.seconds} />
          </div>
        </div>

        <div>
          <p className="label">Choose Exam</p>
          <div className="exam-list stack-gap-sm">
            {exams.map((exam) => {
              const isSelected = selectedExamName === exam.subject;
              const isPast = new Date(exam.date).getTime() < now;

              return (
                <button
                  key={exam.subject}
                  type="button"
                  disabled={isPast}
                  onClick={() => setSelectedExamName(exam.subject)}
                  className={`exam-option ${isSelected ? 'is-active' : ''}`}
                >
                  <h3 className="card-title truncate">{exam.subject}</h3>
                  <p className="card-meta">{exam.date.split('T')[0]} / 09:00</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function CountdownCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="countdown-cell">
      <span className="countdown-value">{value.toString().padStart(2, '0')}</span>
      <span className="metric-label">{label}</span>
    </div>
  );
}
