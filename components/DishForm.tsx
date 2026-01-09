
import React, { useState, useRef, useEffect } from 'react';
import { Dish } from '../types';
import { X, Sparkles, Loader2, Plus, Image as ImageIcon, Upload, Check } from 'lucide-react';
import { suggestIngredients } from '../services/geminiService';

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

  // 阻止背景滚动
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
    <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* 点击背景关闭 */}
      <div className="absolute inset-0" onClick={onClose}></div>
      
      {/* 抽屉内容 */}
      <div className="relative bg-[#1A1A22] w-full max-h-[92vh] rounded-t-[3rem] p-8 pb-12 shadow-2xl flex flex-col animate-slide-up overflow-hidden border-t border-white/10">
        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6 shrink-0"></div>
        
        <div className="flex justify-between items-center mb-8 shrink-0">
          <h2 className="text-2xl font-black">{initialDish ? '编辑美味' : '添加灵感'}</h2>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-white/40">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-8">
          {/* 图片预览与上传 */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-44 bg-white/5 rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center overflow-hidden relative"
          >
            {image ? (
              <img src={image} className="w-full h-full object-cover" />
            ) : (
              <>
                <ImageIcon className="text-white/10 mb-2" size={32} />
                <p className="text-white/20 text-[10px] font-black uppercase">上传实拍图</p>
              </>
            )}
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
          </div>

          {/* 菜名输入 */}
          <div className="relative">
            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-2">菜品名称</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="这道菜叫什么？"
              className="w-full bg-transparent text-xl font-black border-b border-white/10 pb-2 focus:outline-none focus:border-[#C5FF29]"
            />
            <button 
              onClick={handleSuggest}
              disabled={isSuggesting || !name}
              className="absolute right-0 bottom-3 p-2 bg-[#C5FF29] text-black rounded-full shadow-lg disabled:opacity-20"
            >
              {isSuggesting ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
            </button>
          </div>

          {/* 食材列表 */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">食材清单</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {ingredients.map((ing, i) => (
                <span key={i} className="px-3 py-1.5 bg-white/5 rounded-xl text-xs font-bold flex items-center gap-2 border border-white/5">
                  {ing}
                  <X size={12} className="text-white/20" onClick={() => setIngredients(ingredients.filter((_, idx) => idx !== i))} />
                </span>
              ))}
            </div>
            <form onSubmit={addIngredient} className="flex gap-2">
              <input
                type="text"
                value={ingredientInput}
                onChange={(e) => setIngredientInput(e.target.value)}
                placeholder="添加食材..."
                className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none"
              />
              <button type="submit" className="px-4 bg-white/10 rounded-xl"><Plus size={20}/></button>
            </form>
          </div>

          {/* 标签 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <p className="text-[10px] font-black text-white/20 uppercase">口味</p>
              <div className="flex flex-wrap gap-2">
                {['辣', '甜', '清淡'].map(tag => (
                  <button key={tag} onClick={() => toggleTag(tasteTags, setTasteTags, tag)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${tasteTags.includes(tag) ? 'bg-[#C5FF29] text-black border-[#C5FF29]' : 'bg-white/5 text-white/40 border-white/5'}`}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-black text-white/20 uppercase">场景</p>
              <div className="flex flex-wrap gap-2">
                {['快速', '纪念日'].map(tag => (
                  <button key={tag} onClick={() => toggleTag(customTags, setCustomTags, tag)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${customTags.includes(tag) ? 'bg-[#7B57FF] text-white border-[#7B57FF]' : 'bg-white/5 text-white/40 border-white/5'}`}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 笔记 */}
          <div className="space-y-3 pb-8">
            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">灵感笔记</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="记录关于它的美味故事..."
              className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-4 text-sm h-24 focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* 确认按钮 */}
        <div className="pt-6 shrink-0">
          <button
            onClick={() => onSave({ name, image, ingredients, tasteTags, customTags, notes })}
            disabled={!name}
            className="w-full py-5 bg-[#C5FF29] text-black rounded-[2rem] font-black text-lg flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-20"
          >
            <Check size={24} strokeWidth={3} />
            保存灵感
          </button>
        </div>
      </div>
    </div>
  );
};

export default DishForm;
