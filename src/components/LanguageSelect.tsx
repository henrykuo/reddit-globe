import { useCallback, useEffect, useRef, useState } from 'react';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pt', label: 'Português' },
  { code: 'it', label: 'Italiano' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'zh', label: '中文' },
  { code: 'ru', label: 'Русский' },
  { code: 'ar', label: 'العربية' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'sv', label: 'Svenska' },
  { code: 'pl', label: 'Polski' },
  { code: 'tr', label: 'Türkçe' },
];

interface LanguageSelectProps {
  value: string;
  onChange: (lang: string) => void;
}

export default function LanguageSelect({ value, onChange }: LanguageSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = LANGUAGES.find(l => l.code === value) || LANGUAGES[0];

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelect = useCallback((code: string) => {
    onChange(code);
    setOpen(false);
  }, [onChange]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="px-3 py-2 rounded-lg bg-gray-100 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 flex items-center gap-1"
        aria-label="Select language"
        aria-expanded={open}
      >
        {selected.label}
        <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full mt-1 right-0 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto w-36 z-20">
          {LANGUAGES.map(lang => (
            <div
              key={lang.code}
              className={`px-3 py-1.5 cursor-pointer text-sm ${
                lang.code === value ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50'
              } text-slate-900`}
              onMouseDown={e => { e.preventDefault(); handleSelect(lang.code); }}
            >
              {lang.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
