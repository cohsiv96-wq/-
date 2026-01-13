import React, { useState, useEffect, useMemo } from 'react';
import { Dish, WeekendMenu } from './types';
import DishCard from './components/DishCard';
import DishForm from './components/DishForm';
import { syncWithCloud, pushToCloud } from './services/syncService';
import { getAIRecommendations } from './services/geminiService';
import { 
  Plus, Search, Calendar, Library, 
  History, LayoutGrid, Shuffle, Cloud, CloudOff, Link2, Sparkles
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'couple_weekend_v2_storage';

const App: React.FC = () => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [currentMenu, setCurrentMenu] = useState<WeekendMenu | null>(null);
  const [history, setHistory] = useState<WeekendMenu[]>([]);
  const [coupleId, setCoupleId] = useState<string>(localStorage.getItem('couple_id') || '');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  
  const [activeTab, setActiveTab] = useState<'home' | 'library' | 'history'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | undefined>(undefined);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setDishes(parsed.dishes || []);
        setCurrentMenu(parsed.currentMenu || null);
        setHistory(parsed.history || []);
      } catch (e) { console.error(e); }
    }
    refreshRecommendations([]);
  }, []);

  const refreshRecommendations = async (currentDishes: Dish[]) => {
    setIsLoadingRecs(true);
    const recs = await getAIRecommendations(currentDishes.map(d => d.name));
    setRecommendations(recs);
    setIsLoadingRecs(false);
  };

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ dishes, currentMenu, history }));
    if (coupleId) {
      pushToCloud(coupleId, { dishes, currentMenu, history });
    }
  }, [dishes, currentMenu, history, coupleId]);

  useEffect(() => {
    if (!coupleId) return;
    
    const performSync = async () => {
      setSyncStatus('syncing');
      const remoteData = await syncWithCloud(coupleId, { dishes, currentMenu, history });
      if (remoteData) {
        setDishes(prev => {
          const merged = [...prev];
          remoteData.dishes?.forEach((remoteDish: Dish) => {
            const index = merged.findIndex(d => d.id === remoteDish.id);
            if (index === -1) {
              merged.push(remoteDish);
            } else if (remoteDish.updatedAt > merged[index].updatedAt) {
              merged[index] = remoteDish;
            }
          });
          return merged.sort((a, b) => b.createTime - a.createTime);
        });
        setSyncStatus('idle');
      } else {
        setSyncStatus('error');
      }
    };

    const interval = setInterval(performSync, 15000);
    performSync(); 
    return () => clearInterval(interval);
  }, [coupleId]);

  const handleSaveDish = (dishData: Omit<Dish, 'id' | 'createTime' | 'updatedAt'>) => {
    const now = Date.now();
    if (editingDish) {
      setDishes(prev => prev.map(d => d.id === editingDish.id ? { ...d, ...dishData, updatedAt: now } : d));
    } else {
      const newDish: Dish = { 
        ...dishData, 
        id: Math.random().toString(36).slice(2), 
        createTime: now, 
        updatedAt: now 
      };
      setDishes(prev => [newDish, ...prev]);
    }
    setIsFormOpen(false);
    setEditingDish(undefined);
  };

  const handleAddRecToLibrary = (rec: any) => {
    const now = Date.now();
    const newDish: Dish = {
      ...rec,
      id: Math.random().toString(36).slice(2),
      createTime: now,
      updatedAt: now,
      customTags: ['AI灵感']
    };
    setDishes(prev => [newDish, ...prev]);
    // 自动加入本周菜单
    addToMenu(newDish.id);
  };

  const deleteDish = (id: string) => {
    setDishes(prev => prev.filter(d => d.id !== id));
  };

  const menuDishes = useMemo(() => {
    return (currentMenu?.dishIds || []).map(id => dishes.find(d => d.id === id)).filter(Boolean) as Dish[];
  }, [currentMenu, dishes]);

  const addToMenu = (id: string) => {
    setCurrentMenu(prev => {
      const existingIds = prev?.dishIds || [];
      if (existingIds.includes(id)) return prev;
      return { id: 'current', date: new Date().toISOString(), dishIds: [...existingIds, id], status: 'planned', updatedAt: Date.now() };
    });
  };

  const removeFromMenu = (id: string) => {
    setCurrentMenu(prev => {
      if (!prev) return null;
      return { ...prev, dishIds: prev.dishIds.filter(itemId => itemId !== id), updatedAt: Date.now() };
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0F0F14] text-white select-none pb-24">
      <header className="px-6 pt-14 pb-6 sticky top-0 z-40 bg-[#0F0F14]/80 backdrop-blur-xl border-b border-white/5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-black tracking-tight italic">周末吃什么</h1>
            <div className="flex items-center gap-1.5" onClick={() => setIsSyncModalOpen(true)}>
              <div className={`w-1.5 h-1.5 rounded-full ${coupleId ? (syncStatus === 'syncing' ? 'bg-orange-400 animate-pulse' : 'bg-[#C5FF29]') : 'bg-white/20'}`}></div>
              <p className="text-[9px] text-white/30 uppercase font-black tracking-widest cursor-pointer">
                {coupleId ? `Room: ${coupleId}` : '点击开启双人同步'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsSyncModalOpen(true)} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5">
            {coupleId ? <Cloud size={20} className="text-[#C5FF29]" /> : <CloudOff size={20} className="text-white/20" />}
          </button>
          <button onClick={() => { setEditingDish(undefined); setIsFormOpen(true); }} className="w-12 h-12 bg-[#C5FF29] text-black rounded-2xl flex items-center justify-center shadow-lg shadow-[#C5FF29]/20 active:scale-90 transition-transform">
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>
      </header>

      <main className="px-5 pt-6 flex-1 overflow-x-hidden">
        {activeTab === 'home' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section className="bg-gradient-to-br from-[#1E1E2A] to-[#14141C] rounded-[2.5rem] p-6 border border-white/5 shadow-2xl relative overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-[#C5FF29]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">今日灵感</span>
                </div>
                {isLoadingRecs && <div className="loading-dot"></div>}
              </div>
              
              <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-2 px-2 mb-6 scroll-smooth">
                {recommendations.length > 0 ? recommendations.map((rec, idx) => (
                  <div key={idx} className="shrink-0 w-48 bg-white/5 rounded-3xl p-5 border border-white/5 flex flex-col justify-between h-44 group active:bg-white/10 transition-colors">
                    <div>
                      <p className="font-bold text-sm mb-1 line-clamp-2">{rec.name}</p>
                      <p className="text-[9px] text-white/30 line-clamp-3 italic leading-relaxed">{rec.notes}</p>
                    </div>
                    <button 
                      onClick={() => handleAddRecToLibrary(rec)}
                      className="w-full py-2.5 bg-[#C5FF29] text-black rounded-xl text-[10px] font-black uppercase active:scale-95 transition-all"
                    >
                      选这个
                    </button>
                  </div>
                )) : (
                  <div className="w-full py-10 text-center text-white/20 text-[10px] font-black uppercase tracking-widest">
                    正在寻找灵感...
                  </div>
                )}
              </div>
              <button 
                onClick={() => refreshRecommendations(dishes)} 
                disabled={isLoadingRecs}
                className="w-full py-4 bg-white text-black rounded-2xl font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
              >
                换一批灵感 <Shuffle size={14} />
              </button>
            </section>

            <section className="space-y-6">
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                  <Calendar className="text-[#C5FF29]" size={18} />
                  <h2 className="text-lg font-black italic">本周末菜单</h2>
                </div>
                {menuDishes.length > 0 && (
                   <span className="px-2 py-0.5 bg-white/5 rounded text-[10px] font-bold text-white/40">
                     共 {menuDishes.length} 道
                   </span>
                )}
              </div>
              
              {menuDishes.length === 0 ? (
                <div className="py-20 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10 flex flex-col items-center justify-center text-white/15 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
                  空空如也，快去挑选菜品吧
                </div>
              ) : (
                <div className="space-y-4">
                  {menuDishes.map(dish => (
                    <div key={dish.id} className="bg-[#1A1A22] p-5 rounded-3xl border border-white/5 flex items-center gap-4 animate-in slide-in-from-right duration-300 group">
                      <div className="w-12 h-12 bg-white/5 text-[#C5FF29] rounded-2xl flex items-center justify-center font-black italic group-hover:bg-[#C5FF29] group-hover:text-black transition-colors">
                        {dish.name[0]}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-black mb-0.5">{dish.name}</div>
                        <div className="text-[10px] text-white/30 truncate max-w-[180px]">
                          {dish.ingredients.slice(0, 3).join(' · ')}
                        </div>
                      </div>
                      <button 
                        onClick={() => removeFromMenu(dish.id)}
                        className="w-10 h-10 flex items-center justify-center text-white/10 hover:text-red-400 active:scale-90 transition-all"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'library' && (
           <div className="space-y-6 animate-in fade-in duration-500">
              <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-3 border border-white/5 focus-within:border-[#C5FF29]/30 transition-all">
                <Search size={18} className="text-white/20" />
                <input 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)} 
                  placeholder="搜索我们的菜谱..." 
                  className="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-white/20" 
                />
              </div>
              <div className="grid grid-cols-1 gap-6 pb-10">
                {dishes.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
                  dishes.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase())).map(dish => (
                    <DishCard 
                      key={dish.id} dish={dish} onDelete={deleteDish}
                      onEdit={(d) => { setEditingDish(d); setIsFormOpen(true); }}
                      onAddToMenu={addToMenu} isInMenu={currentMenu?.dishIds.includes(dish.id)}
                    />
                  ))
                ) : (
                  <div className="py-20 text-center text-white/20 text-xs font-bold uppercase tracking-widest">
                    没有找到相关菜谱
                  </div>
                )}
              </div>
           </div>
        )}

        {activeTab === 'history' && (
          <div className="h-[60vh] flex flex-col items-center justify-center text-white/20 space-y-4 animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center">
              <History size={40} strokeWidth={1.5} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest">过往的美味都在路上了...</p>
          </div>
        )}
      </main>

      {isSyncModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsSyncModalOpen(false)}></div>
          <div className="relative bg-[#1A1A22] w-full max-w-sm rounded-[2.5rem] p-8 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[#C5FF29]/10 rounded-2xl flex items-center justify-center text-[#C5FF29]">
                <Link2 size={24} />
              </div>
              <h3 className="text-lg font-black italic">开启双人同步</h3>
            </div>
            <p className="text-[11px] text-white/40 mb-6 leading-relaxed">在两台设备上输入相同的<b>配对码</b>，即可实时共享菜谱和清单。数据会加密存储在云端。</p>
            <input 
              type="text" 
              value={coupleId} 
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                setCoupleId(val);
                localStorage.setItem('couple_id', val);
              }}
              placeholder="输入专属配对码"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-center font-black tracking-[0.2em] text-[#C5FF29] focus:outline-none focus:border-[#C5FF29] transition-all mb-6 uppercase"
            />
            <button onClick={() => setIsSyncModalOpen(false)} className="w-full py-4 bg-[#C5FF29] text-black rounded-2xl font-black text-xs uppercase shadow-xl shadow-[#C5FF29]/10">开始同步</button>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 h-24 nav-bubble border-t border-white/5 flex justify-around items-center px-4 z-50">
        {[
          { id: 'home', icon: LayoutGrid, label: '首页' },
          { id: 'library', icon: Library, label: '菜谱库' },
          { id: 'history', icon: History, label: '回忆' }
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === t.id ? 'text-[#C5FF29] -translate-y-1' : 'text-white/20'}`}>
            <t.icon size={22} strokeWidth={activeTab === t.id ? 3 : 2} />
            <span className="text-[9px] font-black uppercase tracking-widest">{t.label}</span>
            {activeTab === t.id && <div className="w-1 h-1 bg-[#C5FF29] rounded-full"></div>}
          </button>
        ))}
      </nav>

      {isFormOpen && <DishForm initialDish={editingDish} onSave={handleSaveDish} onClose={() => setIsFormOpen(false)} />}
    </div>
  );
};

// 辅助组件：简单的 X 图标
const X = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12"/>
  </svg>
);

export default App;