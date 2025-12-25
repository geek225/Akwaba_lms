
import React, { useState, useEffect } from 'react';
import { UserRole, User, Course } from './types';
import { storage } from './utils/storage';
import Navbar from './components/Navbar';
import Home from './views/Home';
import StudentDashboard from './views/StudentDashboard';
import InstructorSpace from './views/InstructorSpace';
import AdminPanel from './views/AdminPanel';
import AuthView from './views/AuthView';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'dashboard' | 'auth'>('home');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    storage.init();
    const stored = localStorage.getItem('akwaba_session');
    if (stored) {
      const u = JSON.parse(stored);
      setCurrentUser(u);
      setCurrentView('dashboard');
    }
  }, []);

  const handleLogin = (user: User) => {
    // Hardcoded Super Admin Override
    if (user.email === 'admin@akwaba.ci') {
        user.role = UserRole.ADMIN;
    }
    
    setCurrentUser(user);
    localStorage.setItem('akwaba_session', JSON.stringify(user));
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('akwaba_session');
    setCurrentView('home');
    setSelectedCourse(null);
  };

  const renderContent = () => {
    if (currentView === 'auth') return <AuthView onLogin={handleLogin} />;
    
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
      case UserRole.INSTRUCTOR:
      case UserRole.EDITOR:
        return <InstructorSpace userRole={currentUser.role} currentUserId={currentUser.id} />;
      case UserRole.STUDENT:
        return <StudentDashboard initialCourse={selectedCourse} currentUser={currentUser} />;
      default:
        return <Home onSelectCourse={() => setCurrentView('dashboard')} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col baoule-pattern">
      <Navbar currentUser={currentUser} onLogout={handleLogout} onGoHome={() => setCurrentView('home')} onGoDashboard={() => setCurrentView('dashboard')} onGoAuth={() => setCurrentView('auth')} />
      <main className="flex-grow">{renderContent()}</main>
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
