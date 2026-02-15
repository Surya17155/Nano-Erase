import React, { useEffect, useState, useRef } from 'react';
import { ImageFile } from '@/types/nanoerase';
import { removeWatermark, detectWatermarksBatch } from '@/services/gemini';
import { AlertCircle, ShieldAlert } from 'lucide-react';

interface Props {
  images: ImageFile[];
  onComplete: (processed: ImageFile[]) => void;
}

export const Processing: React.FC<Props> = ({ images, onComplete }) => {
  const [processedCount, setProcessedCount] = useState(0);
  const [lastErrorMessage, setLastErrorMessage] = useState<string | null>(null);

  const processingRef = useRef(false);

  useEffect(() => {
    if (processingRef.current) return;
    processingRef.current = true;

    const runPipeline = async () => {
      const start = Date.now();

      const processSingleImage = async (img: ImageFile): Promise<ImageFile> => {
        try {
          let maskToSend = img.mask;

          if (img.mode === 'ai' && !maskToSend) {
            const detectionResult = await detectWatermarksBatch([{ id: img.id, preview: img.preview }]);
            maskToSend = detectionResult[img.id];
          }

          const prompt = img.mode === 'manual'
            ? "fill the masked area seamlessly with background"
            : undefined;

          const processedBase64 = await removeWatermark(img.preview, prompt, maskToSend);

          setProcessedCount(prev => prev + 1);
          return { ...img, processed: processedBase64, status: 'done', mask: maskToSend };

        } catch (err: any) {
          console.error(`Error processing ${img.id}:`, err);
          setProcessedCount(prev => prev + 1);

          let msg = err.message || "Server Error";
          if (msg.includes("AI_POLICY_REJECTION")) {
            msg = "Content restricted by AI Safety Policy. Try manual mode.";
          }
          setLastErrorMessage(msg);
          return { ...img, status: 'error', error: msg };
        }
      };

      const promises = images.map(img => processSingleImage(img));
      const results = await Promise.all(promises);

      const elapsed = Date.now() - start;
      const minTime = 2000;
      const wait = Math.max(0, minTime - elapsed);

      setTimeout(() => onComplete(results), wait);
    };

    runPipeline();
  }, [images, onComplete]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F7F6F3] text-black py-12 px-4 relative overflow-hidden">
      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-6xl">
        <div className="text-center space-y-2 mb-4">
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-black">
            Removing Watermark
          </h2>
          <p className="text-gray-500 text-sm font-medium tracking-widest uppercase">
            Processing {images.length} Image{images.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 w-full">
          {images.map((img) => (
            <div key={img.id} className="processing-card relative group">
              <img
                src={img.preview}
                alt="Processing"
                className="max-w-[80vw] md:max-w-[400px] shadow-2xl"
              />
              {img.status === 'error' && (
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <ShieldAlert className="w-12 h-12 text-red-500" />
                </div>
              )}
            </div>
          ))}
        </div>

        {lastErrorMessage && (
          <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-600 max-w-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-xs font-mono font-medium">{lastErrorMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
