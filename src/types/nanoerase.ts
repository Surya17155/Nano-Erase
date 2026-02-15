export interface ImageFile {
  id: string;
  file: File;
  preview: string;
  processed?: string;
  status: 'idle' | 'detecting' | 'processing' | 'done' | 'error';
  mask?: string;
  mode: 'ai' | 'manual';
  error?: string;
}

export type AppStage = 'landing' | 'editing' | 'processing' | 'results';

export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}
