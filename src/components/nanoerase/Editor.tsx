import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ImageFile } from '@/types/nanoerase';
import { ChevronLeft, ChevronRight, Zap, Circle, Undo2, Redo2, Layers, Eraser, Paintbrush, Link, Link2Off, ImagePlus } from 'lucide-react';
import { CanvasBrush } from './CanvasBrush';

interface Props {
  images: ImageFile[];
  currentIndex: number;
  onIndexChange: (idx: number) => void;
  onProcess: () => void;
  setImages: React.Dispatch<React.SetStateAction<ImageFile[]>>;
  onAddImages: (files: FileList) => void;
}

export const Editor: React.FC<Props> = ({ images, currentIndex, onIndexChange, onProcess, setImages, onAddImages }) => {
  const isMultiple = images.length > 1;
  const brushRef = useRef<{ clear: () => void, loadMask: (mask: string) => void }>(null);
  const addFilesInputRef = useRef<HTMLInputElement>(null);

  const [activeTool, setActiveTool] = useState<'ai' | 'manual'>(images[0]?.mode || 'ai');
  const [manualTool, setManualTool] = useState<'brush' | 'eraser'>('brush');
  const [brushSize, setBrushSize] = useState<number>(24);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const [history, setHistory] = useState<ImageFile[][]>([images]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const pushToHistory = (newImages: ImageFile[]) => {
    const snapshot = newImages.map(img => ({ ...img }));
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(snapshot);
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setImages(history[prevIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setImages(history[nextIndex]);
    }
  };

  const handleNext = useCallback(() => {
    if (isMultiple) {
      onIndexChange((currentIndex + 1) % images.length);
    }
  }, [currentIndex, images.length, isMultiple, onIndexChange]);

  const handlePrev = useCallback(() => {
    if (isMultiple) {
      onIndexChange((currentIndex - 1 + images.length) % images.length);
    }
  }, [currentIndex, images.length, isMultiple, onIndexChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, historyIndex, history]);

  const handleMaskChange = (maskBase64: string) => {
    let updated: ImageFile[];
    if (isSyncing) {
      updated = images.map(img => ({ ...img, mask: maskBase64 }));
    } else {
      updated = [...images];
      updated[currentIndex] = { ...updated[currentIndex], mask: maskBase64 };
    }
    setImages(updated);
    pushToHistory(updated);
  };

  const handleApplyToAll = () => {
    const currentMask = images[currentIndex].mask;
    if (!currentMask) return;
    const updated = images.map(img => ({ ...img, mask: currentMask }));
    setImages(updated);
    pushToHistory(updated);
  };

  return (
    <div className="relative w-full flex flex-col items-center justify-start pt-10 md:pt-12 overflow-hidden px-4 select-none pb-8 z-10">
      <div className="relative w-full max-w-[1200px] flex items-center justify-center h-auto min-h-[220px] sm:min-h-[400px] md:min-h-[500px] mb-4 md:mb-12">
        <div className="relative w-full h-full flex items-center justify-center" style={{ perspective: '1200px' }}>
          {images.map((img, idx) => {
            const offset = idx - currentIndex;
            let displayOffset = offset;
            if (isMultiple) {
              if (offset > images.length / 2) displayOffset -= images.length;
              if (offset < -images.length / 2) displayOffset += images.length;
            }
            const absDisplayOffset = Math.abs(displayOffset);
            const isVisible = absDisplayOffset <= 2;
            const isActive = displayOffset === 0;

            if (!isVisible) return null;

            return (
              <div
                key={img.id}
                style={{
                  transform: `translateX(${displayOffset * (window.innerWidth < 768 ? 55 : 85)}%) scale(${1 - absDisplayOffset * 0.18}) translateZ(${isActive ? '0' : '-120px'})`,
                  zIndex: 50 - absDisplayOffset,
                  opacity: isActive ? 1 : 0.25 / (absDisplayOffset + 0.4),
                  filter: isActive ? 'none' : 'blur(8px)',
                  transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), filter 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                  willChange: 'transform, opacity, filter',
                  backfaceVisibility: 'hidden',
                }}
                className="absolute w-fit h-fit flex items-center justify-center pointer-events-none"
              >
                <div className="relative bg-white rounded-[20px] md:rounded-[40px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] border border-white/60 overflow-hidden flex items-center justify-center pointer-events-auto w-fit h-fit max-w-[88vw] max-h-[45vh] sm:max-h-[60vh] md:max-h-[500px]">
                  <div className="relative w-fit h-fit flex items-center justify-center bg-[#fdfdfd] overflow-hidden">
                    <img
                      src={img.preview}
                      className={`h-auto w-auto max-h-[40vh] sm:max-h-[55vh] md:max-h-[500px] object-contain transition-opacity duration-300 ${!isActive ? 'opacity-60' : 'opacity-100'}`}
                      alt={`Image ${idx + 1}`}
                    />

                    {isActive && activeTool === 'manual' && (
                      <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                        <CanvasBrush
                          ref={brushRef}
                          imageSrc={img.preview}
                          onMaskChange={handleMaskChange}
                          initialMask={img.mask}
                          brushSize={brushSize}
                          tool={manualTool}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {isMultiple && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-0 md:left-4 z-[100] w-10 h-10 md:w-16 md:h-16 bg-white/95 backdrop-blur-xl rounded-full flex items-center justify-center shadow-xl border border-gray-100 hover:scale-110 active:scale-95 transition-all duration-300 text-black"
            >
              <ChevronLeft className="w-5 h-5 md:w-8 md:h-8" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-0 md:right-4 z-[100] w-10 h-10 md:w-16 md:h-16 bg-white/95 backdrop-blur-xl rounded-full flex items-center justify-center shadow-xl border border-gray-100 hover:scale-110 active:scale-95 transition-all duration-300 text-black"
            >
              <ChevronRight className="w-5 h-5 md:w-8 md:h-8" />
            </button>
          </>
        )}
      </div>

      <div className="flex flex-col items-center gap-4 w-full max-w-sm mt-2 md:mt-4 px-2">
        <div className="flex justify-center -mb-2">
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            ref={addFilesInputRef}
            onChange={(e) => e.target.files && onAddImages(e.target.files)}
          />
          <button
            onClick={() => addFilesInputRef.current?.click()}
            className="p-2.5 bg-white shadow-md rounded-full border border-black/5 hover:scale-110 transition-all text-gray-500 hover:text-black group active:scale-90"
            title="Add more images"
          >
            <ImagePlus className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          </button>
        </div>

        {activeTool === 'manual' && (
          <div className="w-full flex flex-col gap-2 md:gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-2 md:gap-3 w-full">
              <div className="flex p-1 bg-gray-100/80 rounded-xl border border-gray-200 shadow-sm">
                <button
                  onClick={() => setManualTool('brush')}
                  className={`p-2 md:p-2.5 rounded-lg transition-all ${manualTool === 'brush' ? 'bg-black text-white shadow-sm' : 'text-gray-400 hover:text-black'}`}
                  title="Brush Tool"
                >
                  <Paintbrush className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <button
                  onClick={() => setManualTool('eraser')}
                  className={`p-2 md:p-2.5 rounded-lg transition-all ${manualTool === 'eraser' ? 'bg-black text-white shadow-sm' : 'text-gray-400 hover:text-black'}`}
                  title="Eraser Tool"
                >
                  <Eraser className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>

              <div className="flex-1 p-1.5 md:p-2 bg-white/80 backdrop-blur-md rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-wider text-gray-400 ml-1">Size</span>
                <div className="flex items-center gap-1 md:gap-1.5">
                  {[4, 12, 24, 48, 72].map(size => (
                    <button
                      key={size}
                      onClick={() => setBrushSize(size)}
                      className={`w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-lg transition-all ${brushSize === size ? 'bg-black text-white shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                    >
                      <Circle style={{ width: Math.max(2, size/10), height: Math.max(2, size/10) }} fill="currentColor" />
                    </button>
                  ))}
                </div>
              </div>

              {isMultiple && (
                <button
                  onClick={() => setIsSyncing(!isSyncing)}
                  className={`p-2.5 md:p-3 rounded-xl border transition-all flex items-center gap-2 ${isSyncing ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400 hover:text-black'}`}
                >
                  {isSyncing ? <Link className="w-4 h-4 md:w-5 md:h-5" /> : <Link2Off className="w-4 h-4 md:w-5 md:h-5" />}
                </button>
              )}
            </div>

            <div className="flex gap-2 w-full">
              <button
                onClick={handleUndo}
                disabled={historyIndex === 0}
                className="flex-1 py-2 md:py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 font-bold text-[10px] md:text-xs disabled:opacity-30 flex items-center justify-center gap-1 md:gap-2 hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
              >
                <Undo2 className="w-3 h-3 md:w-4 md:h-4" /> Undo Batch
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="flex-1 py-2 md:py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 font-bold text-[10px] md:text-xs disabled:opacity-30 flex items-center justify-center gap-1 md:gap-2 hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
              >
                Redo Batch <Redo2 className="w-3 h-3 md:w-4 md:h-4" />
              </button>
            </div>

            {isMultiple && !isSyncing && (
              <button
                onClick={handleApplyToAll}
                className="w-full py-2 md:py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-[10px] md:text-[12px] font-bold transition-all flex items-center justify-center gap-1 md:gap-2 border border-blue-100 shadow-sm"
              >
                <Layers className="w-3 h-3 md:w-4 md:h-4" />
                Apply Current Mask to All
              </button>
            )}
          </div>
        )}

        <button
          onClick={onProcess}
          className="w-full py-4 md:py-6 bg-black text-white rounded-[18px] md:rounded-[30px] text-[14px] md:text-[20px] font-black shadow-[0_20px_50px_-10px_rgba(0,0,0,0.4)] hover:shadow-[0_30px_70px_-10px_rgba(0,0,0,0.6)] hover:scale-[1.02] active:scale-95 transition-all duration-500 tracking-wider flex items-center justify-center gap-2 md:gap-3"
        >
          <Zap className="w-4 h-4 md:w-5 md:h-5 fill-white" />
          Remove Watermark
        </button>
      </div>
    </div>
  );
};
