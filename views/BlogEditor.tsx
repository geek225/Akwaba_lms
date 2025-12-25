
import React, { useState, useEffect, useRef } from 'react';
import { BlogPost, User } from '../types';
import { storage } from '../utils/storage';
import { Save, X, Image as ImageIcon, Trash, ChevronLeft, Layout, Settings, Eye, Clock, Calendar, Type } from 'lucide-react';

interface BlogEditorProps {
    currentUser: User;
    onClose: () => void;
}

const BlogEditor: React.FC<BlogEditorProps> = ({ currentUser, onClose }) => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);
    const [showSettings, setShowSettings] = useState(true);

    // Auto-resize textarea ref
    const titleRef = useRef<HTMLTextAreaElement>(null);
    const contentRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setPosts(storage.getPosts());
    }, []);

    useEffect(() => {
        if (titleRef.current) {
            titleRef.current.style.height = 'auto';
            titleRef.current.style.height = titleRef.current.scrollHeight + 'px';
        }
        if (contentRef.current) {
            contentRef.current.style.height = 'auto';
            contentRef.current.style.height = contentRef.current.scrollHeight + 'px';
        }
    }, [editingPost?.title, editingPost?.content]);

    const handleSave = () => {
        if (!editingPost?.title || !editingPost.content) return alert("Titre et contenu requis.");

        const newPost: BlogPost = {
            id: editingPost.id || crypto.randomUUID(),
            title: editingPost.title,
            excerpt: editingPost.excerpt || editingPost.content.substring(0, 150) + '...',
            content: editingPost.content,
            authorId: editingPost.authorId || currentUser.id,
            authorName: editingPost.authorName || currentUser.name,
            coverImage: editingPost.coverImage || 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800&auto=format&fit=crop&q=60',
            createdAt: editingPost.createdAt || new Date().toISOString(),
            isPublished: editingPost.isPublished ?? true
        };

        const updatedPosts = editingPost.id 
            ? posts.map(p => p.id === editingPost.id ? newPost : p)
            : [newPost, ...posts];
        
        storage.savePosts(updatedPosts);
        setPosts(updatedPosts);
        setEditingPost(null); // Return to list
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Supprimer cet article ?")) {
            const updated = posts.filter(p => p.id !== id);
            storage.savePosts(updated);
            setPosts(updated);
            if (editingPost?.id === id) setEditingPost(null);
        }
    };

    const createNewPost = () => {
        setEditingPost({
            title: '',
            content: '',
            isPublished: true,
            createdAt: new Date().toISOString()
        });
    };

    // --- VIEW: LIST OF POSTS ---
    if (!editingPost) {
        return (
            <div className="fixed inset-0 bg-gray-50 z-50 overflow-y-auto animate-in fade-in">
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <div className="flex justify-between items-center mb-12">
                        <div>
                            <button onClick={onClose} className="flex items-center gap-2 text-gray-400 font-bold uppercase text-xs hover:text-gray-900 transition-colors mb-4">
                                <ChevronLeft size={16}/> Retour au site
                            </button>
                            <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Gestion du Blog</h1>
                        </div>
                        <button onClick={createNewPost} className="bg-ivoryGreen text-white px-8 py-4 rounded-[24px] font-black shadow-xl shadow-green-100 hover:scale-105 transition-all flex items-center gap-3">
                            <Type size={20}/> NOUVEL ARTICLE
                        </button>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map(post => (
                            <div key={post.id} onClick={() => setEditingPost(post)} className="group bg-white rounded-[40px] p-4 shadow-sm border border-gray-100 hover:shadow-2xl hover:border-gray-200 transition-all cursor-pointer flex flex-col h-[400px]">
                                <div className="h-48 rounded-[32px] overflow-hidden relative mb-6">
                                    <img src={post.coverImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                                        {post.isPublished ? <span className="text-green-600">Publié</span> : <span className="text-orange-500">Brouillon</span>}
                                    </div>
                                </div>
                                <div className="px-4 flex-grow flex flex-col">
                                    <h3 className="font-black text-xl text-gray-900 mb-3 line-clamp-2 leading-tight group-hover:text-ivoryOrange transition-colors">{post.title}</h3>
                                    <p className="text-gray-400 text-sm font-medium line-clamp-2 mb-6 flex-grow">{post.excerpt}</p>
                                    <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-auto">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-black text-xs text-gray-500">
                                                {post.authorName?.charAt(0)}
                                            </div>
                                            <span className="text-xs font-bold text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {/* Empty State / Create New Card */}
                        <div onClick={createNewPost} className="border-4 border-dashed border-gray-200 rounded-[40px] flex flex-col items-center justify-center text-gray-300 hover:border-ivoryOrange hover:text-ivoryOrange hover:bg-orange-50/10 transition-all cursor-pointer min-h-[400px]">
                            <Type size={48} className="mb-4 opacity-50"/>
                            <span className="font-black text-lg">Écrire un article</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- VIEW: EDITOR ---
    return (
        <div className="fixed inset-0 bg-white z-50 flex flex-col animate-in slide-in-from-bottom-10 duration-500">
            {/* Top Bar */}
            <div className="h-20 border-b border-gray-100 flex items-center justify-between px-6 bg-white/80 backdrop-blur z-20 sticky top-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => setEditingPost(null)} className="p-3 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <ChevronLeft size={24}/>
                    </button>
                    <span className="font-bold text-gray-400 text-sm uppercase tracking-widest">
                        {editingPost.id ? 'Édition' : 'Nouveau brouillon'}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowSettings(!showSettings)} className={`p-3 rounded-xl transition-all ${showSettings ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-900'}`}>
                        <Layout size={20}/>
                    </button>
                    <button onClick={handleSave} className="bg-ivoryGreen text-white px-8 py-3 rounded-xl font-black text-sm shadow-lg shadow-green-100 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2">
                        <Save size={18}/> {editingPost.id ? 'METTRE À JOUR' : 'PUBLIER'}
                    </button>
                </div>
            </div>

            <div className="flex-grow flex overflow-hidden">
                {/* Main Content */}
                <div className="flex-grow overflow-y-auto">
                    <div className="max-w-3xl mx-auto py-20 px-8">
                        <textarea
                            ref={titleRef}
                            value={editingPost.title || ''}
                            onChange={e => setEditingPost({...editingPost, title: e.target.value})}
                            placeholder="Titre de l'article"
                            className="w-full text-5xl md:text-6xl font-black placeholder:text-gray-200 border-none outline-none text-gray-900 resize-none overflow-hidden bg-transparent leading-tight mb-8"
                            rows={1}
                        />
                        <textarea
                            ref={contentRef}
                            value={editingPost.content || ''}
                            onChange={e => setEditingPost({...editingPost, content: e.target.value})}
                            placeholder="Commencez à écrire votre histoire..."
                            className="w-full text-xl leading-relaxed text-gray-700 placeholder:text-gray-300 border-none outline-none resize-none overflow-hidden bg-transparent min-h-[500px]"
                        />
                    </div>
                </div>

                {/* Right Settings Sidebar */}
                {showSettings && (
                    <div className="w-[350px] bg-gray-50 border-l border-gray-100 overflow-y-auto p-6 animate-in slide-in-from-right duration-300">
                        <h3 className="font-black text-gray-900 mb-8 text-lg">Paramètres de l'article</h3>
                        
                        <div className="space-y-8">
                            {/* Publish Status */}
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                <label className="flex items-center justify-between cursor-pointer mb-4">
                                    <span className="font-bold text-gray-700 flex items-center gap-2"><Eye size={18}/> Visibilité</span>
                                    <div className={`w-12 h-7 rounded-full p-1 transition-colors ${editingPost.isPublished ? 'bg-ivoryGreen' : 'bg-gray-200'}`}>
                                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${editingPost.isPublished ? 'translate-x-5' : ''}`}></div>
                                    </div>
                                    <input type="checkbox" className="hidden" checked={editingPost.isPublished ?? true} onChange={e => setEditingPost({...editingPost, isPublished: e.target.checked})} />
                                </label>
                                <p className="text-xs text-gray-400 font-medium">
                                    {editingPost.isPublished ? "L'article est visible par tous." : "L'article est en mode brouillon."}
                                </p>
                            </div>

                            {/* Cover Image */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Image de couverture</label>
                                <div className="relative group cursor-pointer rounded-3xl overflow-hidden shadow-sm border-2 border-white hover:border-ivoryOrange transition-all aspect-video bg-gray-200">
                                    {editingPost.coverImage ? (
                                        <img src={editingPost.coverImage} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                            <ImageIcon size={32} className="mb-2"/>
                                            <span className="text-xs font-bold">Ajouter une image</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="text-white text-xs font-bold border border-white px-4 py-2 rounded-xl">Changer l'URL</span>
                                    </div>
                                    <input 
                                        type="text" 
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={e => {
                                            const url = prompt("URL de l'image", editingPost.coverImage || '');
                                            if (url) setEditingPost({...editingPost, coverImage: url});
                                            // Reset input value to allow selecting same file again if needed (though here it's prompt)
                                            e.target.value = '';
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Excerpt */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Extrait</label>
                                <textarea 
                                    value={editingPost.excerpt || ''}
                                    onChange={e => setEditingPost({...editingPost, excerpt: e.target.value})}
                                    rows={4}
                                    className="w-full p-4 bg-white rounded-2xl border border-gray-100 focus:border-ivoryOrange outline-none text-sm font-medium text-gray-600 resize-none transition-all shadow-sm"
                                    placeholder="Un court résumé pour les cartes d'aperçu..."
                                />
                            </div>

                            {/* Meta Info */}
                            <div className="pt-6 border-t border-gray-200 space-y-4">
                                <div className="flex items-center justify-between text-xs font-bold text-gray-400">
                                    <span className="flex items-center gap-2"><Clock size={14}/> Créé le</span>
                                    <span>{new Date(editingPost.createdAt!).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs font-bold text-gray-400">
                                    <span className="flex items-center gap-2"><Type size={14}/> Mots</span>
                                    <span>{editingPost.content?.trim().split(/\s+/).length || 0}</span>
                                </div>
                            </div>

                            {/* Delete */}
                            {editingPost.id && (
                                <button onClick={() => handleDelete(editingPost.id!)} className="w-full py-4 text-red-500 font-black text-xs uppercase tracking-widest hover:bg-red-50 rounded-2xl transition-all flex items-center justify-center gap-2 mt-8">
                                    <Trash size={16}/> Supprimer l'article
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlogEditor;
