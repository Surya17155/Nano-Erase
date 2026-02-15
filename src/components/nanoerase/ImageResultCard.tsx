import React from 'react';

interface Props {
  imageUrl: string;
  fileName: string;
}

export const ImageResultCard: React.FC<Props> = ({ imageUrl, fileName }) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `nanoerase_cleaned_${fileName.replace(/\.[^/.]+$/, "")}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col items-center w-full group">
      <div className="relative w-full rounded-[24px] bg-[#f0f2f5] shadow-[20px_20px_60px_#ced1d6,-20px_-20px_60px_#ffffff] border border-white/40 overflow-hidden transition-transform duration-300 hover:scale-[1.02]">
        <img
          src={imageUrl}
          alt="Processed result"
          className="w-full h-auto block"
        />
      </div>

      <button
        onClick={handleDownload}
        className="mt-6 px-10 py-3.5 rounded-full bg-[#f0f2f5] text-blue-600 font-bold text-[14px] shadow-[6px_6px_12px_#ced1d6,-6px_-6px_12px_#ffffff] hover:shadow-[inset_4px_4px_8px_#ced1d6,inset_-4px_-4px_8px_#ffffff] transition-all duration-300 active:scale-95 flex items-center gap-2 group-hover:scale-105"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" x2="12" y1="15" y2="3" />
        </svg>
        Download Image
      </button>
    </div>
  );
};
