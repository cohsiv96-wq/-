
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Dish, WeekendMenu } from './types';
import DishCard from './components/DishCard';
import DishForm from './components/DishForm';
import { 
  Heart, 
  Plus, 
  Search, 
  Calendar, 
  Library, 
  Dices, 
  Sparkles,
  History,
  LayoutGrid,
  ChevronRight,
  Clock,
  Edit2,
  Trash2,
  X
} from 'lucide-react';
import { getAIRecommendations } from './services/geminiService';

const LOCAL_STORAGE_KEY = 'couple_weekend_menu_v3_final_stable';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
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
    // 移动端友好的 confirm
    const confirmDelete = window.confirm('确定要从灵感库中删除吗？');
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
      const sample = allIngs.length > 0 ? allIngs.slice(0, 5) : ["鲜虾", "意面", "芝士"];
      const recs = await getAIRecommendations(sample, "浪漫且轻盈");
      setAiSuggestions(recs);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0F0F14] text-white">
      {/* 顶部状态栏占位/Header */}
      <header className="pt-12 px-6 pb-6 flex justify-between items-center sticky top-0 z-40 bg-[#0F0F14]/80 backdrop-blur-lg">
        <div>
          <h1 className="text-2xl font-black tracking-tight">我们的菜单</h1>
          <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Couple Curator v3.2</p>
        </div>
        <button 
          onClick={() => { setEditingDish(undefined); setIsFormOpen(true); }}
          className="w-12 h-12 bg-[#C5FF29] text-black rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"
        >
          <Plus size={24} strokeWidth={3} />
        </button>
      </header>

      {/* 主内容区域 - 带有底部安全间距 */}
      <main className="flex-1 px-6 safe-pb">
        
        {activeTab === 'home' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* AI 灵感卡片 */}
            <section className="bg-gradient-to-br from-[#7B57FF] to-[#6344E3] rounded-[2.5rem] p-6 shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full translate-x-10 -translate-y-10"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-white/70 mb-3">
                  <Sparkles size={14} />
                  <span className="text-[10px] font-black uppercase tracking-wider">灵感实验室</span>
                </div>
                <h2 className="text-xl font-black mb-6">获取 AI 周末菜谱？</h2>
                
                <div className="flex gap-4 overflow-x-auto no-scrollbar mb-6 pb-2">
                  {aiSuggestions.length > 0 ? (
                    aiSuggestions.map((rec, i) => (
                      <div key={i} className="flex-shrink-0 w-56 bg-black/20 backdrop-blur-md rounded-3xl p-4 border border-white/10">
                        <p className="font-black text-sm mb-1">{rec.name}</p>
                        <p className="text-[9px] text-white/50 line-clamp-2 leading-tight mb-3">"{rec.description}"</p>
                        <button 
                          onClick={() => handleSaveDish({name: rec.name, ingredients: rec.ingredients, tasteTags: ['AI推荐'], customTags: ['浪漫'], notes: rec.description})}
                          className="w-full py-2 bg-white/10 hover:bg-[#C5FF29] hover:text-black rounded-xl text-[10px] font-black transition-all"
                        >
                          收藏
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-white/40 italic py-4">点击下方按钮，让 Gemini 为你策划...</p>
                  )}
                </div>

                <button 
                  onClick={fetchAiRecommendations}
                  disabled={aiLoading}
                  className="w-full py-4 bg-[#C5FF29] text-black rounded-2xl font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  {aiLoading ? "正在计算风味..." : "开启灵感碰撞"}
                  <ChevronRight size={14} />
                </button>
              </div>
            </section>

            {/* 本周计划区 */}
            <section className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="text-[#C5FF29]" size={16} />
                    <h3 className="text-xl font-black tracking-tight">本周安排</h3>
                  </div>
                  <p className="text-white/20 text-[10px] font-bold uppercase">Weekend Plans</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => {
                    if (dishes.length === 0) return;
                    toggleToMenu(dishes[Math.floor(Math.random() * dishes.length)].id);
                  }} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white/40 active:scale-90 transition-transform">
                    <Dices size={18} />
                  </button>
                  {menuDishes.length > 0 && (
                    <button onClick={completeWeekend} className="px-4 py-2 bg-[#C5FF29] text-black rounded-full text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform">
                      完成
                    </button>
                  )}
                </div>
              </div>

              {menuDishes.length === 0 ? (
                <div className="py-16 bg-[#1A1A22] rounded-[3rem] border border-white/5 flex flex-col items-center justify-center text-white/10 gap-4" onClick={() => setActiveTab('library')}>
                  <Library size={40} strokeWidth={1} />
                  <p className="text-xs font-bold uppercase tracking-widest">去书库点菜吧</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {menuDishes.map((dish, idx) => (
                    <div key={dish.id} className="bg-[#1A1A22] rounded-[2.5rem] p-5 flex items-center gap-4 border border-white/5 relative overflow-hidden group">
                      <div className="w-20 h-20 bg-white/5 rounded-2xl overflow-hidden shrink-0">
                        {dish.image ? <img src={dish.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl font-black italic text-white/5">{dish.name[0]}</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-base truncate">{dish.name}</h4>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {dish.tasteTags.slice(0, 2).map(t => <span key={t} className="text-[8px] bg-white/5 px-1.5 py-0.5 rounded text-white/40">{t}</span>)}
                        </div>
                      </div>
                      <button onClick={() => toggleToMenu(dish.id)} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white/20 active:scale-90">
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
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input 
                type="text"
                placeholder="搜索美食灵感..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1A1A22] border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm focus:outline-none focus:border-[#C5FF29]/30"
              />
            </div>
            
            <div className="grid grid-cols-1 gap-6">
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
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <h2 className="text-2xl font-black">时光菜单</h2>
            {history.length === 0 ? (
              <div className="py-20 text-center opacity-20">
                <History size={48} className="mx-auto mb-4" />
                <p className="text-xs uppercase font-bold tracking-widest">暂无历史记录</p>
              </div>
            ) : (
              <div className="space-y-6">
                {history.map((h, i) => (
                  <div key={i} className="bg-[#1A1A22] rounded-[2.5rem] p-6 border border-white/5">
                    <p className="text-[10px] font-black text-[#7B57FF] mb-3 uppercase tracking-widest">
                      {new Date(h.date).toLocaleDateString()}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {h.dishIds.map(id => (
                        <span key={id} className="text-xs bg-white/5 px-3 py-1.5 rounded-xl text-white/60">
                          {dishes.find(d => d.id === id)?.name || '未知菜品'}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* 手机级底部导航栏 */}
      <nav className="fixed bottom-0 left-0 right-0 nav-bubble z-50 flex justify-around items-center px-4 py-3">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 p-2 transition-all ${activeTab === 'home' ? 'text-[#C5FF29] scale-110' : 'text-white/20'}`}
        >
          <LayoutGrid size={24} strokeWidth={activeTab === 'home' ? 3 : 2} />
          <span className="text-[9px] font-black uppercase tracking-tighter">首页</span>
        </button>
        <button 
          onClick={() => setActiveTab('library')}
          className={`flex flex-col items-center gap-1 p-2 transition-all ${activeTab === 'library' ? 'text-[#C5FF29] scale-110' : 'text-white/20'}`}
        >
          <Library size={24} strokeWidth={activeTab === 'library' ? 3 : 2} />
          <span className="text-[9px] font-black uppercase tracking-tighter">库</span>
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center gap-1 p-2 transition-all ${activeTab === 'history' ? 'text-[#C5FF29] scale-110' : 'text-white/20'}`}
        >
          <History size={24} strokeWidth={activeTab === 'history' ? 3 : 2} />
          <span className="text-[9px] font-black uppercase tracking-tighter">历史</span>
        </button>
      </nav>

      {/* 底部滑出抽屉表单 */}
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
