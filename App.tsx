
import React, { useState, useEffect, useMemo } from 'react';
import { Dish, WeekendMenu } from './types.ts';
import DishCard from './components/DishCard.tsx';
import DishForm from './components/DishForm.tsx';
import { 
  Plus, Search, Calendar, Library, Dices, 
  History, LayoutGrid, Shuffle, Trash2
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'couple_weekend_v2_storage';

const App: React.FC = () => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [currentMenu, setCurrentMenu] = useState<WeekendMenu | null>(null);
  const [history, setHistory] = useState<WeekendMenu[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'library' | 'history'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | undefined>(undefined);
  const [randomDishes, setRandomDishes] = useState<Dish[]>([]);

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

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ dishes, currentMenu, history }));
  }, [dishes, currentMenu, history]);

  const handleSaveDish = (dishData: Omit<Dish, 'id' | 'createTime'>) => {
    if (editingDish) {
      setDishes(prev => prev.map(d => d.id === editingDish.id ? { ...d, ...dishData } : d));
    } else {
      const newDish: Dish = { ...dishData, id: Math.random().toString(36).slice(2), createTime: Date.now() };
      setDishes(prev => [newDish, ...prev]);
    }
    setIsFormOpen(false);
    setEditingDish(undefined);
  };

  const deleteDish = (id: string) => {
    setDishes(prev => prev.filter(d => d.id !== id));
    setCurrentMenu(prev => prev ? { ...prev, dishIds: prev.dishIds.filter(did => did !== id) } : null);
  };

  const pickRandomDishes = () => {
    if (dishes.length === 0) return;
    const shuffled = [...dishes].sort(() => 0.5 - Math.random());
    setRandomDishes(shuffled.slice(0, 3));
  };

  // 初始加载或菜谱变动时自动选一组
  useEffect(() => {
    if (dishes.length > 0 && randomDishes.length === 0) {
      pickRandomDishes();
    }
  }, [dishes]);

  const menuDishes = useMemo(() => {
    return (currentMenu?.dishIds || []).map(id => dishes.find(d => d.id === id)).filter(Boolean) as Dish[];
  }, [currentMenu, dishes]);

  const addToMenu = (id: string) => {
    setCurrentMenu(prev => {
      const existingIds = prev?.dishIds || [];
      if (existingIds.includes(id)) return prev;
      return {
        id: 'current',
        date: new Date().toISOString(),
        dishIds: [...existingIds, id],
        status: 'planned'
      };
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0F0F14] text-white select-none pb-24">
      <header className="px-6 pt-14 pb-6 sticky top-0 z-40 bg-[#0F0F14]/80 backdrop-blur-xl border-b border-white/5 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black tracking-tight italic">周末吃什么</h1>
          <p className="text-[10px] text-white/20 uppercase font-black tracking-widest">Random Curator</p>
        </div>
        <button onClick={() => { setEditingDish(undefined); setIsFormOpen(true); }} className="w-12 h-12 bg-[#C5FF29] text-black rounded-2xl flex items-center justify-center shadow-lg shadow-[#C5FF29]/20 active:scale-90 transition-transform">
          <Plus size={24} strokeWidth={3} />
        </button>
      </header>

      <main className="px-5 pt-6 flex-1">
        {activeTab === 'home' && (
          <div className="space-y-8">
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
                    <button 
                      onClick={() => addToMenu(dish.id)}
                      className="w-full py-2 bg-[#C5FF29] text-black rounded-xl text-[10px] font-black uppercase active:scale-95"
                    >
                      加入清单
                    </button>
                  </div>
                ))}
                {dishes.length === 0 && (
                  <div className="w-full py-10 flex flex-col items-center text-white/10">
                    <Dices size={32} className="mb-2" />
                    <p className="text-[10px] font-bold">先在“菜谱”里添加一些宝贝吧</p>
                  </div>
                )}
              </div>

              <button 
                onClick={pickRandomDishes} 
                disabled={dishes.length === 0}
                className="w-full py-4 bg-white text-black rounded-2xl font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-20"
              >
                试试手气
                <Shuffle size={14} />
              </button>
            </section>

            <section className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Calendar className="text-[#C5FF29]" size={18} />
                  <h2 className="text-lg font-black italic">周末清单</h2>
                </div>
                {menuDishes.length > 0 && (
                  <button onClick={() => setCurrentMenu(null)} className="text-[10px] text-white/20 font-bold uppercase tracking-widest flex items-center gap-1">
                    清空 <Trash2 size={10} />
                  </button>
                )}
              </div>
              
              {menuDishes.length === 0 ? (
                <div className="py-16 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10 flex flex-col items-center justify-center text-white/20">
                  <Library size={32} strokeWidth={1} className="mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">点击灵感或去菜谱挑选</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {menuDishes.map(dish => (
                    <div key={dish.id} className="bg-[#1A1A22] p-5 rounded-3xl border border-white/5 flex items-center gap-4 animate-in slide-in-from-right duration-300">
                      <div className="w-12 h-12 bg-[#C5FF29]/10 text-[#C5FF29] rounded-xl flex items-center justify-center font-black italic">{dish.name[0]}</div>
                      <div className="flex-1"><p className="font-black text-sm">{dish.name}</p></div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'library' && (
          <div className="space-y-6">
            <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-3">
              <Search size={18} className="text-white/20" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="搜索我的菜谱..." className="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-white/20" />
            </div>
            <div className="grid grid-cols-1 gap-6">
              {dishes.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase())).map(dish => (
                <DishCard 
                  key={dish.id} 
                  dish={dish} 
                  onDelete={deleteDish}
                  onEdit={(d) => { setEditingDish(d); setIsFormOpen(true); }}
                  onAddToMenu={addToMenu} 
                  isInMenu={currentMenu?.dishIds.includes(dish.id)}
                />
              ))}
              {dishes.length === 0 && (
                <div className="text-center py-20 text-white/20">
                  <Plus className="mx-auto mb-4" size={48} strokeWidth={1} />
                  <p className="text-sm font-bold">点击右上角添加第一道菜</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="py-20 text-center text-white/10">
            <History size={48} className="mx-auto mb-4" strokeWidth={1} />
            <p className="text-[10px] font-black uppercase tracking-widest">开发中，敬请期待</p>
          </div>
        )}
      </main>

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

      {isFormOpen && (
        <DishForm 
          initialDish={editingDish} 
          onSave={handleSaveDish} 
          onClose={() => { setIsFormOpen(false); setEditingDish(undefined); }} 
        />
      )}
    </div>
  );
};

export default App;
