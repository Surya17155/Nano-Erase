import React, { useState } from 'react';
import { Upload, Zap, ShieldCheck, Settings, LayoutGrid, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  onUpload: (files: FileList) => void;
}

export const Hero: React.FC<Props> = ({ onUpload }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      onUpload(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onUpload(e.target.files);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 pt-2 md:pt-4 pb-8 text-center select-none flex flex-col items-center justify-center md:min-h-[calc(100vh-100px)]">
      <h1 className="text-[36px] md:text-[56px] lg:text-[64px] font-bold tracking-[-0.03em] mb-2 md:mb-3 leading-[1.1] text-black">
        Remove <br className="md:hidden" />
        Watermarks in<br />
        Bulk, <span className="italic font-playfair font-normal">Effortlessly.</span>
      </h1>

      <p className="text-[14px] md:text-[16px] lg:text-[17px] text-gray-500 font-medium max-w-2xl mx-auto mb-4 md:mb-6 leading-relaxed opacity-90 px-2">
        Instantly clean photos. Optimized for Nano Banana Pro.
      </p>

      <div className="relative w-full max-w-[1280px] mx-auto mb-8 md:mb-12 px-2">
        <div className="relative bg-[#cbd5e1] rounded-[24px] md:rounded-[32px] overflow-hidden shadow-[0_30px_80px_-15px_rgba(0,0,0,0.12)] aspect-[16/10] md:aspect-[16/9] lg:aspect-[2.35/1] flex border border-white/40 max-h-[650px]">
          <div className="relative flex-1 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?auto=format&fit=crop&w=1600&q=80"
              className="absolute inset-0 w-full h-full object-cover brightness-95"
              alt="Before"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-black/30 text-2xl md:text-5xl lg:text-6xl font-bold select-none tracking-tight whitespace-nowrap">Nano Banana Pro</span>
            </div>
            <div className="absolute top-3 left-3 md:top-4 md:left-4 bg-black/60 backdrop-blur-md px-3 md:px-4 py-1 rounded-full text-white text-[10px] md:text-[12px] font-bold tracking-wide">
              Before
            </div>
          </div>

          <div className="relative flex-1 overflow-hidden border-l border-white/50">
            <img
              src="https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?auto=format&fit=crop&w=1600&q=80"
              className="absolute inset-0 w-full h-full object-cover brightness-105"
              alt="After"
            />
            <div className="absolute top-3 right-3 md:top-4 md:right-4 bg-black/60 backdrop-blur-md px-3 md:px-4 py-1 rounded-full text-white text-[10px] md:text-[12px] font-bold tracking-wide">
              After
            </div>
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-full shadow-2xl flex items-center justify-center border border-white cursor-pointer hover:scale-110 transition-transform">
              <div className="flex items-center gap-0.5 text-black/70">
                <ChevronLeft className="w-3 h-3 md:w-4 md:h-4" />
                <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative w-full max-w-[900px] flex flex-col items-center mt-2 md:mt-4">
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative group transition-all duration-500 z-30 mb-8 ${isDragging ? 'scale-105' : ''}`}
        >
          <input
            type="file"
            multiple
            accept="image/*"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-40"
            onChange={handleFileChange}
          />
          <button className="flex items-center gap-2.5 px-8 md:px-14 py-4 md:py-6 bg-black text-white rounded-full text-[16px] md:text-[20px] font-bold shadow-[0_15px_45px_rgba(0,0,0,0.3)] hover:shadow-[0_40px_80px_-10px_rgba(0,0,0,0.5)] hover:bg-zinc-900 hover:-translate-y-1.5 hover:scale-[1.04] transition-all duration-500 relative z-30 border border-white/20 active:scale-95 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-nano-shine pointer-events-none"></div>
            <Upload className="w-5 h-5 md:w-6 md:h-6 transition-transform duration-500 group-hover:-translate-y-1" />
            <span className="relative">Upload Files for Removal</span>
          </button>

          <p className="mt-4 text-gray-500 text-[11px] md:text-[13px] font-semibold tracking-wide whitespace-nowrap opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none">
            or drag and drop here (JPG, PNG, WEBP)
          </p>
        </div>

        <div className="w-full flex flex-wrap justify-center items-center gap-3 md:gap-4 mt-2">
          <Pill icon={<LayoutGrid className="w-3.5 h-3.5" />} text="Bulk Process" />
          <Pill icon={<Settings className="w-3.5 h-3.5" />} text="AI-Powered" />
          <Pill icon={<Zap className="w-3.5 h-3.5" />} text="Fast Results" />
          <Pill icon={<FileText className="w-3.5 h-3.5" />} text="All Formats" />
          <Pill icon={<ShieldCheck className="w-3.5 h-3.5" />} text="Secure" />
        </div>
      </div>
    </div>
  );
};

const Pill = ({ icon, text }: { icon: React.ReactNode, text: string }) => (
  <div className="flex items-center gap-2 px-3 py-2 md:px-5 md:py-2.5 bg-[#e5e7eb]/50 md:bg-white rounded-full text-[11px] md:text-[13px] font-bold text-[#4b5563] shadow-sm border border-transparent md:border-black/5 whitespace-nowrap cursor-default hover:bg-white hover:text-black transition-colors duration-300">
    <div className="text-[#9ca3af]">{icon}</div>
    {text}
  </div>
);
