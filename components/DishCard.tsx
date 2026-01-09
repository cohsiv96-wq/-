
import React from 'react';
import { Dish } from '../types';
import { Utensils, Trash2, Edit2, Plus, Check } from 'lucide-react';

interface DishCardProps {
  dish: Dish;
  onDelete?: (id: string) => void;
  onEdit?: (dish: Dish) => void;
  onAddToMenu?: (id: string) => void;
  isInMenu?: boolean;
}

const DishCard: React.FC<DishCardProps> = ({ dish, onDelete, onEdit, onAddToMenu, isInMenu }) => {
  return (
    <div className="bg-[#1A1A22] rounded-[2.5rem] overflow-hidden border border-white/5 flex flex-col shadow-xl active:scale-[0.98] transition-transform">
      <div className="relative h-48">
        {dish.image ? (
          <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[#2A2A35] flex items-center justify-center">
             <span className="text-white/5 text-8xl font-black italic">{dish.name[0]}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A22] via-transparent to-transparent"></div>
        
        {/* 操作区 - 针对移动端常驻且透明度较高 */}
        <div className="absolute top-4 right-4 flex gap-2">
          {onEdit && (
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(dish); }}
              className="w-10 h-10 bg-black/40 backdrop-blur-md text-white rounded-full flex items-center justify-center border border-white/10 active:scale-90"
            >
              <Edit2 size={16} />
            </button>
          )}
          {onDelete && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(dish.id); }}
              className="w-10 h-10 bg-black/40 backdrop-blur-md text-red-400 rounded-full flex items-center justify-center border border-white/10 active:scale-90"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="p-6 pt-0">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-black tracking-tight">{dish.name}</h3>
          {dish.tasteTags.length > 0 && (
            <span className="px-2 py-0.5 bg-[#C5FF29] text-black text-[8px] font-black rounded uppercase">
              {dish.tasteTags[0]}
            </span>
          )}
        </div>
        
        <p className="text-[10px] text-white/30 italic line-clamp-1 mb-6">
          {dish.ingredients.join(' · ') || '尚未记录食材'}
        </p>

        <button 
          onClick={(e) => { e.stopPropagation(); onAddToMenu?.(dish.id); }}
          className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs transition-all active:scale-95 ${
            isInMenu 
            ? 'bg-white/5 text-white/20 border border-white/5' 
            : 'bg-[#C5FF29] text-black shadow-lg shadow-[#C5FF29]/10'
          }`}
        >
          {isInMenu ? <Check size={16} strokeWidth={3} /> : <Plus size={16} strokeWidth={3} />}
          {isInMenu ? '已在计划中' : '加入本周计划'}
        </button>
      </div>
    </div>
  );
};

export default DishCard;
