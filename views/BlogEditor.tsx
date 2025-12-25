import React, { useState, useEffect } from 'react';
import { BlogPost, User } from '../types';
import { storage } from '../utils/storage';
import { Save, X, Image as ImageIcon, Trash } from 'lucide-react';

interface BlogEditorProps {
    currentUser: User;
    onClose: () => void;
}

const BlogEditor: React.FC<BlogEditorProps> = ({ currentUser, onClose }) => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);

    useEffect(() => {
        setPosts(storage.getPosts());
    }, []);

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
        setEditingPost(null);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Supprimer cet article ?")) {
            const updated = posts.filter(p => p.id !== id);
            storage.savePosts(updated);
            setPosts(updated);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-6xl h-[90vh] rounded-[48px] shadow-2xl flex overflow-hidden">
                {/* Sidebar List */}
                <div className="w-1/3 bg-gray-50 border-r border-gray-100 p-8 flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-black text-gray-900">Articles</h2>
                        <button onClick={() => setEditingPost({})} className="bg-ivoryOrange text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-orange-100 hover:bg-orange-600 transition-colors">
                            + NOUVEAU
                        </button>
                    </div>
                    <div className="space-y-4 overflow-y-auto flex-grow pr-2">
                        {posts.map(post => (
                            <div key={post.id} onClick={() => setEditingPost(post)} className="bg-white p-6 rounded-3xl border border-gray-100 cursor-pointer hover:border-ivoryOrange transition-all shadow-sm">
                                <h3 className="font-bold text-gray-900 mb-2 line-clamp-1">{post.title}</h3>
                                <div className="flex justify-between items-center text-xs text-gray-400 font-bold uppercase tracking-widest">
                                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                    <span className={post.isPublished ? "text-green-500" : "text-orange-500"}>{post.isPublished ? "PUBLIÉ" : "BROUILLON"}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button onClick={onClose} className="mt-8 text-center text-gray-400 font-black text-sm hover:text-gray-900 transition-colors">FERMER L'ÉDITEUR</button>
                </div>

                {/* Editor Area */}
                <div className="w-2/3 p-12 overflow-y-auto bg-white relative">
                    {editingPost ? (
                        <div className="space-y-6 max-w-3xl mx-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-black text-gray-400 uppercase tracking-widest">Édition</h3>
                                {editingPost.id && (
                                    <button onClick={() => handleDelete(editingPost.id!)} className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors"><Trash size={20}/></button>
                                )}
                            </div>
                            
                            <input 
                                value={editingPost.title || ''}
                                onChange={e => setEditingPost({...editingPost, title: e.target.value})}
                                placeholder="Titre de l'article..."
                                className="w-full text-4xl font-black placeholder:text-gray-200 border-none outline-none text-gray-900"
                            />
                            
                            <div className="relative group">
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-3xl">
                                    <span className="text-white font-bold flex items-center gap-2"><ImageIcon/> Changer l'image (URL)</span>
                                </div>
                                <img src={editingPost.coverImage || 'https://via.placeholder.com/800x400'} className="w-full h-64 object-cover rounded-3xl bg-gray-100" />
                                <input 
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    type="text"
                                    onChange={e => {
                                        const url = prompt("Entrez l'URL de l'image", editingPost.coverImage);
                                        if (url) setEditingPost({...editingPost, coverImage: url});
                                    }}
                                />
                            </div>

                            <textarea
                                value={editingPost.excerpt || ''}
                                onChange={e => setEditingPost({...editingPost, excerpt: e.target.value})}
                                placeholder="Court extrait pour l'aperçu..."
                                className="w-full p-4 bg-gray-50 rounded-2xl font-medium text-gray-600 border-none outline-none resize-none h-24"
                            />

                            <textarea
                                value={editingPost.content || ''}
                                onChange={e => setEditingPost({...editingPost, content: e.target.value})}
                                placeholder="Écrivez votre article ici..."
                                className="w-full min-h-[400px] p-0 text-lg leading-relaxed text-gray-800 border-none outline-none resize-y"
                            />

                            <div className="flex items-center justify-between pt-8 border-t border-gray-100">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={editingPost.isPublished ?? true}
                                        onChange={e => setEditingPost({...editingPost, isPublished: e.target.checked})}
                                        className="w-6 h-6 rounded-lg text-ivoryGreen focus:ring-ivoryGreen"
                                    />
                                    <span className="font-bold text-gray-900">Publier cet article</span>
                                </label>
                                <button onClick={handleSave} className="bg-ivoryGreen text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-green-100 hover:bg-green-700 transition-all flex items-center gap-2">
                                    <Save size={20}/> ENREGISTRER
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-300">
                            <ImageIcon size={64} className="mb-4 opacity-50"/>
                            <p className="text-xl font-black">Sélectionnez un article ou créez-en un nouveau</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BlogEditor;
