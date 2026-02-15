import { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';

interface Props {
  imageSrc: string;
  onMaskChange: (maskBase64: string) => void;
  initialMask?: string;
  brushSize?: number;
  tool?: 'brush' | 'eraser';
}

export const CanvasBrush = forwardRef<{ clear: () => void, loadMask: (mask: string) => void }, Props>(({
  imageSrc,
  onMaskChange,
  initialMask,
  brushSize = 48,
  tool = 'brush'
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const bufferCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const [bufferCtx, setBufferCtx] = useState<CanvasRenderingContext2D | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [imageDims, setImageDims] = useState({ w: 0, h: 0 });

  useImperativeHandle(ref, () => ({
    clear: () => {
      if (bufferCtx) {
        bufferCtx.clearRect(0, 0, bufferCanvasRef.current.width, bufferCanvasRef.current.height);
        syncToUI();
        triggerChange();
      }
    },
    loadMask: (mask: string) => {
      if (!bufferCtx) return;
      const img = new Image();
      img.src = mask;
      img.onload = () => {
        bufferCtx.clearRect(0, 0, bufferCanvasRef.current.width, bufferCanvasRef.current.height);
        bufferCtx.drawImage(img, 0, 0, bufferCanvasRef.current.width, bufferCanvasRef.current.height);
        syncToUI();
        triggerChange();
      };
    }
  }));

  const syncToUI = () => {
    const mainCanvas = mainCanvasRef.current;
    if (!mainCanvas || !bufferCanvasRef.current) return;
    const ctx = mainCanvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
    ctx.globalAlpha = 0.6;
    ctx.drawImage(bufferCanvasRef.current, 0, 0, mainCanvas.width, mainCanvas.height);
    ctx.globalAlpha = 1.0;
  };

  const triggerChange = () => {
    if (bufferCanvasRef.current) {
      onMaskChange(bufferCanvasRef.current.toDataURL('image/png'));
    }
  };

  useEffect(() => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      setImageDims({ w: img.width, h: img.height });
      const buffer = bufferCanvasRef.current;
      buffer.width = img.width;
      buffer.height = img.height;
      const bCtx = buffer.getContext('2d', { willReadFrequently: true });
      if (bCtx) {
        bCtx.lineCap = 'round';
        bCtx.lineJoin = 'round';
        setBufferCtx(bCtx);
        if (initialMask) {
          const mImg = new Image();
          mImg.src = initialMask;
          mImg.onload = () => {
            bCtx.drawImage(mImg, 0, 0, img.width, img.height);
            syncToUI();
          };
        }
      }
      updateUISize(img.width, img.height);
    };
  }, [imageSrc]);

  const updateUISize = (imgW: number, imgH: number) => {
    const parent = containerRef.current;
    if (!parent || !mainCanvasRef.current) return;
    const containerWidth = parent.clientWidth;
    const containerHeight = parent.clientHeight;
    const imageRatio = imgW / imgH;
    const containerRatio = containerWidth / containerHeight;
    let drawWidth, drawHeight;
    if (imageRatio > containerRatio) {
      drawWidth = containerWidth;
      drawHeight = containerWidth / imageRatio;
    } else {
      drawHeight = containerHeight;
      drawWidth = containerHeight * imageRatio;
    }
    mainCanvasRef.current.width = drawWidth;
    mainCanvasRef.current.height = drawHeight;
    syncToUI();
  };

  const startDrawing = (e: any) => {
    setIsDrawing(true);
    const pos = getPos(e);
    const bPos = toBufferPos(pos);
    if (bufferCtx) {
      bufferCtx.beginPath();
      bufferCtx.moveTo(bPos.x, bPos.y);
    }
  };

  const draw = (e: any) => {
    if (!isDrawing || !bufferCtx) return;
    const pos = getPos(e);
    const bPos = toBufferPos(pos);
    const scaleFactor = imageDims.w / mainCanvasRef.current!.width;

    bufferCtx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    bufferCtx.strokeStyle = 'rgba(255, 0, 0, 1.0)';
    bufferCtx.lineWidth = brushSize * scaleFactor;
    bufferCtx.lineTo(bPos.x, bPos.y);
    bufferCtx.stroke();
    syncToUI();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (bufferCtx) bufferCtx.closePath();
    triggerChange();
  };

  const getPos = (e: any) => {
    const canvas = mainCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const toBufferPos = (pos: {x: number, y: number}) => {
    const canvas = mainCanvasRef.current!;
    return {
      x: (pos.x / canvas.width) * imageDims.w,
      y: (pos.y / canvas.height) * imageDims.h
    };
  };

  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center overflow-hidden z-20">
      <canvas
        ref={mainCanvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="absolute w-full h-full object-contain cursor-crosshair touch-none"
      />
    </div>
  );
});

CanvasBrush.displayName = 'CanvasBrush';
