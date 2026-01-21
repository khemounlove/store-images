import React from 'react';
import { MediaItem, MediaType } from '../types';
import { IconHeart, IconVideo, IconPhotos, IconFile } from './Icons';

interface MediaGridProps {
  items: MediaItem[];
  onItemClick: (item: MediaItem) => void;
  onToggleFavorite: (id: string) => void;
  gridSize: 'small' | 'medium' | 'large';
  activeTab?: string;
}

const MediaGrid: React.FC<MediaGridProps> = ({ items, onItemClick, onToggleFavorite, gridSize, activeTab }) => {
  const getGridCols = () => {
    switch(gridSize) {
      case 'small': return 'grid-cols-4 md:grid-cols-6 lg:grid-cols-8';
      case 'medium': return 'grid-cols-3 md:grid-cols-4 lg:grid-cols-6';
      case 'large': return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
    }
  };

  const getBrandStyles = (ext?: string) => {
    const e = ext?.toLowerCase();
    if (e === 'psd') return { bg: 'bg-blue-600', text: 'Ps', color: 'text-white' };
    if (e === 'ai') return { bg: 'bg-orange-500', text: 'Ai', color: 'text-white' };
    if (e === 'prproj' || e === 'pr') return { bg: 'bg-purple-700', text: 'Pr', color: 'text-white' };
    if (e === 'aep' || e === 'ae') return { bg: 'bg-indigo-900', text: 'Ae', color: 'text-white' };
    if (e === 'pdf') return { bg: 'bg-red-600', text: 'PDF', color: 'text-white' };
    return { bg: 'bg-slate-200 dark:bg-slate-700', text: e?.toUpperCase() || 'FILE', color: 'text-slate-600 dark:text-slate-300' };
  };

  const groupItemsByDate = () => {
    const groups: { [key: string]: MediaItem[] } = {};
    const today = new Date().toLocaleDateString();
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();

    items.sort((a, b) => b.createdAt - a.createdAt).forEach(item => {
      const date = new Date(item.createdAt);
      const dateStr = date.toLocaleDateString();
      let key = dateStr;
      
      if (dateStr === today) key = 'Today';
      else if (dateStr === yesterday) key = 'Yesterday';
      else {
        key = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  };

  const groupedItems = groupItemsByDate();

  return (
    <div className="relative pl-6 md:pl-8 space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="absolute left-1 md:left-2 top-2 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800 rounded-full" />

      {Object.entries(groupedItems).map(([date, dateItems]) => (
        <section key={date} className="relative">
          <div className="absolute -left-[23px] md:-left-[27px] top-1 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-white dark:ring-slate-900 z-10 shadow-sm" />
          
          <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 ml-1 flex items-center gap-3">
            {date}
            <span className="flex-grow h-px bg-slate-100 dark:bg-slate-800/50" />
            <span className="text-[10px] lowercase font-medium opacity-60">{dateItems.length} items</span>
          </h3>

          <div className={`grid ${getGridCols()} gap-2 md:gap-3`}>
            {dateItems.map((item) => (
              <div 
                key={item.id} 
                className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer group rounded-xl md:rounded-2xl transition-all hover:shadow-xl hover:z-20 active:scale-95 shadow-sm"
                onClick={() => onItemClick(item)}
              >
                {item.type === MediaType.IMAGE ? (
                  <img 
                    src={item.url as string} 
                    alt={item.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                ) : item.type === MediaType.VIDEO ? (
                  <div className="relative w-full h-full bg-black">
                     <video 
                        src={item.url as string} 
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                        muted 
                        loop 
                        autoPlay 
                        playsInline 
                      />
                     <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform">
                          <svg className="w-5 h-5 text-white fill-current translate-x-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                     </div>
                     <div className="absolute top-3 right-3 p-1.5 bg-black/40 backdrop-blur-md rounded-lg">
                       <IconVideo className="w-3.5 h-3.5 text-white" />
                     </div>
                  </div>
                ) : (
                  <div className={`w-full h-full flex flex-col items-center justify-center p-4 transition-all duration-300 ${getBrandStyles(item.extension).bg}`}>
                    <div className={`text-2xl font-black mb-1 ${getBrandStyles(item.extension).color}`}>
                      {getBrandStyles(item.extension).text}
                    </div>
                    <IconFile className={`w-8 h-8 opacity-50 ${getBrandStyles(item.extension).color}`} />
                    <div className={`absolute top-3 right-3 p-1.5 bg-black/10 backdrop-blur-sm rounded-lg`}>
                       <IconFile className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <span className="text-[10px] font-bold text-white truncate max-w-[70%] drop-shadow-md">{item.title}</span>
                  <button 
                    className={`p-2 rounded-full backdrop-blur-md transition-all ${item.isFavorite ? 'bg-white/20' : 'bg-black/20'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(item.id);
                    }}
                  >
                    <IconHeart 
                      className={`w-4 h-4 ${item.isFavorite ? 'text-rose-500 fill-rose-500' : 'text-white'}`} 
                      filled={item.isFavorite}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
      
      {items.length === 0 && (
        <div className="py-24 text-center">
          <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 text-slate-300 shadow-inner">
            {activeTab === 'videos' ? <IconVideo className="w-12 h-12" /> : <IconPhotos className="w-12 h-12" />}
          </div>
          <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
            {activeTab === 'videos' ? 'No Video' : 'Your vault is empty'}
          </h4>
          <p className="text-slate-500 dark:text-slate-400 font-medium px-8 max-w-sm mx-auto">
            {activeTab === 'videos' 
              ? 'Add video to your secure collection.' 
              : 'Add files, photos and videos to see your gallery unfold.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default MediaGrid;