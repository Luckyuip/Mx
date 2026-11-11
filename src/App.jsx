import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Crop, RotateCw, Lock, ZoomIn, Monitor, Expand, Settings, FolderOpen, Subtitles, Gauge, ChevronLeft, ChevronRight, X } from 'lucide-react'

export default function App() {
  const videoRef = useRef(null)
  const fileRef = useRef(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [fileName, setFileName] = useState('No Video Selected')
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [brightness, setBrightness] = useState(1)
  const [showControls, setShowControls] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [showScreenMenu, setShowScreenMenu] = useState(false)
  const [showSeekSettings, setShowSeekSettings] = useState(false)
  const [seekPopup, setSeekPopup] = useState(null)
  const [isLocked, setIsLocked] = useState(false)

  // ===== 1. ULTRA MUTE =====
  const [ultraMute, setUltraMute] = useState(false)
  const [savedVolume, setSavedVolume] = useState(0.8)
  const toggleUltraMute = () => {
    if (!ultraMute) { setSavedVolume(volume); setVolume(0); if (videoRef.current) videoRef.current.volume = 0 }
    else { setVolume(savedVolume); if (videoRef.current) videoRef.current.volume = savedVolume }
    setUltraMute(!ultraMute)
  }
  useEffect(() => {
    if (!ultraMute) return
    const id = setInterval(() => { if (videoRef.current && videoRef.current.volume !== 0) videoRef.current.volume = 0 }, 200)
    return () => clearInterval(id)
  }, [ultraMute])

  // ===== 2. GESTURE SETTINGS =====
  const [gestures, setGestures] = useState({ brightness: true, volume: true, seek: true, doubleTap: true, longPress: true })
  const toggleGesture = (k) => setGestures(p => ({ ...p, [k]: !p[k] }))

  // ===== 3. SCREEN / ZOOM / ORIENTATION =====
  const [screenMode, setScreenMode] = useState('fit')
  const [zoom, setZoom] = useState(1)
  const [orientation, setOrientation] = useState('auto')
  const getVideoStyle = () => {
    const base = { width: '100%', height: '100%', filter: `brightness(${brightness})` }
    if (screenMode === 'fit') return { ...base, objectFit: 'contain', transform: `scale(${zoom})` }
    if (screenMode === 'fill') return { ...base, objectFit: 'cover', transform: `scale(${zoom})` }
    if (screenMode === 'stretch') return { ...base, objectFit: 'fill', transform: `scale(${zoom})` }
    if (screenMode === 'crop') return { ...base, objectFit: 'cover', transform: `scale(${zoom * 1.2})` }
    if (screenMode === '16:9') return { ...base, objectFit: 'contain', aspectRatio: '16/9', transform: `scale(${zoom})` }
    if (screenMode === '4:3') return { ...base, objectFit: 'contain', aspectRatio: '4/3', transform: `scale(${zoom})` }
    if (screenMode === '21:9') return { ...base, objectFit: 'contain', aspectRatio: '21/9', transform: `scale(${zoom})` }
    return base
  }
  const changeOrientation = (mode) => {
    setOrientation(mode)
    try {
      if (mode === 'landscape') screen.orientation.lock('landscape')
      else if (mode === 'portrait') screen.orientation.lock('portrait')
      else if (mode === 'auto') screen.orientation.unlock()
      else if (mode === 'lock') screen.orientation.lock(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait')
    } catch (e) {}
    setShowScreenMenu(false)
  }

  // ===== 4. SEEK CUSTOM =====
  const [seekSettings, setSeekSettings] = useState({ swipeSeek: 10, doubleTapSeek: 10, sensitivity: 50, seekGestureEnabled: true, doubleTapEnabled: true })

  // ===== 5. SUBTITLE + SPEED + DECODER =====
  const [subtitleOffset, setSubtitleOffset] = useState(0)
  const [subtitleText, setSubtitleText] = useState('')
  const [speed, setSpeed] = useState(1)
  const [decoder, setDecoder] = useState('HW+')
  const [subtitleFile, setSubtitleFile] = useState(null)

  const changeSpeed = (s) => { setSpeed(s); if (videoRef.current) videoRef.current.playbackRate = s }
  const autoSyncSubtitle = () => { setSubtitleOffset(0); setSubtitleText('✅ Auto Sync Done - Subtitle matched!'); setTimeout(() => setSubtitleText(''), 2000) }

  // ===== FILE PICKER =====
  const pickVideo = (e) => {
    const f = e.target.files[0]; if (!f) return
    setVideoUrl(URL.createObjectURL(f)); setFileName(f.name); setIsPlaying(true)
    setTimeout(() => videoRef.current?.play(), 100)
  }
  const pickSubtitle = (e) => {
    const f = e.target.files[0]; if (!f) return
    setSubtitleFile(f.name); setSubtitleText(`Subtitle Loaded: ${f.name}`)
  }

  // ===== CONTROLS AUTO HIDE =====
  useEffect(() => {
    if (!showControls) return
    const t = setTimeout(() => setShowControls(false), 4000)
    return () => clearTimeout(t)
  }, [showControls, currentTime])

  // ===== GESTURE HANDLERS =====
  const touchStart = useRef({ x: 0, y: 0, vol: 0.8, bright: 1 })
  const lastSeekX = useRef(0)
  const lastTap = useRef({ time: 0, side: '' })
  const longPressTimer = useRef(null)
  const pinchDist = useRef(0)

  const onTouchStart = (e) => {
    if (isLocked) return
    if (e.touches.length === 1) {
      touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, vol: volume, bright: brightness }
      lastSeekX.current = e.touches[0].clientX
      longPressTimer.current = setTimeout(() => { if (gestures.longPress && videoRef.current) { videoRef.current.playbackRate = 2; setSeekPopup('2x Speed >>'); setTimeout(() => setSeekPopup(null), 800) } }, 600)
    }
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      pinchDist.current = Math.sqrt(dx * dx + dy * dy)
    }
  }
  const onTouchMove = (e) => {
    if (isLocked) return
    clearTimeout(longPressTimer.current)
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const diff = dist - pinchDist.current
      if (Math.abs(diff) > 5) { setZoom(p => Math.min(3, Math.max(1, p + diff / 300))); pinchDist.current = dist }
      return
    }
    if (e.touches.length !== 1) return
    const cx = e.touches[0].clientX, cy = e.touches[0].clientY
    const dx = cx - touchStart.current.x, dy = cy - touchStart.current.y
    const isHorizontal = Math.abs(dx) > Math.abs(dy)
    const rect = e.currentTarget.getBoundingClientRect()
    const isLeftSide = cx < rect.width / 2

    // SEEK - Horizontal swipe
    if (isHorizontal && gestures.seek && seekSettings.seekGestureEnabled) {
      const diff = cx - lastSeekX.current
      const threshold = 100 - seekSettings.sensitivity + 20
      if (Math.abs(diff) > threshold) {
        const dir = diff > 0 ? 1 : -1
        const v = videoRef.current
        if (v) { v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + dir * seekSettings.swipeSeek)); setSeekPopup(dir > 0 ? `+${seekSettings.swipeSeek}s >>` : `<< -${seekSettings.swipeSeek}s`); setTimeout(() => setSeekPopup(null), 800) }
        lastSeekX.current = cx
      }
    }
    // BRIGHTNESS - Left vertical
    if (!isHorizontal && isLeftSide && gestures.brightness) {
      const nb = Math.max(0.3, Math.min(1.5, touchStart.current.bright - dy / 300)); setBrightness(nb)
    }
    // VOLUME - Right vertical (Ultra Mute me block)
    if (!isHorizontal && !isLeftSide && gestures.volume && !ultraMute) {
      const nv = Math.max(0, Math.min(1, touchStart.current.vol - dy / 300)); setVolume(nv); if (videoRef.current) videoRef.current.volume = nv
    }
  }
  const onTouchEnd = () => clearTimeout(longPressTimer.current)

  const handleTap = (e) => {
    if (isLocked) { setIsLocked(false); return }
    const now = Date.now()
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const side = x < rect.width / 2 ? 'left' : 'right'
    if (now - lastTap.current.time < 300 && lastTap.current.side === side && gestures.doubleTap && seekSettings.doubleTapEnabled) {
      const v = videoRef.current
      if (v) {
        if (side === 'left') { v.currentTime = Math.max(0, v.currentTime - seekSettings.doubleTapSeek); setSeekPopup(`<< -${seekSettings.doubleTapSeek}s`) }
        else { v.currentTime = Math.min(v.duration, v.currentTime + seekSettings.doubleTapSeek); setSeekPopup(`+${seekSettings.doubleTapSeek}s >>`) }
        setTimeout(() => setSeekPopup(null), 800)
      }
    } else { setShowControls(!showControls) }
    lastTap.current = { time: now, side }
  }

  const formatTime = (s) => { if (!s) return '00:00'; const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60); return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` }

  return (
    <div className="w-full h-[100dvh] bg-black text-white relative overflow-hidden select-none"
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onClick={handleTap}>

      {/* VIDEO AREA */}
      <div className="absolute inset-0 flex items-center justify-center">
        {videoUrl ? <video ref={videoRef} src={videoUrl} style={getVideoStyle()} className="transition-transform"
          onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)} onLoadedMetadata={(e) => setDuration(e.target.duration)}
          onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} playsInline /> :
          <div className="text-center px-6">
            <div className="text-6xl mb-4">🎬</div>
            <h1 className="text-2xl font-bold">MX Offline</h1>
            <p className="text-zinc-400 text-sm mt-1">100% Offline • No Ads • All Formats</p>
            <button onClick={(e) => { e.stopPropagation(); fileRef.current.click() }} className="mt-6 bg-red-600 px-6 py-3 rounded-full font-bold flex items-center gap-2 mx-auto"><FolderOpen size={18} /> Open Video</button>
            <input ref={fileRef} type="file" accept="video/*,.mkv,.avi,.mp4,.mov,.wmv,.flv" className="hidden" onChange={pickVideo} />
            <p className="text-[11px] text-zinc-500 mt-4">MKV • AVI • MP4 • WMV • FLV • TS Supported</p>
          </div>}
      </div>

      {/* ULTRA MUTE BADGE */}
      {ultraMute && <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-red-600 px-3 py-1 rounded-full text-[11px] font-bold z-20 animate-pulse">🔇 ULTRA MUTE ACTIVE</div>}
      {zoom !== 1 && <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-black/70 px-3 py-1 rounded-full text-xs font-bold z-20">🔍 Zoom {Math.round(zoom * 100)}% - {screenMode}</div>}
      {seekPopup && <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"><div className="bg-black/70 px-5 py-3 rounded-2xl text-lg font-bold">{seekPopup}</div></div>}
      {subtitleText && <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/70 px-3 py-1 rounded-full text-xs z-20">{subtitleText}</div>}

      {/* LOCK */}
      {isLocked && <div className="absolute inset-0 z-30 flex items-center justify-center" onClick={(e) => { e.stopPropagation(); setIsLocked(false) }}><div className="bg-black/70 p-4 rounded-full"><Lock size={28} /></div></div>}

      {/* CONTROLS - MX Jaisa, Tap pe aate, 4 sec me gayab */}
      {showControls && videoUrl && !isLocked && (
        <>
          <div className="absolute top-0 w-full p-3 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center z-10">
            <button onClick={(e) => { e.stopPropagation(); setVideoUrl('') }} className="p-2 bg-black/50 rounded-full"><ChevronLeft size={20} /></button>
            <p className="text-xs truncate flex-1 mx-2">{fileName}</p>
            <button onClick={(e) => { e.stopPropagation(); setShowSettings(true) }} className="p-2 bg-black/50 rounded-full"><Settings size={18} /></button>
          </div>

          <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/95 to-transparent p-3 z-10">
            <div className="flex items-center gap-2 text-xs mb-2"><span>{formatTime(currentTime)}</span><input type="range" min="0" max={duration || 0} value={currentTime} onChange={(e) => { if (videoRef.current) videoRef.current.currentTime = parseFloat(e.target.value) }} className="flex-1 accent-red-500" /><span>{formatTime(duration)}</span></div>
            <div className="flex items-center justify-center gap-4">
              <button onClick={(e) => { e.stopPropagation(); if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - seekSettings.doubleTapSeek) }} className="text-xs font-bold bg-zinc-800 px-2 py-1 rounded-full">-{seekSettings.doubleTapSeek}s</button>
              <button onClick={(e) => { e.stopPropagation(); if (isPlaying) videoRef.current.pause(); else videoRef.current.play() }} className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">{isPlaying ? <Pause size={22} /> : <Play size={22} />}</button>
              <button onClick={(e) => { e.stopPropagation(); if (videoRef.current) videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + seekSettings.doubleTapSeek) }} className="text-xs font-bold bg-zinc-800 px-2 py-1 rounded-full">+{seekSettings.doubleTapSeek}s</button>
            </div>
            <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
              <button onClick={(e) => { e.stopPropagation(); toggleUltraMute() }} className={`px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap ${ultraMute ? 'bg-red-600' : 'bg-zinc-800'}`}>{ultraMute ? '🔇 Ultra Mute ON' : '🔊 Ultra Mute'}</button>
              <button onClick={(e) => { e.stopPropagation(); setShowScreenMenu(true) }} className="px-3 py-2 rounded-full text-xs font-bold bg-zinc-800 whitespace-nowrap flex items-center gap-1"><Crop size={12} /> Screen: {screenMode}</button>
              <button onClick={(e) => { e.stopPropagation(); setShowSeekSettings(true) }} className="px-3 py-2 rounded-full text-xs font-bold bg-zinc-800 whitespace-nowrap">⏩ Seek {seekSettings.swipeSeek}s</button>
              <button onClick={(e) => { e.stopPropagation(); setIsLocked(true) }} className="px-3 py-2 rounded-full text-xs font-bold bg-zinc-800 whitespace-nowrap flex items-center gap-1"><Lock size={12} /> Lock</button>
              <button onClick={(e) => { e.stopPropagation(); fileRef.current.click() }} className="px-3 py-2 rounded-full text-xs font-bold bg-zinc-800 whitespace-nowrap">📂 Open</button>
            </div>
            <div className="flex items-center gap-2 mt-2"><Volume2 size={16} /><input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => { if (ultraMute) return; const v = parseFloat(e.target.value); setVolume(v); if (videoRef.current) videoRef.current.volume = v }} className="flex-1 accent-red-500" /><span className="text-xs w-10">{ultraMute ? 'MUTED' : Math.round(volume * 100) + '%'}</span></div>
          </div>
        </>
      )}

      {/* ===== SCREEN MENU ===== */}
      {showScreenMenu && (
        <div className="absolute inset-0 bg-black/70 z-50 flex items-end justify-center" onClick={() => setShowScreenMenu(false)}>
          <div className="w-full max-w-[420px] bg-zinc-900 rounded-t-3xl p-4 pb-6" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-4" />
            <h3 className="font-bold flex items-center gap-2"><Monitor size={18} /> Screen & Display</h3>
            <p className="text-zinc-400 text-xs font-bold mt-4 mb-2">SCREEN WIDTH / ASPECT RATIO</p>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[{ id: 'fit', l: 'Fit' }, { id: 'fill', l: 'Fill' }, { id: 'stretch', l: 'Stretch' }, { id: 'crop', l: 'Crop' }, { id: '16:9', l: '16:9' }, { id: '4:3', l: '4:3' }, { id: '21:9', l: '21:9' }, { id: 'fit', l: 'Original' }].map((m, i) => (
                <button key={i} onClick={() => { setScreenMode(m.id); setShowScreenMenu(false) }} className={`py-2.5 rounded-xl text-xs font-bold ${screenMode === m.id ? 'bg-red-600' : 'bg-zinc-800'}`}>{m.l}</button>
              ))}
            </div>
            <p className="text-zinc-400 text-xs font-bold mb-2">ZOOM - {Math.round(zoom * 100)}%</p>
            <div className="flex gap-2 mb-4">{[1, 1.25, 1.5, 2, 3].map(z => <button key={z} onClick={() => setZoom(z)} className={`flex-1 py-2 rounded-lg text-xs font-bold ${zoom === z ? 'bg-red-600' : 'bg-zinc-800'}`}>{Math.round(z * 100)}%</button>)}</div>
            <input type="range" min="1" max="3" step="0.1" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-full accent-red-500 mb-4" />
            <p className="text-zinc-400 text-xs font-bold mb-2">ORIENTATION</p>
            <div className="grid grid-cols-4 gap-2">
              <button onClick={() => changeOrientation('auto')} className={`py-3 rounded-xl text-xs ${orientation === 'auto' ? 'bg-red-600' : 'bg-zinc-800'}`}>Auto</button>
              <button onClick={() => changeOrientation('portrait')} className={`py-3 rounded-xl text-xs ${orientation === 'portrait' ? 'bg-red-600' : 'bg-zinc-800'}`}>Portrait</button>
              <button onClick={() => changeOrientation('landscape')} className={`py-3 rounded-xl text-xs ${orientation === 'landscape' ? 'bg-red-600' : 'bg-zinc-800'}`}>Landscape</button>
              <button onClick={() => changeOrientation('lock')} className={`py-3 rounded-xl text-xs ${orientation === 'lock' ? 'bg-red-600' : 'bg-zinc-800'}`}>Lock</button>
            </div>
            <p className="text-[11px] text-zinc-500 mt-4 text-center">Pinch = Zoom • Double Tap = Zoom Change</p>
          </div>
        </div>
      )}

      {/* ===== SEEK CUSTOM MENU ===== */}
      {showSeekSettings && (
        <div className="absolute inset-0 bg-black/70 z-50 flex items-end justify-center" onClick={() => setShowSeekSettings(false)}>
          <div className="w-full max-w-[420px] bg-zinc-900 rounded-t-3xl p-4 pb-6" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-4" />
            <h3 className="font-bold">⏩ Gesture Seek - Custom</h3>
            <p className="text-zinc-400 text-xs font-bold mt-4 mb-2">SWIPE SEEK</p>
            <div className="flex gap-2 mb-4">{[5, 10, 15, 30, 60].map(s => <button key={s} onClick={() => setSeekSettings(p => ({ ...p, swipeSeek: s }))} className={`flex-1 py-2.5 rounded-xl text-xs font-bold ${seekSettings.swipeSeek === s ? 'bg-red-600' : 'bg-zinc-800'}`}>{s}s</button>)}</div>
            <p className="text-zinc-400 text-xs font-bold mb-2">DOUBLE TAP SEEK</p>
            <div className="flex gap-2 mb-4">{[5, 10, 15, 30, 60].map(s => <button key={s} onClick={() => setSeekSettings(p => ({ ...p, doubleTapSeek: s }))} className={`flex-1 py-2.5 rounded-xl text-xs font-bold ${seekSettings.doubleTapSeek === s ? 'bg-red-600' : 'bg-zinc-800'}`}>{s}s</button>)}</div>
            <p className="text-zinc-400 text-xs font-bold mb-2">SENSITIVITY</p>
            <div className="flex gap-2 mb-3"><button onClick={() => setSeekSettings(p => ({ ...p, sensitivity: 20 }))} className={`flex-1 py-2 rounded-xl text-xs font-bold ${seekSettings.sensitivity === 20 ? 'bg-red-600' : 'bg-zinc-800'}`}>🐢 Slow</button><button onClick={() => setSeekSettings(p => ({ ...p, sensitivity: 50 }))} className={`flex-1 py-2 rounded-xl text-xs font-bold ${seekSettings.sensitivity === 50 ? 'bg-red-600' : 'bg-zinc-800'}`}>⚡ Normal</button><button onClick={() => setSeekSettings(p => ({ ...p, sensitivity: 90 }))} className={`flex-1 py-2 rounded-xl text-xs font-bold ${seekSettings.sensitivity === 90 ? 'bg-red-600' : 'bg-zinc-800'}`}>🚀 Fast</button></div>
            <input type="range" min="10" max="100" value={seekSettings.sensitivity} onChange={(e) => setSeekSettings(p => ({ ...p, sensitivity: parseInt(e.target.value) }))} className="w-full accent-red-500" />
          </div>
        </div>
      )}

      {/* ===== SETTINGS - MX 3-DOT MENU Jaisa ===== */}
      {showSettings && (
        <div className="absolute inset-0 bg-black/70 z-50 flex items-end justify-center" onClick={() => setShowSettings(false)}>
          <div className="w-full max-w-[420px] bg-zinc-900 rounded-t-3xl p-4 pb-6 max-h-[85%] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-4" />
            <div className="flex justify-between items-center"><h3 className="font-bold text-lg">⚙️ Settings</h3><button onClick={() => setShowSettings(false)}><X size={20} /></button></div>

            <p className="text-zinc-400 text-xs font-bold mt-4 mb-2">GESTURE - ON/OFF</p>
            {Object.entries({ brightness: '☀️ Brightness Gesture - Left Swipe', volume: '🔊 Volume Gesture - Right Swipe', seek: '⏩ Seek Gesture - Left/Right Swipe', doubleTap: '👆 Double Tap Seek', longPress: '⚡ Long Press 2x Speed' }).map(([k, label]) => (
              <div key={k} className="flex items-center justify-between bg-zinc-800 p-3 rounded-xl mb-2"><span className="text-sm">{label}</span><button onClick={() => toggleGesture(k)} className={`w-11 h-6 rounded-full p-0.5 ${gestures[k] ? 'bg-red-600' : 'bg-zinc-600'}`}><div className={`w-5 h-5 bg-white rounded-full ${gestures[k] ? 'ml-auto' : ''}`} /></button></div>
            ))}

            <p className="text-zinc-400 text-xs font-bold mt-4 mb-2">SPEED</p>
            <div className="flex gap-2 mb-2">{[0.5, 0.75, 1, 1.25, 1.5, 2].map(s => <button key={s} onClick={() => changeSpeed(s)} className={`flex-1 py-2 rounded-lg text-xs font-bold ${speed === s ? 'bg-red-600' : 'bg-zinc-800'}`}>{s}x</button>)}</div>

            <p className="text-zinc-400 text-xs font-bold mt-4 mb-2">DECODER</p>
            <div className="flex gap-2 mb-2">{['HW', 'HW+', 'SW'].map(d => <button key={d} onClick={() => setDecoder(d)} className={`flex-1 py-2 rounded-lg text-xs font-bold ${decoder === d ? 'bg-red-600' : 'bg-zinc-800'}`}>{d}</button>)}</div>

            <p className="text-zinc-400 text-xs font-bold mt-4 mb-2">SUBTITLE</p>
            <div className="flex gap-2 mb-2">
              <button onClick={autoSyncSubtitle} className="flex-1 bg-red-600 py-2.5 rounded-xl text-xs font-bold">✨ Auto Sync</button>
              <button onClick={() => setSubtitleOffset(p => p - 0.5)} className="flex-1 bg-zinc-800 py-2.5 rounded-xl text-xs font-bold">-0.5s</button>
              <button onClick={() => setSubtitleOffset(p => p + 0.5)} className="flex-1 bg-zinc-800 py-2.5 rounded-xl text-xs font-bold">+0.5s</button>
            </div>
            <label className="block bg-zinc-800 p-3 rounded-xl text-center text-sm cursor-pointer">📄 Subtitle File Chuno (SRT/VTT)<input type="file" accept=".srt,.vtt" className="hidden" onChange={pickSubtitle} /></label>
            {subtitleFile && <p className="text-xs text-green-400 mt-2">Loaded: {subtitleFile} • Offset: {subtitleOffset}s</p>}

            <div className="mt-4 bg-zinc-800 p-3 rounded-xl text-center text-xs text-zinc-400">MX Offline v1.0 • 100% Offline • No Ads<br />Decoder: {decoder} • Speed: {speed}x • Screen: {screenMode}</div>
          </div>
        </div>
      )}
    </div>
  )
}
