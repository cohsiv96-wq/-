
import React, { useState, useEffect, useMemo } from 'react';
import { Dish, WeekendMenu } from './types.ts';
import DishCard from './components/DishCard.tsx';
import DishForm from './components/DishForm.tsx';
import { syncWithCloud, pushToCloud } from './services/syncService.ts';
import { 
  Plus, Search, Calendar, Library, Dices, 
  History, LayoutGrid, Shuffle, Trash2, Cloud, CloudOff, Link2
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
  const [randomDishes, setRandomDishes] = useState<Dish[]>([]);

  // 1. 初始化加载
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
  }, []);

  // 2. 数据持久化与云端推送
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ dishes, currentMenu, history }));
    if (coupleId) {
      pushToCloud(coupleId, { dishes, currentMenu, history });
    }
  }, [dishes, currentMenu, history, coupleId]);

  // 3. 定时轮询同步（简单实现双人同步）
  useEffect(() => {
    if (!coupleId) return;
    
    const performSync = async () => {
      setSyncStatus('syncing');
      const remoteData = await syncWithCloud(coupleId, { dishes, currentMenu, history });
      if (remoteData) {
        // 简化的合并逻辑：合并 Dish 列表
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

    const interval = setInterval(performSync, 10000); // 每10秒同步一次
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

  const deleteDish = (id: string) => {
    setDishes(prev => prev.filter(d => d.id !== id));
  };

  const pickRandomDishes = () => {
    if (dishes.length === 0) return;
    const shuffled = [...dishes].sort(() => 0.5 - Math.random());
    setRandomDishes(shuffled.slice(0, 3));
  };

  useEffect(() => {
    if (dishes.length > 0 && randomDishes.length === 0) pickRandomDishes();
  }, [dishes]);

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

  return (
    <div className="min-h-screen flex flex-col bg-[#0F0F14] text-white select-none pb-24">
      <header className="px-6 pt-14 pb-6 sticky top-0 z-40 bg-[#0F0F14]/80 backdrop-blur-xl border-b border-white/5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-black tracking-tight italic">周末吃什么</h1>
            <div className="flex items-center gap-1.5" onClick={() => setIsSyncModalOpen(true)}>
              <div className={`w-1.5 h-1.5 rounded-full ${coupleId ? (syncStatus === 'syncing' ? 'bg-orange-400 animate-pulse' : 'bg-[#C5FF29]') : 'bg-white/20'}`}></div>
              <p className="text-[9px] text-white/30 uppercase font-black tracking-widest">
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

      <main className="px-5 pt-6 flex-1">
        {activeTab === 'home' && (
          <div className="space-y-8">
            {/* 灵感抽取部分保持不变... */}
            <section className="bg-gradient-to-br from-[#1E1E2A] to-[#14141C] rounded-[2.5rem] p-6 border border-white/5 shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-2 mb-6">
                <Shuffle size={16} className="text-[#C5FF29]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">今日灵感</span>
              </div>
              <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-2 px-2 mb-6">
                {randomDishes.map((dish) => (
                  <div key={dish.id} className="shrink-0 w-44 bg-white/5 rounded-3xl p-5 border border-white/5 flex flex-col justify-between h-40">
                    <div>
                      <p className="font-bold text-sm mb-1 line-clamp-2">{dish.name}</p>
                      <p className="text-[9px] text-white/30 line-clamp-2 italic">{dish.notes || "期待美味..."}</p>
                    </div>
                    <button onClick={() => addToMenu(dish.id)} className="w-full py-2 bg-[#C5FF29] text-black rounded-xl text-[10px] font-black uppercase active:scale-95">加入清单</button>
                  </div>
                ))}
              </div>
              <button onClick={pickRandomDishes} className="w-full py-4 bg-white text-black rounded-2xl font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-20">
                试试手气 <Shuffle size={14} />
              </button>
            </section>

            {/* 周末清单部分... */}
            <section className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Calendar className="text-[#C5FF29]" size={18} />
                  <h2 className="text-lg font-black italic">周末清单</h2>
                </div>
              </div>
              {menuDishes.length === 0 ? (
                <div className="py-16 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10 flex flex-col items-center justify-center text-white/20 text-[10px] font-black uppercase">
                  空空如也，快去挑选菜品吧
                </div>
              ) : (
                <div className="space-y-4">
                  {menuDishes.map(dish => (
                    <div key={dish.id} className="bg-[#1A1A22] p-5 rounded-3xl border border-white/5 flex items-center gap-4 animate-in slide-in-from-right duration-300">
                      <div className="w-12 h-12 bg-[#C5FF29]/10 text-[#C5FF29] rounded-xl flex items-center justify-center font-black italic">{dish.name[0]}</div>
                      <div className="flex-1 text-sm font-black">{dish.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* 库和历史页面保持逻辑不变... */}
        {activeTab === 'library' && (
           <div className="space-y-6">
              <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-3">
                <Search size={18} className="text-white/20" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="搜索共同的菜谱..." className="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-white/20" />
              </div>
              <div className="grid grid-cols-1 gap-6 pb-10">
                {dishes.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase())).map(dish => (
                  <DishCard 
                    key={dish.id} dish={dish} onDelete={deleteDish}
                    onEdit={(d) => { setEditingDish(d); setIsFormOpen(true); }}
                    onAddToMenu={addToMenu} isInMenu={currentMenu?.dishIds.includes(dish.id)}
                  />
                ))}
              </div>
           </div>
        )}
      </main>

      {/* 配对码设置弹窗 */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSyncModalOpen(false)}></div>
          <div className="relative bg-[#1A1A22] w-full max-w-sm rounded-[2.5rem] p-8 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[#C5FF29]/10 rounded-2xl flex items-center justify-center text-[#C5FF29]">
                <Link2 size={24} />
              </div>
              <h3 className="text-lg font-black italic">开启双人同步</h3>
            </div>
            <p className="text-xs text-white/40 mb-6 leading-relaxed">两人输入相同的配对码（如：LOVEYOU），即可在各自手机上看到对方添加的菜品和清单。</p>
            <input 
              type="text" 
              value={coupleId} 
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                setCoupleId(val);
                localStorage.setItem('couple_id', val);
              }}
              placeholder="输入你们的专属配对码"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-center font-black tracking-[0.2em] text-[#C5FF29] focus:outline-none focus:border-[#C5FF29] transition-all mb-6 uppercase"
            />
            <button onClick={() => setIsSyncModalOpen(false)} className="w-full py-4 bg-[#C5FF29] text-black rounded-2xl font-black text-xs uppercase">确 定</button>
          </div>
        </div>
      )}

      {/* 底部导航... */}
      <nav className="fixed bottom-0 left-0 right-0 h-24 nav-bubble border-t border-white/5 flex justify-around items-center px-4 z-50">
        {[
          { id: 'home', icon: LayoutGrid, label: '首页' },
          { id: 'library', icon: Library, label: '菜谱' },
          { id: 'history', icon: History, label: '历史' }
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`flex flex-col items-center gap-1 transition-all ${activeTab === t.id ? 'text-[#C5FF29] scale-110' : 'text-white/20 scale-100'}`}>
            <t.icon size={22} strokeWidth={activeTab === t.id ? 3 : 2} />
            <span className="text-[9px] font-black uppercase tracking-widest">{t.label}</span>
          </button>
        ))}
      </nav>

      {isFormOpen && <DishForm initialDish={editingDish} onSave={handleSaveDish} onClose={() => setIsFormOpen(false)} />}
    </div>
  );
};

export default App;
