
import React, { useState, useEffect } from 'react';
import { MealTime, FoodItemEntry, MealInputData } from '../types';
import { XMarkIcon, PlusIcon, TrashIcon, SparklesIcon } from './Icons';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

interface MealFormModalProps {
  onClose: () => void;
  onAddMeal: (mealData: MealInputData) => void;
}

interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  error?: string;
}

const generateLocalId = () => `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

const MealFormModal: React.FC<MealFormModalProps> = ({ onClose, onAddMeal }) => {
  const [mealTime, setMealTime] = useState<MealTime>(MealTime.Breakfast);
  const [foodItems, setFoodItems] = useState<Array<Partial<FoodItemEntry> & { localId: string, manualCaloriesStr: string }>>([
    { localId: generateLocalId(), foodName: '', quantity: '', manualCaloriesStr: '' }
  ]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  
  const [apiKeyMissingError, setApiKeyMissingError] = useState<string | null>(null);
  const [ai, setAi] = useState<GoogleGenAI | null>(null);

  useEffect(() => {
    // Note: In a plain browser environment without a build step, process.env.API_KEY will be undefined.
    // The user needs to ensure this is available, e.g., via a build tool or by defining window.process.env.API_KEY.
    const apiKey = process.env.API_KEY; 
    if (apiKey) {
      try {
        setAi(new GoogleGenAI({ apiKey: apiKey }));
        setApiKeyMissingError(null);
      } catch (error) {
        console.error("Error initializing GoogleGenAI:", error);
        setAi(null);
        setApiKeyMissingError("Error initializing API. Calorie auto-calculation is disabled.");
      }
    } else {
      setAi(null);
      setApiKeyMissingError("API key not configured. Calorie auto-calculation is disabled. Please enter all calories manually.");
    }
  }, []);


  const handleItemChange = (localId: string, field: keyof FoodItemEntry | 'manualCaloriesStr', value: string) => {
    setFoodItems(items => 
      items.map(item => item.localId === localId ? { ...item, [field]: value, apiError: null } : item) // Clear specific item error on change
    );
    setGlobalError(null); // Clear global error on input change
  };

  const addFoodItemField = () => {
    setFoodItems(items => [...items, { localId: generateLocalId(), foodName: '', quantity: '', manualCaloriesStr: '' }]);
  };

  const removeFoodItemField = (localId: string) => {
    setFoodItems(items => items.filter(item => item.localId !== localId));
  };

  const getNutritionalInfoForItem = async (foodName: string, quantity: string): Promise<NutritionalInfo | null> => {
    if (!ai) return null;

    const prompt = `You are a nutritional analysis assistant. For the food entry "${quantity} ${foodName}", provide the estimated total calories, protein (in grams), carbohydrates (in grams), and fat (in grams). Respond ONLY with a valid JSON object formatted like this: {"calories": number, "protein": number, "carbs": number, "fat": number}. Ensure all values are numbers. If the food entry is ambiguous or you cannot provide accurate data, respond with {"calories": 0, "protein": 0, "carbs": 0, "fat": 0, "error": "Could not accurately process food entry. Please be more specific or enter manually."}.`;
    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-04-17",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          systemInstruction: "You are an expert in nutritional analysis and always respond in the specified JSON format."
        }
      });
      let jsonStr = response.text.trim();
      const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[2]) jsonStr = match[2].trim();
      
      const data: NutritionalInfo = JSON.parse(jsonStr);
      if (data.error || typeof data.calories !== 'number' || typeof data.protein !== 'number' || typeof data.carbs !== 'number' || typeof data.fat !== 'number') {
        return { calories: 0, protein: 0, carbs: 0, fat: 0, error: data.error || "Invalid data format from API." };
      }
      return data;
    } catch (e) {
      console.error("API call failed for item:", foodName, e);
      return { calories: 0, protein: 0, carbs: 0, fat: 0, error: "API call failed. Check console for details." };
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGlobalError(null); // Clear previous global errors
    
    // Clear previous item-specific API errors before new submission
    setFoodItems(prevItems => prevItems.map(item => ({ ...item, apiError: null })));

    setIsSubmitting(true);

    const processedFoodItems: Omit<FoodItemEntry, 'id'>[] = [];
    let formHasErrors = false;

    for (let i = 0; i < foodItems.length; i++) {
      const currentItem = foodItems[i];
      let currentItemApiError: string | null = null;

      if (!currentItem.foodName?.trim()) {
        setGlobalError(`Food item name for entry #${i + 1} cannot be empty.`);
        formHasErrors = true;
        break;
      }

      const foodName = currentItem.foodName.trim();
      const quantity = currentItem.quantity?.trim() || undefined;
      const manualCaloriesNum = parseInt(currentItem.manualCaloriesStr, 10);

      let finalCalories: number;
      let protein: number | undefined, carbs: number | undefined, fat: number | undefined;

      if (currentItem.manualCaloriesStr.trim() !== '') {
        if (isNaN(manualCaloriesNum) || manualCaloriesNum <= 0) {
          setGlobalError(`Manual calories for "${foodName}" must be a positive number.`);
          formHasErrors = true;
          break;
        }
        finalCalories = manualCaloriesNum;
      } else { 
        if (!ai) {
          setGlobalError(`API not available for "${foodName}". Please enter calories manually or configure API key.`);
          formHasErrors = true;
          break;
        }
        if (!quantity) {
          setGlobalError(`Quantity for "${foodName}" is required for auto-calculation, or enter calories manually.`);
          formHasErrors = true;
          break;
        }
        
        const nutritionalData = await getNutritionalInfoForItem(foodName, quantity);
        if (!nutritionalData || nutritionalData.error || typeof nutritionalData.calories !== 'number') {
          currentItemApiError = nutritionalData?.error ? `Error for "${foodName}": ${nutritionalData.error}` : `Could not fetch data for "${foodName}".`;
          setFoodItems(prev => prev.map(it => it.localId === currentItem.localId ? {...it, apiError: currentItemApiError} : it));
          formHasErrors = true;
          // Potentially break or collect all errors. For now, break on first API error in the loop.
          setGlobalError(currentItemApiError); // Show this specific error globally
          break; 
        }
        finalCalories = nutritionalData.calories;
        protein = nutritionalData.protein;
        carbs = nutritionalData.carbs;
        fat = nutritionalData.fat;
      }
      
      processedFoodItems.push({ foodName, quantity, calories: finalCalories, protein, carbs, fat, apiError: null });
    }

    if (!formHasErrors && processedFoodItems.length > 0) {
      onAddMeal({ mealTime, items: processedFoodItems });
      onClose();
    } else if (!formHasErrors && processedFoodItems.length === 0 && foodItems.length > 0) {
        setGlobalError("No valid food items to add. Please ensure all entries are complete or remove empty items.");
    } else if (formHasErrors && !globalError) { // If an item error occurred but wasn't set to global explicitly
        setGlobalError("Please correct the errors in the form. Check individual item messages if any.");
    }


    setIsSubmitting(false);
  };
  
  const needsApiCall = foodItems.some(item => 
    item.foodName?.trim() && 
    item.manualCaloriesStr.trim() === '' && 
    item.quantity?.trim() && 
    ai
  );

  return (
    <div 
      className="fixed inset-0 bg-black/30 dark:bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="meal-form-title"
    >
      <div className="bg-light-surface dark:bg-dark-surface p-6 sm:p-8 rounded-xl shadow-modal w-full max-w-lg transform transition-all duration-300 ease-out scale-95 animate-modal-appear max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h3 id="meal-form-title" className="text-xl sm:text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary">Add New Meal Items</h3>
          <button 
            onClick={onClose} 
            disabled={isSubmitting}
            className="text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary p-1 rounded-full hover:bg-light-border/50 dark:hover:bg-dark-border/50 transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        {globalError && (
          <div className="mb-4 p-3 bg-light-danger/10 text-light-danger dark:text-dark-danger border border-light-danger/30 dark:border-dark-danger/30 rounded-lg text-sm flex-shrink-0">
            {globalError}
          </div>
        )}
        {apiKeyMissingError && (
           <div className="mb-4 p-3 bg-light-warning/10 text-yellow-700 dark:text-dark-warning border border-light-warning/30 dark:border-dark-warning/30 rounded-lg text-sm flex-shrink-0">
            {apiKeyMissingError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-hidden">
          <div className="space-y-5 overflow-y-auto flex-grow custom-scrollbar pr-2">
            {/* Meal Time Selection - Placed once at the top */}
            <div className="mb-5 sticky top-0 bg-light-surface dark:bg-dark-surface py-2 z-10">
              <label htmlFor="mealTime" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Meal Time</label>
              <select
                id="mealTime"
                value={mealTime}
                onChange={(e) => setMealTime(e.target.value as MealTime)}
                disabled={isSubmitting}
                className="block w-full p-3 border border-light-border dark:border-dark-border rounded-lg bg-light-background dark:bg-dark-background focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:border-transparent outline-none transition-shadow text-sm"
              >
                {Object.values(MealTime).map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>

            {foodItems.map((item, index) => (
              <div key={item.localId} className="p-4 border border-light-border dark:border-dark-border rounded-lg space-y-3 relative">
                <h4 className="font-medium text-light-text-primary dark:text-dark-text-primary -mt-1 mb-1">Food Item #{index + 1}</h4>
                {foodItems.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removeFoodItemField(item.localId)}
                    className="absolute top-2 right-2 text-light-text-secondary hover:text-light-danger dark:text-dark-text-secondary dark:hover:text-dark-danger p-1 rounded-full hover:bg-light-danger/10 dark:hover:bg-dark-danger/10 disabled:opacity-50"
                    aria-label={`Remove food item ${index + 1}`}
                    disabled={isSubmitting}
                  >
                    <TrashIcon className="w-5 h-5"/>
                  </button>
                )}
                <div>
                  <label htmlFor={`foodName-${item.localId}`} className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-0.5">Food Name</label>
                  <input
                    type="text"
                    id={`foodName-${item.localId}`}
                    value={item.foodName || ''}
                    onChange={(e) => handleItemChange(item.localId, 'foodName', e.target.value)}
                    className="block w-full p-2.5 border border-light-border dark:border-dark-border rounded-md bg-light-background dark:bg-dark-background focus:ring-1 focus:ring-light-primary dark:focus:ring-dark-primary focus:border-transparent outline-none transition-shadow text-sm"
                    placeholder="e.g., Chicken Breast"
                    required
                    disabled={isSubmitting}
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor={`quantity-${item.localId}`} className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-0.5">Quantity / Size</label>
                  <input
                    type="text"
                    id={`quantity-${item.localId}`}
                    value={item.quantity || ''}
                    onChange={(e) => handleItemChange(item.localId, 'quantity', e.target.value)}
                    className="block w-full p-2.5 border border-light-border dark:border-dark-border rounded-md bg-light-background dark:bg-dark-background focus:ring-1 focus:ring-light-primary dark:focus:ring-dark-primary focus:border-transparent outline-none transition-shadow text-sm"
                    placeholder="e.g., 100g, 1 cup"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor={`manualCalories-${item.localId}`} className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-0.5">Calories (kcal) - Optional</label>
                  <input
                    type="number"
                    id={`manualCalories-${item.localId}`}
                    value={item.manualCaloriesStr}
                    onChange={(e) => handleItemChange(item.localId, 'manualCaloriesStr', e.target.value)}
                    className="block w-full p-2.5 border border-light-border dark:border-dark-border rounded-md bg-light-background dark:bg-dark-background focus:ring-1 focus:ring-light-primary dark:focus:ring-dark-primary focus:border-transparent outline-none transition-shadow text-sm"
                    placeholder="Overrides auto-calculation"
                    min="1"
                    disabled={isSubmitting}
                  />
                </div>
                {item.apiError && (
                   <p className="text-xs text-light-danger dark:text-dark-danger mt-1">{item.apiError}</p>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addFoodItemField}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center px-4 py-2.5 border-2 border-dashed border-light-primary/50 dark:border-dark-primary/50 rounded-lg text-sm font-medium text-light-primary dark:text-dark-primary hover:bg-light-primary/5 dark:hover:bg-dark-primary/10 transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-light-primary dark:focus:ring-dark-primary disabled:opacity-60"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Add Another Food Item
            </button>
          </div>
          
          <div className="flex justify-end space-x-3 pt-5 mt-auto flex-shrink-0 border-t border-light-border dark:border-dark-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 border border-light-border dark:border-dark-border rounded-lg text-sm font-medium text-light-text-primary dark:text-dark-text-primary hover:bg-light-border/50 dark:hover:bg-dark-border/50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-light-primary/50 dark:focus:ring-dark-primary/50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || foodItems.length === 0 || (apiKeyMissingError && foodItems.some(fi => fi.manualCaloriesStr.trim() === ''))}
              className="px-5 py-2.5 bg-light-primary hover:bg-light-primary-hover dark:bg-dark-primary dark:hover:bg-dark-primary-hover text-white text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-light-primary/50 dark:focus:ring-dark-primary/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (needsApiCall ? (
                 <>
                  <SparklesIcon className="w-4 h-4 mr-2"/> Add Meal (Calculate)
                 </>
              ) : (
                'Add Meal'
              ))}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        .animate-modal-appear {
          animation: modal-appear 0.3s ease-out forwards;
        }
        @keyframes modal-appear {
          from { opacity: 0.8; transform: scale(0.95) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1; /* light-border equivalent for scrollbar */
          border-radius: 3px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4a5568; /* dark-border equivalent for scrollbar */
        }
      `}</style>
    </div>
  );
};

export default MealFormModal;
