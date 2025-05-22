import React, { useState, useEffect, useCallback } from 'react';
import { Page, Theme } from './types';
import DashboardPage from './components/DashboardPage';
import SettingsPage from './components/SettingsPage';
import { CogIcon, HomeIcon } from './components/Icons';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Dashboard);
  const [dailyGoal, setDailyGoal] = useState<number>(() => {
    const savedGoal = localStorage.getItem('dailyGoal');
    return savedGoal ? parseInt(savedGoal, 10) : 2000;
  });
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return savedTheme || (prefersDark ? 'dark' : 'light');
  });

  useEffect(() => {
    localStorage.setItem('dailyGoal', dailyGoal.toString());
  }, [dailyGoal]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleSetDailyGoal = useCallback((goal: number) => {
    setDailyGoal(goal);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  const NavButton: React.FC<{
    page: Page;
    label: string;
    icon: React.ReactNode;
  }> = ({ page, label, icon }) => (
    <button
      onClick={() => setCurrentPage(page)}
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200
                  ${currentPage === page 
                    ? 'bg-light-primary/10 dark:bg-dark-primary/20 text-light-primary dark:text-dark-primary font-medium' 
                    : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-border/50 dark:hover:bg-dark-border/50 hover:text-light-text-primary dark:hover:text-dark-text-primary'}`}
      aria-label={label}
      aria-current={currentPage === page ? 'page' : undefined}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen text-light-text-primary dark:text-dark-text-primary transition-colors duration-300 font-sans">
      <nav className="bg-light-surface dark:bg-dark-surface shadow-nav sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl sm:text-3xl font-bold text-light-primary dark:text-dark-primary">
              Calorie<span className="font-normal text-light-text-secondary dark:text-dark-text-secondary">Track</span>
            </h1>
            <div className="flex space-x-2 sm:space-x-3">
              <NavButton page={Page.Dashboard} label="Dashboard" icon={<HomeIcon className="w-5 h-5 sm:w-6 sm:h-6" />} />
              <NavButton page={Page.Settings} label="Settings" icon={<CogIcon className="w-5 h-5 sm:w-6 sm:h-6" />} />
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {currentPage === Page.Dashboard && <DashboardPage dailyGoal={dailyGoal} />}
        {currentPage === Page.Settings && (
          <SettingsPage
            dailyGoal={dailyGoal}
            onSetDailyGoal={handleSetDailyGoal}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        )}
      </main>
      <footer className="text-center py-8 text-sm text-light-text-secondary dark:text-dark-text-secondary">
        Manual Calorie Tracker MVP
      </footer>
    </div>
  );
};

export default App;