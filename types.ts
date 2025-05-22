
export enum MealTime {
  Breakfast = "Breakfast",
  Lunch = "Lunch",
  Dinner = "Dinner",
  Snack = "Snack",
}

export interface FoodItemEntry {
  id: string; // Unique ID for this specific food item entry in a meal
  foodName: string;
  quantity?: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  apiError?: string | null; // To store any API error specific to this item
}

export interface Meal {
  id: string; // Unique ID for the overall meal (e.g., this Breakfast instance)
  mealTime: MealTime;
  date: string; // YYYY-MM-DD
  items: FoodItemEntry[];
  totalCalories: number;
  totalProtein?: number;
  totalCarbs?: number;
  totalFat?: number;
}

export enum Page {
  Dashboard = "Dashboard",
  Settings = "Settings",
}

export type Theme = "light" | "dark";

// FIX: Define MealInputData for clarity and type safety when passing new meal data from form
export interface MealInputData {
  mealTime: MealTime;
  items: Omit<FoodItemEntry, 'id'>[];
}
