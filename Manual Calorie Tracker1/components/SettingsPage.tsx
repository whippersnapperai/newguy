import React, { useState, useEffect } from 'react';
import { Theme } from '../types';
import { SunIcon, MoonIcon, CheckCircleIcon } from './Icons'; // Added CheckCircleIcon

interface SettingsPageProps {
  dailyGoal: number;
  onSetDailyGoal: (goal: number) => void;
  theme: Theme;
  onToggleTheme: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ dailyGoal, onSetDailyGoal, theme, onToggleTheme }) => {
  const [currentGoalInput, setCurrentGoalInput] = useState<string>(dailyGoal.toString());
  const [goalError, setGoalError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setCurrentGoalInput(dailyGoal.toString()); // Sync with prop changes
  }, [dailyGoal]);

  const handleGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentGoalInput(e.target.value);
    setGoalError(null); // Clear error on change
    setShowSuccess(false);
  };

  const handleGoalSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newGoal = parseInt(currentGoalInput, 10);
    if (!isNaN(newGoal) && newGoal > 0) {
      onSetDailyGoal(newGoal);
      setGoalError(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000); // Hide success message after 2s
    } else {
      setGoalError('Goal must be a positive number.');
      setShowSuccess(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <div className="bg-light-surface dark:bg-dark-surface p-6 sm:p-8 rounded-xl shadow-card">
        <h2 className="text-xl sm:text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-6 border-b border-light-border dark:border-dark-border pb-4">
          Settings
        </h2>
      
        <form onSubmit={handleGoalSubmit} className="space-y-4">
          <div>
            <label htmlFor="dailyGoal" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
              Daily Calorie Goal (kcal)
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                id="dailyGoal"
                name="dailyGoal"
                value={currentGoalInput}
                onChange={handleGoalChange}
                min="1"
                className="flex-grow p-3 border border-light-border dark:border-dark-border rounded-lg bg-light-background dark:bg-dark-background focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:border-transparent outline-none transition-shadow"
                aria-describedby={goalError ? "goal-error" : undefined}
              />
              <button 
                type="submit"
                className="px-5 py-3 bg-light-primary hover:bg-light-primary-hover dark:bg-dark-primary dark:hover:bg-dark-primary-hover text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-light-primary/50 dark:focus:ring-dark-primary/50"
              >
                Set
              </button>
            </div>
            {goalError && <p id="goal-error" className="text-sm text-light-danger dark:text-dark-danger mt-1.5">{goalError}</p>}
            {showSuccess && <p className="text-sm text-green-600 dark:text-green-400 mt-1.5 flex items-center"><CheckCircleIcon className="w-4 h-4 mr-1.5" />Goal updated successfully!</p>}
          </div>
        </form>
      </div>

      <div className="bg-light-surface dark:bg-dark-surface p-6 sm:p-8 rounded-xl shadow-card">
        <h3 className="text-lg font-medium text-light-text-primary dark:text-dark-text-primary mb-4">Appearance</h3>
        <button
          onClick={onToggleTheme}
          className="w-full flex items-center justify-between px-4 py-3 border border-light-border dark:border-dark-border rounded-lg text-light-text-primary dark:text-dark-text-primary hover:bg-light-background dark:hover:bg-dark-background transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-light-primary/50 dark:focus:ring-dark-primary/50"
          aria-live="polite"
        >
          <span className="flex items-center">
            {theme === 'light' ? (
              <MoonIcon className="w-5 h-5 mr-3 text-light-primary dark:text-dark-primary" />
            ) : (
              <SunIcon className="w-5 h-5 mr-3 text-light-primary dark:text-dark-primary" />
            )}
            Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
          </span>
          <span className="text-xs px-2 py-1 rounded-full bg-light-border dark:bg-dark-border text-light-text-secondary dark:text-dark-text-secondary">
            Current: {theme === 'light' ? 'Light' : 'Dark'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;