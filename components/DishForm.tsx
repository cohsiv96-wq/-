
import React, { useState, useRef, useEffect } from 'react';
import { Dish } from '../types.ts';
import { X, Sparkles, Loader2, Plus, Image as ImageIcon, Check } from 'lucide-react';
import { suggestIngredients } from '../services/geminiService.ts';

interface DishFormProps {
  initialDish?: Dish;
  onSave: (dish: Omit<Dish, 'id' | 'createTime'>) => void;
  onClose: () => void;
}

const DishForm: React.FC<DishFormProps> = ({ initialDish, onSave, onClose }) => {
  const [name, setName] = useState(initialDish?.name || '');
  const [image, setImage] = useState(initialDish?.image || '');
  const [ingredientInput, setIngredientInput] = useState('');
  const [ingredients, setIngredients] = useState<string[]>(initialDish?.ingredients || []);
  const [tasteTags, setTasteTags] = useState<string[]>(initialDish?.tasteTags || []);
  const [customTags, setCustomTags] = useState<string[]>(initialDish?.customTags || []);
  const [notes, setNotes] = useState(initialDish?.notes || '');
  const [isSuggesting, setIsSuggesting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const addIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (ingredientInput.trim() && !ingredients.includes(ingredientInput.trim())) {
      setIngredients([...ingredients, ingredientInput.trim()]);
      setIngredientInput('');
    }
  };

  const handleSuggest = async () => {
    if (!name.trim()) return;
    setIsSuggesting(true);
    try {
      const suggested = await suggestIngredients(name);
      setIngredients(prev => Array.from(new Set([...prev, ...suggested])));
    } finally {
      setIsSuggesting(false);
    }
  };

  const toggleTag = (list: string[], setList: (l: string[]) => void, tag: string) => {
    list.includes(tag) ? setList(list.filter(t => t !== tag)) : setList([...list, tag]);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="absolute inset-0" onClick={onClose}></div>
      
      <div className="relative bg-[#1A1A22] w-full max-h-[95vh] rounded-t-[3rem] p-7 pb-12 shadow-2xl flex flex-col animate-slide-up border-t border-white/5">
        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-7 shrink-0"></div>
        
        <div className="flex justify-between items-center mb-8 shrink-0">
          <h2 className="text-2xl font-black">{initialDish ? '调整这份美味' : '新增灵感'}</h2>
          <button onClick={onClose} className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center text-white/30 active:scale-90 transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-9 px-1">
          {/* 图片区 */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-44 bg-white/5 rounded-[2rem] border-2 border-dashed border-white/10 flex flex-col items-center justify-center overflow-hidden relative active:bg-white/10 transition-colors"
          >
            {image ? (
              <img src={image} className="w-full h-full object-cover" />
            ) : (
              <>
                <ImageIcon className="text-white/10 mb-2" size={32} />
                <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em]">添加这道菜的实拍</p>
              </>
            )}
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
          </div>

          {/* 输入区 */}
          <div className="relative">
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-3">菜名</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="我们要吃什么？"
              className="w-full bg-transparent text-xl font-black border-b border-white/10 pb-3 focus:outline-none focus:border-[#C5FF29] transition-all"
            />
            <button 
              onClick={handleSuggest}
              disabled={isSuggesting || !name}
              className="absolute right-0 bottom-3.5 p-2.5 bg-[#C5FF29] text-black rounded-xl shadow-xl shadow-[#C5FF29]/20 disabled:opacity-20 active:scale-90 transition-all"
            >
              {isSuggesting ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
            </button>
          </div>

          {/* 食材区 */}
          <div className="space-y-4">
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">必备食材</p>
            <div className="flex flex-wrap gap-2.5">
              {ingredients.map((ing, i) => (
                <span key={i} className="px-4 py-2 bg-white/5 rounded-2xl text-[12px] font-black flex items-center gap-3 border border-white/5">
                  {ing}
                  <X size={14} className="text-white/20" onClick={() => setIngredients(ingredients.filter((_, idx) => idx !== i))} />
                </span>
              ))}
            </div>
            <form onSubmit={addIngredient} className="flex gap-2.5">
              <input
                type="text"
                value={ingredientInput}
                onChange={(e) => setIngredientInput(e.target.value)}
                placeholder="输入一样食材..."
                className="flex-1 bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-xs focus:outline-none"
              />
              <button type="submit" className="px-5 bg-white/10 rounded-2xl active:scale-95 transition-all">
                <Plus size={22}/>
              </button>
            </form>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-4">
              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">主打风味</p>
              <div className="flex flex-wrap gap-2.5">
                {['麻辣', '清爽', '甜口', '浓郁'].map(tag => (
                  <button key={tag} onClick={() => toggleTag(tasteTags, setTasteTags, tag)} className={`px-3 py-2 rounded-xl text-[10px] font-black border transition-all ${tasteTags.includes(tag) ? 'bg-[#C5FF29] text-black border-[#C5FF29]' : 'bg-white/5 text-white/30 border-white/5'}`}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">生活标签</p>
              <div className="flex flex-wrap gap-2.5">
                {['浪漫', '快手', '治愈', '纪念'].map(tag => (
                  <button key={tag} onClick={() => toggleTag(customTags, setCustomTags, tag)} className={`px-3 py-2 rounded-xl text-[10px] font-black border transition-all ${customTags.includes(tag) ? 'bg-[#7B57FF] text-white border-[#7B57FF]' : 'bg-white/5 text-white/30 border-white/5'}`}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 pb-6">
            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">灵感备注</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="这道菜里藏着什么秘密？"
              className="w-full bg-white/5 border border-white/5 rounded-[1.5rem] px-5 py-5 text-xs h-24 focus:outline-none resize-none transition-all"
            />
          </div>
        </div>

        <div className="pt-8 shrink-0">
          <button
            onClick={() => onSave({ name, image, ingredients, tasteTags, customTags, notes })}
            disabled={!name}
            className="w-full py-5 bg-[#C5FF29] text-black rounded-[2rem] font-black text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-20 shadow-2xl shadow-[#C5FF29]/20"
          >
            <Check size={24} strokeWidth={4} />
            保存这份灵感
          </button>
        </div>
      </div>
    </div>
  );
};

export default DishForm;
