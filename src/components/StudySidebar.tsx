'use client';

import { useState } from 'react';
import { BrainCircuit, BookOpen, Layers, Sparkles, Wand2, Languages, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import FlashcardManager from './FlashcardManager';

interface StudySidebarProps {
  subject: string;
  pdf: string;
}

// Smart Mock Dictionary
const dictionary: Record<string, string> = {
  "Data Communication": "اتصالات البيانات",
  "Network": "شبكة",
  "Security": "أمن",
  "Information Security": "أمن المعلومات",
  "Digital Forensics": "التحقيقات الرقمية",
  "Software Engineering": "هندسة البرمجيات",
  "Python": "بايثون",
  "Algorithm": "خوارزمية",
  "Database": "قاعدة بيانات",
  "Protocol": "بروتوكول",
  "Layer": "طبقة",
  "Encryption": "تشفير",
  "Decryption": "فك التشفير",
  "Server": "خادم",
  "Client": "عميل",
  "Introduction": "مقدمة",
  "Chapter": "فصل",
  "Test": "اختبار",
  "Exam": "امتحان",
  "Study": "دراسة",
  "Notes": "ملاحظات",
  "Important": "مهم",
  "Definition": "تعريف",
  "Summary": "ملخص",
  "Question": "سؤال",
  "Answer": "إجابة",
  // Common phrases
  "Hello": "مرحباً",
  "Welcome": "أهلاً بك",
  "Good luck": "حظاً موفقاً",
  "This is a test": "هذا اختبار",
  "Message": "رسالة",
  "Text": "نص",
  "Page": "صفحة",
  "Read": "قراءة",
  "Write": "كتابة",
  "File": "ملف",
  "Open": "فتح",
  "Close": "إغلاق",
  "Search": "بحث",
  "Time": "وقت",
  "Date": "تاريخ",
  // Expanded Generic Terms
  "Information": "معلومات",
  "Data": "بيانات",
  "Communicated": "تواصل",
  "Communication": "اتصالات",
  "Consist": "تتألف",
  "Number": "رقم",
  "Numbers": "أرقام",
  "Picture": "صورة",
  "Pictures": "صور",
  "Sound": "صوت",
  "Video": "فيديو",
  "Device": "جهاز",
  "Devices": "أجهزة",
  "Computer": "حاسوب",
  "Workstation": "محطة عمل",
  "Mobile": "هاتف",
  "Phone": "هاتف",
  "Television": "تلفاز",
  "Physical": "مادي",
  "Path": "مسار",
  "Wire": "سلك",
  "Cable": "كابل",
  "Fiber": "ألياف",
  "Optic": "بصرية",
  "Laser": "ليزر",
  "Radio": "راديو",
  "Wave": "موجة",
  "Waves": "موجات",
  "Rule": "قاعدة",
  "Rules": "قواعد",
  "Agreement": "اتفاقية",
  "System": "نظام",
};

// Full Sentence Dictionary for Demo Quality
const sentenceDictionary: Record<string, string> = {
  // Message
  "The message is the information (data) to be communicated": "الرسالة هي المعلومات (البيانات) المراد نقلها",
  "It can consist of text, numbers, pictures, sound, or video or any combination of these": "يمكن أن تتكون من نصوص أو أرقام أو صور أو صوت أو فيديو أو أي مجموعة منها",
  
  // Sender
  "The sender is the device that sends the data message": "المراسل هو الجهاز الذي يرسل رسالة البيانات",
  "It can be a computer, workstation, mobile phone, video camera, and so on": "يمكن أن يكون جهاز كمبيوتر أو محطة عمل أو هاتفًا محمولًا أو كاميرا فيديو وما إلى ذلك",

  // Receiver
  "The receiver is the device that receives the message": "المستقبل هو الجهاز الذي يستقبل الرسالة",
  "It can be a computer, workstation, mobile phone, television, and so on": "يمكن أن يكون جهاز كمبيوتر أو محطة عمل أو هاتفًا محمولًا أو تلفزيونًا وما إلى ذلك",

  // Medium
  "The transmission medium is the physical path by which a message travels from-sender to receiver": "وسط الإرسال هو المسار المادي الذي تنتقل عبره الرسالة من المرسل إلى المستقبل",
  "It can consist of twisted pair wire, coaxial cable, fiber- optic cable, laser, or radio waves": "يمكن أن تتكون من سلك مزدوج مجدول، أو كابل متحد المحور، أو كابل ألياف ضوئية، أو ليزر، أو موجات راديو",

  // Protocol
  "A protocol is a set of rules that govern data communication": "البروتوكول هو مجموعة من القواعد التي تحكم اتصالات البيانات",
  "It represents an agreement between the communicating devices": "إنه يمثل اتفاقاً بين الأجهزة المتصلة",
  "Without a protocol, two devices may be connected but not communicating": "بدون بروتوكول، قد يكون جهازان متصلين ولكنهما لا يتواصلان",
  "just as a person who speaks, only Japanese cannot understand a person speaking French": "تمامًا كما لا يستطيع شخص يتحدث اليابانية فقط فهم شخص يتحدث الفرنسية",
};

export default function StudySidebar({ subject, pdf }: StudySidebarProps) {
  const [activeTab, setActiveTab] = useState<'quiz' | 'notes' | 'cards'>('quiz');
  const [notes, setNotes] = useState('');
  const [quizStarted, setQuizStarted] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const handleTranslateNotes = () => {
    if (!notes.trim()) return;
    
    setIsTranslating(true);
    
    // Simulate API delay
    setTimeout(() => {
        // Strip previous translation separator
        const separator = "\n\n--- 🌐 الترجمة العربية ---";
        let textToTranslate = notes.split(separator)[0].trim();
        let translatedText = textToTranslate;

        // 1. First, try to replace Full Sentences (Best Quality)
        // We split by lines or periods to find matching segments
        Object.keys(sentenceDictionary).forEach(engSentence => {
            // Escaping special regex chars is omitted for brevity in this demo, assume clean input
            // Using includes/replace for direct sentence mapping
            if (translatedText.includes(engSentence)) {
                translatedText = translatedText.replace(engSentence, sentenceDictionary[engSentence]);
            }
        });

        // 2. Then, Fallback to Word-by-Word replacement for remaining English terms
        Object.keys(dictionary).forEach(key => {
            // Only replace if it wasn't part of a sentence we already translated (check if English word still exists)
            // Use word boundary to avoid replacing parts of already translated Arabic (unlikely but safe)
            const regex = new RegExp(`\\b${key}\\b`, "gi"); 
            translatedText = translatedText.replace(regex, dictionary[key]);
        });

        // 3. Output logic: Clean Translation Block (Inline translation requested)
        const output = `${separator}\n${translatedText}\n------------------------`;
        
        setNotes(textToTranslate + output);
        setIsTranslating(false);
    }, 800);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Tabs */}
      <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-white/10">
        <TabButton active={activeTab === 'quiz'} onClick={() => setActiveTab('quiz')} icon={BrainCircuit} label="Quiz" />
        <TabButton active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} icon={BookOpen} label="Notes" />
        <TabButton active={activeTab === 'cards'} onClick={() => setActiveTab('cards')} icon={Layers} label="Cards" />
      </div>

      {/* Content */}
      <div className="flex-1 bg-slate-950/50 rounded-xl border border-white/5 p-4 overflow-auto relative">

        {activeTab === 'quiz' && (
          <div className="h-full flex flex-col">
            {!quizStarted ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                <div className="p-4 bg-cyan-500/10 rounded-full border border-cyan-500/20">
                  <Sparkles className="w-8 h-8 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Test Your Knowledge</h3>
                  <p className="text-sm text-slate-400">
                    Generate AI-powered questions based on this PDF to help you memorize the material.
                  </p>
                </div>
                <button
                  onClick={() => setQuizStarted(true)}
                  className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl font-semibold shadow-lg shadow-cyan-900/20 transition-all flex items-center justify-center gap-2"
                >
                  <Wand2 className="w-4 h-4" />
                  Generate Quiz
                </button>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-cyan-400">Question 1/5</h3>
                  <div className="text-xs text-slate-500">Difficulty: Medium</div>
                </div>

                <div className="space-y-4">
                  <p className="text-slate-200 font-medium">
                    What is the primary function of the Transport Layer in the OSI model?
                  </p>

                  <div className="space-y-2">
                    {['Routing packets', 'End-to-end communication', 'Physical addressing', 'Data encryption'].map((opt, i) => (
                      <button key={i} className="w-full text-left p-3 text-sm rounded-lg border border-white/10 hover:bg-white/5 hover:border-cyan-500/30 transition-all text-slate-300">
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex gap-2">
                  <button
                    onClick={() => setQuizStarted(false)}
                    className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm hover:bg-slate-700"
                  >
                    Reset
                  </button>
                  <button className="flex-1 py-2 rounded-lg bg-cyan-600 text-white text-sm hover:bg-cyan-500 font-medium">
                    Next Question
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="h-full flex flex-col">
            <textarea
              className="flex-1 bg-transparent resize-none focus:outline-none text-slate-300 placeholder-slate-600 text-sm font-mono p-2"
              placeholder="Write your study notes here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            {/* Translation & Save Controls */}
            <div className="pt-2 flex items-center gap-2 justify-between border-t border-white/5 mt-2">
              <button
                onClick={handleTranslateNotes}
                disabled={isTranslating || !notes.trim()}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-cyan-400 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isTranslating ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Languages className="w-3 h-3" />
                    Translate to Arabic
                  </>
                )}
              </button>

              <button className="text-xs text-slate-500 hover:text-white transition-colors">
                Save Note
              </button>
            </div>
          </div>
        )}

        {activeTab === 'cards' && <FlashcardManager subject={subject} />}


      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex flex-col items-center justify-center gap-1 py-1.5 rounded-lg transition-all",
        active
          ? "bg-white/10 text-white shadow-sm"
          : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
