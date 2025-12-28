
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { storage } from '../utils/storage';
import { supabase } from '../utils/supabaseClient';
import { Mail, Lock, Eye, EyeOff, User as UserIcon, Phone, MapPin, Globe } from 'lucide-react';

interface AuthViewProps {
  onLogin: (user: User) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Nom complet
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [accessCode, setAccessCode] = useState('');

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin,
        });

        if (error) throw error;
        alert("Si cet email existe, un lien de réinitialisation vous a été envoyé.");
        setIsResetting(false);
    } catch (err: any) {
        setError(err.message || "Une erreur est survenue.");
    } finally {
        setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        // Login Logic
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
            // Fetch user profile or use metadata
            const metadata = data.user.user_metadata || {};
            
            const loggedUser: User = {
                id: data.user.id,
                email: data.user.email || email,
                name: metadata.full_name || 'Utilisateur',
                firstName: '', // Can be parsed from name if needed
                role: (metadata.role as UserRole) || UserRole.STUDENT,
                avatar: `https://i.pravatar.cc/150?u=${data.user.email}`,
                phone: metadata.phone,
                country: metadata.country,
                city: metadata.city,
                createdAt: data.user.created_at || new Date().toISOString()
            };
            
            onLogin(loggedUser);
        }
      } else {
        // Registration Logic
        let assignedRole = UserRole.STUDENT;

        if (!isLogin) {
            const phoneRegex = /^\+[0-9]+$/;
            if (phone && !phoneRegex.test(phone.replace(/\s/g, ''))) {
                throw new Error("Format de téléphone invalide. Utilisez le format international avec uniquement des chiffres (ex: +2250700000000). Pas de lettres.");
            }

            if (accessCode.trim()) {
                const role = await storage.validateCode(accessCode.trim());
                if (role) {
                    assignedRole = role;
                } else {
                    throw new Error("Code d'accès invalide ou déjà utilisé.");
                }
            }
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              phone,
              country,
              city,
              role: assignedRole,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
            if (accessCode.trim()) {
                await storage.markCodeAsUsed(accessCode.trim());
            }
            alert('Inscription réussie ! Veuillez vérifier votre boîte mail pour confirmer votre compte avant de vous connecter.');
            setIsLogin(true);
        }
      }
    } catch (err: any) {
        console.error("Auth error:", err);
        // Fallback for demo accounts if Supabase fails or not configured
        if (isLogin && (email.includes('@akwaba.ci'))) {
            // FORCE ADMIN LOGIN (Secours)
            if (email.trim().toLowerCase() === 'admin@akwaba.ci' && password === '123456') {
                 const adminUser: User = { 
                    id: 'u3', 
                    name: 'Admin', 
                    firstName: 'Akwaba', 
                    email: 'admin@akwaba.ci', 
                    role: UserRole.ADMIN, 
                    avatar: 'https://i.pravatar.cc/150?u=u3', 
                    createdAt: new Date().toISOString()
                 };
                 onLogin(adminUser);
                 return;
            }

            const allUsers = storage.getUsers();
            const existing = allUsers.find(u => u.email.toLowerCase().trim() === email.toLowerCase().trim());
            if (existing) {
                onLogin(existing);
                return;
            }
        }
        setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const fillTestAccount = (testEmail: string) => {
    setEmail(testEmail);
    setPassword('123456'); // Default password for testing
    setIsLogin(true);
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl rounded-[32px] md:rounded-[48px] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-50">
        <div className="bg-ivoryGreen md:w-2/5 p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-ivoryOrange rounded-3xl flex items-center justify-center shadow-2xl mb-6 md:mb-10">
              <span className="text-white font-black text-3xl md:text-4xl">A</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-4 md:mb-6 leading-tight tracking-tighter">Bienvenue.</h2>
            <p className="text-green-100 text-base md:text-lg font-medium opacity-80 leading-relaxed">Accédez à votre espace d'apprentissage local 100% ivoirien.</p>
          </div>
        </div>

        <div className="p-8 md:p-16 md:w-3/5 overflow-y-auto max-h-[90vh]">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">{isLogin ? 'Connexion' : 'Inscription'}</h1>
          <p className="text-gray-400 mb-6 md:mb-8">{isLogin ? 'Ravis de vous revoir !' : 'Créez votre compte pour commencer.'}</p>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nom complet</label>
                  <div className="relative">
                    <input 
                      required 
                      type="text" 
                      placeholder="Kouamé Koffi Jean" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-14 pr-6 py-4 rounded-3xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-ivoryOrange outline-none font-bold text-gray-900 text-lg shadow-sm transition-all" 
                    />
                    <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Téléphone</label>
                    <div className="relative">
                        <input 
                        required 
                        type="tel" 
                        placeholder="+225 07..." 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-3xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-ivoryOrange outline-none font-bold text-gray-900 text-md shadow-sm transition-all" 
                        />
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    </div>
                    </div>
                    <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pays</label>
                    <div className="relative">
                        <input 
                        required 
                        type="text" 
                        placeholder="Côte d'Ivoire" 
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-3xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-ivoryOrange outline-none font-bold text-gray-900 text-md shadow-sm transition-all" 
                        />
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    </div>
                    </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ville</label>
                  <div className="relative">
                    <input 
                      required 
                      type="text" 
                      placeholder="Abidjan" 
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full pl-14 pr-6 py-4 rounded-3xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-ivoryOrange outline-none font-bold text-gray-900 text-lg shadow-sm transition-all" 
                    />
                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-gray-50">
                   <label className="text-[10px] font-black text-ivoryOrange uppercase tracking-widest ml-1">Code D'accès (Optionnel)</label>
                   <p className="text-xs text-gray-400 mb-2 ml-1">Si vous êtes formateur ou administrateur, entrez votre code ici.</p>
                   <div className="relative">
                     <input 
                       type="text" 
                       placeholder="Code secret..." 
                       id="accessCode"
                       value={accessCode}
                       onChange={(e) => setAccessCode(e.target.value)}
                       className="w-full pl-6 pr-4 py-4 rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50 focus:bg-white focus:border-ivoryOrange outline-none font-bold text-gray-900 text-md shadow-sm transition-all" 
                     />
                     <Lock className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                   </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
              <div className="relative">
                <input 
                  required 
                  type="email" 
                  placeholder="votre@email.ci" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 rounded-3xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-ivoryOrange outline-none font-bold text-gray-900 text-lg shadow-sm transition-all" 
                />
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mot de passe</label>
                {isLogin && (
                    <button type="button" onClick={() => { setIsResetting(true); setError(null); }} className="text-[10px] font-black text-ivoryOrange uppercase tracking-widest hover:text-orange-600 transition-colors">
                        Oublié ?
                    </button>
                )}
              </div>
              <div className="relative">
                <input 
                  required 
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-12 py-4 rounded-3xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-ivoryOrange outline-none font-bold text-gray-900 text-lg shadow-sm transition-all" 
                />
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ivoryOrange transition-colors"
                >
                  {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                </button>
              </div>
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full py-6 bg-ivoryOrange text-white rounded-3xl font-black text-xl shadow-2xl shadow-orange-100 hover:bg-orange-600 hover:-translate-y-1 active:translate-y-0 transition-all mt-8 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Chargement...' : (isLogin ? 'Accéder à mon espace' : "Créer mon profil")}
            </button>
          </form>
          {!isResetting && (
          <button onClick={() => { setIsLogin(!isLogin); setError(null); }} className="w-full mt-10 text-sm font-black text-ivoryGreen hover:text-green-700 transition-colors">
            {isLogin ? "PAS ENCORE DE COMPTE ? S'INSCRIRE" : "DÉJÀ UN COMPTE ? SE CONNECTER"}
          </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthView;
