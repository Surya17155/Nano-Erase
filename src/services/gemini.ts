import { GoogleGenAI } from "@google/genai";

const NANO_BANANA_X_RATIO = 0.9061;
const NANO_BANANA_Y_RATIO = 0.9207;
const NANO_BANANA_W_RATIO = 0.0709;
const NANO_BANANA_H_RATIO = 0.0616;

const COMPRESSION_TYPE = 'image/jpeg';
const COMPRESSION_QUALITY = 0.75;
const OUTPUT_TYPE = 'image/png';
const OUTPUT_QUALITY = 1.0;

const EDIT_MODEL = 'gemini-2.5-flash-image';
const API_KEY = 'AIzaSyBwy8z-t9pO2uvPCr9ruJMnrf1r-ECitiQ';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function fetchWithRetry<T>(fn: () => Promise<T>, retries = 2, backoff = 500): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const msg = error.toString();
    if (msg.includes('400') || msg.includes('INVALID_ARGUMENT') || msg.includes('SAFETY')) {
      throw error;
    }
    if (retries <= 0) throw error;
    console.warn(`Gemini API retry (${retries} left)...`, error.message);
    await delay(backoff);
    return fetchWithRetry(fn, retries - 1, backoff * 1.5);
  }
}

async function toBase64(urlOrBlob: string): Promise<string> {
  if (urlOrBlob.startsWith('data:')) return urlOrBlob;
  try {
    const response = await fetch(urlOrBlob);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') resolve(reader.result);
        else reject(new Error("Base64 conversion failed"));
      };
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    throw new Error("Resource loading failed");
  }
}

async function getMaskBounds(maskBase64: string): Promise<{x: number, y: number, w: number, h: number} | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = maskBase64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return resolve(null);
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0, found = false;
      const step = 4;
      for (let y = 0; y < canvas.height; y += step) {
        for (let x = 0; x < canvas.width; x += step) {
          const idx = (y * canvas.width + x) * 4;
          if (data[idx + 3] > 30 && (data[idx] > 140 || (data[idx] > 200 && data[idx+1] > 200 && data[idx+2] > 200))) {
            if (x < minX) minX = x; if (x > maxX) maxX = x;
            if (y < minY) minY = y; if (y > maxY) maxY = y;
            found = true;
          }
        }
      }
      if (!found) return resolve(null);
      const padding = 15;
      resolve({
        x: Math.max(0, minX - padding), y: Math.max(0, minY - padding),
        w: Math.min(canvas.width - minX, (maxX - minX) + (padding * 2)),
        h: Math.min(canvas.height - minY, (maxY - minY) + (padding * 2))
      });
    };
  });
}

async function createInpaintTarget(imageBase64: string, maskBase64: string, rect: any): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image(); img.src = imageBase64;
    img.onload = () => {
      const mImg = new Image(); mImg.src = maskBase64;
      mImg.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = rect.w; canvas.height = rect.h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return resolve(imageBase64);

        ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h);

        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = rect.w; maskCanvas.height = rect.h;
        const mCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
        if (mCtx) {
          mCtx.drawImage(mImg, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h);
          const iData = mCtx.getImageData(0, 0, rect.w, rect.h);
          const data = iData.data;
          for (let i = 0; i < data.length; i += 4) {
            if (data[i] > 100 || data[i+1] > 100 || data[i+2] > 100) {
              data[i] = 255; data[i+1] = 0; data[i+2] = 0; data[i+3] = 255;
            } else {
              data[i+3] = 0;
            }
          }
          mCtx.putImageData(iData, 0, 0);
          ctx.drawImage(maskCanvas, 0, 0);
        }
        resolve(canvas.toDataURL(COMPRESSION_TYPE, COMPRESSION_QUALITY));
      };
    };
  });
}

