
import React, { useState, useEffect } from 'react';
import { storage, supabase } from '../utils/storage';
import { User, UserRole, Course, Enrollment, ChatMessage, AccessCode } from '../types';
import { Search, UserPlus, X, Edit2, Trash2, Save, Filter, BookOpen, MessageSquare, Send, Paperclip, AlertTriangle, Key, Copy, Check, Database } from 'lucide-react';
import InstructorSpace from './InstructorSpace'; // Récupération pour l'édition globale
import ClassroomManager from './ClassroomManager';
import ProfileEdit from '../components/ProfileEdit';
import ChatWindow from '../components/ChatWindow';

const AdminPanel: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const currentUserId = currentUser.id;
  const [activeTab, setActiveTab] = useState<'staff' | 'students' | 'courses' | 'messages' | 'codes' | 'profile'>('staff');
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([]);

  // Modals
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showCourseDeleteConfirm, setShowCourseDeleteConfirm] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('Toutes');
  const [instFilter, setInstFilter] = useState('Tous');

  // Form States
  const [userFormData, setUserFormData] = useState<Partial<User>>({});
  const [enrollFormData, setEnrollFormData] = useState({ userId: '', courseId: '' });
  const [globalMessage, setGlobalMessage] = useState('');
  
  // Access Codes
  const [codeRole, setCodeRole] = useState<UserRole>(UserRole.INSTRUCTOR);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const canModerateInstructors = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.CABINET;

  const loadAll = () => {
    setUsers(storage.getUsers());
    setCourses(storage.getCourses());
    setEnrollments(storage.getEnrollments());
    setAccessCodes(storage.getAccessCodes());
  };

  useEffect(() => {
    loadAll();
    window.addEventListener('storage_update', loadAll);
    return () => window.removeEventListener('storage_update', loadAll);
  }, []);

  if (activeTab === 'classrooms') {
    return <ClassroomManager currentUser={currentUser} onClose={() => setActiveTab('staff')} />;
  }

  const handleGenerateCode = () => {
    storage.generateAccessCode(codeRole, currentUserId);
    // Auto refresh handled by event listener
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDeleteCode = (code: string) => {
    if (window.confirm("Voulez-vous vraiment supprimer ce code d'accès ?")) {
        storage.deleteAccessCode(code);
    }
  };

  const handleToggleInstructorValidation = (userId: string, isValidated: boolean) => {
    const updated = storage.getUsers().map(u => {
      if (u.id !== userId) return u;
      return { ...u, isValidated };
    });
    storage.saveUsers(updated);
  };

  const cleanDemoData = async () => {
    if (!window.confirm("ATTENTION : Cette action va supprimer définitivement tous les utilisateurs de démonstration (u1-u4) et les cours associés de la base de données Supabase. Êtes-vous sûr ?")) return;

    const demoUserIds = ['u1', 'u2', 'u3', 'u4'];
    const demoCourseIds = ['c1', 'c2', 'c3', 'c4', 'c5'];

    if (supabase) {
        try {
            // 1. Delete Messages
            await supabase.from('messages').delete().in('from_id', demoUserIds);
            await supabase.from('messages').delete().in('to_id', demoUserIds);
            
            // 2. Delete Enrollments
            await supabase.from('enrollments').delete().in('user_id', demoUserIds);
            
            // 3. Delete Modules (Cascade should handle, but to be safe)
            // Need course IDs for this, but let's assume cascade on courses works or skip specific module deletion if no ID
            
            // 4. Delete Courses
            await supabase.from('courses').delete().in('instructor_id', demoUserIds);
            await supabase.from('courses').delete().in('id', demoCourseIds);

            // 5. Delete Users
            const { error } = await supabase.from('users').delete().in('id', demoUserIds);
            
            if (error) {
                console.error("Erreur lors de la suppression:", error);
                alert("Erreur lors de la suppression: " + error.message);
            } else {
                alert("Données de démonstration supprimées avec succès de Supabase !");
                // Refresh local storage too just in case
                const cleanUsers = storage.getUsers().filter(u => !demoUserIds.includes(u.id));
                storage.saveUsers(cleanUsers);
                const cleanCourses = storage.getCourses().filter(c => !demoCourseIds.includes(c.id));
                storage.saveCourses(cleanCourses);
            }
        } catch (e: any) {
            alert("Erreur inattendue: " + e.message);
        }
    } else {
        alert("Supabase n'est pas connecté.");
    }
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    const all = storage.getUsers();
    let updated;
    if (editingUser) {
      updated = all.map(u => u.id === editingUser.id ? { ...u, ...userFormData, avatar: `https://i.pravatar.cc/150?u=${userFormData.email}` } : u);
    } else {
      const nextRole = userFormData.role || UserRole.STUDENT;
      const newUser: User = {
        id: `u-${Date.now()}`,
        name: userFormData.name || '',
        firstName: userFormData.firstName || '',
        email: userFormData.email || '',
        role: nextRole,
        isValidated: nextRole === UserRole.INSTRUCTOR ? false : true,
        avatar: `https://i.pravatar.cc/150?u=${userFormData.email}`,
        createdAt: new Date().toISOString(),
        ...userFormData
      };
      updated = [newUser, ...all];
    }
    storage.saveUsers(updated);
    setShowUserModal(false);
    alert("Compte enregistré avec succès !");
  };

  const confirmDelete = (id: string) => {
    const updated = storage.getUsers().filter(u => u.id !== id);
    storage.saveUsers(updated);
    setShowDeleteConfirm(null);
  };

  const confirmCourseDelete = (id: string) => {
    const updated = storage.getCourses().filter(c => c.id !== id);
    storage.saveCourses(updated);
    setShowCourseDeleteConfirm(null);
    alert("Le cours a été supprimé de la plateforme.");
  };

  const handleReassign = () => {
    if (!enrollFormData.userId || !enrollFormData.courseId) return;
    const all = storage.getEnrollments();
    const filtered = all.filter(e => e.userId !== enrollFormData.userId);
    const updated = [...filtered, { 
      userId: enrollFormData.userId, 
      courseId: enrollFormData.courseId, 
      enrolledAt: new Date().toISOString(), 
      progress: 0 
    }];
    storage.saveEnrollments(updated);
    setShowEnrollModal(false);
    alert("Apprenant réaffecté.");
  };

  const handleSendGlobal = () => {
    if (!globalMessage.trim()) return;
    const msgs = storage.getMessages();
    const newMessage: ChatMessage = {
      id: `m-${Date.now()}`,
      fromId: currentUserId,
      toId: 'global',
      text: globalMessage,
      createdAt: new Date().toISOString()
    };
    storage.saveMessages([...msgs, newMessage]);
    setGlobalMessage('');
    alert("Message diffusé à tous les membres !");
  };

  const filteredUsers = users.filter(u => {
    const isRoleMatch = activeTab === 'staff' ? u.role !== UserRole.STUDENT : u.role === UserRole.STUDENT;
    const searchMatch = (u.name + u.firstName + u.email).toLowerCase().includes(search.toLowerCase());
    return isRoleMatch && searchMatch;
  });

  if (editingCourseId) {
    return (
      <div className="p-8 animate-in slide-in-from-left duration-500">
        <button onClick={() => setEditingCourseId(null)} className="mb-10 flex items-center gap-3 text-ivoryGreen font-black uppercase text-xs hover:gap-5 transition-all bg-ivoryGreen/5 px-6 py-3 rounded-2xl w-fit">
          <Filter size={18}/> Retour au Panel Admin
        </button>
        <InstructorSpace userRole={UserRole.ADMIN} currentUserId={currentUserId} forceEditId={editingCourseId} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl animate-in fade-in duration-500">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-10 gap-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">Administration</h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.4em] mt-2">PLATEFORME AKWABA • ABIDJAN</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-[24px] shadow-sm border border-gray-100 overflow-x-auto max-w-full w-full xl:w-auto scrollbar-hide">
          <div className="flex gap-2 min-w-max">
            {(['staff', 'students', 'courses', 'messages', 'codes', 'profile'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 md:px-6 py-3.5 rounded-[18px] font-black text-[10px] transition-all uppercase tracking-widest whitespace-nowrap ${activeTab === tab ? 'bg-ivoryGreen text-white shadow-xl' : 'text-gray-400 hover:text-gray-600'}`}>
                {tab === 'staff' ? 'ÉQUIPE' : tab === 'students' ? 'ÉLÈVES' : tab === 'courses' ? 'COURS' : tab === 'messages' ? 'MESSAGES' : tab === 'codes' ? 'CODES ACCÈS' : 'MON PROFIL'}
                </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === 'profile' ? (
        <ProfileEdit userId={currentUserId} initialUser={currentUser} />
      ) : activeTab === 'codes' ? (
        <div className="grid lg:grid-cols-3 gap-8 md:gap-12">
            <div className="lg:col-span-1 bg-white p-8 md:p-12 rounded-[40px] md:rounded-[56px] shadow-2xl border border-gray-50 h-fit">
                <div className="w-20 h-20 bg-ivoryOrange/10 text-ivoryOrange rounded-[32px] flex items-center justify-center mb-10">
                    <Key size={40} />
                </div>
                <h2 className="text-3xl font-black mb-6 text-gray-900 tracking-tighter leading-none">Générateur de Codes</h2>
                <p className="text-gray-400 font-bold text-sm mb-10 leading-relaxed">Créez des codes d'accès uniques pour permettre l'inscription directe de Formateurs, Cabinets, Éditeurs ou Administrateurs.</p>
                
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Rôle à attribuer</label>
                    <select value={codeRole} onChange={e => setCodeRole(e.target.value as UserRole)} className="w-full p-6 bg-gray-50 rounded-3xl border-2 border-transparent focus:border-ivoryOrange focus:bg-white outline-none font-bold text-gray-900 mb-6 shadow-inner transition-all appearance-none">
                        <option value={UserRole.INSTRUCTOR}>FORMATEUR</option>
                        <option value={UserRole.CABINET}>CABINET</option>
                        <option value={UserRole.EDITOR}>ÉDITEUR</option>
                        <option value={UserRole.ADMIN}>ADMINISTRATEUR</option>
                    </select>
                </div>

                <button onClick={handleGenerateCode} className="w-full py-5 bg-ivoryGreen text-white rounded-3xl font-black text-lg shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4">
                    <Key size={24}/> GÉNÉRER LE CODE
                </button>
            </div>

            <div className="lg:col-span-2 space-y-6">
                <h3 className="text-2xl font-black text-gray-900 mb-6">Codes Actifs</h3>
                {accessCodes.filter(c => !c.isUsed).length === 0 ? (
                    <div className="p-12 text-center bg-gray-50 rounded-[32px] border border-dashed border-gray-200">
                        <p className="text-gray-400 font-bold">Aucun code actif pour le moment.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                        {accessCodes.filter(c => !c.isUsed).map(code => (
                            <div key={code.code} className="bg-white p-8 rounded-[32px] shadow-lg border border-gray-50 flex flex-col justify-between group hover:border-ivoryOrange transition-colors">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${code.role === UserRole.ADMIN ? 'bg-red-50 text-red-500' : code.role === UserRole.CABINET ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-500'}`}>
                                            {code.role}
                                        </span>
                                        <span className="text-[10px] font-bold text-gray-300">{new Date(code.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="text-3xl font-black text-gray-900 tracking-wider font-mono mb-2">{code.code}</div>
                                    <p className="text-xs text-gray-400 font-medium">Généré par Admin</p>
                                </div>
                                <button 
                                    onClick={() => handleCopyCode(code.code)}
                                    className="mt-6 w-full py-3 bg-gray-50 text-gray-600 rounded-xl font-bold text-sm hover:bg-ivoryOrange hover:text-white transition-all flex items-center justify-center gap-2"
                                >
                                    {copiedCode === code.code ? <Check size={18}/> : <Copy size={18}/>}
                                    {copiedCode === code.code ? 'COPIÉ !' : 'COPIER LE CODE'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <h3 className="text-2xl font-black text-gray-900 mb-6 mt-12">Historique (Codes Utilisés)</h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                     {accessCodes.filter(c => c.isUsed).length === 0 && <p className="text-gray-400 font-bold text-sm">Aucun code utilisé.</p>}
                     {accessCodes.filter(c => c.isUsed).map(code => (
                        <div key={code.code} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-ivoryOrange transition-colors">
                            <div className="flex items-center gap-4">
                                <span className="font-mono font-bold text-gray-500 line-through decoration-2 decoration-red-300">{code.code}</span>
                                <span className="px-3 py-1 bg-white rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-400">{code.role}</span>
                            </div>
                            <button onClick={() => handleDeleteCode(code.code)} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Supprimer définitivement">
                                <Trash2 size={16} />
                            </button>
                        </div>
                     ))}
                </div>
            </div>
        </div>
      ) : activeTab === 'messages' ? (
        <div className="grid lg:grid-cols-3 gap-8 md:gap-12">
          <div className="lg:col-span-1 bg-white p-8 md:p-12 rounded-[40px] md:rounded-[56px] shadow-2xl border border-gray-50 h-fit">
            <div className="w-20 h-20 bg-ivoryOrange/10 text-ivoryOrange rounded-[32px] flex items-center justify-center mb-10">
              <MessageSquare size={40} />
            </div>
            <h2 className="text-3xl font-black mb-6 text-gray-900 tracking-tighter leading-none">Diffusion Publique</h2>
            <p className="text-gray-400 font-bold text-sm mb-10 leading-relaxed">Envoyez un message qui sera visible par absolument tous les utilisateurs dans le canal général.</p>
            <textarea value={globalMessage} onChange={e => setGlobalMessage(e.target.value)} rows={5} className="w-full p-6 bg-gray-50 rounded-3xl border-2 border-transparent focus:border-ivoryOrange focus:bg-white outline-none font-bold text-gray-900 mb-6 shadow-inner transition-all" placeholder="Que voulez-vous annoncer ?"></textarea>
            <button onClick={handleSendGlobal} className="w-full py-5 bg-ivoryGreen text-white rounded-3xl font-black text-lg shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4"><Send size={24}/> DIFFUSER</button>
          </div>
          <div className="lg:col-span-2">
             <ChatWindow currentUser={currentUser} />
          </div>
        </div>
      ) : activeTab === 'courses' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
           {courses.map(c => (
             <div key={c.id} className="bg-white rounded-[40px] md:rounded-[56px] overflow-hidden border border-gray-100 shadow-sm group hover:shadow-2xl transition-all">
               <div className="h-48 relative overflow-hidden">
                 <img src={c.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                 <div className="absolute inset-0 bg-black/20"></div>
                 <div className="absolute top-6 left-6 bg-white/90 backdrop-blur px-4 py-2 rounded-2xl text-[10px] font-black text-ivoryGreen uppercase tracking-widest">{c.category}</div>
               </div>
               <div className="p-8 md:p-10">
                 <h3 className="font-black text-2xl mb-8 text-gray-900 leading-tight h-[4rem] line-clamp-2">{c.title}</h3>
                 <div className="flex gap-4">
                    <button onClick={() => setEditingCourseId(c.id)} className="flex-1 py-4 bg-gray-50 text-gray-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-ivoryOrange hover:text-white transition-all">Modifier</button>
                    <button onClick={() => setShowCourseDeleteConfirm(c.id)} className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"><Trash2 size={24}/></button>
                 </div>
               </div>
             </div>
           ))}
        </div>
      ) : (
        <div className="bg-white rounded-[40px] md:rounded-[56px] shadow-2xl border border-gray-100 overflow-hidden">
          <div className="p-6 md:p-10 bg-gray-50/50 flex flex-col md:flex-row gap-6 items-stretch md:items-center justify-between border-b">
            <div className="relative flex-grow max-w-xl">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom ou email..." className="w-full pl-16 pr-8 py-4 md:py-6 rounded-[32px] border-4 border-white bg-white focus:border-ivoryOrange outline-none font-black text-gray-900 shadow-xl transition-all" />
            </div>
            <button onClick={() => { setEditingUser(null); setUserFormData({role: activeTab === 'staff' ? UserRole.INSTRUCTOR : UserRole.STUDENT}); setShowUserModal(true); }} className="px-8 py-4 md:px-12 md:py-6 bg-ivoryGreen text-white rounded-[32px] font-black text-lg flex items-center justify-center gap-4 hover:scale-105 transition-all shadow-2xl"><UserPlus size={24} /> AJOUTER</button>
            <button onClick={cleanDemoData} className="px-8 py-4 md:px-12 md:py-6 bg-red-500 text-white rounded-[32px] font-black text-lg flex items-center justify-center gap-4 hover:scale-105 transition-all shadow-2xl"><Database size={24} /> NETTOYER DÉMO</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-gray-100/50 text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] border-b">
                <tr>
                  <th className="px-6 py-6 md:px-12 md:py-8">Utilisateur</th>
                  <th className="px-6 py-6 md:px-12 md:py-8">Rôle / Statut</th>
                  <th className="px-6 py-6 md:px-12 md:py-8 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-ivoryGreen/[0.02] transition-colors group">
                    <td className="px-6 py-6 md:px-12 md:py-10">
                      <div className="flex items-center gap-6">
                        <img src={u.avatar} className="w-16 h-16 md:w-20 md:h-20 rounded-[32px] object-cover border-4 border-white shadow-xl" />
                        <div>
                          <p className="font-black text-gray-900 text-xl md:text-2xl tracking-tighter mb-1">{u.firstName} {u.name}</p>
                          <p className="text-xs font-bold text-gray-400 tracking-wide uppercase">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 md:px-12 md:py-10">
                      <span className="px-6 py-2 bg-white border border-gray-100 rounded-full text-[10px] font-black uppercase text-ivoryGreen tracking-widest shadow-sm">{u.role}</span>
                    </td>
                    <td className="px-6 py-6 md:px-12 md:py-10 text-right">
                      <div className="flex justify-end gap-4 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all md:transform md:translate-x-4 md:group-hover:translate-x-0">
                        {canModerateInstructors && u.role === UserRole.INSTRUCTOR && (
                          <button
                            onClick={() => handleToggleInstructorValidation(u.id, !(u.isValidated === true))}
                            className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${u.isValidated === true ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'}`}
                          >
                            {u.isValidated === true ? 'VALIDÉ' : 'EN ATTENTE'}
                          </button>
                        )}
                        <button onClick={() => { setEditingUser(u); setUserFormData(u); setShowUserModal(true); }} className="p-4 text-ivoryGreen hover:bg-ivoryGreen/10 rounded-2xl transition-all shadow-sm bg-white border border-gray-50"><Edit2 size={20} /></button>
                        <button onClick={() => setShowDeleteConfirm(u.id)} className="p-4 text-red-500 hover:bg-red-50 rounded-2xl transition-all shadow-sm bg-white border border-gray-50"><Trash2 size={20} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* POPUP DE CONFIRMATION (ADMIN) */}
      {(showDeleteConfirm || showCourseDeleteConfirm) && (
        <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-md z-[1000] flex items-center justify-center p-4 md:p-6">
          <div className="bg-white p-8 md:p-16 rounded-[32px] md:rounded-[64px] max-w-lg w-full text-center space-y-10 animate-in zoom-in duration-300 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
            <div className="w-32 h-32 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto border-8 border-white shadow-2xl transform hover:rotate-12 transition-transform">
               <AlertTriangle size={64} />
            </div>
            <div>
              <h3 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter">Action Irréversible</h3>
              <p className="text-gray-400 font-bold text-lg md:text-xl mt-4">Voulez-vous vraiment supprimer cet élément ? Toutes les données liées seront effacées.</p>
            </div>
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 pt-6">
              <button onClick={() => { setShowDeleteConfirm(null); setShowCourseDeleteConfirm(null); }} className="flex-1 py-6 bg-gray-100 rounded-[32px] font-black text-gray-400 hover:bg-gray-200 transition-all uppercase tracking-widest text-xs">ANNULER</button>
              <button onClick={() => showDeleteConfirm ? confirmDelete(showDeleteConfirm) : confirmCourseDelete(showCourseDeleteConfirm!)} className="flex-1 py-6 bg-red-500 text-white rounded-[32px] font-black shadow-2xl shadow-red-100 hover:bg-red-600 transition-all uppercase tracking-widest text-xs">OUI, SUPPRIMER</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AJOUT/EDIT UTILISATEUR */}
      {showUserModal && (
        <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-md z-[500] flex items-center justify-center p-4">
          <form onSubmit={handleSaveUser} className="bg-white w-full max-w-2xl rounded-[32px] md:rounded-[64px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-20 duration-500 border border-white max-h-[90vh] overflow-y-auto">
            <div className="bg-ivoryOrange p-8 md:p-12 text-white flex justify-between items-center relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
               <h3 className="text-3xl md:text-4xl font-black tracking-tighter relative z-10">{editingUser ? 'Modifier Profil' : 'Nouvel Akwabien'}</h3>
               <button type="button" onClick={() => setShowUserModal(false)} className="bg-white/20 p-4 rounded-full relative z-10 hover:bg-white/30 transition-all"><X size={28}/></button>
            </div>
            <div className="p-8 md:p-16 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nom</label>
                    <input required value={userFormData.name || ''} onChange={e => setUserFormData({...userFormData, name: e.target.value})} className="w-full p-5 rounded-3xl bg-gray-50 border-2 border-transparent focus:border-ivoryOrange focus:bg-white text-gray-900 font-bold outline-none shadow-inner" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Prénom</label>
                    <input required value={userFormData.firstName || ''} onChange={e => setUserFormData({...userFormData, firstName: e.target.value})} className="w-full p-5 rounded-3xl bg-gray-50 border-2 border-transparent focus:border-ivoryOrange focus:bg-white text-gray-900 font-bold outline-none shadow-inner" />
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Adresse Email Professionnelle</label>
                 <input required type="email" value={userFormData.email || ''} onChange={e => setUserFormData({...userFormData, email: e.target.value})} placeholder="nom@akwaba.ci" className="w-full p-5 rounded-3xl bg-gray-50 border-2 border-transparent focus:border-ivoryOrange focus:bg-white text-gray-900 font-bold outline-none shadow-inner" />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Rôle Système</label>
                 <select value={userFormData.role} onChange={e => setUserFormData({...userFormData, role: e.target.value as UserRole})} className="w-full p-5 rounded-3xl bg-gray-50 border-2 border-transparent focus:border-ivoryOrange focus:bg-white text-gray-900 font-black outline-none appearance-none cursor-pointer shadow-inner">
                   {Object.values(UserRole).map(role => <option key={role} value={role}>{role.toUpperCase()}</option>)}
                 </select>
              </div>
              <button type="submit" className="w-full py-6 bg-ivoryGreen text-white rounded-[32px] font-black text-2xl shadow-2xl hover:bg-green-700 hover:-translate-y-1 active:translate-y-0 transition-all uppercase tracking-tighter mt-10">Valider Profil</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
