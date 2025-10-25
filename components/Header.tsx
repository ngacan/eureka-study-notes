import React from 'react';
import { View } from '../types';

interface HeaderProps {
  currentView: View;
  setView: (view: View) => void;
  user: any;
  onSignOut: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, setView, user, onSignOut }) => {
  const NavButton = ({ view, label }: { view: View; label: string }) => {
    const isActive = currentView === view || (view === 'notes' && (currentView === 'new_note' || currentView === 'edit_note'));
    
    return (
      <button
        onClick={() => setView(view)}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
          isActive
            ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
            : 'bg-slate-700/50 hover:bg-slate-600/70 text-slate-300'
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <header className="bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10 p-4 border-b border-slate-700">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold text-sky-400">
          Eureka <span className="text-white text-xl font-normal">- Ghi chú học tập</span>
        </h1>
        <nav className="flex items-center gap-4">
          <NavButton view="notes" label="Ghi Chú Của Tôi" />
          <NavButton view="dashboard" label="Tổng hợp & Hướng dẫn" />
           {user && (
            <div className="flex items-center gap-3 pl-4 border-l border-slate-700">
              <img src={user.photoURL} alt={user.displayName} className="h-8 w-8 rounded-full" />
              <span className="text-sm font-medium text-slate-300 hidden sm:block">{user.displayName}</span>
               <button onClick={onSignOut} className="ml-2 text-slate-400 hover:text-white transition-colors" title="Đăng xuất">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                  </svg>
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;