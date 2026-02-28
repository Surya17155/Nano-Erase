import React from 'react';
import { ImageFile } from '@/types/nanoerase';
import { Download, RefreshCcw } from 'lucide-react';
import { ImageResultCard } from './ImageResultCard';

interface Props {
  images: ImageFile[];
  onDownloadAll: () => void;
  onReset: () => void;
}

export const Results: React.FC<Props> = ({ images, onDownloadAll, onReset }) => {
  const cleanedImages = images.filter((i) => i.status === 'done' || !!i.processed);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 select-none">
      <div className="flex flex-col items-center text-center gap-8 mb-20">
        <div className="flex flex-col gap-2">
          <h2 className="text-[32px] md:text-[40px] font-black tracking-tight text-black">Results Ready</h2>
          <p className="text-gray-400 font-semibold uppercase text-[11px] tracking-[0.2em]">
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <button onClick={onReset}
          className="flex items-center gap-2 px-8 py-4 bg-[#f0f2f5] text-gray-600 rounded-full font-bold text-[15px] shadow-[6px_6px_12px_#ced1d6,-6px_-6px_12px_#ffffff] hover:shadow-[inset_4px_4px_8px_#ced1d6,inset_-4px_-4px_8px_#ffffff] transition-all active:scale-95">

            <RefreshCcw className="w-5 h-5" />
            Start New
          </button>
          <button
            onClick={onDownloadAll}
            className="flex items-center gap-2 px-10 py-4 bg-black text-white rounded-full font-bold text-[15px] shadow-[0_15px_35px_rgba(0,0,0,0.2)] hover:bg-gray-900 transition-all active:scale-95">

            <Download className="w-5 h-5" />
            Download All (ZIP)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
        {cleanedImages.map((img) =>
        <ImageResultCard
          key={img.id}
          imageUrl={img.processed || img.preview}
          fileName={img.file.name} />

        )}
      </div>

      <div className="h-24"></div>
    </div>);

};