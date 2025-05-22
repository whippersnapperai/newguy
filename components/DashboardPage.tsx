
import React, { useState, useEffect, useCallback } from 'react';
// FIX: Import MealInputData type
import { Meal, MealTime, FoodItemEntry, MealInputData } from '../types';
import MealFormModal from './MealFormModal';
import MealList from './MealList';
import ProgressBar from './ProgressBar';
import { PlusIcon } from './Icons';

interface DashboardPageProps {
  dailyGoal: number;
}

const getCurrentDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0]; // YYYY-MM-DD
};

const DashboardPage: React.FC<DashboardPageProps> = ({ dailyGoal }) => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState<string>(getCurrentDate());

  useEffect(() => {
    const savedMeals = localStorage.getItem(`meals_${currentDate}`);
    if (savedMeals) {
      try {
        const parsedMeals = JSON.parse(savedMeals);
        // Basic validation to ensure it's an array and items have an 'id'
        if (Array.isArray(parsedMeals) && parsedMeals.every(m => m.id && Array.isArray(m.items))) {
           setMeals(parsedMeals);
        } else {
           setMeals([]); // Data is malformed
           localStorage.removeItem(`meals_${currentDate}`); // Clear bad data
        }
      } catch (error) {
        console.error("Failed to parse meals from localStorage:", error);
        setMeals([]);
        localStorage.removeItem(`meals_${currentDate}`);
      }
    } else {
      setMeals([]);
    }
  }, [currentDate]);

  const saveMealsToLocalStorage = useCallback((updatedMeals: Meal[]) => {
     localStorage.setItem(`meals_${currentDate}`, JSON.stringify(updatedMeals));
  }, [currentDate]);

  // FIX: Update handleAddMeal parameter type to MealInputData
  const handleAddMeal = useCallback((
    mealData: MealInputData
  ) => {
    let mealTotalCalories = 0;
    let mealTotalProtein = 0;
    let mealTotalCarbs = 0;
    let mealTotalFat = 0;

    const newMealItems: FoodItemEntry[] = mealData.items.map(item => {
      mealTotalCalories += item.calories;
      mealTotalProtein += item.protein || 0;
      mealTotalCarbs += item.carbs || 0;
      mealTotalFat += item.fat || 0;
      return {
        ...item,
        id: `food_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`, // Assign unique ID to each food item
      };
    });

    const newMeal: Meal = {
      id: `meal_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      date: currentDate,
      mealTime: mealData.mealTime,
      items: newMealItems,
      totalCalories: mealTotalCalories,
      totalProtein: mealTotalProtein > 0 ? mealTotalProtein : undefined,
      totalCarbs: mealTotalCarbs > 0 ? mealTotalCarbs : undefined,
      totalFat: mealTotalFat > 0 ? mealTotalFat : undefined,
    };

    setMeals(prevMeals => {
      const updatedMeals = [...prevMeals, newMeal].sort((a, b) => {
        const timeOrder = [MealTime.Breakfast, MealTime.Lunch, MealTime.Dinner, MealTime.Snack];
        return timeOrder.indexOf(a.mealTime) - timeOrder.indexOf(b.mealTime);
      });
      saveMealsToLocalStorage(updatedMeals);
      return updatedMeals;
    });
  }, [currentDate, saveMealsToLocalStorage]);

  const handleDeleteMeal = useCallback((mealId: string) => {
    setMeals(prevMeals => {
      const updatedMeals = prevMeals.filter(meal => meal.id !== mealId);
      saveMealsToLocalStorage(updatedMeals);
      return updatedMeals;
    });
  }, [saveMealsToLocalStorage]);

  // Recalculate totalCaloriesConsumed based on new Meal structure
  const totalCaloriesConsumed = meals.reduce((sum, meal) => sum + meal.totalCalories, 0);
  const caloriesRemaining = dailyGoal - totalCaloriesConsumed;
  const progressPercentage = dailyGoal > 0 ? Math.max(0, (totalCaloriesConsumed / dailyGoal) * 100) : 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="bg-light-surface dark:bg-dark-surface p-6 rounded-xl shadow-card">
        <div className="text-center">
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">
            {caloriesRemaining >= 0 ? "Calories Remaining" : "Calories Over"}
          </p>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-light-primary dark:text-dark-primary">
            {Math.abs(caloriesRemaining).toLocaleString()}
            <span className="text-2xl sm:text-3xl font-semibold text-light-text-secondary dark:text-dark-text-secondary">
              {' '}/ {dailyGoal.toLocaleString()} kcal
            </span>
          </h2>
          <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-2">
            Today: {new Date(currentDate.replace(/-/g, '/')).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <ProgressBar percentage={progressPercentage} />
      </header>

      <MealList meals={meals} onDeleteMeal={handleDeleteMeal} />

      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 bg-light-primary dark:bg-dark-primary hover:bg-light-primary-hover dark:hover:bg-dark-primary-hover text-white p-4 rounded-2xl shadow-lg transition-all duration-200 ease-in-out hover:scale-105 focus:outline-none focus:ring-4 focus:ring-light-accent/50 dark:focus:ring-dark-accent/50"
        aria-label="Add new meal"
      >
        <PlusIcon className="w-7 h-7 sm:w-8 sm:h-8" />
      </button>

      {isModalOpen && (
        <MealFormModal
          onClose={() => setIsModalOpen(false)}
          onAddMeal={handleAddMeal}
        />
      )}
    </div>
  );
};

export default DashboardPage;
