import { useCallback, useEffect, useRef, useState } from 'react';
import {
  X,
  Camera,
  FlipHorizontal,
  ImagePlus,
  Scan,
  Loader2,
  Check,
  Search,
  Package,
  ExternalLink,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { STICKER_CATALOG, CATEGORY_LABELS, STICKER_BY_ID, RARITY_LABELS } from '../data/stickers';
import { stickerImageUrl } from '../utils/stickerImage';
import { formatDate, getCategoryIcon, getRarityColor } from '../utils/helpers';
import type { Sticker, StickerCondition } from '../types';
import {
  loadMobilenetModel,
  embedVisual,
  dotSimilarity,
  similarityToPercent,
  loadImageCors,
} from '../services/stickerEmbeddings';

type Tab = 'scan' | 'manual';

interface MatchRow {
  sticker: Sticker;
  score: number;
  percent: number;
}

export default function ScannerModal({
  onClose,
  onViewSticker,
}: {
  onClose: () => void;
  onViewSticker: (id: string) => void;
}) {
  const { priceCache, addToInventory, getTotalQuantity } = useAppStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);

  const [tab, setTab] = useState<Tab>('scan');
  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const [camError, setCamError] = useState<string | null>(null);
  const [captureDataUrl, setCaptureDataUrl] = useState<string | null>(null);
  const [modelReady, setModelReady] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [indexBuilding, setIndexBuilding] = useState(false);
  const [indexProgress, setIndexProgress] = useState({ done: 0, total: 0 });
  const [embeddingIndex, setEmbeddingIndex] = useState<Map<string, Float32Array>>(new Map());
  const [matching, setMatching] = useState(false);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [manualQ, setManualQ] = useState('');
  const [addCondition, setAddCondition] = useState<StickerCondition>('mint');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refEntries = STICKER_CATALOG.map((s) => ({
    sticker: s,
    url: stickerImageUrl(s, priceCache[s.id]),
  })).filter((e): e is { sticker: Sticker; url: string } => Boolean(e.url));

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCamera = useCallback(async () => {
    setCamError(null);
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      const v = videoRef.current;
      if (v) {
        v.srcObject = stream;
        await v.play();
      }
    } catch {
      setCamError('Camera unavailable. Use Upload, check permissions, or try https / localhost.');
    }
  }, [facing, stopCamera]);

  useEffect(() => {
    if (tab === 'scan' && !captureDataUrl) void startCamera();
    return () => stopCamera();
  }, [tab, facing, captureDataUrl, startCamera, stopCamera]);

  const flipCamera = () => {
    setFacing((f) => (f === 'environment' ? 'user' : 'environment'));
  };

  const captureFrame = () => {
    const v = videoRef.current;
    const c = captureCanvasRef.current;
    if (!v || !c || v.readyState < 2) return;
    const w = v.videoWidth;
    const h = v.videoHeight;
    if (!w || !h) return;
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, w, h);
    setCaptureDataUrl(c.toDataURL('image/jpeg', 0.92));
    stopCamera();
    setMatches([]);
  };

  const retake = () => {
    setCaptureDataUrl(null);
    setMatches([]);
    void startCamera();
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      if (typeof r.result === 'string') {
        setCaptureDataUrl(r.result);
        stopCamera();
        setMatches([]);
      }
    };
    r.readAsDataURL(f);
    e.target.value = '';
  };

  const loadModel = async () => {
    setModelLoading(true);
    try {
      await loadMobilenetModel();
      setModelReady(true);
    } catch (err) {
      console.error(err);
    } finally {
      setModelLoading(false);
    }
  };

  const buildIndex = async () => {
    setIndexBuilding(true);
    try {
      const model = await loadMobilenetModel();
      setModelReady(true);
      setEmbeddingIndex(new Map());
      const next = new Map<string, Float32Array>();
      const total = refEntries.length;
      setIndexProgress({ done: 0, total });
      for (let i = 0; i < refEntries.length; i++) {
        const { sticker, url } = refEntries[i];
        const img = await loadImageCors(url);
        if (img) {
          try {
            const emb = await embedVisual(model, img);
            next.set(sticker.id, emb);
          } catch {
            /* skip CORS / decode issues */
          }
        }
        setIndexProgress({ done: i + 1, total });
        await new Promise((r) => setTimeout(r, 0));
      }
      setEmbeddingIndex(next);
    } finally {
      setIndexBuilding(false);
    }
  };

  const runMatch = async () => {
    if (!captureDataUrl || embeddingIndex.size === 0) return;
    setMatching(true);
    setMatches([]);
    try {
      const model = await loadMobilenetModel();
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('decode'));
        img.src = captureDataUrl;
      });
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const queryEmb = await embedVisual(model, c);
      const rows: MatchRow[] = [];
      embeddingIndex.forEach((refEmb, id) => {
        const sticker = STICKER_BY_ID.get(id);
        if (!sticker) return;
        const score = dotSimilarity(queryEmb, refEmb);
        rows.push({ sticker, score, percent: similarityToPercent(score) });
      });
      rows.sort((a, b) => b.score - a.score);
      setMatches(rows.slice(0, 8));
    } catch (e) {
      console.error(e);
    } finally {
      setMatching(false);
    }
  };

  const manualFiltered = STICKER_CATALOG.filter((s) => {
    if (!manualQ.trim()) return true;
    const q = manualQ.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.tags.some((t) => t.toLowerCase().includes(q))
    );
  }).slice(0, 80);

  const quickAdd = (id: string) => {
    addToInventory(id, 1, addCondition);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-db-navy text-db-cream"
      role="dialog"
      aria-modal="true"
      aria-label="Sticker scanner"
    >
      <header className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-db-blue/30 bg-db-navy-light/95 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Scan className="text-db-orange" size={22} />
          <div>
            <h2 className="font-display text-lg tracking-wide leading-none">SCAN TO INVENTORY</h2>
            <p className="text-[10px] text-db-cream/40 font-mono mt-0.5">
              Camera · visual match · manual pick
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="p-2 rounded-lg text-db-cream/50 hover:text-db-cream hover:bg-db-blue/20"
        >
          <X size={22} />
        </button>
      </header>

      <div className="flex gap-1 px-4 pt-3 shrink-0">
        {(['scan', 'manual'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-display tracking-wider transition-colors ${
              tab === t ? 'bg-db-orange text-white' : 'bg-db-navy-light text-db-cream/50 border border-db-blue/20'
            }`}
          >
            {t === 'scan' ? 'CAMERA & MATCH' : 'MANUAL PICK'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {tab === 'scan' && (
          <>
            {refEntries.length === 0 && (
              <div className="rounded-xl border border-db-orange/40 bg-db-orange/10 px-3 py-2 text-xs text-db-cream/80">
                No reference photos yet. Run <strong>Fetch all prices & photos</strong> on the main screen (or refresh
                prices per sticker) so visual matching has thumbnails to compare against.
              </div>
            )}

            <div className="flex flex-wrap gap-2 items-center">
              <button
                type="button"
                onClick={() => (modelReady ? null : loadModel())}
                disabled={modelLoading || modelReady}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs bg-db-blue/40 border border-db-blue/30 disabled:opacity-50"
              >
                {modelLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                {modelReady ? <Check size={14} className="text-db-green" /> : null}
                {modelReady ? 'AI model ready' : 'Load AI model'}
              </button>
              <button
                type="button"
                onClick={() => void buildIndex()}
                disabled={indexBuilding || refEntries.length === 0}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs bg-db-navy-light border border-db-blue/30 disabled:opacity-40"
              >
                {indexBuilding ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Index {indexProgress.done}/{indexProgress.total}
                  </>
                ) : (
                  <>
                    <Scan size={14} /> Build index ({refEntries.length} refs)
                  </>
                )}
              </button>
              <span className="text-[10px] text-db-cream/35 w-full sm:w-auto">
                Uses on-device MobileNet — nothing is uploaded. Matches are best-effort vs listing photos, not magic.
              </span>
            </div>

            <div className="rounded-2xl overflow-hidden border border-db-blue/30 bg-black aspect-[4/3] max-h-[min(50vh,420px)] mx-auto relative">
              {captureDataUrl ? (
                <img src={captureDataUrl} alt="Capture" className="w-full h-full object-contain" />
              ) : (
                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
              )}
              {!captureDataUrl && !camError && (
                <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-2 justify-center">
                  <button
                    type="button"
                    onClick={captureFrame}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-db-orange text-white text-sm font-display shadow-lg"
                  >
                    <Camera size={18} /> Capture
                  </button>
                  <button
                    type="button"
                    onClick={flipCamera}
                    className="p-2 rounded-full bg-db-navy/80 border border-db-blue/40"
                    title="Flip camera"
                  >
                    <FlipHorizontal size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-2 rounded-full bg-db-navy/80 border border-db-blue/40 text-xs"
                  >
                    <ImagePlus size={16} /> Upload
                  </button>
                </div>
              )}
              {camError && (
                <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-db-cream/60">
                  {camError}
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />

            {captureDataUrl && (
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  type="button"
                  onClick={retake}
                  className="px-4 py-2 rounded-lg text-xs border border-db-blue/40 text-db-cream/70"
                >
                  Retake
                </button>
                <button
                  type="button"
                  onClick={() => void runMatch()}
                  disabled={matching || embeddingIndex.size === 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs bg-db-gold/20 text-db-gold border border-db-gold/40 disabled:opacity-40"
                >
                  {matching ? <Loader2 size={14} className="animate-spin" /> : <Scan size={14} />}
                  Find matches
                </button>
              </div>
            )}

            <canvas ref={captureCanvasRef} className="hidden" />

            {matches.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs uppercase tracking-wider text-db-cream/50 font-mono">Top matches</h3>
                <ul className="space-y-2">
                  {matches.map((m) => {
                    const thumb = stickerImageUrl(m.sticker, priceCache[m.sticker.id]);
                    const owned = getTotalQuantity(m.sticker.id);
                    return (
                      <li
                        key={m.sticker.id}
                        className="flex gap-3 p-3 rounded-xl bg-db-navy-light border border-db-blue/25"
                      >
                        <div
                          className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-db-navy border border-db-blue/20 cursor-pointer"
                          onClick={() => onViewSticker(m.sticker.id)}
                        >
                          {thumb ? (
                            <img src={thumb} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-db-cream/20">
                              <Package size={20} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-display leading-tight">{m.sticker.name}</p>
                              <p className="text-[10px] text-db-cream/40 mt-0.5">
                                {formatDate(m.sticker.releaseDate)} · {m.percent}% visual match
                              </p>
                            </div>
                            <span
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0"
                              style={{
                                color: getRarityColor(m.sticker.rarity),
                                background: `${getRarityColor(m.sticker.rarity)}18`,
                              }}
                            >
                              {RARITY_LABELS[m.sticker.rarity].label}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2 items-center">
                            <select
                              value={addCondition}
                              onChange={(e) => setAddCondition(e.target.value as StickerCondition)}
                              className="bg-db-navy border border-db-blue/30 rounded text-[10px] px-1 py-1 text-db-cream"
                            >
                              <option value="mint">Mint</option>
                              <option value="near_mint">Near mint</option>
                              <option value="good">Good</option>
                              <option value="fair">Fair</option>
                              <option value="poor">Poor</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => quickAdd(m.sticker.id)}
                              className="px-3 py-1 rounded-lg text-[10px] bg-db-green/25 text-db-green border border-db-green/30 font-display"
                            >
                              + Add 1
                            </button>
                            <button
                              type="button"
                              onClick={() => onViewSticker(m.sticker.id)}
                              className="flex items-center gap-1 text-[10px] text-db-orange px-2"
                            >
                              Details <ExternalLink size={10} />
                            </button>
                            {owned > 0 && (
                              <span className="text-[10px] text-db-cream/40 font-mono">Owned ×{owned}</span>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </>
        )}

        {tab === 'manual' && (
          <div className="space-y-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-db-cream/30" />
              <input
                value={manualQ}
                onChange={(e) => setManualQ(e.target.value)}
                placeholder="Search catalog…"
                className="w-full bg-db-navy-light border border-db-blue/30 rounded-xl pl-10 pr-4 py-2.5 text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2 items-center text-[10px] text-db-cream/40">
              <span>Condition:</span>
              <select
                value={addCondition}
                onChange={(e) => setAddCondition(e.target.value as StickerCondition)}
                className="bg-db-navy border border-db-blue/30 rounded px-2 py-1 text-db-cream"
              >
                <option value="mint">Mint</option>
                <option value="near_mint">Near mint</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-8">
              {manualFiltered.map((s) => {
                const thumb = stickerImageUrl(s, priceCache[s.id]);
                const owned = getTotalQuantity(s.id);
                return (
                  <li
                    key={s.id}
                    className="flex gap-2 p-2 rounded-xl bg-db-navy-light border border-db-blue/20 items-center"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-db-navy">
                      {thumb ? (
                        <img src={thumb} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-db-cream/15">
                          <Package size={16} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs truncate">{s.name}</p>
                      <p className="text-[10px] text-db-cream/35">
                        {getCategoryIcon(s.category)} {CATEGORY_LABELS[s.category]}
                        {owned > 0 ? ` · owned ×${owned}` : ''}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => quickAdd(s.id)}
                        className="px-2 py-1 rounded text-[10px] bg-db-orange/80 text-white font-display"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => onViewSticker(s.id)}
                        className="text-[10px] text-db-orange"
                      >
                        Open
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
