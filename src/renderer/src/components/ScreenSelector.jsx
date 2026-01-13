import { Monitor } from 'lucide-react'

const ScreenSelector = ({ sources, onSelect, onCancel }) => {
    return (
        <div
            className="h-screen w-screen flex flex-col justify-center items-center p-8"
            style={{
                background: 'linear-gradient(135deg, #f8f7f2 0%, #e6e5d5 50%, #bfb9a3 100%)'
            }}
        >
            <div
                className="p-8 rounded-3xl max-w-4xl w-full"
                style={{
                    background: '#f8f7f2',
                    boxShadow: '0 20px 60px rgba(102, 40, 31, 0.2)'
                }}
            >
                <div className="text-center mb-8">
                    <div
                        className="mb-4 p-4 rounded-full inline-block"
                        style={{ background: 'linear-gradient(135deg, #994d47, #66281f)' }}
                    >
                        <Monitor size={32} className="text-white" strokeWidth={1.5} />
                    </div>
                    <h2
                        className="text-2xl font-bold mb-2"
                        style={{ color: '#66281f' }}
                    >
                        Select a Screen
                    </h2>
                    <p style={{ color: '#9d8361' }}>
                        Choose which monitor you want to capture
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    {sources.map((source, index) => (
                        <button
                            key={source.id}
                            onClick={() => onSelect(source.id)}
                            className="p-4 rounded-2xl transition-all duration-300 hover:scale-102 group"
                            style={{
                                background: '#e6e5d5',
                                border: '2px solid #bfb9a3'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = '#994d47'
                                e.currentTarget.style.boxShadow = '0 8px 25px rgba(153, 77, 71, 0.2)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = '#bfb9a3'
                                e.currentTarget.style.boxShadow = 'none'
                            }}
                        >
                            {/* Thumbnail Preview */}
                            <div
                                className="w-full h-32 rounded-xl mb-3 overflow-hidden"
                                style={{
                                    background: '#bfb9a3',
                                    border: '1px solid #9d8361'
                                }}
                            >
                                <img
                                    src={source.thumbnail}
                                    alt={source.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Label */}
                            <div className="flex items-center justify-center gap-2">
                                <Monitor size={18} style={{ color: '#66281f' }} />
                                <span
                                    className="font-semibold"
                                    style={{ color: '#66281f' }}
                                >
                                    Screen {index + 1}
                                </span>
                            </div>
                            <p
                                className="text-sm mt-1"
                                style={{ color: '#9d8361' }}
                            >
                                {source.name}
                            </p>
                        </button>
                    ))}
                </div>

                <div className="text-center">
                    <button
                        onClick={onCancel}
                        className="px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105"
                        style={{
                            background: '#e6e5d5',
                            color: '#66281f',
                            border: '2px solid #bfb9a3'
                        }}
                    >
                        Cancel
                    </button>
                    <p
                        className="mt-4 text-sm"
                        style={{ color: '#9d8361' }}
                    >
                        Press <kbd className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: '#e6e5d5', border: '1px solid #bfb9a3' }}>Esc</kbd> to cancel
                    </p>
                </div>
            </div>
        </div>
    )
}

export default ScreenSelector
