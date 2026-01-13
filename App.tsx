
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Dish, WeekendMenu } from './types.ts';
import DishCard from './components/DishCard.tsx';
import DishForm from './components/DishForm.tsx';
import { 
  Plus, 
  Search, 
  Calendar, 
  Library, 
  Dices, 
  Sparkles,
  History,
  LayoutGrid,
  ChevronRight,
  X,
  AlertCircle
} from 'lucide-react';
import { getAIRecommendations } from './services/geminiService.ts';

const LOCAL_STORAGE_KEY = 'couple_weekend_menu_wx_final';

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const App: React.FC = () => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [currentMenu, setCurrentMenu] = useState<WeekendMenu | null>(null);
  const [history, setHistory] = useState<WeekendMenu[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'library' | 'history'>('home');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | undefined>(undefined);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  
  const isWechat = /MicroMessenger/i.test(navigator.userAgent);

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setDishes(parsed.dishes || []);
        setCurrentMenu(parsed.currentMenu || null);
        setHistory(parsed.history || []);
      } catch (e) {
        console.error("Storage load error", e);
      }
    }
  }, []);

  useEffect(() => {
    try {
      const data = { dishes, currentMenu, history };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("Storage quota exceeded", e);
    }
  }, [dishes, currentMenu, history]);

  const deleteDish = useCallback((id: string) => {
    if (!id) return;
    const confirmDelete = window.confirm('确认删除这道菜谱灵感吗？');
    if (confirmDelete) {
      setDishes(prev => prev.filter(d => d.id !== id));
      setCurrentMenu(prev => {
        if (!prev) return null;
        return { ...prev, dishIds: prev.dishIds.filter(mid => mid !== id) };
      });
    }
  }, []);

  const handleSaveDish = (dishData: Omit<Dish, 'id' | 'createTime'>) => {
    if (editingDish) {
      setDishes(prev => prev.map(d => d.id === editingDish.id ? { ...d, ...dishData } : d));
    } else {
      const newDish: Dish = {
        ...dishData,
        id: generateId(),
        createTime: Date.now()
      };
      setDishes(prev => [newDish, ...prev]);
    }
    setIsFormOpen(false);
    setEditingDish(undefined);
  };

  const toggleToMenu = (id: string) => {
    setCurrentMenu(prev => {
      if (!prev) {
        return { id: generateId(), date: new Date().toISOString(), dishIds: [id], status: 'planned' };
      }
      const isExist = prev.dishIds.includes(id);
      return {
        ...prev,
        dishIds: isExist ? prev.dishIds.filter(mid => mid !== id) : [...prev.dishIds, id]
      };
    });
  };

  const completeWeekend = () => {
    if (!currentMenu) return;
    setHistory(prev => [{ ...currentMenu, status: 'completed' }, ...prev]);
    setCurrentMenu(null);
    setActiveTab('history');
  };

  const menuDishes = useMemo(() => {
    if (!currentMenu) return [];
    return currentMenu.dishIds.map(id => dishes.find(d => d.id === id)).filter(Boolean) as Dish[];
  }, [currentMenu, dishes]);

  const fetchAiRecommendations = async () => {
    setAiLoading(true);
    try {
      const allIngs = Array.from(new Set(dishes.flatMap(d => d.ingredients)));
      const sample = allIngs.length > 0 ? allIngs.slice(0, 5) : ["牛肉", "牛油果", "松露"];
      const recs = await getAIRecommendations(sample, "精致且浪漫");
      setAiSuggestions(recs);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0F0F14] text-white select-none">
      {/* 顶部 Header：微信内大幅增加顶部间距避让胶囊按钮 */}
      <header className={`px-6 flex justify-between items-center sticky top-0 z-40 bg-[#0F0F14]/90 backdrop-blur-2xl border-b border-white/5 ${isWechat ? 'pt-14 pb-4' : 'pt-12 pb-6'}`}>
        <div>
          <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
            我们的周末
            {isWechat && <span className="bg-[#C5FF29] text-black text-[9px] px-2 py-0.5 rounded-full font-black">MINI</span>}
          </h1>
          <p className="text-[9px] text-white/30 uppercase font-black tracking-[0.2em] mt-0.5">Couple Curator</p>
        </div>
        <button 
          onClick={() => { setEditingDish(undefined); setIsFormOpen(true); }}
          className="w-11 h-11 bg-[#C5FF29] text-black rounded-2xl flex items-center justify-center shadow-lg shadow-[#C5FF29]/20 active:scale-90 transition-all"
        >
          <Plus size={22} strokeWidth={3} />
        </button>
      </header>

      <main className="flex-1 px-5 safe-pb pt-6">
        {activeTab === 'home' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-3 duration-500">
            {/* AI 灵感推荐卡片 */}
            <section className="bg-gradient-to-br from-[#7B57FF] to-[#6344E3] rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-white/70 mb-4">
                  <Sparkles size={14} className="text-[#C5FF29]" />
                  <span className="text-[10px] font-black uppercase tracking-widest">灵感实验室</span>
                </div>
                <h2 className="text-xl font-black mb-6 leading-tight">Gemini 为你<br/>策划这周末？</h2>
                
                <div className="flex gap-4 overflow-x-auto no-scrollbar mb-6 -mx-2 px-2">
                  {aiSuggestions.length > 0 ? (
                    aiSuggestions.map((rec, i) => (
                      <div key={i} className="flex-shrink-0 w-52 bg-black/30 backdrop-blur-xl rounded-3xl p-5 border border-white/10 shadow-xl">
                        <p className="font-black text-sm mb-1">{rec.name}</p>
                        <p className="text-[9px] text-white/50 line-clamp-2 leading-tight mb-4 min-h-[2.4em]">{rec.description}</p>
                        <button 
                          onClick={() => handleSaveDish({name: rec.name, ingredients: rec.ingredients, tasteTags: ['AI推荐'], customTags: ['周末'], notes: rec.description})}
                          className="w-full py-2.5 bg-[#C5FF29] text-black rounded-xl text-[10px] font-black active:scale-95 transition-all"
                        >
                          收藏灵感
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full py-8 text-white/20 border-2 border-dashed border-white/10 rounded-3xl">
                       <Dices size={24} className="mb-2 opacity-40 animate-pulse" />
                       <p className="text-[10px] uppercase font-black tracking-widest">点击下方按钮开启</p>
                    </div>
                  )}
                </div>

                <button 
                  onClick={fetchAiRecommendations}
                  disabled={aiLoading}
                  className="w-full py-4.5 bg-white text-black rounded-[1.5rem] font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-black/10 disabled:opacity-50"
                >
                  {aiLoading ? "正在构思风味..." : "开启味蕾风暴"}
                  <ChevronRight size={14} />
                </button>
              </div>
            </section>

            {/* 本周计划 */}
            <section className="space-y-6">
              <div className="flex justify-between items-end px-1">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="text-[#C5FF29]" size={16} />
                    <h3 className="text-xl font-black">本周吃什么</h3>
                  </div>
                  <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">Selection</p>
                </div>
                {menuDishes.length > 0 && (
                  <button onClick={completeWeekend} className="px-5 py-2.5 bg-[#C5FF29] text-black rounded-full text-[10px] font-black uppercase active:scale-95 transition-all shadow-lg shadow-[#C5FF29]/20">
                    烹饪记录
                  </button>
                )}
              </div>

              {menuDishes.length === 0 ? (
                <div 
                  className="py-24 bg-[#1A1A22] rounded-[3rem] border border-white/5 flex flex-col items-center justify-center text-white/10 gap-4 cursor-pointer" 
                  onClick={() => setActiveTab('library')}
                >
                  <div className="p-5 bg-white/5 rounded-full"><Library size={36} strokeWidth={1.5} /></div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]">从灵感库挑选美味</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {menuDishes.map((dish) => (
                    <div key={dish.id} className="bg-[#1A1A22] rounded-[2.2rem] p-4 flex items-center gap-4 border border-white/5 relative overflow-hidden group active:bg-[#23232D] transition-colors">
                      <div className="w-16 h-16 bg-white/5 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center text-xl font-black italic text-white/5">
                        {dish.image ? <img src={dish.image} className="w-full h-full object-cover" /> : dish.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-base truncate">{dish.name}</h4>
                        <p className="text-[10px] text-white/30 truncate mt-0.5">{dish.ingredients.join(' · ')}</p>
                      </div>
                      <button onClick={() => toggleToMenu(dish.id)} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white/20 active:scale-90 active:bg-red-500/20 active:text-red-400 transition-all">
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
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input 
                type="text"
                placeholder="搜索我们的美食灵感..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1A1A22] border border-white/5 rounded-2xl py-4.5 pl-13 pr-6 text-sm focus:outline-none focus:border-[#C5FF29]/30 transition-all"
              />
            </div>
            
            <div className="grid grid-cols-1 gap-6 pb-4">
              {dishes.filter(d => d.name.includes(searchQuery)).map(dish => (
                <DishCard 
                  key={dish.id} 
                  dish={dish} 
                  onDelete={deleteDish}
                  onEdit={(d) => { setEditingDish(d); setIsFormOpen(true); }}
                  onAddToMenu={toggleToMenu}
                  isInMenu={currentMenu?.dishIds.includes(dish.id)}
                />
              ))}
              {dishes.length === 0 && (
                <div className="py-32 text-center opacity-20">
                  <AlertCircle size={48} className="mx-auto mb-4" strokeWidth={1} />
                  <p className="text-[10px] font-black uppercase tracking-widest">灵感库是空的</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-3 mb-2 px-1">
              <div className="w-10 h-10 bg-[#7B57FF]/20 rounded-xl flex items-center justify-center">
                <History className="text-[#7B57FF]" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black">时光菜单</h2>
                <p className="text-[9px] text-white/20 uppercase font-black tracking-widest">Sweet Memories</p>
              </div>
            </div>
            <div className="space-y-5">
              {history.map((h, i) => (
                <div key={i} className="bg-[#1A1A22] rounded-[2.5rem] p-7 border border-white/5 relative overflow-hidden active:scale-[0.99] transition-transform">
                  <div className="absolute top-0 right-0 w-1.5 bg-[#7B57FF] h-full opacity-40"></div>
                  <p className="text-[10px] font-black text-[#7B57FF] mb-4 uppercase tracking-[0.2em]">
                    {new Date(h.date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {h.dishIds.map(id => (
                      <span key={id} className="text-[11px] font-black bg-white/5 px-3.5 py-2 rounded-xl text-white/60 border border-white/5">
                        {dishes.find(d => d.id === id)?.name || '未知菜品'}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* 底部导航栏 */}
      <nav className="fixed bottom-0 left-0 right-0 nav-bubble z-50 flex justify-around items-center px-4 pt-3 pb-safe">
        {[
          { id: 'home', icon: LayoutGrid, label: '本周' },
          { id: 'library', icon: Library, label: '库' },
          { id: 'history', icon: History, label: '足迹' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-center gap-1.5 px-6 py-2 transition-all duration-300 ${activeTab === tab.id ? 'text-[#C5FF29] scale-105' : 'text-white/20'}`}
          >
            <tab.icon size={22} strokeWidth={activeTab === tab.id ? 2.8 : 2} />
            <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* 滑出表单 */}
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
