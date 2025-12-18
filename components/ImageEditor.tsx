import React, { useState } from 'react';
import { Sparkles, Loader2, X, Send } from 'lucide-react';
import { editImage } from '../services/geminiService';

interface ImageEditorProps {
  itemId: string;
  itemName: string;
  currentImage: string;
  onUpdateImage: (newImage: string) => void;
  onClose: () => void;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ itemName, currentImage, onUpdateImage, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await editImage(currentImage, prompt);
      onUpdateImage(result);
      setPrompt('');
    } catch (err: any) {
      setError(err.message || "Failed to edit image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center p-4 border-b border-slate-800">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="text-accent" size={20} /> AI Artist: {itemName}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center gap-6">
          <div className="w-48 h-48 bg-white rounded-2xl overflow-hidden shadow-inner border-4 border-slate-800">
            {loading ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-slate-800">
                <Loader2 className="animate-spin text-accent" size={32} />
                <span className="text-[10px] uppercase font-bold text-slate-400">Rendering...</span>
              </div>
            ) : (
              <img src={currentImage} alt={itemName} className="w-full h-full object-contain" />
            )}
          </div>

          <div className="w-full space-y-4">
            <p className="text-xs text-slate-400 text-center italic px-4">
              Try: "Add a retro filter", "make it neon", "turn it into gold", or "add stickers".
            </p>
            
            <div className="relative">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
                placeholder="What should I change?"
                className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 pr-12 focus:border-accent outline-none transition-colors text-sm"
                disabled={loading}
              />
              <button
                onClick={handleEdit}
                disabled={loading || !prompt.trim()}
                className="absolute right-2 top-2 p-2 bg-accent text-slate-900 rounded-lg disabled:opacity-50 hover:bg-yellow-400 transition-colors"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
              </button>
            </div>

            {error && <div className="text-red-400 text-[10px] text-center bg-red-900/20 py-1 rounded border border-red-900/50">{error}</div>}
          </div>
        </div>

        <div className="bg-slate-800/50 p-4 border-t border-slate-800 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white">Done</button>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;