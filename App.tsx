
import React, { useState, useEffect, useMemo } from 'react';
import { MediaItem, TabType, MediaType, AppSettings } from './types';
import { IconPhotos, IconVideo, IconHeart, IconSearch, IconSettings, IconPlus } from './components/Icons';
import MediaGrid from './components/MediaGrid';
import DetailModal from './components/DetailModal';
import UploadModal from './components/UploadModal';
import { getSmartGreeting } from './services/geminiService';
import { getAllMediaItems, saveMediaItems, deleteMediaItem as dbDeleteMediaItem } from './services/db';

const STORAGE_CAPACITY_GB = 8192; // 8TB

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('library');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isDBLoaded, setIsDBLoaded] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('media-vault-settings');
    const defaultSettings: AppSettings = { 
      theme: 'light', 
      gridSize: 'medium', 
      autoTagging: true, 
      storageUsage: 0.12,
      uploadSpeedLimit: 'unlimited',
      wifiOnly: false
    };
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [greeting, setGreeting] = useState("Your Memories");

  // Load from IndexedDB on startup
  useEffect(() => {
    getAllMediaItems().then(items => {
      setMediaItems(items);
      setIsDBLoaded(true);
    }).catch(() => setIsDBLoaded(true));
  }, []);

  // Sync state to IndexedDB when changed
  useEffect(() => {
    if (isDBLoaded && mediaItems.length > 0) {
      saveMediaItems(mediaItems).catch(console.error);
      const newUsage = Math.min(STORAGE_CAPACITY_GB, Number((mediaItems.length * 0.05 + 0.1).toFixed(2)));
      setSettings(s => ({...s, storageUsage: Number(newUsage)}));
    }
  }, [mediaItems, isDBLoaded]);

  useEffect(() => {
    localStorage.setItem('media-vault-settings', JSON.stringify(settings));
    if (settings.theme === 'dark') {
      document.body.classList.add('dark');
      document.body.style.backgroundColor = '#0f172a';
    } else {
      document.body.classList.remove('dark');
      document.body.style.backgroundColor = '#f8fafc';
    }
  }, [settings]);

  useEffect(() => {
    getSmartGreeting().then(setGreeting);
  }, []);

  const handleToggleFavorite = (id: string) => {
    setMediaItems(prev => prev.map(item => item.id === id ? { ...item, isFavorite: !item.isFavorite } : item));
    if (selectedItem?.id === id) {
      setSelectedItem(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
    }
  };

  const handleDeleteItem = async (id: string) => {
    await dbDeleteMediaItem(id);
    setMediaItems(prev => prev.filter(item => item.id !== id));
    setSelectedItem(null);
  };

  const handleUpload = (newItems: MediaItem[]) => {
    setMediaItems(prev => [...newItems, ...prev]);
  };

  const storagePercentage = Math.round((settings.storageUsage / STORAGE_CAPACITY_GB) * 100 * 10) / 10;

  const filteredItems = useMemo(() => {
    let items = [...mediaItems];
    if (activeTab === 'favorites') items = items.filter(i => i.isFavorite);
    if (activeTab === 'videos') items = items.filter(i => i.type === MediaType.VIDEO);
    if (searchQuery) {
      items = items.filter(i => 
        i.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        i.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    return items.sort((a, b) => b.createdAt - a.createdAt);
  }, [mediaItems, activeTab, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-500 font-sans">
      <header className="sticky top-0 z-40 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-b border-slate-200/50 dark:border-slate-800/50 px-6 pt-12 pb-6">
        <div className="flex justify-between items-end max-w-7xl mx-auto">
          <div className="animate-in fade-in slide-in-from-left-4 duration-500">
            <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mb-1.5 opacity-80">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {activeTab === 'library' ? 'Timeline' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('-', ' ')}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end gap-1">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{storagePercentage}% of 8TB USED</span>
               <div className="w-32 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                 <div className="h-full bg-blue-500" style={{ width: `${Math.max(1, storagePercentage)}%` }}></div>
               </div>
            </div>
            <button 
              onClick={() => setShowUpload(true)}
              className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 shadow-xl shadow-slate-900/10 dark:shadow-white/10 hover:scale-105 transition-all active:scale-90 group"
            >
              <IconPlus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </header>

      {(activeTab === 'library' || activeTab === 'search' || activeTab === 'videos') && (
        <div className="px-6 py-4 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-top-2 duration-700">
          <div className="relative group">
            <IconSearch className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text"
              placeholder="Search moments, tags, vibes..."
              className="w-full pl-14 pr-6 py-4 rounded-[1.25rem] bg-slate-100 dark:bg-slate-800/50 border-2 border-transparent focus:border-blue-500/20 text-slate-900 dark:text-white placeholder-slate-400/80 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      <main className="flex-grow p-4 pb-28 md:p-8 md:pb-28 max-w-7xl mx-auto w-full">
        {!isDBLoaded ? (
          <div className="flex flex-col items-center justify-center py-40 animate-pulse">
            <div className="w-12 h-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin mb-4" />
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Opening 8TB Vault...</p>
          </div>
        ) : activeTab === 'for-you' ? (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 px-1">
            <div className="relative h-[28rem] rounded-[3rem] overflow-hidden shadow-2xl group cursor-pointer ring-1 ring-black/5">
              <img src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2000ms] ease-out" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute bottom-12 left-10 right-10">
                <p className="text-white/60 text-xs font-black uppercase tracking-[0.3em] mb-4">FEATURED MEMORY</p>
                <h3 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4 tracking-tighter">{greeting}</h3>
                <button className="px-8 py-3 bg-white text-black rounded-full font-bold text-sm hover:bg-slate-100 transition-colors shadow-xl">Relive Now</button>
              </div>
            </div>
          </div>
        ) : activeTab === 'settings' ? (
           <div className="max-w-2xl mx-auto py-12 px-6 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
             <section>
               <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-6 opacity-60">General Settings</h3>
               <div className="bg-white dark:bg-slate-800/50 rounded-[2rem] overflow-hidden divide-y divide-slate-100 dark:divide-slate-700/50 shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
                 <div className="p-6 flex items-center justify-between">
                   <div className="flex items-center gap-5">
                     <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
                     </div>
                     <div>
                       <p className="font-black text-slate-900 dark:text-white text-lg tracking-tight">Night Mode</p>
                       <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Protect your eyes</p>
                     </div>
                   </div>
                   <button 
                    onClick={() => setSettings(s => ({...s, theme: s.theme === 'light' ? 'dark' : 'light'}))}
                    className={`w-14 h-8 rounded-full p-1.5 transition-all duration-500 ${settings.theme === 'dark' ? 'bg-blue-600 shadow-lg shadow-blue-500/40' : 'bg-slate-200'}`}
                   >
                     <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-500 ease-spring ${settings.theme === 'dark' ? 'translate-x-6' : ''}`} />
                   </button>
                 </div>
               </div>
             </section>

             <section>
               <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-6 opacity-60">Network & Bandwidth</h3>
               <div className="bg-white dark:bg-slate-800/50 rounded-[2rem] overflow-hidden divide-y divide-slate-100 dark:divide-slate-700/50 shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
                 <div className="p-6 flex items-center justify-between">
                   <div className="flex items-center gap-5">
                     <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-inner">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071a9 9 0 0114.142 0M2.006 8.854a13.5 13.5 0 0119.988 0"/></svg>
                     </div>
                     <div>
                       <p className="font-black text-slate-900 dark:text-white text-lg tracking-tight">Wi-Fi Only</p>
                       <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Pause on cellular data</p>
                     </div>
                   </div>
                   <button 
                    onClick={() => setSettings(s => ({...s, wifiOnly: !s.wifiOnly}))}
                    className={`w-14 h-8 rounded-full p-1.5 transition-all duration-500 ${settings.wifiOnly ? 'bg-blue-600' : 'bg-slate-200'}`}
                   >
                     <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-500 ${settings.wifiOnly ? 'translate-x-6' : ''}`} />
                   </button>
                 </div>
               </div>
             </section>

             <section>
               <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-6 opacity-60">Storage Status (8TB)</h3>
               <div className="bg-white dark:bg-slate-800/50 p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
                 <div className="flex justify-between items-end mb-4">
                   <div>
                     <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{settings.storageUsage} GB</p>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Occupied of 8TB Plan</p>
                   </div>
                   <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{storagePercentage}%</p>
                 </div>
                 <div className="w-full h-4 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden mb-8 ring-1 ring-slate-200/50 dark:ring-slate-700">
                   <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-1000 shadow-[0_0_15px_rgba(37,99,235,0.3)]" 
                    style={{ width: `${Math.max(1, storagePercentage)}%` }}
                   ></div>
                 </div>
                 <button 
                  onClick={async () => { 
                    if(confirm("Permanently wipe all 8TB storage?")) {
                      localStorage.removeItem('media-vault-items');
                      setMediaItems([]);
                      const db = await indexedDB.open('LuminaVaultDB');
                      db.onsuccess = () => {
                        const transaction = db.result.transaction('media', 'readwrite');
                        transaction.objectStore('media').clear();
                        window.location.reload();
                      };
                    }
                  }}
                  className="w-full py-4 rounded-2xl border-2 border-rose-500/10 text-rose-500 font-black hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all active:scale-95 text-[10px] uppercase tracking-widest"
                 >
                   Clear 8TB Storage
                 </button>
               </div>
             </section>
           </div>
        ) : (
          <MediaGrid 
            items={filteredItems} 
            gridSize={settings.gridSize} 
            onItemClick={setSelectedItem}
            onToggleFavorite={handleToggleFavorite}
            activeTab={activeTab}
          />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/60 dark:bg-slate-950/70 backdrop-blur-3xl border-t border-slate-200/50 dark:border-slate-800/50 safe-area-bottom">
        <div className="flex justify-around items-center max-w-2xl mx-auto h-20 px-4">
          <button 
            onClick={() => setActiveTab('library')}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'library' ? 'text-blue-600 -translate-y-1' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
          >
            <IconPhotos className={`w-6 h-6 transition-transform ${activeTab === 'library' ? 'scale-110' : ''}`} />
            <span className="text-[10px] font-black uppercase tracking-tighter">Vault</span>
          </button>
          <button 
            onClick={() => setActiveTab('videos')}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'videos' ? 'text-blue-600 -translate-y-1' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
          >
            <IconVideo className={`w-6 h-6 transition-transform ${activeTab === 'videos' ? 'scale-110' : ''}`} />
            <span className="text-[10px] font-black uppercase tracking-tighter">Videos</span>
          </button>
          <button 
            onClick={() => setActiveTab('for-you')}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'for-you' ? 'text-blue-600 -translate-y-1' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
          >
            <svg className={`w-6 h-6 transition-transform ${activeTab === 'for-you' ? 'scale-110' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"/></svg>
            <span className="text-[10px] font-black uppercase tracking-tighter">Memories</span>
          </button>
          <button 
            onClick={() => setActiveTab('favorites')}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'favorites' ? 'text-blue-600 -translate-y-1' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
          >
            <IconHeart className={`w-6 h-6 transition-transform ${activeTab === 'favorites' ? 'scale-110' : ''}`} filled={activeTab === 'favorites'} />
            <span className="text-[10px] font-black uppercase tracking-tighter">Liked</span>
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'settings' ? 'text-blue-600 -translate-y-1' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
          >
            <IconSettings className={`w-6 h-6 transition-transform ${activeTab === 'settings' ? 'scale-110' : ''}`} />
            <span className="text-[10px] font-black uppercase tracking-tighter">Setup</span>
          </button>
        </div>
      </nav>
      <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} onDelete={handleDeleteItem} onToggleFavorite={handleToggleFavorite} />
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onUpload={handleUpload} appSettings={settings} />}
    </div>
  );
};

export default App;
