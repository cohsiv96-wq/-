
import React from 'react';
import { Dish } from '../types';
import { Trash2, Edit2, Plus, Check } from 'lucide-react';

interface DishCardProps {
  dish: Dish;
  onDelete?: (id: string) => void;
  onEdit?: (dish: Dish) => void;
  onAddToMenu?: (id: string) => void;
  isInMenu?: boolean;
}

const DishCard: React.FC<DishCardProps> = ({ dish, onDelete, onEdit, onAddToMenu, isInMenu }) => {
  return (
    <div className="bg-[#1A1A22] rounded-[2.5rem] overflow-hidden border border-white/5 flex flex-col shadow-2xl active:scale-[0.98] transition-transform duration-200">
      <div className="relative h-52">
        {dish.image ? (
          <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[#2A2A35] flex items-center justify-center">
             <span className="text-white/5 text-8xl font-black italic select-none">{dish.name[0]}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A22] via-transparent to-transparent opacity-80"></div>
        
        <div className="absolute top-5 right-5 flex gap-3">
          {onEdit && (
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(dish); }}
              className="w-11 h-11 bg-black/50 backdrop-blur-xl text-white rounded-2xl flex items-center justify-center border border-white/10 active:scale-90 transition-all"
            >
              <Edit2 size={18} />
            </button>
          )}
          {onDelete && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(dish.id); }}
              className="w-11 h-11 bg-black/50 backdrop-blur-xl text-red-400 rounded-2xl flex items-center justify-center border border-white/10 active:scale-90 transition-all"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="p-7 pt-0 relative -mt-4 z-10">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-black tracking-tight">{dish.name}</h3>
          {dish.tasteTags.length > 0 && (
            <span className="px-2.5 py-1 bg-[#C5FF29] text-black text-[9px] font-black rounded uppercase tracking-wider">
              {dish.tasteTags[0]}
            </span>
          )}
        </div>
        
        <p className="text-[10px] text-white/30 font-bold line-clamp-1 mb-7 tracking-wide">
          {dish.ingredients.join(' · ') || '尚未记录具体食材'}
        </p>

        <button 
          onClick={(e) => { e.stopPropagation(); onAddToMenu?.(dish.id); }}
          className={`w-full py-4.5 rounded-[1.5rem] flex items-center justify-center gap-2 font-black text-xs transition-all active:scale-95 ${
            isInMenu 
            ? 'bg-white/5 text-white/20 border border-white/10' 
            : 'bg-[#C5FF29] text-black shadow-lg shadow-[#C5FF29]/10'
          }`}
        >
          {isInMenu ? <Check size={18} strokeWidth={3} /> : <Plus size={18} strokeWidth={3} />}
          {isInMenu ? '计划中' : '加入这周末'}
        </button>
      </div>
    </div>
  );
};

export default DishCard;
