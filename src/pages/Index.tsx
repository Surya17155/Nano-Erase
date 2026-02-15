import React, { useState } from 'react';
import { Hero } from '@/components/nanoerase/Hero';
import { Header } from '@/components/nanoerase/Header';
import { Editor } from '@/components/nanoerase/Editor';
import { Processing } from '@/components/nanoerase/Processing';
import { Results } from '@/components/nanoerase/Results';
import { AppStage, ImageFile } from '@/types/nanoerase';
import JSZip from 'jszip';

const Index: React.FC = () => {
  const [stage, setStage] = useState<AppStage>('landing');
  const [images, setImages] = useState<ImageFile[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  const handleHome = () => {
    setStage('landing');
    setImages([]);
  };

  const processUpload = (files: FileList) => {
    const newImages: ImageFile[] = Array.from(files)
      .filter(file => file.type.startsWith('image/'))
      .slice(0, 20)
      .map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
        status: 'idle',
        mode: 'ai',
      }));

    if (newImages.length === 0) {
      alert("Please upload valid image files only.");
      return;
    }

    setImages(newImages);
    setStage('editing');
    setCurrentIdx(0);
  };

  const handleAddImages = (files: FileList) => {
    const totalRemaining = 20 - images.length;
    if (totalRemaining <= 0) {
      alert("Maximum 20 images allowed.");
      return;
    }
    const newImages: ImageFile[] = Array.from(files)
      .filter(file => file.type.startsWith('image/'))
      .slice(0, totalRemaining)
      .map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
        status: 'idle',
        mode: 'ai',
      }));

    setImages(prev => [...prev, ...newImages]);
  };

  const startProcessing = async () => {
    setStage('processing');
  };

  const completeProcessing = (processedImages: ImageFile[]) => {
    setImages(processedImages);
    setStage('results');
  };

  const downloadAll = async () => {
    const zip = new JSZip();
    let hasFiles = false;

    for (const img of images) {
      if (img.processed) {
        hasFiles = true;
        const base64Data = img.processed.split(',')[1];
        zip.file(`nanoerase_${img.file.name.replace(/\.[^/.]+$/, "")}.png`, base64Data, { base64: true });
      }
    }

    if (!hasFiles) {
      alert("No processed images found to download.");
      return;
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nanoerase_cleaned_images.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F6F3]">
      <Header onLogoClick={handleHome} />

      <main className="flex-grow flex flex-col">
        {stage === 'landing' && <Hero onUpload={processUpload} />}
        {stage === 'editing' && (
          <Editor
            images={images}
            currentIndex={currentIdx}
            onIndexChange={setCurrentIdx}
            onProcess={startProcessing}
            setImages={setImages}
            onAddImages={handleAddImages}
          />
        )}
        {stage === 'processing' && (
          <Processing
            images={images}
            onComplete={completeProcessing}
          />
        )}
        {stage === 'results' && (
          <Results
            images={images}
            onDownloadAll={downloadAll}
            onReset={() => {
              setStage('landing');
              setImages([]);
            }}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
