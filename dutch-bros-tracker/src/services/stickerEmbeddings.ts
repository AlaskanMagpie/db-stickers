import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

let modelPromise: Promise<mobilenet.MobileNet> | null = null;

export async function loadMobilenetModel(): Promise<mobilenet.MobileNet> {
  await tf.ready();
  if (!modelPromise) {
    modelPromise = mobilenet.load({ version: 2, alpha: 1.0 });
  }
  return modelPromise;
}

function l2Normalize(v: Float32Array): Float32Array {
  let sum = 0;
  for (let i = 0; i < v.length; i++) sum += v[i] * v[i];
  const m = Math.sqrt(sum) || 1;
  const out = new Float32Array(v.length);
  for (let i = 0; i < v.length; i++) out[i] = v[i] / m;
  return out;
}

export async function embedVisual(
  model: mobilenet.MobileNet,
  source: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
): Promise<Float32Array> {
  const tensor = await model.infer(source, true);
  const data = await tensor.data();
  tensor.dispose();
  return l2Normalize(new Float32Array(data));
}

export function dotSimilarity(a: Float32Array, b: Float32Array): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

/** Map dot product (cosine similarity of L2-normalized embeddings) to 0–100. */
export function similarityToPercent(dot: number): number {
  return Math.min(100, Math.max(0, Math.round(dot * 100)));
}

export function loadImageCors(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}
