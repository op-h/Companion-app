'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ar';

interface Translations {
  [key: string]: {
    en: string;
    ar: string;
  };
}

const translations: Translations = {
  // Dashboard
  'dashboard.greeting': { en: 'Welcome Back,', ar: 'مرحباً بك،' },
  'dashboard.continueReading': { en: 'Continue Reading', ar: 'متابعة القراءة' },
  'dashboard.searchPlaceholder': { en: 'Search subjects...', ar: 'بحث عن المواد...' },
  'dashboard.filters.all': { en: 'All', ar: 'الكل' },
  'dashboard.filters.read': { en: 'Read', ar: 'مقروء' },
  'dashboard.filters.unread': { en: 'Unread', ar: 'غير مقروء' },
  'dashboard.examCountdown': { en: 'Exam Countdown', ar: 'العد التنازلي للاختبارات' },
  'dashboard.daysLeft': { en: 'Days Left', ar: 'أيام متبقية' },
  'dashboard.nextExam': { en: 'Next: ', ar: 'التالي: ' },
  'dashboard.selectExam': { en: 'Select Subject', ar: 'اختر المادة' },
  'dashboard.noExams': { en: 'No upcoming exams', ar: 'لا توجد اختبارات قادمة' },

  // Sidebar
  'sidebar.quiz': { en: 'Quiz', ar: 'اختبار' },
  'sidebar.notes': { en: 'Notes', ar: 'ملاحظات' },
  'sidebar.cards': { en: 'Cards', ar: 'بطاقات' },
  'sidebar.generateQuiz': { en: 'Generate Quiz', ar: 'إنشاء اختبار' },
  'sidebar.testKnowledge': { en: 'Test Your Knowledge', ar: 'اختبر معلوماتك' },
  'sidebar.notesPlaceholder': { en: 'Write your study notes here...', ar: 'اكتب ملاحظاتك الدراسية هنا...' },
  'sidebar.saveNotes': { en: 'Save to LocalStorage', ar: 'حفظ في التخزين المحلي' },

  // Flashcards
  'flashcards.title': { en: 'Flashcards', ar: 'البطاقات التعليمية' },
  'flashcards.create': { en: 'Create New Card', ar: 'إنشاء بطاقة جديدة' },
  'flashcards.front': { en: 'Front (Question)', ar: 'الوجه (السؤال)' },
  'flashcards.back': { en: 'Back (Answer)', ar: 'الظهر (الإجابة)' },
  'flashcards.add': { en: 'Add Card', ar: 'إضافة بطاقة' },
  'flashcards.delete': { en: 'Delete', ar: 'حذف' },
  'flashcards.flip': { en: 'Click to flip', ar: 'انقر للقلب' },

  // PDF Viewer
  'viewer.zenMode': { en: 'Zen Mode', ar: 'وضع التركيز' },
  'viewer.exitZen': { en: 'Exit Zen Mode (Esc)', ar: 'خروج من وضع التركيز (Esc)' },
  'viewer.page': { en: 'Page', ar: 'صفحة' },
  'viewer.bookmark': { en: 'Bookmark', ar: 'إشارة مرجعية' },

  // Pomodoro
  'timer.focus': { en: 'Focus', ar: 'تركيز' },
  'timer.break': { en: 'Break', ar: 'راحة' },
  'timer.switch': { en: 'Switch', ar: 'تبديل' },
  'timer.settings': { en: 'Settings', ar: 'إعدادات' },
  'timer.sound': { en: 'Sound', ar: 'صوت' },
  'timer.focusTime': { en: 'Focus Time (min)', ar: 'وقت التركيز (دقيقة)' },
  'timer.breakTime': { en: 'Break Time (min)', ar: 'وقت الراحة (دقيقة)' },

  // General
  'gen.loading': { en: 'Loading...', ar: 'جاري التحميل...' },
  'gen.back': { en: 'Back', ar: 'رجوع' },
  'gen.home': { en: 'Home', ar: 'الرئيسية' },
  'gen.language': { en: 'Language', ar: 'اللغة' },
  'gen.designedBy': { en: 'Designed by', ar: 'تصميم' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('app-language') as Language;
    if (saved) setLanguage(saved);
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('app-language', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  const t = (key: string) => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage: handleSetLanguage,
      t,
      dir: language === 'ar' ? 'rtl' : 'ltr'
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
