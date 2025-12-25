
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Layout, Home, LogOut, LogIn, UserCircle, Menu, X } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  onGoHome: () => void;
  onGoDashboard: () => void;
  onGoAuth: () => void;
  onGoContact: () => void;
  onGoBlog: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentUser, onLogout, onGoHome, onGoDashboard, onGoAuth, onGoContact, onGoBlog }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50 px-4 py-3">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={onGoHome}>
          <div className="w-10 h-10 bg-ivoryOrange rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-black text-xl">A</span>
          </div>
          <span className="text-2xl font-black tracking-tighter">
            <span className="text-ivoryOrange">Akwa</span>
            <span className="text-ivoryGreen">ba</span>
          </span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8 font-bold text-sm text-gray-500">
          <button onClick={onGoHome} className="hover:text-ivoryOrange transition-colors">Accueil</button>
          <button onClick={onGoBlog} className="hover:text-ivoryOrange transition-colors">Blog</button>
          <button onClick={onGoContact} className="hover:text-ivoryOrange transition-colors">Contact</button>
          {currentUser && <button onClick={onGoDashboard} className="hover:text-ivoryOrange transition-colors">Mon Espace</button>}
        </div>

        {/* Desktop User/Auth */}
        <div className="hidden md:flex items-center gap-4">
          {currentUser ? (
            <div className="flex items-center gap-4">
              <div className="hidden lg:block text-right">
                <p className="text-sm font-black text-gray-900 leading-none">{currentUser.firstName} {currentUser.name}</p>
                <span className="text-[10px] font-bold uppercase text-ivoryGreen tracking-widest">{currentUser.role}</span>
              </div>
              <img src={currentUser.avatar} className="w-10 h-10 rounded-full border-2 border-ivoryOrange" />
              <button onClick={onLogout} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <button 
              onClick={onGoAuth}
              className="px-6 py-2.5 bg-ivoryOrange text-white rounded-xl font-bold shadow-lg shadow-orange-100 flex items-center gap-2"
            >
              <LogIn size={18} /> Se connecter
            </button>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center gap-4">
            {currentUser && (
                <img src={currentUser.avatar} className="w-8 h-8 rounded-full border border-ivoryOrange" />
            )}
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-600">
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b shadow-xl p-4 flex flex-col gap-4 animate-in slide-in-from-top-5">
            <button onClick={() => { onGoHome(); setIsMobileMenuOpen(false); }} className="text-left font-bold text-gray-600 py-2 border-b border-gray-50">Accueil</button>
            <button onClick={() => { onGoBlog(); setIsMobileMenuOpen(false); }} className="text-left font-bold text-gray-600 py-2 border-b border-gray-50">Blog</button>
            <button onClick={() => { onGoContact(); setIsMobileMenuOpen(false); }} className="text-left font-bold text-gray-600 py-2 border-b border-gray-50">Contact</button>
            {currentUser && (
                <button onClick={() => { onGoDashboard(); setIsMobileMenuOpen(false); }} className="text-left font-bold text-gray-600 py-2 border-b border-gray-50">Mon Espace</button>
            )}
            
            <div className="mt-4 flex flex-col gap-4">
                {currentUser ? (
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl">
                        <div>
                            <p className="font-black text-gray-900">{currentUser.firstName} {currentUser.name}</p>
                            <p className="text-xs text-gray-500 uppercase">{currentUser.role}</p>
                        </div>
                        <button onClick={onLogout} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                            <LogOut size={20} />
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={() => { onGoAuth(); setIsMobileMenuOpen(false); }}
                        className="w-full py-4 bg-ivoryOrange text-white rounded-xl font-bold shadow-lg shadow-orange-100 flex items-center justify-center gap-2"
                    >
                        <LogIn size={18} /> Se connecter
                    </button>
                )}
            </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
