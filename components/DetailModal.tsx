import React from 'react';
import { MediaItem, MediaType } from '../types';
import { IconHeart, IconTrash, IconDownload, IconFile } from './Icons';

interface DetailModalProps {
  item: MediaItem | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ item, onClose, onDelete, onToggleFavorite }) => {
  if (!item) return null;

  const handleDownload = () => {
    if (!item.url) return;
    
    const link = document.createElement('a');
    link.href = item.url as string;
    link.download = item.originalFileName || `${item.title.replace(/\s+/g, '_')}_vault.${item.extension || 'file'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getBrandStyles = (ext?: string) => {
    const e = ext?.toLowerCase();
    if (e === 'psd') return { bg: 'bg-blue-600', text: 'Adobe Photoshop' };
    if (e === 'ai') return { bg: 'bg-orange-500', text: 'Adobe Illustrator' };
    if (e === 'prproj' || e === 'pr') return { bg: 'bg-purple-700', text: 'Adobe Premiere' };
    if (e === 'aep' || e === 'ae') return { bg: 'bg-indigo-900', text: 'Adobe After Effects' };
    return { bg: 'bg-slate-800', text: 'Project File' };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md transition-all duration-300">
      <div className="relative max-w-5xl w-full h-full flex flex-col md:flex-row bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10">
        {/* Media Side */}
        <div className="flex-grow bg-black flex items-center justify-center relative min-h-[40vh] md:min-h-0">
          {item.type === MediaType.IMAGE ? (
            <img src={item.url as string} alt={item.title} className="max-w-full max-h-full object-contain p-4" />
          ) : item.type === MediaType.VIDEO ? (
            <video src={item.url as string} controls className="max-w-full max-h-full" />
          ) : (
            <div className={`w-full h-full flex flex-col items-center justify-center p-12 text-center ${getBrandStyles(item.extension).bg}`}>
               <IconFile className="w-32 h-32 text-white/20 mb-6" />
               <div className="text-white text-5xl font-black mb-4 uppercase tracking-tighter">
                 {item.extension || 'FILE'}
               </div>
               <p className="text-white/60 font-black uppercase tracking-widest text-sm">
                 {getBrandStyles(item.extension).text}
               </p>
               <div className="mt-8 px-6 py-2 bg-white/10 rounded-full text-white/80 text-xs font-bold uppercase tracking-widest backdrop-blur-md border border-white/10">
                 Secure Document Storage
               </div>
            </div>
          )}
          <button 
            onClick={onClose}
            className="absolute top-6 left-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all active:scale-90 backdrop-blur-xl border border-white/10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
          </button>
        </div>

        {/* Info Side */}
        <div className="w-full md:w-[380px] flex flex-col bg-white dark:bg-slate-900 p-10">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-widest">
                {item.type}
              </span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {item.size || '0 MB'}
              </span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter leading-tight break-words">{item.title}</h2>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-6">
              Stored on {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            {item.description && (
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8 font-medium italic">"{item.description}"</p>
            )}
            <div className="flex flex-wrap gap-2">
              {item.tags.map(tag => (
                <span key={tag} className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-auto space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => onToggleFavorite(item.id)}
                className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 ${
                  item.isFavorite 
                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30' 
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500'
                }`}
              >
                <IconHeart filled={item.isFavorite} className="w-4 h-4" />
                {item.isFavorite ? 'Liked' : 'Like'}
              </button>
              <button 
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 shadow-xl shadow-slate-900/10 dark:shadow-white/10"
              >
                <IconDownload className="w-4 h-4" />
                Download
              </button>
            </div>
            <button 
              onClick={() => {
                onDelete(item.id);
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-slate-50 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-900 dark:hover:bg-rose-900/20 text-slate-300 dark:text-slate-700 transition-all font-black uppercase tracking-widest text-[10px]"
            >
              <IconTrash className="w-4 h-4" />
              Remove Permanently
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;