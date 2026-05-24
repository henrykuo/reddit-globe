import EarthGlobe from './components/EarthGlobe/EarthGlobe'
import LanguageSelect from './components/LanguageSelect'
import SubredditSearch from './components/SubredditSearch'
import { useCallback, useEffect, useRef, useState } from 'react'

function App() {
  const [autoRotation, setAutoRotation] = useState(true)
  const [riseReady, setRiseReady] = useState(false)
  const [language, setLanguage] = useState('en')
  const navigateToCityRef = useRef<((cityIndex: number) => void) | null>(null)

  const handleSearchSelect = useCallback((cityIndex: number) => {
    navigateToCityRef.current?.(cityIndex)
  }, [])

  // Trigger the rise animation on next frame after mount
  useEffect(() => {
    requestAnimationFrame(() => setRiseReady(true))
  }, [])

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* White container box - full screen */}
      <div className="absolute inset-0 bg-white">
        {/* Globe - 100% of viewport, rises up from below on load */}
        <div
          className="w-full h-full"
          style={{
            transform: riseReady ? 'translateY(0)' : 'translateY(100vh)',
            transition: 'transform 1600ms cubic-bezier(0.25, 0.1, 0.25, 1)',
          }}
        >
          <EarthGlobe className="w-full h-full" disableAutoRotation={!autoRotation} onNavigateToCityRef={navigateToCityRef} language={language} />
        </div>
      </div>

      {/* Title - top left */}
      <div className="absolute top-6 left-6 z-10">
        <h1 className="text-3xl font-semibold text-slate-900 leading-tight">globally local</h1>
        <h2 className="text-1xl font-semibold text-slate-900 leading-tight">The top current post<br></br>from local subreddits<br></br>around the world</h2>
      </div>

      {/* Search input + language dropdown - top right */}
      <div className="absolute top-6 right-6 z-10 flex items-center gap-2 max-[639px]:flex-col max-[639px]:items-end">
        <SubredditSearch onSelect={handleSearchSelect} />
        <LanguageSelect value={language} onChange={setLanguage} />
      </div>

      {/* Auto-rotation toggle - bottom left */}
      <div className="absolute bottom-8 left-6 z-10 flex items-center gap-2">
        <button
          onClick={() => setAutoRotation(prev => !prev)}
          role="switch"
          aria-checked={autoRotation}
          aria-label="Toggle auto-rotation"
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1 ${
            autoRotation ? 'bg-gray-700' : 'bg-slate-300'
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
              autoRotation ? 'translate-x-[1.15rem]' : 'translate-x-0.5'
            }`}
          />
        </button>
        <span className="text-xs text-slate-500">Auto rotate</span>
      </div>
      {/* Help text - bottom right */}
      <div className="absolute bottom-8 right-6 z-10">
        <p className="text-xs text-slate-500">Drag to rotate. Click or press "Return" to open post.</p>
      </div>
    </div>
  )
}

export default App
