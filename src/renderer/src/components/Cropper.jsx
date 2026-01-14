import { useState, useRef, useEffect } from 'react'

const Cropper = ({ fullScreenImage, onCrop, onCancel }) => {
    const [isDrawing, setIsDrawing] = useState(false)
    const [startPos, setStartPos] = useState({ x: 0, y: 0 })
    const [endPos, setEndPos] = useState({ x: 0, y: 0 })
    const [showTooSmallMessage, setShowTooSmallMessage] = useState(false)
    const containerRef = useRef(null)
    const imgRef = useRef(null)

    // Auto-dismiss the "too small" message after 2 seconds
    useEffect(() => {
        if (showTooSmallMessage) {
            const timer = setTimeout(() => setShowTooSmallMessage(false), 2000)
            return () => clearTimeout(timer)
        }
    }, [showTooSmallMessage])

    const handleMouseDown = (e) => {
        const rect = containerRef.current.getBoundingClientRect()
        setStartPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
        setEndPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
        setIsDrawing(true)
    }

    const handleMouseMove = (e) => {
        if (!isDrawing) return
        const rect = containerRef.current.getBoundingClientRect()
        setEndPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    }

    const handleMouseUp = () => {
        if (!isDrawing) return
        setIsDrawing(false)

        const x = Math.min(startPos.x, endPos.x)
        const y = Math.min(startPos.y, endPos.y)
        const w = Math.abs(endPos.x - startPos.x)
        const h = Math.abs(endPos.y - startPos.y)

        if (w < 10 || h < 10) {
            setShowTooSmallMessage(true)
            return
        }
        setShowTooSmallMessage(false)

        const img = new Image()
        img.src = fullScreenImage
        img.onload = () => {
            const rect = containerRef.current.getBoundingClientRect()
            const scaleX = img.naturalWidth / rect.width
            const scaleY = img.naturalHeight / rect.height

            const canvas = document.createElement('canvas')
            // Use full resolution crop
            const cropX = Math.round(x * scaleX)
            const cropY = Math.round(y * scaleY)
            const cropW = Math.round(w * scaleX)
            const cropH = Math.round(h * scaleY)

            canvas.width = cropW
            canvas.height = cropH

            const ctx = canvas.getContext('2d')
            ctx.imageSmoothingEnabled = true
            ctx.imageSmoothingQuality = 'high'
            ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)

            onCrop(canvas.toDataURL('image/png', 1.0))
        }
    }

    const selectionRect = {
        left: Math.min(startPos.x, endPos.x),
        top: Math.min(startPos.y, endPos.y),
        width: Math.abs(endPos.x - startPos.x),
        height: Math.abs(endPos.y - startPos.y)
    }

    const hasSelection = startPos.x !== endPos.x || startPos.y !== endPos.y

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 cursor-crosshair z-50"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{ background: 'transparent' }}
        >
            {/* Full quality background image */}
            <img
                ref={imgRef}
                src={fullScreenImage}
                alt="Screenshot"
                className="w-full h-full object-cover pointer-events-none select-none"
                draggable={false}
            />

            {/* Light overlay - reduced opacity for better visibility */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{ backgroundColor: 'rgba(102, 40, 31, 0.15)' }}
            />

            {/* Selection Rectangle with clearer visibility */}
            {hasSelection && (
                <>
                    {/* Dark overlay outside selection */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: `
                linear-gradient(to right, rgba(0,0,0,0.3) ${selectionRect.left}px, transparent ${selectionRect.left}px),
                linear-gradient(to left, rgba(0,0,0,0.3) calc(100% - ${selectionRect.left + selectionRect.width}px), transparent calc(100% - ${selectionRect.left + selectionRect.width}px)),
                linear-gradient(to bottom, rgba(0,0,0,0.3) ${selectionRect.top}px, transparent ${selectionRect.top}px),
                linear-gradient(to top, rgba(0,0,0,0.3) calc(100% - ${selectionRect.top + selectionRect.height}px), transparent calc(100% - ${selectionRect.top + selectionRect.height}px))
              `
                        }}
                    />

                    {/* Selection border */}
                    <div
                        className="absolute pointer-events-none"
                        style={{
                            left: selectionRect.left,
                            top: selectionRect.top,
                            width: selectionRect.width,
                            height: selectionRect.height,
                            border: '2px solid #994d47',
                            borderRadius: '4px',
                            boxShadow: '0 0 0 1px rgba(255,255,255,0.5), 0 0 20px rgba(153, 77, 71, 0.3)'
                        }}
                    >
                        {/* Corner handles */}
                        <div className="absolute -top-1 -left-1 w-3 h-3 rounded-full" style={{ background: '#994d47' }} />
                        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full" style={{ background: '#994d47' }} />
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 rounded-full" style={{ background: '#994d47' }} />
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full" style={{ background: '#994d47' }} />

                        {/* Size indicator */}
                        <div
                            className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs font-semibold whitespace-nowrap"
                            style={{ background: '#66281f', color: '#f8f7f2' }}
                        >
                            {Math.round(selectionRect.width)} × {Math.round(selectionRect.height)}
                        </div>
                    </div>
                </>
            )}

            {/* Instructions */}
            <div
                className="absolute top-4 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl text-sm pointer-events-none"
                style={{
                    background: 'rgba(248, 247, 242, 0.95)',
                    color: '#66281f',
                    boxShadow: '0 4px 20px rgba(102, 40, 31, 0.2)'
                }}
            >
                Drag to select area <span style={{ color: '#9d8361' }}>|</span> Press <kbd className="mx-1 px-2 py-0.5 rounded text-xs font-semibold" style={{ background: '#e6e5d5', border: '1px solid #bfb9a3' }}>Esc</kbd> to cancel
            </div>

            {/* Too Small Selection Feedback */}
            {showTooSmallMessage && (
                <div
                    className="absolute top-20 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl text-sm pointer-events-none animate-slide-up"
                    style={{
                        background: 'linear-gradient(135deg, #994d47, #66281f)',
                        color: '#f8f7f2',
                        boxShadow: '0 4px 20px rgba(102, 40, 31, 0.3)'
                    }}
                    role="alert"
                >
                    Selection too small – drag a larger area
                </div>
            )}

            {/* Cancel Button */}
            <button
                onClick={onCancel}
                className="absolute top-4 right-4 px-5 py-2 rounded-xl font-bold transition-all hover:scale-105"
                style={{
                    background: 'linear-gradient(135deg, #994d47, #66281f)',
                    color: '#f8f7f2',
                    boxShadow: '0 4px 15px rgba(102, 40, 31, 0.3)'
                }}
            >
                Cancel
            </button>
        </div>
    )
}

export default Cropper
