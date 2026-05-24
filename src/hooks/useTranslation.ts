import { useEffect, useRef, useState } from 'react';

// Cache translations to avoid re-fetching
const translationCache = new Map<string, string>();

function getCacheKey(text: string, targetLang: string): string {
  return `${targetLang}:${text.slice(0, 100)}`;
}

/**
 * Translate text using the Google Translate API (free tier).
 * Returns { translatedText, isTranslating, isTranslated }.
 * If the text is already in the target language, translatedText === original.
 */
export function useTranslation(text: string | undefined, targetLang: string) {
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!text) {
      setTranslatedText(null);
      setIsTranslating(false);
      return;
    }

    const cacheKey = getCacheKey(text, targetLang);
    const cached = translationCache.get(cacheKey);
    if (cached !== undefined) {
      setTranslatedText(cached === text ? null : cached);
      setIsTranslating(false);
      return;
    }

    // Abort previous request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsTranslating(true);

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

    fetch(url, { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (controller.signal.aborted) return;
        // data[0] is array of translation segments, data[2] is detected source language
        const detectedLang: string = data[2] || 'en';
        // Compare base language codes (e.g. 'zh-CN' matches 'zh', 'pt-BR' matches 'pt')
        const detectedBase = detectedLang.split('-')[0];
        const targetBase = targetLang.split('-')[0];
        const translated = (data[0] as any[])
          .map((seg: any) => seg[0])
          .join('');
        if (detectedBase === targetBase || translated === text) {
          // Already in target language or translation is identical
          translationCache.set(cacheKey, text);
          setTranslatedText(null);
        } else {
          translationCache.set(cacheKey, translated);
          setTranslatedText(translated);
        }
        setIsTranslating(false);
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
        console.warn('Translation failed:', err);
        setIsTranslating(false);
        setTranslatedText(null);
      });

    return () => controller.abort();
  }, [text, targetLang]);

  return { translatedText, isTranslating, isTranslated: translatedText !== null };
}
