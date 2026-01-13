import { useRef, useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Type, Square, Circle, PenTool, Save, MousePointer2, Trash2, Undo2, Redo2, Plus, Minus } from 'lucide-react'

const ToolButton = ({ active, onClick, children, title }) => (
    <button
        onClick={onClick}
        title={title}
        className="p-3 rounded-xl transition-all duration-200"
        style={{
            background: active ? 'linear-gradient(135deg, #994d47, #66281f)' : '#e6e5d5',
            color: active ? '#f8f7f2' : '#66281f',
            boxShadow: active ? '0 4px 15px rgba(102, 40, 31, 0.3)' : 'none'
        }}
    >
        {children}
    </button>
)

const Editor = ({ imageSrc, onClose }) => {
    const canvasRef = useRef(null)
    const containerRef = useRef(null)

    const [tool, setTool] = useState('pen')
    const [color, setColor] = useState('#994d47')
    const [lineWidth, setLineWidth] = useState(3)
    const [texts, setTexts] = useState([])
    const [selectedTextId, setSelectedTextId] = useState(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [startPos, setStartPos] = useState({ x: 0, y: 0 })

    const [history, setHistory] = useState([])
    const [historyIndex, setHistoryIndex] = useState(-1)

    const saveToHistory = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const dataUrl = canvas.toDataURL()
        const newHistory = history.slice(0, historyIndex + 1)
        newHistory.push(dataUrl)
        if (newHistory.length > 20) newHistory.shift()
        setHistory(newHistory)
        setHistoryIndex(newHistory.length - 1)
    }, [history, historyIndex])

    const handleUndo = useCallback(() => {
        if (historyIndex > 0) {
            const prevIndex = historyIndex - 1
            const canvas = canvasRef.current
            const ctx = canvas.getContext('2d')
            const img = new Image()
            img.src = history[prevIndex]
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height)
                ctx.drawImage(img, 0, 0)
            }
            setHistoryIndex(prevIndex)
        }
    }, [history, historyIndex])

    const handleRedo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const nextIndex = historyIndex + 1
            const canvas = canvasRef.current
            const ctx = canvas.getContext('2d')
            const img = new Image()
            img.src = history[nextIndex]
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height)
                ctx.drawImage(img, 0, 0)
            }
            setHistoryIndex(nextIndex)
        }
    }, [history, historyIndex])

    useEffect(() => {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        const img = new Image()
        img.src = imageSrc
        img.onload = () => {
            canvas.width = img.naturalWidth
            canvas.height = img.naturalHeight
            ctx.drawImage(img, 0, 0)
            setHistory([canvas.toDataURL()])
            setHistoryIndex(0)
        }
    }, [imageSrc])

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault()
                handleUndo()
            } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault()
                handleRedo()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleUndo, handleRedo])

    const getPos = (e) => {
        const rect = canvasRef.current.getBoundingClientRect()
        const scaleX = canvasRef.current.width / rect.width
        const scaleY = canvasRef.current.height / rect.height
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        }
    }

    const startDrawing = (e) => {
        if (tool === 'text' || tool === 'select') return
        const pos = getPos(e)
        setStartPos(pos)
        setIsDrawing(true)
        const ctx = canvasRef.current.getContext('2d')
        ctx.beginPath()
        ctx.moveTo(pos.x, pos.y)
        ctx.strokeStyle = color
        ctx.lineWidth = lineWidth
        ctx.lineCap = 'round'
    }

    const draw = (e) => {
        if (!isDrawing) return
        const pos = getPos(e)
        const ctx = canvasRef.current.getContext('2d')

        if (tool === 'pen') {
            ctx.lineTo(pos.x, pos.y)
            ctx.stroke()
        } else if (tool === 'rect' || tool === 'circle') {
            if (historyIndex >= 0) {
                const img = new Image()
                img.src = history[historyIndex]
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
                ctx.drawImage(img, 0, 0)
            }
            ctx.beginPath()
            ctx.strokeStyle = color
            ctx.lineWidth = lineWidth
            const w = pos.x - startPos.x
            const h = pos.y - startPos.y
            if (tool === 'rect') {
                ctx.strokeRect(startPos.x, startPos.y, w, h)
            } else {
                ctx.beginPath()
                ctx.ellipse(startPos.x + w / 2, startPos.y + h / 2, Math.abs(w / 2), Math.abs(h / 2), 0, 0, 2 * Math.PI)
                ctx.stroke()
            }
        }
    }

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false)
            saveToHistory()
        }
    }

    const handleCanvasClick = (e) => {
        if (tool === 'text') {
            const rect = containerRef.current.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            const newText = {
                id: Date.now(),
                x,
                y,
                content: 'Type here',
                color: color,
                fontSize: 24,
                fontFamily: 'Quicksand'
            }
            setTexts([...texts, newText])
            setSelectedTextId(newText.id)
            setTool('select')
        } else if (tool === 'select') {
            setSelectedTextId(null)
        }
    }

    const handleTextClick = (e, textId) => {
        e.stopPropagation()
        if (tool === 'select') {
            setSelectedTextId(textId)
        }
    }

    const updateSelectedText = (updates) => {
        setTexts(prev => prev.map(t => t.id === selectedTextId ? { ...t, ...updates } : t))
    }

    const selectedText = texts.find(t => t.id === selectedTextId)

    const handleSave = async () => {
        const canvas = canvasRef.current
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = canvas.width
        tempCanvas.height = canvas.height
        const ctx = tempCanvas.getContext('2d')
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(canvas, 0, 0)

        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height

        texts.forEach(t => {
            ctx.font = `600 ${t.fontSize * scaleY}px ${t.fontFamily}`
            ctx.fillStyle = t.color
            ctx.fillText(t.content, t.x * scaleX, t.y * scaleY + (t.fontSize * scaleY * 0.8))
        })

        const dataUrl = tempCanvas.toDataURL('image/png', 1.0)
        const success = await window.electron.ipcRenderer.invoke('SAVE_IMAGE', dataUrl)
        if (success) {
            alert('Saved successfully!')
        }
    }

    return (
        <div className="flex h-screen w-screen flex-col" style={{ background: '#f8f7f2' }}>
            {/* Toolbar */}
            <div
                className="flex items-center justify-between px-6 py-3"
                style={{
                    background: 'linear-gradient(135deg, #66281f, #994d47)',
                    boxShadow: '0 4px 20px rgba(102, 40, 31, 0.3)'
                }}
            >
                <div className="flex items-center gap-4">
                    <button
                        onClick={onClose}
                        className="p-3 rounded-xl transition-all hover:scale-105"
                        style={{ background: 'rgba(248, 247, 242, 0.2)' }}
                        title="Close"
                    >
                        <ArrowLeft size={20} className="text-white" />
                    </button>

                    {/* Undo Button */}
                    <button
                        onClick={handleUndo}
                        disabled={historyIndex <= 0}
                        className="p-3 rounded-xl transition-all hover:scale-105 disabled:opacity-50"
                        style={{ background: 'rgba(248, 247, 242, 0.2)' }}
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo2 size={20} className="text-white" />
                    </button>

                    {/* Redo Button */}
                    <button
                        onClick={handleRedo}
                        disabled={historyIndex >= history.length - 1}
                        className="p-3 rounded-xl transition-all hover:scale-105 disabled:opacity-50"
                        style={{ background: 'rgba(248, 247, 242, 0.2)' }}
                        title="Redo (Ctrl+Y)"
                    >
                        <Redo2 size={20} className="text-white" />
                    </button>

                    <div className="h-8 w-px mx-2" style={{ background: 'rgba(248, 247, 242, 0.3)' }} />

                    <div className="flex items-center gap-2 p-2 rounded-2xl" style={{ background: 'rgba(248, 247, 242, 0.15)' }}>
                        <ToolButton active={tool === 'select'} onClick={() => setTool('select')} title="Select">
                            <MousePointer2 size={18} />
                        </ToolButton>
                        <ToolButton active={tool === 'pen'} onClick={() => setTool('pen')} title="Pen">
                            <PenTool size={18} />
                        </ToolButton>
                        <ToolButton active={tool === 'rect'} onClick={() => setTool('rect')} title="Rectangle">
                            <Square size={18} />
                        </ToolButton>
                        <ToolButton active={tool === 'circle'} onClick={() => setTool('circle')} title="Circle">
                            <Circle size={18} />
                        </ToolButton>
                        <ToolButton active={tool === 'text'} onClick={() => setTool('text')} title="Text">
                            <Type size={18} />
                        </ToolButton>
                    </div>

                    <div className="h-8 w-px mx-2" style={{ background: 'rgba(248, 247, 242, 0.3)' }} />

                    <div className="flex items-center gap-3 p-2 rounded-2xl" style={{ background: 'rgba(248, 247, 242, 0.15)' }}>
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="w-10 h-10 rounded-xl cursor-pointer border-2 border-white/30"
                            style={{ background: 'transparent' }}
                        />
                        <input
                            type="range"
                            min="1"
                            max="20"
                            value={lineWidth}
                            onChange={(e) => setLineWidth(parseInt(e.target.value))}
                            className="w-24"
                            style={{ accentColor: '#f8f7f2' }}
                        />
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-105"
                    style={{
                        background: '#f8f7f2',
                        color: '#66281f',
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
                    }}
                >
                    <Save size={18} /> Save
                </button>
            </div>

            {/* Text Properties Panel */}
            {selectedText && (
                <div
                    className="flex items-center gap-4 px-6 py-3"
                    style={{ background: '#e6e5d5', borderBottom: '1px solid #bfb9a3' }}
                >
                    <span className="font-semibold text-sm" style={{ color: '#66281f' }}>Text Properties:</span>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => updateSelectedText({ fontSize: Math.max(12, selectedText.fontSize - 4) })}
                            className="p-2 rounded-lg"
                            style={{ background: '#bfb9a3', color: '#66281f' }}
                        >
                            <Minus size={14} />
                        </button>
                        <span className="w-12 text-center font-semibold" style={{ color: '#66281f' }}>
                            {selectedText.fontSize}px
                        </span>
                        <button
                            onClick={() => updateSelectedText({ fontSize: Math.min(120, selectedText.fontSize + 4) })}
                            className="p-2 rounded-lg"
                            style={{ background: '#bfb9a3', color: '#66281f' }}
                        >
                            <Plus size={14} />
                        </button>
                    </div>

                    <div className="h-6 w-px" style={{ background: '#bfb9a3' }} />

                    <select
                        value={selectedText.fontFamily}
                        onChange={(e) => updateSelectedText({ fontFamily: e.target.value })}
                        className="px-3 py-2 rounded-lg font-semibold"
                        style={{ background: '#bfb9a3', color: '#66281f', border: 'none' }}
                    >
                        <option value="Quicksand">Quicksand</option>
                        <option value="Arial">Arial</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Courier New">Courier New</option>
                        <option value="Verdana">Verdana</option>
                    </select>

                    <div className="h-6 w-px" style={{ background: '#bfb9a3' }} />

                    <input
                        type="color"
                        value={selectedText.color}
                        onChange={(e) => updateSelectedText({ color: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer"
                        style={{ border: '2px solid #bfb9a3' }}
                    />

                    <button
                        onClick={() => {
                            setTexts(texts.filter(t => t.id !== selectedTextId))
                            setSelectedTextId(null)
                        }}
                        className="p-2 rounded-lg ml-auto"
                        style={{ background: '#994d47', color: '#f8f7f2' }}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )}

            {/* Canvas Area */}
            <div
                className="flex-1 relative overflow-auto flex justify-center items-center p-8"
                style={{ background: '#bfb9a3' }}
            >
                <div ref={containerRef} className="relative rounded-2xl overflow-hidden" style={{ boxShadow: '0 20px 60px rgba(102, 40, 31, 0.3)' }}>
                    <canvas
                        ref={canvasRef}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onClick={handleCanvasClick}
                        className="bg-white"
                        style={{
                            maxWidth: '100%',
                            maxHeight: '70vh',
                            display: 'block',
                            cursor: tool === 'text' ? 'text' : tool === 'select' ? 'default' : 'crosshair'
                        }}
                    />

                    {texts.map((t) => (
                        <div
                            key={t.id}
                            className="absolute group"
                            style={{
                                left: t.x,
                                top: t.y,
                                color: t.color,
                                fontSize: t.fontSize,
                                fontFamily: t.fontFamily,
                                border: selectedTextId === t.id ? '2px dashed #994d47' : '2px dashed transparent',
                                padding: '4px 8px',
                                borderRadius: '8px',
                                cursor: tool === 'select' ? 'move' : 'default',
                                background: selectedTextId === t.id ? 'rgba(248, 247, 242, 0.5)' : 'transparent'
                            }}
                            onClick={(e) => handleTextClick(e, t.id)}
                            onMouseDown={(e) => {
                                if (tool !== 'select') return
                                e.stopPropagation()
                                const startX = e.clientX
                                const startY = e.clientY
                                const startLeft = t.x
                                const startTop = t.y

                                const onMove = (moveEvent) => {
                                    const dx = moveEvent.clientX - startX
                                    const dy = moveEvent.clientY - startY
                                    setTexts(prev => prev.map(item => item.id === t.id ? { ...item, x: startLeft + dx, y: startTop + dy } : item))
                                }

                                const onUp = () => {
                                    window.removeEventListener('mousemove', onMove)
                                    window.removeEventListener('mouseup', onUp)
                                }

                                window.addEventListener('mousemove', onMove)
                                window.addEventListener('mouseup', onUp)
                            }}
                        >
                            <div
                                contentEditable
                                suppressContentEditableWarning
                                className="outline-none whitespace-nowrap font-semibold"
                                style={{ minWidth: '50px' }}
                                onBlur={(e) => {
                                    setTexts(prev => prev.map(item => item.id === t.id ? { ...item, content: e.target.innerText } : item))
                                }}
                                onFocus={() => setSelectedTextId(t.id)}
                            >
                                {t.content}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Editor
