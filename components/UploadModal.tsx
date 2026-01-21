import React, { useState, useRef } from 'react';
import { MediaType, MediaItem, AppSettings } from '../types';
import { IconPlus, IconVideo, IconPhotos, IconFile } from './Icons';
import { analyzeMedia } from '../services/geminiService';

interface UploadModalProps {
  onUpload: (items: MediaItem[]) => void;
  onClose: () => void;
  appSettings?: AppSettings;
}

const UploadModal: React.FC<UploadModalProps> = ({ onUpload, onClose, appSettings }) => {
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [bitrate, setBitrate] = useState<string>('0 Mbps');
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processBatchUpload = async (mediaData: (string | Blob)[], types: MediaType[], mimeTypes: string[], sizes: number[] = [], names: string[] = []) => {
    setLoading(true);
    setError(null);
    setUploadProgress(0);
    const newItems: MediaItem[] = [];
    const total = mediaData.length;

    for (let i = 0; i < total; i++) {
      const type = types[i];
      const data = mediaData[i];
      const mimeType = mimeTypes[i];
      const name = names[i] || 'Untitled';
      const size = sizes[i] || (typeof data === 'string' ? data.length * 0.75 : data.size);
      const ext = name.split('.').pop() || '';

      setUploadStatus(type === MediaType.DOCUMENT ? `Storing Project ${ext.toUpperCase()} to Unlimited Vault...` : type === MediaType.VIDEO ? `Streaming Video to Unlimited Vault...` : `Securing Moment ${i + 1} of ${total}`);
      
      let limitValue = 100;
      if (appSettings?.uploadSpeedLimit === '1mbps') limitValue = 1;
      else if (appSettings?.uploadSpeedLimit === '5mbps') limitValue = 5;
      else if (appSettings?.uploadSpeedLimit === '10mbps') limitValue = 10;

      let simulatedProgress = 0;
      const actualSpeed = Math.min(limitValue, Math.random() * 40 + (appSettings?.uploadSpeedLimit === 'unlimited' ? 80 : 0)); 
      setBitrate(`${actualSpeed.toFixed(1)} Mbps`);
      
      const sizeInMb = (size * 8) / (1024 * 1024);
      let totalSecondsNeeded = sizeInMb / actualSpeed;
      const stepDuration = appSettings?.uploadSpeedLimit === 'unlimited' ? 50 : 200;

      while (simulatedProgress < 98) {
        const increment = appSettings?.uploadSpeedLimit === '1mbps' ? 1 : 5;
        simulatedProgress += Math.random() * increment + 1;
        
        const currentProgress = Math.min(99, Math.round(((i / total) * 100) + (simulatedProgress / 100 * (100 / total))));
        setUploadProgress(currentProgress);

        const remainingFactor = (100 - simulatedProgress) / 100;
        const secondsLeft = Math.ceil(totalSecondsNeeded * remainingFactor);
        setTimeLeft(secondsLeft > 0 ? `${secondsLeft}s remaining` : 'Wrapping up...');

        await new Promise(r => setTimeout(r, stepDuration));
      }

      try {
        let analysis = null;
        if (type === MediaType.IMAGE && appSettings?.autoTagging) {
          const base64Clean = typeof data === 'string' 
            ? data.split(',')[1] 
            : await new Promise<string>((res) => {
                const r = new FileReader();
                r.onloadend = () => res((r.result as string).split(',')[1]);
                r.readAsDataURL(data as Blob);
              });
          analysis = await analyzeMedia(base64Clean, mimeType).catch(() => null);
        }
        
        newItems.push({
          id: Math.random().toString(36).substr(2, 9),
          url: data,
          type: type,
          title: analysis?.title || name,
          description: analysis?.description || `Professional ${ext.toUpperCase()} project file.`,
          tags: analysis?.tags || [ext.toUpperCase(), 'Creative'],
          isFavorite: false,
          createdAt: Date.now(),
          size: `${(size / (1024 * 1024)).toFixed(1)} MB`,
          extension: ext,
          originalFileName: name
        });
      } catch (err) {
        newItems.push({
          id: Math.random().toString(36).substr(2, 9),
          url: data,
          type: type,
          title: name,
          tags: [ext.toUpperCase()],
          isFavorite: false,
          createdAt: Date.now(),
          size: `${(size / (1024 * 1024)).toFixed(1)} MB`,
          extension: ext,
          originalFileName: name
        });
      }
      setUploadProgress(Math.round(((i + 1) / total) * 100));
      setTimeLeft('');
    }

    onUpload(newItems);
    setIsSuccess(true);
    setLoading(false);
    setTimeout(onClose, 800);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;
    
    // We allow "unlimited" within browser constraints
    setLoading(true);
    const mediaItemsData: (string | Blob)[] = [];
    const types: MediaType[] = [];
    const mimeTypes: string[] = [];
    const sizes: number[] = [];
    const names: string[] = [];
    
    for (const file of files) {
      let type = MediaType.DOCUMENT;
      if (file.type.startsWith('image/')) type = MediaType.IMAGE;
      else if (file.type.startsWith('video/')) type = MediaType.VIDEO;
      
      mediaItemsData.push(file);
      types.push(type);
      mimeTypes.push(file.type);
      sizes.push(file.size);
      names.push(file.name);
    }
    await processBatchUpload(mediaItemsData, types, mimeTypes, sizes, names);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl transition-all">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="p-10 text-center">
          {isSuccess ? (
            <div className="py-8 animate-in zoom-in duration-500">
              <div className="w-28 h-28 bg-emerald-100 dark:bg-emerald-950/50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-emerald-600 shadow-xl shadow-emerald-500/10">
                <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter">Vault Secured</h2>
              <p className="text-slate-500 font-medium font-bold italic">Your media is now in the unlimited vault.</p>
            </div>
          ) : (
            <>
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-blue-600 shadow-inner">
                <IconPlus className="w-10 h-10" />
              </div>
              {error ? (
                <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-2xl text-xs font-bold uppercase tracking-tight">
                  {error}
                </div>
              ) : null}
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tighter">Unlimited Vault</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-10 px-6 font-medium leading-relaxed italic">Infinite storage for Adobe projects, photos & videos.</p>
              
              {loading ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex justify-between items-end px-1">
                    <div className="text-left">
                      <span className="block text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1">{uploadStatus}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{bitrate}</span>
                        {timeLeft && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                            <span className="text-[10px] text-blue-500 font-black uppercase tracking-tighter">{timeLeft}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-1 shadow-inner">
                    <div className="h-full bg-blue-600 rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(37,99,235,0.5)]" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />
                  
                  <button 
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.setAttribute('accept', 'image/*,video/*,.psd,.ai,.prproj,.aep,.pdf,.zip');
                        fileInputRef.current.click();
                      }
                    }} 
                    className="w-full py-6 rounded-[1.5rem] font-black flex items-center justify-center gap-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-[1.02] active:scale-95 transition-all shadow-xl uppercase tracking-widest text-sm"
                  >
                    <IconFile className="w-6 h-6" />
                    Store Files (Unlimited)
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.setAttribute('accept', 'video/*');
                          fileInputRef.current.click();
                        }
                      }} 
                      className="py-4 rounded-[1.25rem] font-black flex items-center justify-center gap-2 bg-rose-600 text-white hover:bg-rose-700 active:scale-95 transition-all shadow-lg shadow-rose-500/20 uppercase tracking-widest text-[10px]"
                    >
                      <IconVideo className="w-4 h-4" />
                      Videos
                    </button>

                    <button 
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.setAttribute('accept', 'image/*');
                          fileInputRef.current.click();
                        }
                      }} 
                      className="py-4 rounded-[1.25rem] font-black flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-500/20 uppercase tracking-widest text-[10px]"
                    >
                      <IconPhotos className="w-4 h-4" />
                      Photos
                    </button>
                  </div>
                  
                  <div className="pt-2 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                    Unlimited storage for pro creative software
                  </div>
                </div>
              )}
              {!loading && <button onClick={onClose} className="mt-10 text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-[0.2em]">Close Vault</button>}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadModal;