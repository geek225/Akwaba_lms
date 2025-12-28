
import React, { useState, useEffect, useRef } from 'react';
import { BlogPost, User } from '../types';
import { storage } from '../utils/storage';
import { Save, X, Image as ImageIcon, Trash, ChevronLeft, Layout, Settings, Eye, Clock, Calendar, Type, Bold, Italic, Underline, Link as LinkIcon, Video, List, ListOrdered, Heading1, Heading2, Quote, Undo, Redo, MoreHorizontal } from 'lucide-react';

interface BlogEditorProps {
    currentUser: User;
    onClose: () => void;
}

const BlogEditor: React.FC<BlogEditorProps> = ({ currentUser, onClose }) => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);
    const [showSettings, setShowSettings] = useState(true);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    // Auto-resize textarea ref
    const titleRef = useRef<HTMLTextAreaElement>(null);
    const contentEditableRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setPosts(storage.getPosts());
        // Load draft if exists
        const draft = localStorage.getItem('blog_draft');
        if (draft && !editingPost) {
           // Optional: Ask user? For now, let's just leave it manual or we can auto-load if "New Post" is clicked.
        }
    }, []);

    // Auto-save draft
    useEffect(() => {
        if (editingPost) {
            const timer = setTimeout(() => {
                localStorage.setItem('blog_draft', JSON.stringify(editingPost));
                setLastSaved(new Date());
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [editingPost]);

    useEffect(() => {
        if (titleRef.current) {
            titleRef.current.style.height = 'auto';
            titleRef.current.style.height = titleRef.current.scrollHeight + 'px';
        }
    }, [editingPost?.title]);

    // Sync contentEditable with state on load
    useEffect(() => {
        if (contentEditableRef.current && editingPost?.content && contentEditableRef.current.innerHTML !== editingPost.content) {
            // Only set if empty or completely different (initial load) to avoid cursor jumps
             if (contentEditableRef.current.innerHTML === '' || contentEditableRef.current.innerHTML === '<br>') {
                 contentEditableRef.current.innerHTML = editingPost.content;
             }
        }
    }, [editingPost?.id]); // Only re-sync on post switch

    const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
        const html = e.currentTarget.innerHTML;
        setEditingPost(prev => prev ? ({ ...prev, content: html }) : null);
    };

    const execCmd = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        contentEditableRef.current?.focus();
    };

    const handleLink = () => {
        const url = prompt("Entrez l'URL du lien :");
        if (url) execCmd('createLink', url);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const imgUrl = ev.target?.result as string;
                // Insert image with style
                const imgHtml = `<img src="${imgUrl}" class="max-w-full h-auto rounded-xl my-4 shadow-sm" />`;
                execCmd('insertHTML', imgHtml);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleVideoEmbed = () => {
        const url = prompt("Entrez l'URL de la vidéo (YouTube, Vimeo) :");
        if (url) {
            let embedUrl = url;
            if (url.includes('youtube.com/watch?v=')) {
                const videoId = url.split('v=')[1].split('&')[0];
                embedUrl = `https://www.youtube.com/embed/${videoId}`;
            } else if (url.includes('youtu.be/')) {
                const videoId = url.split('youtu.be/')[1];
                embedUrl = `https://www.youtube.com/embed/${videoId}`;
            }
            const videoHtml = `<div class="aspect-video w-full my-6 rounded-2xl overflow-hidden shadow-lg"><iframe src="${embedUrl}" class="w-full h-full" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div><br/>`;
            execCmd('insertHTML', videoHtml);
        }
    };

    const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setEditingPost(prev => prev ? ({ ...prev, coverImage: ev.target?.result as string }) : null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        if (!editingPost?.title) return alert("Le titre est requis.");

        // Fallback for content if state is stale
        const currentContent = contentEditableRef.current?.innerHTML || editingPost.content || '';

        // Safe ID generation
        const postId = editingPost.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString());

        const newPost: BlogPost = {
            id: postId,
            title: editingPost.title,
            excerpt: editingPost.excerpt || contentEditableRef.current?.innerText.substring(0, 150) + '...' || '',
            content: currentContent,
            authorId: editingPost.authorId || currentUser.id,
            authorName: editingPost.authorName || currentUser.name,
            coverImage: editingPost.coverImage || 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800&auto=format&fit=crop&q=60',
            createdAt: editingPost.createdAt || new Date().toISOString(),
            isPublished: editingPost.isPublished ?? true
        };

        try {
            const updatedPosts = editingPost.id 
                ? posts.map(p => p.id === editingPost.id ? newPost : p)
                : [newPost, ...posts];
            
            storage.savePosts(updatedPosts);
            setPosts(updatedPosts);
            localStorage.removeItem('blog_draft'); // Clear draft after save
            setEditingPost(null); // Return to list
            alert("Article publié avec succès !");
        } catch (error) {
            console.error("Erreur lors de la sauvegarde :", error);
            alert("Une erreur est survenue lors de la sauvegarde.");
        }
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
        // Check for draft
        const draft = localStorage.getItem('blog_draft');
        if (draft) {
            if (window.confirm("Un brouillon non sauvegardé existe. Voulez-vous le reprendre ?")) {
                setEditingPost(JSON.parse(draft));
                return;
            } else {
                localStorage.removeItem('blog_draft');
            }
        }

        setEditingPost({
            title: '',
            content: '',
            isPublished: true,
            createdAt: new Date().toISOString()
        });
    };

    // --- VIEW: LIST OF POSTS ---
    if (!editingPost) {
        const hasDraft = localStorage.getItem('blog_draft');
        
        return (
            <div className="fixed inset-0 bg-gray-50 z-50 overflow-y-auto animate-in fade-in">
                <div className="max-w-7xl mx-auto px-6 py-12">
                    {hasDraft && (
                        <div className="mb-8 bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-in slide-in-from-top-4">
                            <div className="flex items-center gap-4">
                                <div className="bg-orange-100 p-2 rounded-xl text-orange-600">
                                    <Save size={20}/>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Brouillon non sauvegardé détecté</h4>
                                    <p className="text-sm text-gray-500">Vous avez un article en cours de rédaction.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => { localStorage.removeItem('blog_draft'); setPosts([...posts]); }} className="text-sm font-bold text-gray-400 hover:text-gray-600 px-4 py-2">
                                    Supprimer
                                </button>
                                <button onClick={() => setEditingPost(JSON.parse(hasDraft))} className="bg-ivoryOrange text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-orange-100 hover:scale-105 transition-all">
                                    Reprendre
                                </button>
                            </div>
                        </div>
                    )}

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
                                    <p className="text-gray-400 text-sm font-medium line-clamp-2 mb-6 flex-grow" dangerouslySetInnerHTML={{__html: post.excerpt || ''}}></p>
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
        <div className="fixed inset-0 bg-[#FAFAFA] z-50 flex flex-col animate-in slide-in-from-bottom-10 duration-500">
            {/* Top Bar */}
            <div className="h-20 border-b border-gray-100 flex items-center justify-between px-6 bg-white/80 backdrop-blur z-20 sticky top-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => setEditingPost(null)} className="p-3 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <ChevronLeft size={24}/>
                    </button>
                    <div className="flex flex-col">
                        <span className="font-bold text-gray-400 text-xs uppercase tracking-widest">
                            {editingPost.id ? 'Édition' : 'Nouveau brouillon'}
                        </span>
                        {lastSaved && <span className="text-[10px] font-medium text-gray-300">Sauvegardé à {lastSaved.toLocaleTimeString()}</span>}
                    </div>
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
                <div className="flex-grow overflow-y-auto bg-[#FAFAFA] flex justify-center relative">
                    {/* Floating Toolbar (Sticky at top of container) */}
                    <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur shadow-2xl border border-gray-100 rounded-full px-6 py-3 flex items-center gap-4 z-30 transition-all hover:scale-105">
                         <button onClick={() => execCmd('bold')} className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors" title="Gras"><Bold size={18}/></button>
                         <button onClick={() => execCmd('italic')} className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors" title="Italique"><Italic size={18}/></button>
                         <button onClick={() => execCmd('underline')} className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors" title="Souligné"><Underline size={18}/></button>
                         <div className="w-px h-6 bg-gray-200"></div>
                         <button onClick={() => execCmd('formatBlock', 'H2')} className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors" title="Titre 1"><Heading1 size={18}/></button>
                         <button onClick={() => execCmd('formatBlock', 'H3')} className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors" title="Titre 2"><Heading2 size={18}/></button>
                         <button onClick={() => execCmd('formatBlock', 'BLOCKQUOTE')} className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors" title="Citation"><Quote size={18}/></button>
                         <div className="w-px h-6 bg-gray-200"></div>
                         <button onClick={handleLink} className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors" title="Lien"><LinkIcon size={18}/></button>
                         <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors" title="Image"><ImageIcon size={18}/></button>
                         <button onClick={handleVideoEmbed} className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors" title="Vidéo"><Video size={18}/></button>
                         <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                    </div>

                    <div className="max-w-4xl w-full py-32 px-12 md:px-20 bg-white min-h-[120vh] shadow-sm my-8 mx-auto rounded-[4px] border border-gray-100">
                        <textarea
                            ref={titleRef}
                            value={editingPost.title || ''}
                            onChange={e => setEditingPost({...editingPost, title: e.target.value})}
                            placeholder="Titre de l'article"
                            className="w-full text-5xl md:text-6xl font-black placeholder:text-gray-200 border-none outline-none text-gray-900 resize-none overflow-hidden bg-transparent leading-tight mb-12"
                            rows={1}
                        />
                        
                        <div 
                            ref={contentEditableRef}
                            contentEditable
                            onInput={handleContentChange}
                            className="prose prose-xl max-w-none focus:outline-none min-h-[500px] empty:before:content-[attr(placeholder)] empty:before:text-gray-300"
                            placeholder="Commencez à écrire votre histoire..."
                        ></div>
                    </div>
                </div>

                {/* Right Settings Sidebar */}
                {showSettings && (
                    <div className="w-[350px] bg-white border-l border-gray-100 overflow-y-auto p-8 animate-in slide-in-from-right duration-300 shadow-2xl z-40">
                        <div className="flex items-center justify-between mb-8">
                             <h3 className="font-black text-gray-900 text-lg">Paramètres</h3>
                             <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-900"><X size={20}/></button>
                        </div>
                        
                        <div className="space-y-10">
                            {/* Publish Status */}
                            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                                <label className="flex items-center justify-between cursor-pointer mb-4">
                                    <span className="font-bold text-gray-700 flex items-center gap-2"><Eye size={18}/> Visibilité</span>
                                    <div className={`w-12 h-7 rounded-full p-1 transition-colors ${editingPost.isPublished ? 'bg-ivoryGreen' : 'bg-gray-200'}`}>
                                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${editingPost.isPublished ? 'translate-x-5' : ''}`}></div>
                                    </div>
                                    <input type="checkbox" className="hidden" checked={editingPost.isPublished ?? true} onChange={e => setEditingPost({...editingPost, isPublished: e.target.checked})} />
                                </label>
                                <p className="text-xs text-gray-400 font-medium leading-relaxed">
                                    {editingPost.isPublished ? "L'article est visible par tous." : "L'article est en mode brouillon."}
                                </p>
                            </div>

                            {/* Cover Image */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Image de couverture</label>
                                <div onClick={() => coverInputRef.current?.click()} className="relative group cursor-pointer rounded-3xl overflow-hidden shadow-sm border-2 border-dashed border-gray-200 hover:border-ivoryOrange transition-all aspect-video bg-gray-50 flex items-center justify-center">
                                    {editingPost.coverImage ? (
                                        <>
                                            <img src={editingPost.coverImage} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2"><ImageIcon size={16}/> Changer</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center p-6">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400 group-hover:text-ivoryOrange group-hover:bg-orange-50 transition-colors">
                                                <ImageIcon size={24}/>
                                            </div>
                                            <span className="text-gray-400 font-bold text-xs group-hover:text-gray-600">Ajouter une image</span>
                                        </div>
                                    )}
                                    <input type="file" ref={coverInputRef} onChange={handleCoverUpload} className="hidden" accept="image/*" />
                                </div>
                            </div>

                            {/* Excerpt */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Extrait</label>
                                <textarea 
                                    value={editingPost.excerpt || ''}
                                    onChange={e => setEditingPost({...editingPost, excerpt: e.target.value})}
                                    className="w-full p-6 bg-gray-50 rounded-3xl border-2 border-transparent focus:border-ivoryOrange focus:bg-white outline-none font-medium text-gray-600 text-sm shadow-inner min-h-[150px] resize-none leading-relaxed"
                                    placeholder="Un court résumé pour les cartes d'aperçu..."
                                />
                            </div>

                             {/* Meta Info */}
                             <div className="space-y-4 pt-8 border-t border-gray-100">
                                <div className="flex items-center justify-between text-xs font-bold text-gray-400">
                                    <span>Auteur</span>
                                    <span className="text-gray-900">{editingPost.authorName}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs font-bold text-gray-400">
                                    <span>Créé le</span>
                                    <span className="text-gray-900">{new Date(editingPost.createdAt!).toLocaleDateString()}</span>
                                </div>
                             </div>
                             
                             <button onClick={() => handleDelete(editingPost.id!)} className="w-full py-4 text-red-500 bg-red-50 hover:bg-red-100 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                                <Trash size={16}/> Supprimer l'article
                             </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlogEditor;
