import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { storage } from '../utils/storage';
import { supabase } from '../utils/supabaseClient';
import { Save, User as UserIcon, MapPin, Phone, Mail, Info, Image as ImageIcon } from 'lucide-react';

const ProfileEdit: React.FC<{ userId: string; initialUser?: User }> = ({ userId, initialUser }) => {
  const [user, setUser] = useState<User | null>(initialUser || null);
  const [formData, setFormData] = useState<Partial<User>>(initialUser || {});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Attempt to get from session storage or local storage first
    const u = storage.getUsers().find(x => x.id === userId);
    if (u) {
      setUser(u);
      setFormData(u);
    } else if (initialUser) {
        // Fallback to initialUser if not found in storage (e.g. hardcoded admin)
        setUser(initialUser);
        setFormData(initialUser);
    }
  }, [userId, initialUser]);

  const handleSave = async () => {
    if (!formData.name || !formData.firstName) return alert("Le nom et le prénom sont requis.");
    
    // Validation stricte du téléphone international (uniquement chiffres et + au début)
    const phoneRegex = /^\+[0-9]+$/;
    if (formData.phone && !phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      return alert("Format de téléphone invalide. Utilisez le format international avec uniquement des chiffres (ex: +2250700000000). Pas de lettres.");
    }

    setLoading(true);

    try {
        // 1. Update Supabase Auth Metadata
        const { error } = await supabase.auth.updateUser({
            data: {
                full_name: formData.name, // Assuming name holds full name or we construct it
                phone: formData.phone,
                city: formData.city,
                country: formData.country,
                bio: formData.bio,
                // avatar_url: formData.avatar // Optional: Update avatar if changed
            }
        });

        if (error) throw error;

        // 2. Update Local Storage (to reflect changes immediately in UI without re-fetch)
        const all = storage.getUsers();
        const updated = all.map(u => u.id === userId ? { ...u, ...formData } : u);
        storage.saveUsers(updated);
        
        // Mise à jour de la session
        const session = localStorage.getItem('akwaba_session');
        if (session) {
          const sessionUser = JSON.parse(session);
          if (sessionUser.id === userId) {
            localStorage.setItem('akwaba_session', JSON.stringify({ ...sessionUser, ...formData }));
          }
        }
        
        alert("Profil mis à jour avec succès !");
    } catch (err: any) {
        console.error("Error updating profile:", err);
        alert("Erreur lors de la mise à jour : " + err.message);
    } finally {
        setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 md:space-y-12 animate-in slide-in-from-bottom-10 duration-500 pb-20">
      <div className="bg-white rounded-[32px] md:rounded-[56px] p-6 md:p-12 shadow-2xl border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-ivoryGreen/5 rounded-full -mr-32 -mt-32"></div>
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12 relative z-10">
          <div className="relative group">
            <img src={formData.avatar || `https://ui-avatars.com/api/?name=${formData.name}&background=random`} className="w-32 h-32 md:w-48 md:h-48 rounded-[32px] md:rounded-[48px] object-cover border-4 md:border-8 border-white shadow-2xl" />
            <div className="absolute -bottom-2 -right-2 md:-bottom-4 md:-right-4 bg-ivoryOrange text-white p-3 md:p-4 rounded-2xl shadow-xl">
              <ImageIcon size={20} className="md:w-6 md:h-6" />
            </div>
          </div>
          <div className="flex-grow space-y-2 text-center md:text-left">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter leading-tight">
              {formData.firstName} {formData.name}
            </h2>
            <p className="text-sm md:text-xl font-bold text-ivoryGreen flex items-center justify-center md:justify-start gap-2 uppercase tracking-widest text-xs">
              <UserIcon size={16}/> {user.role} • Membre Actif
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 md:gap-8">
        <div className="bg-white p-6 md:p-10 rounded-[32px] md:rounded-[48px] shadow-xl border border-gray-100 space-y-6 md:space-y-8">
          <h3 className="text-xl md:text-2xl font-black flex items-center gap-3 text-ivoryOrange"><Info/> Identité & Visuel</h3>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nom</label>
                <input 
                  value={formData.name || ''} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-ivoryOrange focus:bg-white text-gray-900 font-bold outline-none transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Prénom</label>
                <input 
                  value={formData.firstName || ''} 
                  onChange={e => setFormData({...formData, firstName: e.target.value})} 
                  className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-ivoryOrange focus:bg-white text-gray-900 font-bold outline-none transition-all" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Lien Photo de Profil (URL)</label>
              <div className="flex gap-2">
                  <input 
                    value={formData.avatar || ''} 
                    onChange={e => setFormData({...formData, avatar: e.target.value})} 
                    className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-ivoryOrange focus:bg-white text-gray-900 font-bold outline-none transition-all" 
                    placeholder="https://..."
                  />
                  <label className="p-4 bg-gray-100 hover:bg-gray-200 rounded-2xl cursor-pointer transition-colors flex items-center justify-center">
                      <ImageIcon className="text-gray-500" />
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                    setFormData({...formData, avatar: reader.result as string});
                                };
                                reader.readAsDataURL(file);
                            }
                        }}
                      />
                  </label>
              </div>
              <p className="text-xs text-gray-400 pl-2">Collez une URL ou cliquez sur l'icône pour uploader une image locale.</p>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Bio / Slogan</label>
              <textarea 
                value={formData.bio || ''} 
                onChange={e => setFormData({...formData, bio: e.target.value})} 
                rows={3} 
                className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-ivoryOrange focus:bg-white text-gray-900 font-bold outline-none transition-all" 
                placeholder="Décrivez votre parcours..."
              ></textarea>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 md:p-10 rounded-[32px] md:rounded-[48px] shadow-xl border border-gray-100 space-y-6 md:space-y-8">
          <h3 className="text-xl md:text-2xl font-black flex items-center gap-3 text-ivoryOrange"><Phone/> Contact & Localisation</h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Téléphone (International)</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                <input 
                  value={formData.phone || ''} 
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9+]/g, '');
                    setFormData({...formData, phone: val});
                  }} 
                  placeholder="+2250700000000" 
                  className="w-full pl-12 p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-ivoryOrange focus:bg-white text-gray-900 font-bold outline-none transition-all" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ville</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                <input 
                  value={formData.city || ''} 
                  onChange={e => setFormData({...formData, city: e.target.value})} 
                  placeholder="Abidjan, Yamoussoukro..." 
                  className="w-full pl-12 p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-ivoryOrange focus:bg-white text-gray-900 font-bold outline-none transition-all" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pays</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                <input 
                  value={formData.country || ''} 
                  onChange={e => setFormData({...formData, country: e.target.value})} 
                  placeholder="Côte d'Ivoire" 
                  className="w-full pl-12 p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-ivoryOrange focus:bg-white text-gray-900 font-bold outline-none transition-all" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18}/>
                <input 
                  value={user.email} 
                  disabled
                  className="w-full pl-12 p-4 rounded-2xl bg-gray-100 border-2 border-transparent text-gray-400 font-bold outline-none" 
                />
              </div>
            </div>
            <button 
                onClick={handleSave} 
                disabled={loading}
                className={`w-full py-5 bg-ivoryGreen text-white rounded-3xl font-black text-xl shadow-xl shadow-green-100 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 mt-6 ${loading ? 'opacity-70 cursor-wait' : ''}`}
            >
                {loading ? 'Enregistrement...' : <><Save size={24}/> ENREGISTRER MON PROFIL</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit;
