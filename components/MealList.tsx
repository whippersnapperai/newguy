import React from 'react';
import { Meal } from '../types';
import MealItem from './MealItem';
import {ClipboardDocumentListIcon} from './Icons'; // Example for a more engaging icon

interface MealListProps {
  meals: Meal[];
  onDeleteMeal: (mealId: string) => void;
}

const MealList: React.FC<MealListProps> = ({ meals, onDeleteMeal }) => {
  if (meals.length === 0) {
    return (
      <div className="text-center py-12 sm:py-16 bg-light-surface dark:bg-dark-surface rounded-xl shadow-card">
        <ClipboardDocumentListIcon className="w-16 h-16 mx-auto text-light-text-secondary/50 dark:text-dark-text-secondary/50 mb-4" />
        <h3 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">No meals logged yet</h3>
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
          Tap the '+' button to add your first meal for today.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {meals.map(meal => (
        <MealItem key={meal.id} meal={meal} onDeleteMeal={onDeleteMeal} />
      ))}
    </div>
  );
};

export default MealList;