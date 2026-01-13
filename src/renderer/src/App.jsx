import { useState, useEffect, useCallback } from 'react'
import Editor from './components/Editor'
import Cropper from './components/Cropper'
import ScreenSelector from './components/ScreenSelector'
import { Camera } from 'lucide-react'
import cakeIcon from './assets/cake.png'

function App() {
  const [imageSrc, setImageSrc] = useState(null)
  const [fullScreenCapture, setFullScreenCapture] = useState(null)
  const [screenSources, setScreenSources] = useState([])
  const [mode, setMode] = useState('home')

  const captureScreen = useCallback(async (sourceId) => {
    try {
      await window.electron.ipcRenderer.invoke('HIDE_WINDOW')
      await new Promise((resolve) => setTimeout(resolve, 150))

      const bounds = await window.electron.ipcRenderer.invoke('GET_DISPLAY_BOUNDS')
      const scaleFactor = window.devicePixelRatio || 1

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sourceId,
            minWidth: bounds.width * scaleFactor,
            maxWidth: bounds.width * scaleFactor * 2,
            minHeight: bounds.height * scaleFactor,
            maxHeight: bounds.height * scaleFactor * 2
          }
        }
      })

      const video = document.createElement('video')
      video.srcObject = stream

      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          video.play()
          resolve()
        }
      })

      await new Promise((resolve) => setTimeout(resolve, 150))

      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const dataUrl = canvas.toDataURL('image/png')
      stream.getTracks().forEach((track) => track.stop())

      setFullScreenCapture(dataUrl)
      setScreenSources([])
      setMode('cropping')

      await window.electron.ipcRenderer.invoke('SHOW_WINDOW')

    } catch (e) {
      console.error('Failed to capture screen:', e)
      await window.electron.ipcRenderer.invoke('SHOW_WINDOW')
    }
  }, [])

  const startScreenCapture = useCallback(async () => {
    try {
      await window.electron.ipcRenderer.invoke('HIDE_WINDOW')
      await new Promise((resolve) => setTimeout(resolve, 150))

      const sources = await window.electron.ipcRenderer.invoke('GET_SCREEN_SOURCES')
      if (!sources || sources.length === 0) {
        console.error('No screen sources found')
        await window.electron.ipcRenderer.invoke('SHOW_WINDOW')
        return
      }

      await window.electron.ipcRenderer.invoke('SHOW_WINDOW')

      if (sources.length > 1) {
        setScreenSources(sources)
        setMode('selecting-screen')
      } else {
        await captureScreen(sources[0].id)
      }

    } catch (e) {
      console.error('Failed to start screen capture:', e)
      await window.electron.ipcRenderer.invoke('SHOW_WINDOW')
    }
  }, [captureScreen])

  const handleScreenSelect = (sourceId) => {
    captureScreen(sourceId)
  }

  const handleCancelScreenSelect = () => {
    setScreenSources([])
    setMode('home')
  }

  const handleCrop = (croppedImage) => {
    setImageSrc(croppedImage)
    setFullScreenCapture(null)
    setMode('editing')
  }

  const handleCancelCrop = () => {
    setFullScreenCapture(null)
    setMode('home')
  }

  const handleCloseEditor = () => {
    setImageSrc(null)
    setMode('home')
  }

  useEffect(() => {
    const handler = () => {
      startScreenCapture()
    }

    window.electron.ipcRenderer.on('TRIGGER_SCREENSHOT', handler)

    return () => {
      window.electron.ipcRenderer.removeListener('TRIGGER_SCREENSHOT', handler)
    }
  }, [startScreenCapture])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (mode === 'cropping') {
          handleCancelCrop()
        } else if (mode === 'selecting-screen') {
          handleCancelScreenSelect()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mode])

  if (mode === 'selecting-screen' && screenSources.length > 0) {
    return (
      <ScreenSelector
        sources={screenSources}
        onSelect={handleScreenSelect}
        onCancel={handleCancelScreenSelect}
      />
    )
  }

  if (mode === 'cropping' && fullScreenCapture) {
    return (
      <Cropper
        fullScreenImage={fullScreenCapture}
        onCrop={handleCrop}
        onCancel={handleCancelCrop}
      />
    )
  }

  if (mode === 'editing' && imageSrc) {
    return <Editor imageSrc={imageSrc} onClose={handleCloseEditor} />
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col justify-center items-center p-8 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #66281f 0%, #994d47 100%)' }}
    >
      {/* Styles for animations */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
          100% { transform: translateY(0px); }
        }
        .floating-cake {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }
      `}</style>

      {/* Subtle Vintage Frame Decoration - Moved closer to edge */}
      <div
        className="absolute inset-2 md:inset-4 pointer-events-none border border-white/10 rounded-3xl z-0"
      />
      <div
        className="absolute inset-3 md:inset-6 pointer-events-none border border-white/5 rounded-2xl z-0"
      />

      <div className="text-center z-10 fade-in w-full max-w-2xl px-4 flex flex-col items-center">
        {/* Cake Icon - Floating Animation */}
        <div className="mb-6 floating-cake">
          <img
            src={cakeIcon}
            alt="Morisnip"
            className="w-48 h-48 md:w-56 md:h-56 mx-auto object-contain drop-shadow-2xl"
          />
        </div>

        <h1
          className="text-5xl md:text-7xl font-bold mb-2 tracking-tight"
          style={{ color: '#f8f7f2', fontFamily: 'Quicksand, sans-serif' }}
        >
          Morisnip
        </h1>

        <p
          className="mb-8 text-lg md:text-xl font-medium tracking-wide opacity-90"
          style={{ color: '#e6e5d5', fontFamily: 'Quicksand, sans-serif' }}
        >
          Capture, Annotate, Save.
        </p>

        <button
          onClick={startScreenCapture}
          className="group relative px-12 py-6 text-xl font-bold transition-all duration-300 flex items-center justify-center gap-4 hover:-translate-y-1 hover:shadow-2xl overflow-hidden"
          style={{
            background: '#e6e5d5',
            color: '#66281f',
            borderRadius: '4px',
            fontFamily: 'Quicksand, sans-serif',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
          }}
        >
          {/* Decorative Inner Border */}
          <div className="absolute inset-1.5 border-2 border-dashed border-[#66281f]/40 group-hover:border-[#e6e5d5]/40 transition-colors duration-300 pointer-events-none z-20" />

          {/* Corner Accents */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-4 border-l-4 border-[#66281f] group-hover:border-[#e6e5d5] transition-colors duration-300 z-20" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-4 border-r-4 border-[#66281f] group-hover:border-[#e6e5d5] transition-colors duration-300 z-20" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-4 border-l-4 border-[#66281f] group-hover:border-[#e6e5d5] transition-colors duration-300 z-20" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-4 border-r-4 border-[#66281f] group-hover:border-[#e6e5d5] transition-colors duration-300 z-20" />

          {/* Hover Fill Effect */}
          <div className="absolute inset-0 bg-[#66281f] scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500 ease-out z-0" />

          {/* Content */}
          <Camera size={26} strokeWidth={2.5} className="relative z-30 group-hover:text-[#e6e5d5] transition-colors duration-300" />
          <span className="relative z-30 group-hover:text-[#e6e5d5] transition-colors duration-300 tracking-wide">Take Screenshot</span>
        </button>

        <div
          className="mt-8 text-sm font-medium opacity-80"
          style={{ color: '#bfb9a3', fontFamily: 'Quicksand, sans-serif' }}
        >
          <p className="flex items-center justify-center gap-2 flex-wrap text-center">
            Press
            <kbd
              className="mx-1 px-3 py-1.5 text-xs font-bold tracking-wider uppercase transition-colors hover:bg-white/20"
              style={{
                background: 'rgba(255,255,255,0.1)',
                color: '#f8f7f2',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '4px'
              }}
            >
              Ctrl + Shift + S
            </kbd>
            for quick capture
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
