import React from 'react';
import { View } from '../types';
import { signOutUser } from '../services/firebaseService';

interface HeaderProps {
  currentView: View;
  setView: (view: View) => void;
  user: any;
}

const Header: React.FC<HeaderProps> = ({ currentView, setView, user }) => {
  const NavButton = ({ view, label }: { view: View; label: string }) => {
    const isActive = currentView === view || (currentView === 'new_note' && view === 'notes') || (currentView === 'edit_note' && view === 'notes');
    return (
      <button
        onClick={() => setView(view)}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
          isActive
            ? 'bg-sky-500 text-white'
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
          Eureka <span className="text-white text-xl font-normal">- from error to hero</span>
        </h1>
        <nav className="flex items-center gap-4">
          <NavButton view="notes" label="Ghi Chú Của Tôi" />
          <NavButton view="dashboard" label="Tổng hợp và hướng dẫn" />
           {user && (
            <div className="flex items-center gap-3">
              <img src={user.photoURL} alt={user.displayName} className="h-8 w-8 rounded-full" />
              <button
                onClick={signOutUser}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-red-600/80 hover:bg-red-500/80 text-white transition-colors"
              >
                Đăng xuất
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;