async function stitchRect(
  originalBase64: string,
  patchBase64: string,
  maskBase64: string,
  rect: {x:number, y:number, w:number, h:number}
): Promise<string> {
  return new Promise((resolve) => {
    const original = new Image(); original.src = originalBase64;
    original.onload = () => {
      const patch = new Image(); patch.src = patchBase64;
      patch.onload = () => {
        const mask = new Image(); mask.src = maskBase64;
        mask.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = original.width; canvas.height = original.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(originalBase64);

          ctx.drawImage(original, 0, 0);

          const patchCanvas = document.createElement('canvas');
          patchCanvas.width = rect.w; patchCanvas.height = rect.h;
          const pCtx = patchCanvas.getContext('2d');
          if (pCtx) {
            pCtx.drawImage(patch, 0, 0, rect.w, rect.h);
            const patchData = pCtx.getImageData(0, 0, rect.w, rect.h);
            const maskCanvas = document.createElement('canvas');
            maskCanvas.width = rect.w; maskCanvas.height = rect.h;
            const mCtx = maskCanvas.getContext('2d');
            if (mCtx) {
              mCtx.drawImage(mask, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h);
              const maskData = mCtx.getImageData(0, 0, rect.w, rect.h);
              const finalData = pCtx.createImageData(rect.w, rect.h);

              for (let i = 0; i < patchData.data.length; i += 4) {
                const isMasked = maskData.data[i] > 80 || maskData.data[i+1] > 80 || maskData.data[i+2] > 80;
                if (isMasked) {
                  finalData.data[i] = patchData.data[i];
                  finalData.data[i+1] = patchData.data[i+1];
                  finalData.data[i+2] = patchData.data[i+2];
                  finalData.data[i+3] = 255;
                } else {
                  finalData.data[i+3] = 0;
                }
              }
              pCtx.putImageData(finalData, 0, 0);
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(patchCanvas, rect.x, rect.y);
            }
          }
          resolve(canvas.toDataURL(OUTPUT_TYPE, OUTPUT_QUALITY));
        };
      };
    };
  });
}

async function callGeminiEdit(inputData: string, rect: any, originalBase64: string, maskBase64: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const cleanData = inputData.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

  const prompt = `Remove the red masked area. Fill with background texture. Do not change anything else.`;

  return await fetchWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: EDIT_MODEL,
      contents: {
        parts: [
          { inlineData: { mimeType: COMPRESSION_TYPE, data: cleanData } },
          { text: prompt }
        ]
      }
    });

    const candidate = response.candidates?.[0];
    if (candidate?.finishReason === 'SAFETY') throw new Error("Safety Block: Operation restricted.");

    for (const part of candidate?.content?.parts || []) {
      if (part.inlineData?.data) {
        const patch = `data:image/png;base64,${part.inlineData.data}`;
        return await stitchRect(originalBase64, patch, maskBase64, rect);
      }
    }

    throw new Error("AI returned no data. Ensure the model is configured for multimodal image tasks.");
  });
}

export async function detectWatermarksBatch(
  items: { id: string; preview: string }[]
): Promise<Record<string, string>> {
  const masks: Record<string, string> = {};

  const processItem = async (item: { id: string; preview: string }) => {
    return new Promise<void>(async (resolve) => {
      const img = new Image();
      img.src = item.preview;
      await img.decode();

      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';

        const x = Math.floor(img.width * NANO_BANANA_X_RATIO);
        const y = Math.floor(img.height * NANO_BANANA_Y_RATIO);
        const w = Math.max(1, Math.ceil(img.width * NANO_BANANA_W_RATIO));
        const h = Math.max(1, Math.ceil(img.height * NANO_BANANA_H_RATIO));

        const expansion = Math.max(15, Math.ceil(img.width * 0.015));

        const finalX = Math.max(0, x - expansion);
        const finalY = Math.max(0, y - expansion);
        const finalW = Math.min(img.width - finalX, w + (expansion * 2));
        const finalH = Math.min(img.height - finalY, h + (expansion * 2));

        if (finalW > 0 && finalH > 0) {
          ctx.fillRect(finalX, finalY, finalW, finalH);
          masks[item.id] = canvas.toDataURL('image/png');
        }
      }
      resolve();
    });
  };

  await Promise.all(items.map(processItem));
  return masks;
}

export async function removeWatermark(imageInput: string, manualPrompt?: string, maskBase64?: string): Promise<string> {
  const fullBase64 = await toBase64(imageInput);
  const img = new Image(); img.src = fullBase64; await img.decode();

  const targetMask = maskBase64 || (await detectWatermarksBatch([{ id: 'tmp', preview: fullBase64 }]))['tmp'];
  if (!targetMask) return fullBase64;

  const rawBounds = await getMaskBounds(targetMask);

  if (rawBounds) {
    const minImgDim = Math.min(img.width, img.height);
    let contextSize = 512;
    if (rawBounds.w > 400 || rawBounds.h > 400) contextSize = 1024;
    contextSize = Math.min(minImgDim, contextSize);

    const targetRect = {
      x: Math.max(0, Math.floor(rawBounds.x + (rawBounds.w / 2) - (contextSize / 2))),
      y: Math.max(0, Math.floor(rawBounds.y + (rawBounds.h / 2) - (contextSize / 2))),
      w: contextSize,
      h: contextSize
    };

    if (targetRect.x + targetRect.w > img.width) targetRect.x = Math.max(0, img.width - targetRect.w);
    if (targetRect.y + targetRect.h > img.height) targetRect.y = Math.max(0, img.height - targetRect.h);

    const inputToAI = await createInpaintTarget(fullBase64, targetMask, targetRect);
    return await callGeminiEdit(inputToAI, targetRect, fullBase64, targetMask);
  }

  return fullBase64;
}
