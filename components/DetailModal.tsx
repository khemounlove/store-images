
import React from 'react';
import { MediaItem, MediaType } from '../types';
import { IconHeart, IconTrash, IconPlus } from './Icons';

interface DetailModalProps {
  item: MediaItem | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ item, onClose, onDelete, onToggleFavorite }) => {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm transition-all duration-300">
      <div className="relative max-w-5xl w-full h-full flex flex-col md:flex-row bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl">
        {/* Media Side */}
        <div className="flex-grow bg-black flex items-center justify-center relative min-h-[50vh] md:min-h-0">
          {item.type === MediaType.IMAGE ? (
            <img src={item.url} alt={item.title} className="max-w-full max-h-full object-contain" />
          ) : (
            <video src={item.url} controls className="max-w-full max-h-full" />
          )}
          <button 
            onClick={onClose}
            className="absolute top-4 left-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
        </div>

        {/* Info Side */}
        <div className="w-full md:w-80 flex flex-col bg-white dark:bg-slate-900 p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{item.title}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
              {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            {item.description && (
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">{item.description}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {item.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-medium text-slate-600 dark:text-slate-400">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-auto space-y-3">
            <button 
              onClick={() => onToggleFavorite(item.id)}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
                item.isFavorite 
                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30' 
                : 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
              }`}
            >
              <IconHeart filled={item.isFavorite} className="w-5 h-5" />
              {item.isFavorite ? 'Favorited' : 'Add to Favorites'}
            </button>
            <button 
              onClick={() => {
                onDelete(item.id);
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:text-slate-400 transition-all"
            >
              <IconTrash className="w-5 h-5" />
              Delete Item
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;
