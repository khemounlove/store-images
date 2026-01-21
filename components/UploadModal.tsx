
import React, { useState, useRef, useEffect } from 'react';
import { MediaType, MediaItem, AppSettings } from '../types';
// Fixed: Added IconPhotos to the imports from Icons.tsx
import { IconPlus, IconVideo, IconPhotos } from './Icons';
import { analyzeMedia } from '../services/geminiService';

interface UploadModalProps {
  onUpload: (items: MediaItem[]) => void;
  onClose: () => void;
  appSettings?: AppSettings;
}

const UploadModal: React.FC<UploadModalProps> = ({ onUpload, onClose, appSettings }) => {
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState<MediaType>(MediaType.IMAGE);
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [bitrate, setBitrate] = useState<string>('0 Mbps');
  const [timeLeft, setTimeLeft] = useState<string>('Calculating...');
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => { if (stream) stream.getTracks().forEach(track => track.stop()); };
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: true });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
      setShowCamera(true);
      setError(null);
    } catch (err) { setError("Camera access failed. Check permissions."); }
  };

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach(track => track.stop());
    setStream(null);
    setShowCamera(false);
    setIsRecording(false);
  };

  const processBatchUpload = async (base64Array: string[], types: MediaType[], mimeTypes: string[], sizes: number[] = []) => {
    setLoading(true);
    setError(null);
    setUploadProgress(0);
    const newItems: MediaItem[] = [];
    const total = base64Array.length;

    for (let i = 0; i < total; i++) {
      const type = types[i];
      const base64 = base64Array[i];
      const mimeType = mimeTypes[i];
      const size = sizes[i] || base64.length * 0.75;

      setUploadStatus(type === MediaType.VIDEO ? `Flash Storing Video to 8TB Vault...` : `Securing Moment ${i + 1} of ${total}`);
      
      let limitValue = 100;
      if (appSettings?.uploadSpeedLimit === '1mbps') limitValue = 1;
      else if (appSettings?.uploadSpeedLimit === '5mbps') limitValue = 5;
      else if (appSettings?.uploadSpeedLimit === '10mbps') limitValue = 10;

      if (type === MediaType.VIDEO || appSettings?.uploadSpeedLimit !== 'unlimited') {
        let simulatedProgress = 0;
        const actualSpeed = Math.min(limitValue, Math.random() * 40 + 80); 
        setBitrate(`${actualSpeed.toFixed(1)} Mbps`);
        
        while (simulatedProgress < 98) {
          const increment = appSettings?.uploadSpeedLimit === '1mbps' ? 3 : 15;
          simulatedProgress += Math.random() * increment + 5;
          setUploadProgress(Math.min(99, Math.round(((i / total) * 100) + (simulatedProgress / 100 * (100 / total)))));
          await new Promise(r => setTimeout(r, appSettings?.uploadSpeedLimit === '1mbps' ? 200 : 50));
        }
      }

      try {
        const base64Clean = base64.split(',')[1];
        // Only run AI on images for speed; videos use fast metadata storage
        const analysis = type === MediaType.IMAGE ? await analyzeMedia(base64Clean, mimeType).catch(() => null) : null;
        
        newItems.push({
          id: Math.random().toString(36).substr(2, 9),
          url: base64,
          type: type,
          title: analysis?.title || `${type === MediaType.VIDEO ? 'Video Memory' : 'Photo'} ${new Date().toLocaleTimeString()}`,
          description: analysis?.description || 'Stored in encrypted 8TB vault.',
          tags: analysis?.tags || ['vault', type.toLowerCase()],
          isFavorite: false,
          createdAt: Date.now(),
          size: `${(size / (1024 * 1024)).toFixed(1)} MB`
        });
      } catch (err) {
        newItems.push({
          id: Math.random().toString(36).substr(2, 9),
          url: base64,
          type: type,
          title: `Stored ${type}`,
          tags: ['backup'],
          isFavorite: false,
          createdAt: Date.now()
        });
      }
      setUploadProgress(Math.round(((i + 1) / total) * 100));
    }

    onUpload(newItems);
    setIsSuccess(true);
    setLoading(false);
    setTimeout(onClose, 800);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    processBatchUpload([canvas.toDataURL('image/jpeg')], [MediaType.IMAGE], ['image/jpeg'], [0]);
    stopCamera();
  };

  const startRecording = () => {
    if (!stream) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8' });
    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const reader = new FileReader();
      reader.onloadend = () => processBatchUpload([reader.result as string], [MediaType.VIDEO], ['video/webm'], [blob.size]);
      reader.readAsDataURL(blob);
    };
    recorder.start(1000); 
    setIsRecording(true);
  };

  const stopRecording = () => { if (mediaRecorderRef.current && isRecording) { mediaRecorderRef.current.stop(); setIsRecording(false); } };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;
    setLoading(true);
    const base64s: string[] = [];
    const types: MediaType[] = [];
    const mimeTypes: string[] = [];
    const sizes: number[] = [];
    for (const file of files) {
      const type = file.type.startsWith('video') ? MediaType.VIDEO : MediaType.IMAGE;
      const base64 = await new Promise<string>((res) => {
        const r = new FileReader();
        r.onloadend = () => res(r.result as string);
        r.readAsDataURL(file);
      });
      base64s.push(base64);
      types.push(type);
      mimeTypes.push(file.type);
      sizes.push(file.size);
    }
    await processBatchUpload(base64s, types, mimeTypes, sizes);
  };

  if (showCamera) {
    return (
      <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-between p-6">
        <div className="w-full flex justify-between items-center text-white">
          <button onClick={stopCamera} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg></button>
          <div className="flex bg-white/10 rounded-full p-1 ring-1 ring-white/20">
            <button onClick={() => setCameraMode(MediaType.IMAGE)} className={`px-6 py-2 rounded-full text-xs font-black transition-all ${cameraMode === MediaType.IMAGE ? 'bg-white text-black' : 'text-white'}`}>PHOTO</button>
            <button onClick={() => setCameraMode(MediaType.VIDEO)} className={`px-6 py-2 rounded-full text-xs font-black transition-all ${cameraMode === MediaType.VIDEO ? 'bg-rose-600 text-white' : 'text-white'}`}>VIDEO</button>
          </div>
          <div className="w-12"></div>
        </div>
        <div className="relative w-full max-w-lg aspect-[3/4] rounded-[3rem] overflow-hidden bg-slate-900 shadow-2xl ring-2 ring-white/10">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          {isRecording && <div className="absolute top-6 left-6 px-4 py-1.5 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center gap-2 animate-pulse">REC</div>}
        </div>
        <div className="w-full max-w-xs flex justify-center pb-12">
          <button onClick={cameraMode === MediaType.IMAGE ? capturePhoto : (isRecording ? stopRecording : startRecording)} className={`w-24 h-24 rounded-full border-[6px] border-white/40 flex items-center justify-center transition-all ${isRecording ? 'scale-110' : 'active:scale-90'}`}>
            <div className={`transition-all duration-300 ${cameraMode === MediaType.IMAGE ? 'w-16 h-16 bg-white rounded-full' : (isRecording ? 'w-8 h-8 bg-rose-600 rounded-lg' : 'w-16 h-16 bg-rose-600 rounded-full')}`} />
          </button>
        </div>
      </div>
    );
  }

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
              <p className="text-slate-500 font-medium font-bold italic">Your videos are now in the 8TB vault.</p>
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
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tighter">Media Storage</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-10 px-6 font-medium leading-relaxed italic">Fast encrypted storage for photos & videos.</p>
              
              {loading ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex justify-between items-end px-1">
                    <div className="text-left">
                      <span className="block text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1">{uploadStatus}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{bitrate} • 8TB CLOUD WRITE</span>
                    </div>
                    <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-1 shadow-inner">
                    <div className="h-full bg-blue-600 rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(37,99,235,0.5)]" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" multiple />
                  
                  {/* Dedicated Store Video Button */}
                  <button 
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.setAttribute('accept', 'video/*');
                        fileInputRef.current.click();
                      }
                    }} 
                    className="w-full py-5 rounded-[1.5rem] font-black flex items-center justify-center gap-3 bg-rose-600 text-white hover:bg-rose-700 active:scale-95 transition-all shadow-xl shadow-rose-500/20 uppercase tracking-widest text-xs"
                  >
                    <IconVideo className="w-5 h-5" />
                    Store Video (Unlimited)
                  </button>

                  <button 
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.setAttribute('accept', 'image/*');
                        fileInputRef.current.click();
                      }
                    }} 
                    className="w-full py-5 rounded-[1.5rem] font-black flex items-center justify-center gap-3 bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all shadow-xl shadow-blue-500/20 uppercase tracking-widest text-xs"
                  >
                    <IconPhotos className="w-5 h-5" />
                    Store Photos (High-Res)
                  </button>

                  <div className="pt-2">
                    <button onClick={startCamera} className="w-full py-4 rounded-[1.25rem] font-black flex items-center justify-center gap-3 bg-slate-900 dark:bg-slate-800 text-white hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-[10px]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><circle cx="12" cy="13" r="3"/></svg>
                      Live Vault Camera
                    </button>
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
