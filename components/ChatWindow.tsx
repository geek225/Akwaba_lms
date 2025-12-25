
import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage, UserRole } from '../types';
import { storage, supabase } from '../utils/storage';
import { Send, Paperclip, FileText, CheckCircle2, User as UserIcon, X, Download, MessageSquare, Play, Maximize2, ArrowLeft } from 'lucide-react';

const ChatWindow: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [contacts, setContacts] = useState<User[]>([]);
  const [selectedContact, setSelectedContact] = useState<User | 'global' | null>(null);
  const [inputText, setInputText] = useState('');
  const [file, setFile] = useState<{name: string, data: string, size: number, type: string} | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadData = () => {
    setMessages(storage.getMessages());
    const allUsers = storage.getUsers().filter(u => u.id !== currentUser.id);
    setContacts(allUsers);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage_update', loadData);
    return () => window.removeEventListener('storage_update', loadData);
  }, [currentUser.id]);

  useEffect(() => {
    if (selectedContact && selectedContact !== 'global') {
        const unreadMsgs = messages.filter(m => m.fromId === selectedContact.id && m.toId === currentUser.id && !m.read);
        if (unreadMsgs.length > 0) {
            const updatedMessages = messages.map(m => {
                if (m.fromId === selectedContact.id && m.toId === currentUser.id && !m.read) {
                    return { ...m, read: true };
                }
                return m;
            });
            storage.saveMessages(updatedMessages);
            setMessages(updatedMessages);
        }
    }
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, selectedContact]);

  const getUnreadCount = (contactId: string) => {
    return messages.filter(m => m.fromId === contactId && m.toId === currentUser.id && !m.read).length;
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (f.size > 100 * 1024 * 1024) return alert("Fichier trop lourd (Max 100MB)");
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFile({ name: f.name, data: ev.target?.result as string, size: f.size, type: f.type });
      };
      reader.readAsDataURL(f);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() && !file) return;
    const toId = selectedContact === 'global' ? 'global' : selectedContact?.id;
    if (!toId) return;

    const newMessageBase = {
      fromId: currentUser.id,
      toId,
      text: inputText,
      fileName: file?.name,
      fileData: file?.data,
      fileType: file?.type,
      fileSize: file?.size,
      createdAt: new Date().toISOString()
    };

    let sentViaSupabase = false;

    if (supabase) {
        // Envoi vers Supabase
        const { error } = await supabase.from('messages').insert({
            from_id: newMessageBase.fromId,
            to_id: newMessageBase.toId,
            text: newMessageBase.text,
            file_name: newMessageBase.fileName,
            file_data: newMessageBase.fileData,
            file_type: newMessageBase.fileType,
            file_size: newMessageBase.fileSize,
            created_at: newMessageBase.createdAt
        });

        if (error) {
            console.warn("Erreur Supabase, bascule sur stockage local:", error);
            // On continue vers le fallback local au lieu de bloquer
        } else {
            sentViaSupabase = true;
        }
    }

    if (!sentViaSupabase) {
        // Fallback LocalStorage
        const newMessage: ChatMessage = {
            id: `m-${Date.now()}`,
            ...newMessageBase,
            read: false
        };
        const all = storage.getMessages();
        storage.saveMessages([...all, newMessage]);
        setMessages([...messages, newMessage]); // Update local state immediately
    }

    setInputText('');
    setFile(null);
  };

  const chatMessages = messages.filter(m => {
    if (selectedContact === 'global') return m.toId === 'global';
    const contactId = selectedContact?.id;
    return (m.fromId === currentUser.id && m.toId === contactId) || 
           (m.fromId === contactId && m.toId === currentUser.id);
  });

  const renderFilePreview = (m: ChatMessage) => {
    if (!m.fileData) return null;

    // Détection Images
    if (m.fileType?.startsWith('image/')) {
      return (
        <div className="mt-4 rounded-3xl overflow-hidden border-4 border-white shadow-xl group relative">
          <img src={m.fileData} alt={m.fileName} className="w-full max-h-[300px] object-cover hover:scale-105 transition-transform duration-500" />
          <a href={m.fileData} download={m.fileName} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
             <div className="bg-white p-3 rounded-full text-ivoryOrange"><Download size={24} /></div>
          </a>
        </div>
      );
    }

    // Détection Vidéos
    if (m.fileType?.startsWith('video/')) {
      return (
        <div className="mt-4 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-black">
          <video controls className="w-full max-h-[300px]">
            <source src={m.fileData} type={m.fileType} />
            Vidéo non supportée.
          </video>
        </div>
      );
    }

    // Autres fichiers
    return (
      <div className={`mt-4 p-5 rounded-3xl flex items-center gap-4 ${m.fromId === currentUser.id ? 'bg-white/10' : 'bg-gray-50'}`}>
        <FileText size={28} className={m.fromId === currentUser.id ? 'text-white' : 'text-ivoryOrange'} />
        <div className="flex-grow overflow-hidden">
          <p className="text-sm font-black truncate">{m.fileName}</p>
          <p className="text-[10px] font-bold opacity-60 uppercase">{(m.fileSize! / (1024*1024)).toFixed(2)} MB</p>
        </div>
        <a href={m.fileData} download={m.fileName} className="p-3 bg-black/5 hover:bg-black/10 rounded-2xl transition-all"><Download size={20}/></a>
      </div>
    );
  };

  return (
    <div className="flex bg-white rounded-3xl md:rounded-[48px] shadow-2xl border border-gray-100 overflow-hidden h-[80vh] md:h-[750px] animate-in slide-in-from-right duration-500">
      <div className={`flex-col bg-gray-50/20 border-r border-gray-50 transition-all duration-300 ${selectedContact ? 'hidden md:flex' : 'flex w-full'} md:w-80`}>
        <div className="p-6 md:p-8 border-b bg-white">
           <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">Messagerie</h3>
        </div>
        <div className="flex-grow overflow-y-auto">
          <button onClick={() => setSelectedContact('global')} className={`w-full p-4 md:p-6 text-left flex items-center gap-4 border-b border-gray-50 transition-all ${selectedContact === 'global' ? 'bg-ivoryGreen text-white' : 'hover:bg-gray-50'}`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${selectedContact === 'global' ? 'bg-white/20' : 'bg-ivoryOrange text-white'}`}>@</div>
            <div>
              <p className="font-black text-sm">Général</p>
              <p className={`text-[10px] uppercase font-bold ${selectedContact === 'global' ? 'text-white/60' : 'text-gray-400'}`}>Tous les membres</p>
            </div>
          </button>
          {contacts.map(u => {
            const unread = getUnreadCount(u.id);
            return (
            <button key={u.id} onClick={() => setSelectedContact(u)} className={`w-full p-4 md:p-6 text-left flex items-center gap-4 border-b border-gray-50 transition-all ${selectedContact !== 'global' && selectedContact?.id === u.id ? 'bg-ivoryGreen text-white' : 'hover:bg-gray-50'}`}>
              <div className="relative">
                <img src={u.avatar} className="w-12 h-12 rounded-2xl object-cover" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" title="En ligne"></div>
                {unread > 0 && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white animate-bounce shadow-sm">
                        {unread}
                    </div>
                )}
              </div>
              <div className="flex-grow">
                <div className="flex justify-between items-center">
                    <p className="font-black text-sm">{u.firstName} {u.name}</p>
                    {unread > 0 && <span className="w-2 h-2 bg-red-500 rounded-full"></span>}
                </div>
                <p className={`text-[10px] uppercase font-bold ${selectedContact !== 'global' && selectedContact?.id === u.id ? 'text-white/60' : 'text-gray-400'}`}>{u.role}</p>
              </div>
            </button>
            );
          })}
        </div>
      </div>

      <div className={`flex-grow flex-col bg-gray-50/50 relative ${selectedContact ? 'flex' : 'hidden md:flex'}`}>
        {selectedContact ? (
          <>
            <div className="p-4 md:p-8 bg-white border-b flex items-center justify-between shadow-sm relative z-10">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedContact(null)} className="md:hidden p-2 -ml-2 text-gray-400 hover:text-gray-900">
                  <ArrowLeft size={24} />
                </button>
                {selectedContact === 'global' ? (
                  <div className="w-14 h-14 rounded-2xl bg-ivoryOrange flex items-center justify-center text-white font-black text-xl shadow-lg">@</div>
                ) : (
                  <img src={selectedContact.avatar} className="w-14 h-14 rounded-2xl object-cover shadow-lg border-2 border-white" />
                )}
                <div>
                  <h4 className="font-black text-gray-900 text-lg tracking-tighter">{selectedContact === 'global' ? 'Discussion Plateforme' : `${selectedContact.firstName} ${selectedContact.name}`}</h4>
                  <p className="text-[10px] font-bold text-ivoryGreen uppercase tracking-widest">Connecté</p>
                </div>
              </div>
            </div>

            <div ref={scrollRef} className="flex-grow overflow-y-auto p-10 space-y-8 scroll-smooth">
              {chatMessages.map(m => (
                <div key={m.id} className={`flex ${m.fromId === currentUser.id ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                  <div className={`max-w-[80%] p-6 rounded-[32px] shadow-sm ${m.fromId === currentUser.id ? 'bg-ivoryGreen text-white rounded-br-none' : 'bg-white text-gray-900 rounded-bl-none border border-gray-100'}`}>
                    {m.toId === 'global' && m.fromId !== currentUser.id && (
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-60 block mb-2 border-b border-black/5 pb-1">
                        {storage.getUsers().find(u => u.id === m.fromId)?.firstName || 'Inconnu'}
                      </span>
                    )}
                    {m.text && <p className="font-bold text-sm leading-relaxed">{m.text}</p>}
                    {renderFilePreview(m)}
                    <span className="text-[9px] font-black opacity-40 block text-right mt-3 uppercase">{new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 md:p-8 bg-white border-t space-y-4">
              {file && (
                <div className="flex items-center gap-4 bg-ivoryOrange/5 p-4 rounded-3xl border-2 border-ivoryOrange/20 animate-in zoom-in">
                  <div className="w-12 h-12 bg-ivoryOrange/10 rounded-2xl flex items-center justify-center text-ivoryOrange">
                    <FileText size={24} />
                  </div>
                  <div className="flex-grow overflow-hidden">
                    <span className="block text-xs font-black truncate text-gray-900">{file.name}</span>
                    <span className="text-[10px] font-bold text-ivoryOrange uppercase">Prêt pour l'envoi</span>
                  </div>
                  <button onClick={() => setFile(null)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-all"><X size={20}/></button>
                </div>
              )}
              <div className="flex gap-2 md:gap-4">
                <div className="relative flex-grow">
                  <input value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Votre message..." className="w-full pl-6 md:pl-8 pr-12 md:pr-16 py-4 md:py-6 rounded-[24px] md:rounded-[32px] bg-gray-50 border-2 border-transparent focus:border-ivoryOrange focus:bg-white outline-none font-bold text-gray-900 text-sm md:text-base transition-all shadow-inner" />
                  <label className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-ivoryOrange transition-all cursor-pointer">
                    <Paperclip size={20} className="md:w-6 md:h-6" />
                    <input type="file" className="hidden" onChange={handleFileChange} accept="image/*,video/*,application/pdf" />
                  </label>
                </div>
                <button onClick={sendMessage} className="p-4 md:p-6 bg-ivoryGreen text-white rounded-[24px] md:rounded-[28px] shadow-xl hover:scale-110 active:scale-95 transition-all"><Send size={20} className="md:w-7 md:h-7" /></button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-gray-300 p-20 text-center">
            <div className="w-32 h-32 bg-gray-100 rounded-[48px] flex items-center justify-center mb-8">
              <MessageSquare size={64} className="opacity-20" />
            </div>
            <h3 className="text-3xl font-black uppercase tracking-[0.2em] text-gray-400">Messagerie Akwaba</h3>
            <p className="font-bold mt-4 text-gray-400 max-w-xs">Sélectionnez une discussion pour commencer à échanger.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
