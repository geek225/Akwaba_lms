import React, { useEffect, useState } from 'react';
import { Search, ChevronRight, Star, Clock, BookOpen, User as UserIcon } from 'lucide-react';
import { storage } from '../utils/storage';
import { Course, User } from '../types';

interface HomeProps {
  onSelectCourse: (course: Course) => void;
  currentUser: User | null;
  onNavigateToAuth: () => void;
}

const Home: React.FC<HomeProps> = ({ onSelectCourse, currentUser, onNavigateToAuth }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);

  useEffect(() => {
    storage.init();
    setCourses(storage.getCourses().filter(c => !c.isDraft).slice(0, 5));
    
    // Simulate fetching enrollments (In a real app, this comes from Supabase/API)
    // For now, we assume if we are logged in, we check the enrollments
    // But since the current 'storage' implementation doesn't easily track per-user enrollments in a relational way locally,
    // we will check if the user is enrolled in the specific course via local logic or just visually.
    // For this prototype, let's assume specific courses are enrolled if the user is 'jean@akwaba.ci' or we just track it.
    
    // BETTER: Check enrollments from storage if they exist
    const enrollments = storage.getEnrollments();
    if (currentUser) {
        const userEnrollments = enrollments.filter(e => e.userId === currentUser.id).map(e => e.courseId);
        setEnrolledCourseIds(userEnrollments);
    }
  }, [currentUser]);

  const handleCourseAction = (e: React.MouseEvent, course: Course) => {
    e.stopPropagation();
    if (!currentUser) {
        onNavigateToAuth();
    } else {
        // If enrolled, continue
        // If not, also select course (which usually opens details/enrollment page)
        onSelectCourse(course);
    }
  };

  const getActionButton = (course: Course) => {
    if (!currentUser) {
        return (
            <button 
                onClick={(e) => handleCourseAction(e, course)}
                className="w-full py-3 bg-ivoryGreen text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors"
            >
                S'inscrire pour suivre
            </button>
        );
    }

    const isEnrolled = enrolledCourseIds.includes(course.id);
    
    if (isEnrolled) {
        return (
            <button 
                onClick={(e) => handleCourseAction(e, course)}
                className="w-full py-3 bg-ivoryOrange/10 text-ivoryOrange rounded-xl font-bold text-sm hover:bg-ivoryOrange/20 transition-colors"
            >
                Continuer le cours
            </button>
        );
    }

    return (
        <button 
            onClick={(e) => handleCourseAction(e, course)}
            className="w-full py-3 bg-ivoryGreen text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors shadow-lg shadow-green-100"
        >
            Suivre ce cours
        </button>
    );
  };

  return (
    <div className="pb-20">
      {/* Hero Section */}
      <section className="bg-ivoryWhite py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-ivoryOrange opacity-5 -skew-x-12 transform translate-x-20"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-6xl md:text-7xl font-black text-gray-900 mb-8 leading-[0.9] tracking-tighter">
              L'avenir se <span className="text-ivoryOrange">construit</span> ici et <span className="text-ivoryGreen underline decoration-8 underline-offset-8">maintenant</span>.
            </h1>
            <p className="text-xl text-gray-500 mb-12 font-medium max-w-2xl mx-auto">
              Rejoignez des milliers d'ivoiriens qui se forment aux métiers d'aujourd'hui.
            </p>
            
            <div className="relative max-w-2xl mx-auto group">
              <input 
                type="text" 
                placeholder="Ex: Agriculture, Digital, Vannerie..." 
                className="w-full pl-14 pr-4 py-6 rounded-[32px] border-4 border-gray-100 shadow-2xl focus:border-ivoryOrange transition-all outline-none font-bold text-lg"
              />
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-ivoryOrange" size={24} />
              <button className="absolute right-3 top-3 bottom-3 bg-ivoryOrange hover:bg-orange-600 text-white px-10 rounded-2xl font-black transition-all">
                Chercher
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Course List */}
      <section className="container mx-auto px-4 py-20">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">Cours populaires</h2>
            <div className="h-2 w-20 bg-ivoryGreen mt-3 rounded-full"></div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {courses.map(course => (
            <div 
              key={course.id} 
              className="bg-white rounded-[40px] overflow-hidden shadow-sm border border-gray-50 hover:shadow-2xl hover:-translate-y-2 transition-all group cursor-pointer flex flex-col"
              onClick={() => onSelectCourse(course)}
            >
              <div className="relative h-56">
                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute top-6 left-6 bg-white/90 backdrop-blur px-4 py-2 rounded-2xl text-[10px] font-black text-ivoryGreen uppercase tracking-widest">
                  {course.category}
                </div>
              </div>
              <div className="p-8 flex-grow flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex text-yellow-500">
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                  </div>
                  <span className="text-[10px] font-black text-gray-400 uppercase">Top Vente</span>
                </div>
                <h3 className="text-2xl font-black mb-4 leading-tight group-hover:text-ivoryOrange transition-colors">{course.title}</h3>
                
                <div className="mt-auto space-y-4">
                    <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-ivoryGreen/10 flex items-center justify-center text-ivoryGreen">
                        <BookOpen size={14} />
                        </div>
                        <span className="text-xs font-bold text-gray-500">{course.modules.length} Modules</span>
                    </div>
                    <span className="text-xs font-black text-gray-900 uppercase">PAR {course.instructor}</span>
                    </div>
                    
                    {getActionButton(course)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
