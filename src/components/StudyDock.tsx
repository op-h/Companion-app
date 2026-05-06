'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, ListTodo, Minus, Pause, Play, Plus, RotateCcw, Timer, Trash2 } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface Todo {
  id: string;
  text: string;
  done: boolean;
}

const DEFAULT_TIMER_MINUTES = 25;
const TIMER_PRESETS = [15, 25, 45, 60];

export default function StudyDock() {
  const pathname = usePathname();
  const [isMinimized, setIsMinimized] = useState(true);
  const [todos, setTodos] = useState<Todo[]>(() => {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem('study-dock-todos') || '[]');
  });
  const [todoText, setTodoText] = useState('');
  const [timerMinutes, setTimerMinutes] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_TIMER_MINUTES;
    return Number(localStorage.getItem('study-dock-timer-minutes')) || DEFAULT_TIMER_MINUTES;
  });
  const [customMinutes, setCustomMinutes] = useState(() => timerMinutes.toString());
  const [timeLeft, setTimeLeft] = useState(() => timerMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);

  const completedCount = useMemo(() => todos.filter((todo) => todo.done).length, [todos]);
  const activeCount = todos.length - completedCount;
  const timerProgress = Math.max(0, Math.min(100, (timeLeft / Math.max(timerMinutes * 60, 1)) * 100));
  const isReaderPage = pathname.split('/').filter(Boolean).length >= 2;

  useEffect(() => {
    localStorage.setItem('study-dock-todos', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem('study-dock-timer-minutes', timerMinutes.toString());
  }, [timerMinutes]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          setIsRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const addTodo = () => {
    const text = todoText.trim();
    if (!text) return;
    setTodos((current) => [{ id: Date.now().toString(), text, done: false }, ...current]);
    setTodoText('');
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const applyTimerMinutes = (minutesValue: number) => {
    const baseMinutes = Number.isFinite(minutesValue) ? minutesValue : DEFAULT_TIMER_MINUTES;
    const minutes = Math.min(240, Math.max(1, Math.round(baseMinutes)));
    setTimerMinutes(minutes);
    setCustomMinutes(minutes.toString());
    setTimeLeft(minutes * 60);
    setIsRunning(false);
  };

  if (isMinimized) {
    return (
      <button
        className={`study-dock dock-mini ${isRunning ? 'is-running' : ''} ${isReaderPage ? 'dock-reader-offset' : ''}`}
        type="button"
        onClick={() => setIsMinimized(false)}
      >
        <span className="dock-mini-icon">
          <Timer size={16} />
        </span>
        <span className="dock-mini-main">
          <span className="dock-mini-label">{isRunning ? 'Running' : 'Study'}</span>
          <span className="mono dock-mini-time">{formatTime(timeLeft)}</span>
        </span>
        <span className="dock-mini-count" title="Active tasks">{activeCount}</span>
      </button>
    );
  }

  return (
    <section className={`study-dock dock-panel dock-simple ${isReaderPage ? 'dock-reader-offset' : ''}`} aria-label="Study dock">
      <header className="dock-head">
        <div>
          <p className="label">Study Dock</p>
          <h2 className="dock-title">Timer / Tasks</h2>
        </div>
        <div className="dock-head-actions">
          <span className={`dock-status ${isRunning ? 'is-running' : ''}`}>
            {isRunning ? 'Running' : 'Ready'}
          </span>
          <button className="btn btn-icon" type="button" onClick={() => setIsMinimized(true)} title="Minimize">
            <Minus size={16} />
          </button>
        </div>
      </header>

      <section className="dock-section dock-timer dock-simple-section">
        <div className="simple-timer-head">
          <div>
            <p className="label">Timer</p>
            <span className="timer-display compact">{formatTime(timeLeft)}</span>
          </div>
          <span className="timer-subtitle">{timerMinutes} min</span>
        </div>

        <div className="simple-progress" aria-label="Timer remaining">
          <span style={{ width: `${timerProgress}%` }} />
        </div>

        <div className="timer-actions">
          <button className="btn timer-reset" type="button" onClick={() => setTimeLeft(timerMinutes * 60)} title="Reset timer">
            <RotateCcw size={15} />
            Reset
          </button>
          <button className="btn btn-primary" type="button" onClick={() => setIsRunning((value) => !value)}>
            {isRunning ? <Pause size={15} /> : <Play size={15} />}
            {isRunning ? 'Pause' : 'Start'}
          </button>
        </div>
        <div className="timer-custom">
          <label>
            <span className="label">Custom min</span>
            <input
              className="input-box"
              type="number"
              min="1"
              max="240"
              value={customMinutes}
              onChange={(event) => setCustomMinutes(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') applyTimerMinutes(Number(customMinutes));
              }}
            />
          </label>
          <button className="btn btn-primary" type="button" onClick={() => applyTimerMinutes(Number(customMinutes))}>
            Set
          </button>
        </div>
        <div className="timer-presets">
          {TIMER_PRESETS.map((minutes) => (
            <button
              className={`btn preset-btn ${timerMinutes === minutes ? 'is-active' : ''}`}
              type="button"
              key={minutes}
              onClick={() => applyTimerMinutes(minutes)}
            >
              {minutes}m
            </button>
          ))}
        </div>
      </section>

      <section className="dock-section dock-todos dock-simple-section">
        <div className="todo-head">
          <div>
            <p className="label">Tasks</p>
            <h3 className="todo-title">
              <ListTodo size={15} />
              To-do
            </h3>
          </div>
          <span className="todo-count">{completedCount}/{todos.length}</span>
        </div>

        <form
          className="dock-input-row"
          onSubmit={(event) => {
            event.preventDefault();
            addTodo();
          }}
        >
          <input
            className="input-box"
            value={todoText}
            onChange={(event) => setTodoText(event.target.value)}
            placeholder="Add study task..."
          />
          <button className="btn btn-primary btn-icon" type="submit" title="Add task">
            <Plus size={16} />
          </button>
        </form>

        <div className="todo-list">
          {todos.length > 0 ? (
            todos.map((todo) => (
              <div className={`todo-item ${todo.done ? 'is-done' : ''}`} key={todo.id}>
                <button
                  className="todo-check"
                  type="button"
                  onClick={() => setTodos((current) => current.map((item) => item.id === todo.id ? { ...item, done: !item.done } : item))}
                  title="Toggle task"
                >
                  {todo.done && <Check size={13} />}
                </button>
                <span>{todo.text}</span>
                <button
                  className="todo-delete"
                  type="button"
                  onClick={() => setTodos((current) => current.filter((item) => item.id !== todo.id))}
                  title="Delete task"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          ) : (
            <div className="dock-empty">No tasks yet.</div>
          )}
        </div>

        <footer className="dock-foot">
          {activeCount} active / {completedCount} complete
        </footer>
      </section>
    </section>
  );
}
