
import React, { useState, useEffect } from 'react';
import { UserRole, User, Course } from './types';
import { storage } from './utils/storage';
import Navbar from './components/Navbar';
import Home from './views/Home';
import StudentDashboard from './views/StudentDashboard';
import InstructorSpace from './views/InstructorSpace';
import AdminPanel from './views/AdminPanel';
import AuthView from './views/AuthView';
import ContactView from './views/ContactView';
import BlogView from './views/BlogView';
import BlogEditor from './views/BlogEditor';

import { supabase } from './utils/supabaseClient';

const normalizeRole = (rawRole: unknown): UserRole => {
  const value = String(rawRole || '').trim().toLowerCase();

  if (value === String(UserRole.ADMIN).toLowerCase() || value === 'admin' || value === 'administrator' || value === 'administrateur') {
    return UserRole.ADMIN;
  }
  if (value === String(UserRole.CABINET).toLowerCase() || value === 'cabinet') {
    return UserRole.CABINET;
  }
  if (value === String(UserRole.INSTRUCTOR).toLowerCase() || value === 'instructor' || value === 'formateur') {
    return UserRole.INSTRUCTOR;
  }
  if (value === String(UserRole.EDITOR).toLowerCase() || value === 'editor' || value === 'editeur' || value === 'editeur') {
    return UserRole.EDITOR;
  }
  return UserRole.STUDENT;
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'dashboard' | 'auth' | 'contact' | 'blog' | 'blog_editor'>('home');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Online/Offline listener
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Supabase Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
            // Only clear if we are actually logged out by Supabase (e.g. manual logout or expired session)
            // We rely on localStorage for offline access, so we only clear if explicitly signed out
            // But if the token is invalid, Supabase might fire SIGNED_OUT
        }
    });

    storage.init();
    const stored = localStorage.getItem('akwaba_session');
    if (stored) {
      const u = JSON.parse(stored) as User;
      const normalizedUser: User = { ...u, role: normalizeRole(u.role) };
      setCurrentUser(normalizedUser);
      localStorage.setItem('akwaba_session', JSON.stringify(normalizedUser));
      setCurrentView('dashboard');
    }

    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        subscription.unsubscribe();
    };
  }, []);

  const handleLogin = (user: User) => {
    const normalizedIncoming: User = { ...user, role: normalizeRole(user.role) };

    // Hardcoded Super Admin Override
    if (normalizedIncoming.email === 'admin@akwaba.ci') {
      normalizedIncoming.role = UserRole.ADMIN;
    }

    const users = storage.getUsers();
    const existing = users.find(u => u.id === normalizedIncoming.id || u.email.toLowerCase() === normalizedIncoming.email.toLowerCase());
    const mergedUser: User = existing
      ? { ...existing, ...normalizedIncoming, isValidated: existing.isValidated ?? normalizedIncoming.isValidated }
      : normalizedIncoming;

    if (!existing) {
      storage.saveUsers([mergedUser, ...users]);
    }

    setCurrentUser(mergedUser);
    localStorage.setItem('akwaba_session', JSON.stringify(mergedUser));
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('akwaba_session');
    setCurrentView('home');
    setSelectedCourse(null);
    setShowLogoutConfirm(false);
  };

  const renderContent = () => {
    if (currentView === 'auth') return <AuthView onLogin={handleLogin} />;
    if (currentView === 'contact') return <ContactView />;
    if (currentView === 'blog') return <BlogView currentUser={currentUser} onEdit={() => setCurrentView('blog_editor')} />;
    if (currentView === 'blog_editor' && currentUser) return <BlogEditor currentUser={currentUser} onClose={() => setCurrentView('blog')} />;
    
    if (currentView === 'home') return (
        <Home 
            currentUser={currentUser}
            onSelectCourse={(course) => { 
                setSelectedCourse(course); 
                if (currentUser) {
                    setCurrentView('dashboard');
                } else {
                    setCurrentView('auth');
                }
            }}
            onNavigateToAuth={() => setCurrentView('auth')} 
        />
    );

    if (!currentUser) return <AuthView onLogin={handleLogin} />;

    switch (currentUser.role) {
      case UserRole.ADMIN:
        return <AdminPanel currentUser={currentUser} />;
      case UserRole.CABINET:
        return <AdminPanel currentUser={currentUser} />;
      case UserRole.INSTRUCTOR:
        if (currentUser.isValidated === false) {
          return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
              <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl text-center space-y-6">
                <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-3xl">⏳</span>
                </div>
                <h2 className="text-2xl font-black text-gray-900">Compte en attente de validation</h2>
                <p className="text-gray-500 font-medium">
                  Votre inscription a bien ete prise en compte. Votre cabinet de rattachement doit valider votre profil avant que vous puissiez acceder a votre espace formateur.
                </p>
                <button onClick={confirmLogout} className="text-sm font-bold text-gray-400 hover:text-gray-600 underline">
                  Se deconnecter
                </button>
              </div>
            </div>
          );
        }
        return <InstructorSpace currentUser={currentUser} />;
      case UserRole.EDITOR:
        return <BlogView currentUser={currentUser} onEdit={() => setCurrentView('blog_editor')} />;
      case UserRole.STUDENT:
        return <StudentDashboard initialCourse={selectedCourse} currentUser={currentUser} />;
      default:
        return <Home onSelectCourse={() => setCurrentView('dashboard')} currentUser={currentUser} onNavigateToAuth={() => setCurrentView('auth')} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col baoule-pattern">
      <Navbar 
        currentUser={currentUser} 
        onLogout={handleLogout} 
        onGoHome={() => setCurrentView('home')} 
        onGoDashboard={() => setCurrentView('dashboard')} 
        onGoAuth={() => setCurrentView('auth')}
        onGoContact={() => setCurrentView('contact')}
        onGoBlog={() => setCurrentView('blog')}
      />
      <main className="flex-grow">{renderContent()}</main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                <h3 className="text-xl font-black text-gray-900 mb-2">Déconnexion</h3>
                <p className="text-gray-500 font-medium mb-6">Êtes-vous sûr de vouloir vous déconnecter ?</p>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowLogoutConfirm(false)}
                        className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                    >
                        Annuler
                    </button>
                    <button 
                        onClick={confirmLogout}
                        className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
                    >
                        Se déconnecter
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Offline Indicator */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 z-[200] bg-gray-900 text-white px-6 py-3 rounded-full font-bold text-xs shadow-xl animate-bounce flex items-center gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            Connexion perdue. Mode hors-ligne activé.
        </div>
      )}

      <footer className="bg-white border-t py-12 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-ivoryOrange rounded-xl flex items-center justify-center shadow-lg"><span className="text-white font-black text-xl">A</span></div>
            <span className="text-2xl font-black tracking-tighter">Akwa<span className="text-ivoryGreen">ba</span></span>
          </div>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em]">&copy; {new Date().getFullYear()} Akwaba LMS • Local App v4.0</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
