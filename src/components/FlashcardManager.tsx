'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Brain, RotateCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export default function FlashcardManager({ subject }: { subject: string }) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');

  // Load
  useEffect(() => {
    const saved = localStorage.getItem(`flashcards-${subject}`);
    if (saved) setCards(JSON.parse(saved));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject]);

  // Save
  useEffect(() => {
    localStorage.setItem(`flashcards-${subject}`, JSON.stringify(cards));
  }, [cards, subject]);

  const addCard = () => {
    if (!newFront || !newBack) return;
    setCards([...cards, { front: newFront, back: newBack, id: Date.now().toString() }]);
    setNewFront('');
    setNewBack('');
    setIsAdding(false);
  };

  const removeCard = (id: string) => {
    setCards(cards.filter(c => c.id !== id));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-400" />
          Flashcards ({cards.length})
        </h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="p-1.5 bg-purple-500/20 hover:bg-purple-500/40 rounded-lg text-purple-300 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {isAdding && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-slate-900/50 p-3 rounded-lg border border-purple-500/30 mb-4 space-y-2 overflow-hidden"
        >
          <input
            placeholder="Front (Question)"
            className="w-full bg-slate-800 p-2 rounded text-sm text-white focus:ring-1 focus:ring-purple-500 outline-none"
            value={newFront}
            onChange={(e) => setNewFront(e.target.value)}
          />
          <input
            placeholder="Back (Answer)"
            className="w-full bg-slate-800 p-2 rounded text-sm text-white focus:ring-1 focus:ring-purple-500 outline-none"
            value={newBack}
            onChange={(e) => setNewBack(e.target.value)}
          />
          <button
            onClick={addCard}
            className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 rounded text-xs font-semibold text-white transition-colors"
          >
            Add Card
          </button>
        </motion.div>
      )}

      <div className="flex-1 overflow-auto space-y-3">
        {cards.map((card) => (
          <FlashcardItem key={card.id} card={card} onDelete={() => removeCard(card.id)} />
        ))}
        {cards.length === 0 && !isAdding && (
          <div className="text-center text-slate-500 text-sm py-8">
            No cards yet. Create one!
          </div>
        )}
      </div>
    </div>
  );
}

function FlashcardItem({ card, onDelete }: { card: Flashcard, onDelete: () => void }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <motion.div
      layout
      className="perspective-1000 group relative"
      onClick={() => setFlipped(!flipped)}
    >
      <div className="p-4 bg-slate-800/50 border border-white/5 rounded-xl hover:border-purple-500/30 transition-all cursor-pointer min-h-[100px] flex items-center justify-center text-center relative">
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute top-2 right-2 p-1 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="w-3 h-3" />
        </button>

        <div className="text-sm font-medium text-slate-200">
          {flipped ? (
            <span className="text-purple-300">{card.back}</span>
          ) : (
            <span>{card.front}</span>
          )}
        </div>

        <div className="absolute bottom-2 right-2 text-xs text-slate-700">
          <RotateCw className="w-3 h-3" />
        </div>
      </div>
    </motion.div>
  );
}
