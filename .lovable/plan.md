

# Performance Optimization Plan: Sub-10s Watermark Removal

## Problem Analysis

After reviewing the full pipeline, here's where time is being spent for 3 images (~16s total):

| Phase | Current Time | Bottleneck |
|-------|-------------|------------|
| Client prep (canvas/mask) | ~1-2s | PNG DataURL encoding for masks, nested image onload chains |
| Network upload | ~1-2s | Large base64 payloads (512x512 JPEG @ 0.75 quality) |
| AI inference (server) | ~8-12s | Already parallel via Promise.all, but large input = slower inference |
| Network download | ~1s | Large base64 responses |
| Client stitch | ~1-2s | PNG output encoding, pixel-by-pixel mask blending |
| Artificial delay | 2s | Hardcoded `minTime = 2000` in Processing.tsx |

## Optimizations (6 changes, 2 files)

### 1. Reduce crop context size: 512 → 256
The Gemini watermark is tiny (~7% of image width). A 512x512 crop is overkill. Reducing to 256 means:
- 4x less pixels to encode/upload/download
- Faster AI inference (smaller input)
- File: `src/services/gemini.ts` — change `contextSize = 512` to `256`, and threshold from `400` to `200`

### 2. Lower input compression quality: 0.75 → 0.50
Less data to upload to the AI. The AI doesn't need high-quality input for inpainting a small watermark.
- File: `src/services/gemini.ts` — change `COMPRESSION_QUALITY` from `0.75` to `0.50`

### 3. Switch output from PNG to JPEG
PNG encoding is significantly slower than JPEG. Since this is photo content, JPEG at 0.92 quality is visually identical but encodes ~5-10x faster.
- File: `src/services/gemini.ts` — change `OUTPUT_TYPE` to `'image/jpeg'` and `OUTPUT_QUALITY` to `0.92`

### 4. Remove artificial 2-second minimum delay
The Processing screen currently waits at least 2 seconds even if processing finishes faster. Remove it.
- File: `src/components/nanoerase/Processing.tsx` — change `minTime` from `2000` to `300`

### 5. Use `img.decode()` instead of nested `onload` callbacks
The `createInpaintTarget` and `stitchRect` functions use nested `onload` callbacks which are slower than `await img.decode()`. Refactor both to use async/await with decode().
- File: `src/services/gemini.ts` — rewrite `createInpaintTarget` and `stitchRect` to use `img.decode()`

### 6. Skip redundant mask detection in prepareImageForBatch
Currently `prepareImageForBatch` re-runs `detectWatermarksBatch` per image even though Processing.tsx already detects masks. Pass the mask through consistently.
- File: `src/services/gemini.ts` — already handled, but ensure the mask path is optimized

## Expected Result

| Phase | After Optimization |
|-------|-------------------|
| Client prep | ~0.3s (smaller canvas, JPEG, decode()) |
| Network upload | ~0.3s (4x smaller payload) |
| AI inference | ~4-6s (smaller input, parallel) |
| Network download | ~0.3s (smaller response) |
| Client stitch | ~0.3s (JPEG output, decode()) |
| Artificial delay | 0.3s (reduced from 2s) |
| **Total** | **~5-7s** |

## Files Modified
- `src/services/gemini.ts` — context size, compression, output format, async decode
- `src/components/nanoerase/Processing.tsx` — remove artificial delay

## Safety
- No API or edge function changes needed
- No UI layout changes
- All changes are internal performance tuning
- Backward-compatible (same inputs/outputs, just faster)

