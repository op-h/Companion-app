'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, Settings2, GripHorizontal } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

export default function PomodoroTimer() {
   // Settings
   const [focusDuration, setFocusDuration] = useState(25);
   const [breakDuration, setBreakDuration] = useState(5);

   // State
   const [timeLeft, setTimeLeft] = useState(25 * 60);
   const [isActive, setIsActive] = useState(false);
   const [mode, setMode] = useState<'focus' | 'break'>('focus');
   const [showSettings, setShowSettings] = useState(false);
   const [soundEnabled, setSoundEnabled] = useState(false);
   const [isMinimized, setIsMinimized] = useState(true);

   const constraintsRef = useRef(null);

   useEffect(() => {
      let interval: NodeJS.Timeout;
      if (isActive && timeLeft > 0) {
         interval = setInterval(() => {
            setTimeLeft((time) => time - 1);
         }, 1000);
      } else if (timeLeft === 0 && isActive) {
         setIsActive(false);
         // Play sound if enabled
         if (soundEnabled) {
            const audio = new Audio('/notification.mp3'); // Mock path
            audio.play().catch(() => { });
         }
      }
      return () => clearInterval(interval);
   }, [isActive, timeLeft, soundEnabled]);

   const toggleTimer = () => setIsActive(!isActive);

   const resetTimer = () => {
      setIsActive(false);
      setTimeLeft(mode === 'focus' ? focusDuration * 60 : breakDuration * 60);
   };

   const switchMode = () => {
      const newMode = mode === 'focus' ? 'break' : 'focus';
      setMode(newMode);
      setTimeLeft(newMode === 'focus' ? focusDuration * 60 : breakDuration * 60);
      setIsActive(false);
   };

   const applySettings = (newFocus: number, newBreak: number) => {
      setFocusDuration(newFocus);
      setBreakDuration(newBreak);
      if (!isActive) {
         setTimeLeft(mode === 'focus' ? newFocus * 60 : newBreak * 60);
      }
      setShowSettings(false);
   };

   const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
   };

   // Progress circle calc
   const totalTime = mode === 'focus' ? focusDuration * 60 : breakDuration * 60;

   return (
      <>
         <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-[100]" />

         <motion.div
            drag
            dragMomentum={false}
            dragConstraints={constraintsRef}
            initial={{ right: 24, bottom: 24 }}
            className="fixed z-[100] pointer-events-auto"
            layout
         >
            <AnimatePresence mode="wait">
               {isMinimized ? (
                  <motion.button
                     key="minimized"
                     initial={{ scale: 0.8, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     exit={{ scale: 0.8, opacity: 0 }}
                     onClick={() => setIsMinimized(false)}
                     className={clsx(
                        "w-16 h-16 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-xl border border-white/20 cursor-pointer relative group overflow-hidden",
                        mode === 'focus' ? "bg-cyan-600/80" : "bg-purple-600/80"
                     )}
                     layoutId="timer-body"
                  >
                     {/* Progress Ring for Circle */}
                     <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle
                           cx="32"
                           cy="32"
                           r="30"
                           stroke="rgba(255,255,255,0.1)"
                           strokeWidth="4"
                           fill="transparent"
                        />
                        <motion.circle
                           cx="32"
                           cy="32"
                           r="30"
                           stroke="white"
                           strokeWidth="4"
                           fill="transparent"
                           strokeDasharray="188.5"
                           animate={{ strokeDashoffset: 188.5 - (188.5 * (1 - timeLeft / totalTime)) }}
                           transition={{ duration: 1, ease: "linear" }}
                        />
                     </svg>

                     <div className="flex flex-col items-center z-10">
                        <span className="text-[10px] font-bold text-white/70 uppercase mb-px">Time</span>
                        <span className="text-xs font-mono font-bold text-white leading-none">
                           {formatTime(timeLeft)}
                        </span>
                     </div>
                  </motion.button>
               ) : (
                  <motion.div
                     key="expanded"
                     initial={{ scale: 0.8, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     exit={{ scale: 0.8, opacity: 0 }}
                     className="bg-slate-900/90 backdrop-blur-xl border border-white/10 p-1 rounded-3xl shadow-2xl flex flex-col items-center gap-2 relative overflow-hidden group w-48"
                     layoutId="timer-body"
                  >
                     {/* Drag Handle */}
                     <div className="w-full flex justify-center py-1 opacity-50 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                        <GripHorizontal className="w-4 h-4 text-slate-500" />
                     </div>

                     {/* Header / Mode Switch */}
                     <div className="flex items-center justify-between w-full px-4 pt-1 pb-1">
                        <div
                           className="cursor-pointer"
                           onClick={() => setIsMinimized(true)}
                           onPointerDownCapture={(e) => e.stopPropagation()}
                        >
                           <span className={clsx("text-[10px] font-bold uppercase tracking-wider transition-colors", mode === 'focus' ? "text-cyan-400" : "text-purple-400")}>
                              {mode === 'focus' ? 'Focus' : 'Break'}
                           </span>
                        </div>
                        <div className="flex gap-1" onPointerDownCapture={(e) => e.stopPropagation()}>
                           <button
                              onClick={() => setSoundEnabled(!soundEnabled)}
                              className={clsx("p-1 rounded-full hover:bg-white/10 transition-colors", soundEnabled ? "text-white" : "text-slate-600")}
                           >
                              <Volume2 className="w-3 h-3" />
                           </button>
                           <button
                              onClick={() => setShowSettings(!showSettings)}
                              className={clsx("p-1 rounded-full hover:bg-white/10 transition-colors", showSettings ? "text-white bg-white/10" : "text-slate-500")}
                           >
                              <Settings2 className="w-3 h-3" />
                           </button>
                           <button
                              onClick={() => setIsMinimized(true)}
                              className="p-1 rounded-full hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
                           >
                              <GripHorizontal className="w-3 h-3 rotate-90" />
                           </button>
                        </div>
                     </div>

                     {/* Time Display */}
                     <div className="relative w-full h-20 flex items-center justify-center">
                        <div className="text-3xl font-mono font-bold text-white tracking-widest z-10 drop-shadow-lg">
                           {formatTime(timeLeft)}
                        </div>
                        <div className="absolute bottom-2 left-4 right-4 h-1 bg-white/5 rounded-full overflow-hidden">
                           <motion.div
                              className={clsx("h-full", mode === 'focus' ? "bg-cyan-500" : "bg-purple-500")}
                              animate={{ width: `${100 - (timeLeft / totalTime) * 100}%` }}
                              transition={{ duration: 1, ease: "linear" }}
                           />
                        </div>
                     </div>

                     {/* Controls */}
                     <div className="flex items-center gap-3 pb-4" onPointerDownCapture={(e) => e.stopPropagation()}>
                        <button onClick={resetTimer} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all">
                           <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                           onClick={toggleTimer}
                           className={clsx(
                              "w-10 h-10 flex items-center justify-center rounded-xl shadow-lg transition-all transform hover:scale-105 active:scale-95",
                              isActive
                                 ? "bg-gradient-to-br from-red-500 to-pink-600 text-white shadow-red-900/20"
                                 : mode === 'focus'
                                    ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-cyan-900/20"
                                    : "bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-purple-900/20"
                           )}
                        >
                           {isActive ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                        </button>
                        <button onClick={switchMode} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all text-[10px] font-bold">
                           SW
                        </button>
                     </div>

                     {/* Settings Overlay */}
                     <AnimatePresence>
                        {showSettings && (
                           <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="w-full bg-slate-950/50 backdrop-blur-md border-t border-white/10 overflow-hidden"
                              onPointerDownCapture={(e) => e.stopPropagation()}
                           >
                              <div className="p-3 space-y-2">
                                 <div className="flex items-center justify-between">
                                    <label className="text-[10px] text-slate-400">Focus</label>
                                    <input
                                       type="number"
                                       value={focusDuration}
                                       onChange={(e) => setFocusDuration(Number(e.target.value))}
                                       className="w-12 bg-slate-800 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-white text-center"
                                    />
                                 </div>
                                 <div className="flex items-center justify-between">
                                    <label className="text-[10px] text-slate-400">Break</label>
                                    <input
                                       type="number"
                                       value={breakDuration}
                                       onChange={(e) => setBreakDuration(Number(e.target.value))}
                                       className="w-12 bg-slate-800 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-white text-center"
                                    />
                                 </div>
                                 <button
                                    onClick={() => applySettings(focusDuration, breakDuration)}
                                    className="w-full py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold text-white"
                                 >
                                    Done
                                 </button>
                              </div>
                           </motion.div>
                        )}
                     </AnimatePresence>
                  </motion.div>
               )}
            </AnimatePresence>
         </motion.div>
      </>
   );
}

