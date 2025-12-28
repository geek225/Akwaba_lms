import React, { useState, useEffect } from 'react';
import { BlogPost, UserRole, User } from '../types';
import { storage } from '../utils/storage';
import { Calendar, User as UserIcon, ArrowRight } from 'lucide-react';

interface BlogViewProps {
    currentUser: User | null;
    onEdit: () => void; // Callback to open editor
}

const BlogView: React.FC<BlogViewProps> = ({ currentUser, onEdit }) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    const allPosts = storage.getPosts();
    // Filter published posts for non-admins/editors, or show all for staff
    const visiblePosts = allPosts.filter(p => p.isPublished || (currentUser && [UserRole.ADMIN, UserRole.EDITOR].includes(currentUser.role)));
    setPosts(visiblePosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }, [currentUser]);

  const canEdit = currentUser && (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.EDITOR);

  return (
    <div className="min-h-screen bg-gray-50 py-12 md:py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 md:mb-16 gap-6">
            <div>
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-2 md:mb-4 tracking-tighter">Le Blog <span className="text-ivoryOrange">Akwaba</span></h1>
                <p className="text-lg md:text-xl text-gray-500">Actualités, conseils et histoires de notre communauté.</p>
            </div>
            {canEdit && (
                <button 
                    onClick={onEdit}
                    className="w-full md:w-auto px-8 py-4 bg-ivoryGreen text-white rounded-2xl font-black shadow-lg shadow-green-100 hover:bg-green-700 transition-all"
                >
                    GÉRER LES ARTICLES
                </button>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {posts.map(post => (
                <article key={post.id} className="bg-white rounded-[40px] overflow-hidden shadow-xl border border-gray-100 group hover:-translate-y-2 transition-transform duration-300">
                    <div className="h-64 overflow-hidden relative">
                        <img 
                            src={post.coverImage} 
                            alt={post.title} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                            onError={(e) => {
                                e.currentTarget.src = 'https://placehold.co/800x600/FF8800/FFFFFF?text=Akwaba+Blog';
                            }}
                        />
                        {!post.isPublished && (
                            <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest">Brouillon</div>
                        )}
                    </div>
                    <div className="p-8">
                        <div className="flex items-center gap-4 text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">
                            <span className="flex items-center gap-1"><Calendar size={14}/> {new Date(post.createdAt).toLocaleDateString('fr-FR')}</span>
                            <span className="flex items-center gap-1"><UserIcon size={14}/> {post.authorName}</span>
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-4 leading-tight group-hover:text-ivoryOrange transition-colors">{post.title}</h2>
                        <p className="text-gray-500 mb-6 line-clamp-3">{post.excerpt}</p>
                        <button className="text-ivoryGreen font-black flex items-center gap-2 group/btn">
                            LIRE L'ARTICLE <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform"/>
                        </button>
                    </div>
                </article>
            ))}

            {posts.length === 0 && (
                <div className="col-span-full text-center py-20 text-gray-400">
                    <p className="text-xl font-bold">Aucun article pour le moment.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default BlogView;
