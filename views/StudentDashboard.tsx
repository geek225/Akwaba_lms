
import React, { useState, useEffect } from 'react';
import { Course, QuizQuestion, User } from '../types';
import { storage } from '../utils/storage';
import { ChevronLeft, BrainCircuit, Volume2, CheckCircle2, XCircle, RefreshCcw, Award, PlayCircle, BookOpen, Clock, Search, MessageSquare, User as UserIcon } from 'lucide-react';
import ProfileEdit from '../components/ProfileEdit';
import ChatWindow from '../components/ChatWindow';

const StudentDashboard: React.FC<{ initialCourse: Course | null, currentUser: User }> = ({ initialCourse, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'library' | 'player' | 'messages' | 'profile'>(initialCourse ? 'player' : 'library');
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(initialCourse);
  const [activeIdx, setActiveIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Quiz State
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuizAnswers, setCurrentQuizAnswers] = useState<number[]>([]);
  const [quizResult, setQuizResult] = useState<{ score: number, total: number } | null>(null);

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.split('v=')[1] || url.split('/').pop();
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  useEffect(() => {
    const load = () => {
      const all = storage.getCourses().filter(c => !c.isDraft);
      const enrolls = storage.getEnrollments().filter(e => e.userId === currentUser.id);
      const userCourses = all.filter(c => enrolls.some(e => e.courseId === c.id));
      // Si l'étudiant n'a pas de cours, on lui montre tout le catalogue pour qu'il puisse choisir
      setCourses(userCourses.length > 0 ? userCourses : all);
    };
    load();
    window.addEventListener('storage_update', load);
    return () => window.removeEventListener('storage_update', load);
  }, [currentUser.id]);

  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course);
    setActiveIdx(0);
    setShowQuiz(false);
    setQuizResult(null);
    setActiveTab('player');
  };

  if (activeTab === 'profile') {
    return (
      <div className="container mx-auto px-4 py-12">
        <button onClick={() => setActiveTab('library')} className="mb-8 font-black text-ivoryGreen uppercase text-[10px] tracking-widest flex items-center gap-2"><ChevronLeft size={16}/> Bibliothèque</button>
        <ProfileEdit userId={currentUser.id} />
      </div>
    );
  }

  if (activeTab === 'messages') {
    return (
      <div className="container mx-auto px-4 py-12">
        <button onClick={() => setActiveTab('library')} className="mb-8 font-black text-ivoryGreen uppercase text-[10px] tracking-widest flex items-center gap-2"><ChevronLeft size={16}/> Bibliothèque</button>
        <ChatWindow currentUser={currentUser} />
      </div>
    );
  }

  if (activeTab === 'library') {
    return (
      <div className="container mx-auto px-4 py-12 max-w-7xl animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter">Bienvenue, {currentUser.firstName} !</h1>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-2">Votre progression Akwaba</p>
          </div>
          <div className="flex items-center gap-3 self-end md:self-auto">
             <button onClick={() => setActiveTab('messages')} className="p-3 md:p-4 bg-white border border-gray-100 rounded-2xl text-ivoryGreen hover:bg-ivoryGreen hover:text-white transition-all shadow-sm"><MessageSquare size={20}/></button>
             <button onClick={() => setActiveTab('profile')} className="p-3 md:p-4 bg-white border border-gray-100 rounded-2xl text-ivoryOrange hover:bg-ivoryOrange hover:text-white transition-all shadow-sm"><UserIcon size={20}/></button>
          </div>
        </div>

        {/* Mobile Search Bar (visible on all screens now, but styled differently) */}
        <div className="mb-10 relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
             <input placeholder="Chercher un cours..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full md:max-w-md pl-12 pr-4 py-4 rounded-2xl bg-white border border-gray-100 shadow-sm outline-none focus:border-ivoryOrange font-bold text-gray-900" />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {courses.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-gray-50 rounded-[48px] border-2 border-dashed border-gray-200">
               <BookOpen size={64} className="mx-auto text-gray-300 mb-6"/>
               <h3 className="text-2xl font-black text-gray-400">Aucun cours disponible</h3>
               <p className="text-gray-400 font-bold mt-2">Vous n'êtes inscrit à aucun cours pour le moment.</p>
            </div>
          ) : (
            courses.map(course => (
            <div key={course.id} onClick={() => handleSelectCourse(course)} className="bg-white rounded-[48px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group cursor-pointer">
              <div className="relative h-56">
                <img src={course.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute top-6 left-6 bg-white/90 backdrop-blur px-4 py-2 rounded-2xl text-[10px] font-black text-ivoryGreen uppercase tracking-widest">{course.category}</div>
              </div>
              <div className="p-10">
                <h3 className="text-2xl font-black text-gray-900 mb-6 leading-tight line-clamp-2 min-h-[4rem] group-hover:text-ivoryOrange transition-colors">{course.title}</h3>
                <div className="flex items-center justify-between pt-8 border-t border-gray-50">
                   <div className="flex items-center gap-2">
                     <BookOpen size={16} className="text-ivoryOrange" />
                     <span className="text-xs font-black text-gray-400">{course.modules.length} Modules</span>
                   </div>
                   <div className="px-5 py-2 bg-ivoryGreen/10 rounded-full"><span className="text-[10px] font-black text-ivoryGreen uppercase tracking-widest">Poursuivre</span></div>
                </div>
              </div>
            </div>
          )))}
        </div>
      </div>
    );
  }

  // Player view remains mostly the same as previous turn...
  if (!selectedCourse && activeTab === 'player') {
      return (
        <div className="container mx-auto px-4 py-12 text-center">
            <h2 className="text-2xl font-black text-gray-900">Erreur de chargement du cours</h2>
            <button onClick={() => setActiveTab('library')} className="mt-4 text-ivoryGreen font-bold underline">Retour à la bibliothèque</button>
        </div>
      );
  }

  if (!selectedCourse) return null;
  const module = selectedCourse.modules[activeIdx] || { title: 'Module en construction', description: 'Contenu à venir.', videoUrl: '', videoType: 'url', quiz: [] };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)] bg-gray-50 animate-in slide-in-from-right duration-500">
      <aside className="w-full lg:w-96 bg-white border-r p-6 md:p-10 space-y-6 md:space-y-10 flex flex-col shadow-xl">
        <button onClick={() => setActiveTab('library')} className="text-[10px] font-black text-ivoryGreen uppercase flex items-center gap-2 hover:translate-x-[-4px] transition-all bg-ivoryGreen/5 w-fit px-5 py-3 rounded-2xl"><ChevronLeft size={16}/> Ma bibliothèque</button>
        <h2 className="text-2xl md:text-3xl font-black tracking-tighter leading-none text-gray-900">{selectedCourse.title}</h2>
        <div className="flex-grow space-y-3 overflow-y-auto pr-2 max-h-[300px] lg:max-h-none">
          {selectedCourse.modules.map((m, i) => (
            <button key={m.id} onClick={() => { setActiveIdx(i); setShowQuiz(false); setQuizResult(null); }} className={`w-full p-4 md:p-6 rounded-[28px] text-left font-bold text-sm transition-all border-4 flex items-start gap-4 ${activeIdx === i ? 'bg-ivoryGreen text-white border-ivoryGreen shadow-lg' : 'bg-white border-gray-50 text-gray-500 hover:border-gray-200'}`}>
              <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 ${activeIdx === i ? 'bg-white text-ivoryGreen' : 'bg-gray-100 text-gray-400'}`}>{i+1}</span>
              <span className="flex-grow pt-1">{m.title}</span>
            </button>
          ))}
        </div>
      </aside>

      <main className="flex-grow p-4 md:p-12 overflow-y-auto">
         <div className="max-w-5xl mx-auto space-y-6 md:space-y-12">
            {!showQuiz ? (
              <>
                <div className="aspect-video bg-black rounded-[32px] md:rounded-[56px] overflow-hidden border-4 md:border-[12px] border-white shadow-2xl relative">
                  {module.videoUrl ? (
                    module.videoType === 'url' ? (
                       <iframe className="w-full h-full" src={getEmbedUrl(module.videoUrl)} frameBorder="0" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>
                    ) : (
                       <video controls className="w-full h-full object-contain" src={module.videoUrl}></video>
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 font-black uppercase text-xs tracking-widest">Vidéo indisponible</div>
                  )}
                </div>
                <div className="bg-white p-6 md:p-16 rounded-[32px] md:rounded-[56px] shadow-sm border border-gray-100 relative">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-6 md:gap-8 mb-6 md:mb-12">
                    <div className="flex-grow">
                      <span className="text-[10px] font-black text-ivoryOrange uppercase tracking-widest mb-3 block">Module {activeIdx+1}</span>
                      <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter leading-[0.9]">{module.title}</h1>
                    </div>
                    {module.quiz && module.quiz.length > 0 && <button onClick={() => setShowQuiz(true)} className="w-full md:w-auto px-10 py-4 md:py-6 bg-ivoryGreen text-white rounded-3xl font-black text-sm shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"><BrainCircuit size={24} className="md:w-7 md:h-7"/> ÉVALUATION</button>}
                  </div>
                  <p className="text-lg md:text-2xl text-gray-500 leading-relaxed font-medium italic border-l-4 md:border-l-8 border-ivoryOrange pl-6 md:pl-10 py-4">{module.description || "Pas de description."}</p>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-[32px] md:rounded-[56px] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-500">
                 <div className="bg-ivoryGreen p-8 md:p-16 text-white flex justify-between items-center">
                    <h2 className="text-3xl md:text-5xl font-black tracking-tighter">Test de Validation</h2>
                    <button onClick={() => setShowQuiz(false)} className="bg-white/10 p-3 md:p-4 rounded-full"><XCircle size={24} className="md:w-8 md:h-8"/></button>
                 </div>
                 <div className="p-8 md:p-16 text-center py-12 md:py-24 space-y-6">
                    <Award size={64} className="text-ivoryOrange mx-auto md:w-20 md:h-20" />
                    <h3 className="text-2xl md:text-3xl font-black text-gray-900">Module Prêt ?</h3>
                    <p className="text-gray-400 font-bold text-lg md:text-xl">Répondez aux questions pour valider votre progression.</p>
                    {/* Note: Logic for taking quiz would be here, simplifying for UI responsiveness only */}
                    <button className="px-8 md:px-12 py-4 md:py-6 bg-ivoryOrange text-white rounded-3xl font-black text-lg md:text-xl shadow-2xl w-full md:w-auto">COMMENCER LE QUIZ</button>
                 </div>
              </div>
            )}
         </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
