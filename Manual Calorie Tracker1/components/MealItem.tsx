import React from 'react';
import { Meal } from '../types';
import { TrashIcon } from './Icons';

interface MealItemProps {
  meal: Meal;
  onDeleteMeal: (mealId: string) => void;
}

const MealItem: React.FC<MealItemProps> = ({ meal, onDeleteMeal }) => {
  return (
    <div className="bg-light-surface dark:bg-dark-surface p-4 sm:p-5 rounded-xl shadow-card transition-all duration-200 hover:shadow-card-hover">
      <div className="flex justify-between items-start mb-3 pb-3 border-b border-light-border dark:border-dark-border">
        <div>
          <h3 className="font-semibold text-lg sm:text-xl text-light-primary dark:text-dark-primary">
            {meal.mealTime}
          </h3>
          <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
            {meal.items.length} item{meal.items.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
           <span 
            className="bg-light-primary/10 dark:bg-dark-primary/20 text-light-primary dark:text-dark-primary px-3 py-1.5 rounded-full text-sm sm:text-base font-bold whitespace-nowrap"
            role="status"
          >
            {meal.totalCalories.toLocaleString()} kcal
          </span>
          {(meal.totalProtein || meal.totalCarbs || meal.totalFat) && (
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
              {meal.totalProtein ? `P: ${Math.round(meal.totalProtein)}g` : ''}
              {meal.totalCarbs ? ` C: ${Math.round(meal.totalCarbs)}g` : ''}
              {meal.totalFat ? ` F: ${Math.round(meal.totalFat)}g` : ''}
            </p>
          )}
        </div>
      </div>

      <ul className="space-y-2.5 mb-3">
        {meal.items.map((item) => (
          <li key={item.id} className="flex justify-between items-start text-sm">
            <div className="flex-grow overflow-hidden pr-2">
              <p className="font-medium text-light-text-primary dark:text-dark-text-primary truncate" title={item.foodName}>
                {item.foodName}
                {item.quantity && <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary ml-1">({item.quantity})</span>}
              </p>
              {(item.protein || item.carbs || item.fat) && (
                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                  {item.protein ? `P: ${Math.round(item.protein)}g` : ''}
                  {item.carbs ? ` C: ${Math.round(item.carbs)}g` : ''}
                  {item.fat ? ` F: ${Math.round(item.fat)}g` : ''}
                </p>
              )}
            </div>
            <span className="text-light-text-secondary dark:text-dark-text-secondary whitespace-nowrap">
              {item.calories.toLocaleString()} kcal
            </span>
          </li>
        ))}
      </ul>
      
      <div className="flex justify-end pt-2 border-t border-light-border/50 dark:border-dark-border/50">
        <button
            onClick={() => onDeleteMeal(meal.id)}
            className="text-light-text-secondary hover:text-light-danger dark:text-dark-text-secondary dark:hover:text-dark-danger p-1.5 rounded-full hover:bg-light-danger/10 dark:hover:bg-dark-danger/10 transition-colors duration-200 text-xs flex items-center"
            aria-label={`Delete ${meal.mealTime} meal`}
          >
            <TrashIcon className="w-4 h-4 mr-1" /> Delete Meal
          </button>
      </div>
    </div>
  );
};

export default MealItem;