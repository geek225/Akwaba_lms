
import React, { useState, useEffect, useRef } from 'react';
import { UserRole, Course, Module, QuizQuestion, ChatMessage, User } from '../types';
import { storage } from '../utils/storage';
import { Plus, Video, Trash2, Edit, Book, BrainCircuit, X, CheckCircle2, ListPlus, MessageSquare, Send, Paperclip, User as UserIcon, Save, AlertTriangle, ChevronRight } from 'lucide-react';
import ProfileEdit from '../components/ProfileEdit';
import ChatWindow from '../components/ChatWindow';

const InstructorSpace: React.FC<{ currentUser: User, forceEditId?: string | null }> = ({ currentUser, forceEditId }) => {
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'messages' | 'profile'>(forceEditId ? 'create' : 'list');
  const [courses, setCourses] = useState<Course[]>([]);
  const [editingId, setEditingId] = useState<string | null>(forceEditId || null);
  const [user, setUser] = useState<User | null>(currentUser);
  
  // UI States
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Course State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Business');
  const [newCategory, setNewCategory] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [desc, setDesc] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [modules, setModules] = useState<Module[]>([]);

  // Module Modal State
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [currentModIdx, setCurrentModIdx] = useState<number | null>(null);
  const [modForm, setModForm] = useState<Module>({ id: '', title: '', videoUrl: '', videoType: 'url', description: '', quiz: [] });

  const loadCourses = () => {
    const all = storage.getCourses();
    setCourses(all.filter(c => c.instructorId === currentUser.id || currentUser.role === UserRole.ADMIN));
    if (forceEditId) {
      const c = all.find(x => x.id === forceEditId);
      if (c) { 
        setTitle(c.title); setCategory(c.category); setDesc(c.description); setModules(c.modules); setThumbnail(c.thumbnail);
      }
    }
    // Try to update user from storage if available, otherwise keep prop
    const foundUser = storage.getUsers().find(u => u.id === currentUser.id);
    if (foundUser) setUser(foundUser);
  };

  useEffect(() => {
    loadCourses();
    window.addEventListener('storage_update', loadCourses);
    return () => window.removeEventListener('storage_update', loadCourses);
  }, [currentUser.id, forceEditId]);

  const handleSaveCourse = (isDraft: boolean) => {
    if (!title) return alert("Le titre est requis.");
    const finalCategory = isAddingCategory ? newCategory : category;
    const all = storage.getCourses();
    const course: Course = {
      id: editingId || `c-${Date.now()}`,
      title, category: finalCategory, description: desc,
      instructor: user ? `${user.firstName} ${user.name}` : "Formateur",
      instructorId: editingId ? (all.find(x => x.id === editingId)?.instructorId || currentUser.id) : currentUser.id,
      thumbnail: thumbnail || `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800`,
      createdAt: new Date().toISOString(),
      isDraft, modules
    };
    const updated = editingId ? all.map(c => c.id === editingId ? course : c) : [course, ...all];
    storage.saveCourses(updated);
    alert("Cours sauvegardé !");
    if (!forceEditId) reset();
  };

  const handleDeleteCourse = (id: string) => {
    const updated = storage.getCourses().filter(c => c.id !== id);
    storage.saveCourses(updated);
    setShowDeleteConfirm(null);
  };

  const reset = () => {
    setTitle(''); setCategory('Business'); setDesc(''); setModules([]); setEditingId(null); setActiveTab('list'); setIsAddingCategory(false); setThumbnail('');
  };

  const addModule = () => {
    setModForm({ id: `m-${Date.now()}`, title: '', videoUrl: '', videoType: 'url', description: '', quiz: [] });
    setCurrentModIdx(null);
    setShowModuleModal(true);
  };

  const saveModule = () => {
    const newModules = [...modules];
    if (currentModIdx !== null) newModules[currentModIdx] = modForm;
    else newModules.push(modForm);
    setModules(newModules);
    setShowModuleModal(false);
  };

  // Logic Quiz
  const addQuizQuestion = () => {
    const newQ: QuizQuestion = { id: `q-${Date.now()}`, text: '', options: ['', ''], correctIndex: 0 };
    setModForm({ ...modForm, quiz: [...(modForm.quiz || []), newQ] });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-500 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-8">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Gestion Formation</h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">ESPACE {userRole.toUpperCase()} AKWABA</p>
        </div>
        {!forceEditId && (
          <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
            {(['list', 'create', 'messages', 'profile'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2.5 rounded-xl font-bold text-xs transition-all uppercase ${activeTab === tab ? 'bg-ivoryGreen text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}>
                {tab === 'list' ? 'Mes Cours' : tab === 'create' ? 'Contenu' : tab === 'messages' ? 'Chat' : 'Profil'}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeTab === 'profile' ? (
        <ProfileEdit userId={currentUser.id} initialUser={user || undefined} />
      ) : activeTab === 'messages' ? (
        user ? <ChatWindow currentUser={user} /> : <div className="text-center py-20 text-gray-400 font-bold">Chargement du profil chat...</div>
      ) : activeTab === 'list' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {courses.map(c => (
            <div key={c.id} className="bg-white rounded-[48px] overflow-hidden border border-gray-100 shadow-sm group hover:shadow-2xl transition-all">
              <div className="h-48 relative">
                <img src={c.thumbnail} className="w-full h-full object-cover" />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-4 py-2 rounded-2xl text-[10px] font-black text-ivoryGreen uppercase">{c.category}</div>
                {c.isDraft && <div className="absolute top-4 right-4 bg-yellow-400 text-white text-[10px] font-black px-4 py-2 rounded-2xl">BROUILLON</div>}
              </div>
              <div className="p-10">
                <h3 className="text-2xl font-black text-gray-900 mb-8 leading-tight line-clamp-2">{c.title}</h3>
                <div className="flex gap-3">
                  <button onClick={() => { 
                    setEditingId(c.id); setTitle(c.title); setCategory(c.category); setDesc(c.description); setModules(c.modules); setThumbnail(c.thumbnail); setActiveTab('create'); 
                  }} className="flex-1 py-4 bg-gray-50 text-gray-900 rounded-2xl font-black text-xs hover:bg-ivoryOrange hover:text-white transition-all uppercase tracking-widest">Modifier</button>
                  <button onClick={() => setShowDeleteConfirm(c.id)} className="p-4 text-red-400 bg-red-50 rounded-2xl hover:bg-red-100 transition-all"><Trash2 size={24} /></button>
                </div>
              </div>
            </div>
          ))}
          <button onClick={() => { reset(); setActiveTab('create'); }} className="h-full min-h-[300px] border-8 border-dashed border-gray-100 rounded-[48px] flex flex-col items-center justify-center text-gray-300 hover:text-ivoryGreen hover:border-ivoryGreen transition-all group p-10">
            <Plus size={64} className="mb-6 group-hover:scale-110 transition-transform" />
            <p className="font-black text-sm uppercase tracking-[0.3em]">Ajouter Parcours</p>
          </button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            <div className="bg-white rounded-[48px] p-12 shadow-xl border border-gray-50 space-y-10">
              <h2 className="text-3xl font-black text-ivoryOrange tracking-tighter">Configuration Formation</h2>
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Titre du cours</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} className="w-full p-6 rounded-3xl border-2 border-gray-50 bg-gray-50 text-gray-900 font-black focus:bg-white focus:border-ivoryOrange outline-none transition-all text-xl" />
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Catégorie</label>
                    <div className="flex gap-2">
                      {!isAddingCategory ? (
                        <>
                          <select value={category} onChange={e => setCategory(e.target.value)} className="flex-grow p-6 rounded-3xl border-2 border-gray-50 bg-gray-50 text-gray-900 font-black outline-none appearance-none">
                            <option>Business</option><option>Agriculture</option><option>Tech</option><option>Santé</option>
                          </select>
                          <button onClick={() => setIsAddingCategory(true)} className="p-6 bg-ivoryGreen/10 text-ivoryGreen rounded-3xl hover:bg-ivoryGreen hover:text-white transition-all"><Plus size={24}/></button>
                        </>
                      ) : (
                        <div className="flex-grow flex gap-2">
                          <input autoFocus value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Nom..." className="flex-grow p-6 rounded-3xl border-2 border-ivoryOrange bg-white text-gray-900 font-black outline-none" />
                          <button onClick={() => setIsAddingCategory(false)} className="p-6 bg-gray-100 text-gray-400 rounded-3xl"><X size={24}/></button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Vignette URL (Image)</label>
                    <input value={thumbnail} onChange={e => setThumbnail(e.target.value)} placeholder="https://..." className="w-full p-6 rounded-3xl border-2 border-gray-50 bg-gray-50 text-gray-900 font-black focus:bg-white focus:border-ivoryOrange outline-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
                  <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={4} className="w-full p-6 rounded-3xl border-2 border-gray-50 bg-gray-50 text-gray-900 font-black focus:bg-white focus:border-ivoryOrange outline-none" placeholder="Objectifs..."></textarea>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex justify-between items-end">
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Modules</h2>
                <button onClick={addModule} className="px-8 py-4 bg-ivoryGreen text-white rounded-2xl font-black text-xs flex items-center gap-2 shadow-xl hover:scale-105 transition-all"><ListPlus size={20}/> AJOUTER MODULE</button>
              </div>
              <div className="grid gap-6">
                {modules.map((m, i) => (
                  <div key={m.id} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-ivoryOrange transition-all">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-ivoryOrange/10 rounded-3xl flex items-center justify-center text-ivoryOrange font-black text-xl">{i+1}</div>
                      <div>
                        <h4 className="font-black text-xl text-gray-900">{m.title}</h4>
                        <div className="flex gap-4 mt-2">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1"><Video size={12}/> Vidéo</span>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1"><BrainCircuit size={12}/> {m.quiz?.length || 0} Questions</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setModForm(m); setCurrentModIdx(i); setShowModuleModal(true); }} className="p-4 bg-gray-50 rounded-2xl text-gray-400 hover:text-ivoryOrange transition-all"><Edit size={20}/></button>
                      <button onClick={() => setModules(modules.filter((_, idx) => idx !== i))} className="p-4 bg-red-50 rounded-2xl text-red-400 hover:bg-red-100 transition-all"><Trash2 size={20}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8">
             <div className="bg-ivoryGreen p-12 rounded-[56px] text-white shadow-2xl sticky top-24">
                <h3 className="text-3xl font-black mb-10 flex items-center gap-4"><Book size={32}/> Actions</h3>
                <div className="space-y-4">
                   <button onClick={() => handleSaveCourse(false)} className="w-full py-6 bg-ivoryOrange rounded-3xl font-black text-xl shadow-xl hover:scale-[1.03] transition-all flex items-center justify-center gap-4"><Send size={24}/> {editingId ? 'METTRE À JOUR' : 'PUBLIER'}</button>
                   <button onClick={() => handleSaveCourse(true)} className="w-full py-6 bg-white/10 hover:bg-white/20 rounded-3xl font-black text-sm uppercase tracking-widest transition-all">Brouillon</button>
                </div>
             </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
          <div className="bg-white p-12 rounded-[48px] max-w-md w-full text-center space-y-8 animate-in zoom-in duration-300">
            <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto border-8 border-white shadow-xl">
               <AlertTriangle size={48} />
            </div>
            <h3 className="text-3xl font-black text-gray-900">Confirmer suppression ?</h3>
            <p className="text-gray-400 font-bold">Cette action est définitive. Les données du cours seront perdues.</p>
            <div className="flex gap-4">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-4 bg-gray-100 rounded-2xl font-black text-gray-400 hover:bg-gray-200 transition-all">ANNULER</button>
              <button onClick={() => handleDeleteCourse(showDeleteConfirm)} className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black shadow-xl hover:bg-red-600 transition-all text-xs">SUPPRIMER</button>
            </div>
          </div>
        </div>
      )}

      {showModuleModal && (
        <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-md z-[300] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-5xl rounded-[32px] md:rounded-[56px] overflow-hidden shadow-2xl animate-in zoom-in duration-300 my-8">
             <div className="bg-ivoryOrange p-6 md:p-10 text-white flex justify-between items-center">
               <h3 className="text-2xl md:text-4xl font-black tracking-tighter">Éditeur de Module</h3>
               <button onClick={() => setShowModuleModal(false)} className="bg-white/10 p-3 rounded-full hover:bg-white/20 transition-all"><X size={28}/></button>
             </div>
             <div className="p-6 md:p-12 space-y-8 md:space-y-12">
                <div className="grid md:grid-cols-2 gap-6 md:gap-10">
                   <div className="space-y-6">
                      <input value={modForm.title} onChange={e => setModForm({...modForm, title: e.target.value})} placeholder="Titre module" className="w-full p-4 md:p-6 rounded-3xl bg-gray-50 border-2 border-transparent focus:border-ivoryOrange focus:bg-white outline-none font-bold text-gray-900" />
                      <input value={modForm.videoUrl} onChange={e => setModForm({...modForm, videoUrl: e.target.value})} placeholder="Lien Vidéo (YouTube/MP4)" className="w-full p-4 md:p-6 rounded-3xl bg-gray-50 border-2 border-transparent focus:border-ivoryOrange focus:bg-white outline-none font-bold text-gray-900" />
                   </div>
                   <textarea value={modForm.description} onChange={e => setModForm({...modForm, description: e.target.value})} rows={5} placeholder="Résumé du module..." className="w-full p-4 md:p-6 rounded-3xl bg-gray-50 border-2 border-transparent focus:border-ivoryOrange focus:bg-white outline-none font-bold text-gray-900"></textarea>
                </div>
                
                <div className="pt-10 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-xl md:text-2xl font-black text-gray-900">Quiz du module</h4>
                    <button onClick={addQuizQuestion} className="text-xs font-black text-ivoryOrange uppercase tracking-widest">+ Question</button>
                  </div>
                  <div className="space-y-4">
                    {modForm.quiz?.map((q, qidx) => (
                      <div key={q.id} className="p-6 bg-gray-50 rounded-3xl space-y-4 border border-gray-100">
                         <div className="flex justify-between items-start gap-4">
                            <input value={q.text} onChange={e => {
                              const nq = [...(modForm.quiz || [])];
                              nq[qidx].text = e.target.value;
                              setModForm({...modForm, quiz: nq});
                            }} placeholder="Question..." className="flex-grow p-4 rounded-xl border-b-2 border-gray-200 focus:border-ivoryOrange bg-white font-bold text-gray-900 outline-none" />
                            <button onClick={() => {
                                const nq = [...(modForm.quiz || [])];
                                nq.splice(qidx, 1);
                                setModForm({...modForm, quiz: nq});
                            }} className="p-3 text-red-400 hover:bg-red-50 rounded-xl"><Trash2 size={16}/></button>
                         </div>

                         <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Réponses (Cochez la bonne réponse)</p>
                            {q.options.map((opt, optIdx) => (
                                <div key={optIdx} className="flex items-center gap-3">
                                    <input 
                                        type="radio" 
                                        name={`correct-${q.id}`} 
                                        checked={q.correctIndex === optIdx} 
                                        onChange={() => {
                                            const nq = [...(modForm.quiz || [])];
                                            nq[qidx].correctIndex = optIdx;
                                            setModForm({...modForm, quiz: nq});
                                        }}
                                        className="w-4 h-4 text-ivoryOrange focus:ring-ivoryOrange cursor-pointer"
                                        title="Marquer comme bonne réponse"
                                    />
                                    <input 
                                        value={opt} 
                                        onChange={(e) => {
                                            const nq = [...(modForm.quiz || [])];
                                            nq[qidx].options[optIdx] = e.target.value;
                                            setModForm({...modForm, quiz: nq});
                                        }} 
                                        placeholder={`Réponse ${optIdx + 1}`} 
                                        className="flex-grow p-3 rounded-lg border border-gray-200 bg-white text-sm font-bold focus:border-ivoryOrange outline-none"
                                    />
                                    <button onClick={() => {
                                        const nq = [...(modForm.quiz || [])];
                                        nq[qidx].options.splice(optIdx, 1);
                                        // Adjust correctIndex if needed
                                        if (q.correctIndex === optIdx) nq[qidx].correctIndex = 0;
                                        else if (q.correctIndex > optIdx) nq[qidx].correctIndex--;
                                        setModForm({...modForm, quiz: nq});
                                    }} className="text-gray-300 hover:text-red-400"><X size={14}/></button>
                                </div>
                            ))}
                            <button onClick={() => {
                                const nq = [...(modForm.quiz || [])];
                                nq[qidx].options.push('');
                                setModForm({...modForm, quiz: nq});
                            }} className="text-xs font-black text-ivoryGreen uppercase tracking-widest mt-2 hover:underline flex items-center gap-1">+ Ajouter une réponse</button>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={saveModule} className="w-full py-6 bg-ivoryGreen text-white rounded-3xl font-black text-xl shadow-xl hover:scale-105 transition-all">VALIDER MODULE</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorSpace;
