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
      // Only reset if currently stopped to avoid interrupting flow? 
      // Actually simpler to just reset current timer if mode matches config change
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
         {/* Full screen constraints container (invisible) */}
         <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-[100]" />

         <motion.div
            drag
            dragMomentum={false}
            dragConstraints={constraintsRef}
            initial={{ right: 24, bottom: 24 }}
            className="fixed z-[100] flex flex-col items-center gap-2 pointer-events-auto cursor-grab active:cursor-grabbing"
         >
            {/* Main Widget */}
            <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 p-1 rounded-3xl shadow-2xl flex flex-col items-center gap-2 relative overflow-hidden group">

               {/* Drag Handle */}
               <div className="w-full flex justify-center py-1 opacity-50 group-hover:opacity-100 transition-opacity">
                  <GripHorizontal className="w-4 h-4 text-slate-500" />
               </div>

               {/* Glass Reflection */}
               <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded-3xl" />

               {/* Header / Mode Switch */}
               <div className="flex items-center justify-between w-full px-4 pt-1 pb-1">
                  <span className={clsx("text-xs font-bold uppercase tracking-wider transition-colors", mode === 'focus' ? "text-cyan-400" : "text-purple-400")}>
                     {mode === 'focus' ? 'Focus' : 'Break'}
                  </span>
                  <div className="flex gap-2">
                     <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={clsx("p-1.5 rounded-full hover:bg-white/10 transition-colors pointer-events-auto", soundEnabled ? "text-white" : "text-slate-600")}
                        onPointerDownCapture={(e) => e.stopPropagation()} // Prevent drag when clicking button
                     >
                        <Volume2 className="w-3.5 h-3.5" />
                     </button>
                     <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={clsx("p-1.5 rounded-full hover:bg-white/10 transition-colors pointer-events-auto", showSettings ? "text-white bg-white/10" : "text-slate-500")}
                        onPointerDownCapture={(e) => e.stopPropagation()} // Prevent drag
                     >
                        <Settings2 className="w-3.5 h-3.5" />
                     </button>
                  </div>
               </div>

               {/* Time Display with Progress Ring */}
               <div className="relative w-40 h-24 flex items-center justify-center">
                  <div className="text-4xl font-mono font-bold text-white tracking-widest z-10 drop-shadow-lg">
                     {formatTime(timeLeft)}
                  </div>
                  {/* Simple Background Bar for Visual Flair */}
                  <div className="absolute bottom-4 left-4 right-4 h-1 bg-white/5 rounded-full overflow-hidden">
                     <motion.div
                        className={clsx("h-full", mode === 'focus' ? "bg-cyan-500" : "bg-purple-500")}
                        animate={{ width: `${100 - (timeLeft / totalTime) * 100}%` }}
                        transition={{ duration: 1, ease: "linear" }}
                     />
                  </div>
               </div>

               {/* Controls */}
               <div className="flex items-center gap-4 pb-4">
                  <button
                     onClick={resetTimer}
                     onPointerDownCapture={(e) => e.stopPropagation()}
                     className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all"
                     title="Reset"
                  >
                     <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                     onClick={toggleTimer}
                     onPointerDownCapture={(e) => e.stopPropagation()}
                     className={clsx(
                        "w-12 h-12 flex items-center justify-center rounded-2xl shadow-lg transition-all transform hover:scale-105 active:scale-95 pointer-events-auto",
                        isActive
                           ? "bg-gradient-to-br from-red-500 to-pink-600 text-white shadow-red-900/20"
                           : mode === 'focus'
                              ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-cyan-900/20"
                              : "bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-purple-900/20"
                     )}
                  >
                     {isActive ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                  </button>

                  <button
                     onClick={switchMode}
                     onPointerDownCapture={(e) => e.stopPropagation()}
                     className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all text-xs font-semibold"
                  >
                     Switch
                  </button>
               </div>

               {/* Settings Overlay */}
               <AnimatePresence>
                  {showSettings && (
                     <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="w-full bg-slate-950/50 backdrop-blur-md border-t border-white/10 overflow-hidden text-left"
                     >
                        <div className="p-4 space-y-3" onPointerDownCapture={(e) => e.stopPropagation()}>
                           <div className="flex items-center justify-between">
                              <label className="text-xs text-slate-400">Focus Time (min)</label>
                              <input
                                 type="number"
                                 value={focusDuration}
                                 onChange={(e) => setFocusDuration(Number(e.target.value))}
                                 className="w-16 bg-slate-800 border border-white/10 rounded px-2 py-1 text-xs text-white text-center focus:border-cyan-500 outline-none"
                              />
                           </div>
                           <div className="flex items-center justify-between">
                              <label className="text-xs text-slate-400">Break Time (min)</label>
                              <input
                                 type="number"
                                 value={breakDuration}
                                 onChange={(e) => setBreakDuration(Number(e.target.value))}
                                 className="w-16 bg-slate-800 border border-white/10 rounded px-2 py-1 text-xs text-white text-center focus:border-purple-500 outline-none"
                              />
                           </div>
                           <button
                              onClick={() => applySettings(focusDuration, breakDuration)}
                              className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold text-white transition-colors"
                           >
                              Done
                           </button>
                        </div>
                     </motion.div>
                  )}
               </AnimatePresence>
            </div>
         </motion.div>
      </>
   );
}
