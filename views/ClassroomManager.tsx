import React, { useState, useEffect, useRef } from 'react';
import { User, Classroom, UserRole } from '../types';
import { storage } from '../utils/storage';
import { Users, BookOpen, Plus, FileSpreadsheet, Download, QrCode, Search, Trash2, Edit, X, Save, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import { QRCodeCanvas } from 'qrcode.react';

interface ClassroomManagerProps {
    currentUser: User;
    onClose: () => void;
}

const ClassroomManager: React.FC<ClassroomManagerProps> = ({ currentUser, onClose }) => {
    const [activeTab, setActiveTab] = useState<'classes' | 'students' | 'import'>('classes');
    const [classes, setClasses] = useState<Classroom[]>([]);
    const [students, setStudents] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Class Editing State
    const [editingClass, setEditingClass] = useState<Partial<Classroom> | null>(null);

    // Import State
    const [importPreview, setImportPreview] = useState<any[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // QR Modal State
    const [selectedStudentQR, setSelectedStudentQR] = useState<User | null>(null);

    useEffect(() => {
        loadData();
        window.addEventListener('storage_update', loadData);
        return () => window.removeEventListener('storage_update', loadData);
    }, []);

    const loadData = () => {
        setClasses(storage.getClasses());
        setStudents(storage.getUsers().filter(u => u.role === UserRole.STUDENT));
    };

    // --- CLASS MANAGEMENT ---
    const handleSaveClass = () => {
        if (!editingClass?.name) return alert("Le nom de la classe est requis");

        const newClass: Classroom = {
            id: editingClass.id || crypto.randomUUID(),
            name: editingClass.name,
            description: editingClass.description || '',
            studentIds: editingClass.studentIds || [],
            courseIds: editingClass.courseIds || [],
            createdBy: editingClass.createdBy || currentUser.id,
            createdAt: editingClass.createdAt || new Date().toISOString()
        };

        const updatedClasses = editingClass.id 
            ? classes.map(c => c.id === editingClass.id ? newClass : c)
            : [...classes, newClass];

        storage.saveClasses(updatedClasses);
        setEditingClass(null);
    };

    const handleDeleteClass = (id: string) => {
        if (window.confirm("Supprimer cette classe ?")) {
            const updated = classes.filter(c => c.id !== id);
            storage.saveClasses(updated);
        }
    };

    // --- IMPORT MANAGEMENT ---
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);
            setImportPreview(data);
        };
        reader.readAsBinaryString(file);
    };

    const processImport = () => {
        if (!importPreview.length) return;

        const newUsers: User[] = [];
        const currentUsers = storage.getUsers();

        importPreview.forEach((row: any) => {
            // Expected columns: Name, FirstName, Email (optional)
            const name = row['Nom'] || row['Name'];
            const firstName = row['Prénom'] || row['FirstName'] || '';
            const email = row['Email'] || `${name.toLowerCase()}.${firstName.toLowerCase()}@akwaba.lms`; // Generate dummy email if missing
            
            // Check if user exists
            if (currentUsers.some(u => u.email === email)) return;

            const newUser: User = {
                id: crypto.randomUUID(),
                studentId: storage.generateStudentId(),
                name: name,
                firstName: firstName,
                email: email,
                role: UserRole.STUDENT,
                avatar: `https://ui-avatars.com/api/?name=${name}+${firstName}&background=random`,
                createdAt: new Date().toISOString()
            };
            newUsers.push(newUser);
        });

        if (newUsers.length > 0) {
            storage.saveUsers([...currentUsers, ...newUsers]);
            alert(`${newUsers.length} étudiants importés avec succès !`);
            setImportPreview([]);
            setActiveTab('students');
        } else {
            alert("Aucun nouvel étudiant à importer (doublons détectés ou fichier vide).");
        }
    };

    const downloadQR = () => {
        const canvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement;
        if (canvas) {
            const pngUrl = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.href = pngUrl;
            downloadLink.download = `qrcode_${selectedStudentQR?.studentId}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-50 z-50 overflow-hidden flex flex-col animate-in fade-in">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <Users className="text-ivoryOrange"/> Gestion des Classes
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">Gérez vos salles de classe et importez vos étudiants</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X size={24} className="text-gray-400"/>
                </button>
            </div>

            {/* Content */}
            <div className="flex-grow flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-64 bg-white border-r border-gray-200 flex flex-col py-6">
                    <nav className="space-y-1 px-4">
                        <button onClick={() => setActiveTab('classes')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'classes' ? 'bg-orange-50 text-ivoryOrange' : 'text-gray-500 hover:bg-gray-50'}`}>
                            <BookOpen size={20}/> Salles de Classe
                        </button>
                        <button onClick={() => setActiveTab('students')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'students' ? 'bg-orange-50 text-ivoryOrange' : 'text-gray-500 hover:bg-gray-50'}`}>
                            <Users size={20}/> Liste Étudiants
                        </button>
                        <button onClick={() => setActiveTab('import')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'import' ? 'bg-orange-50 text-ivoryOrange' : 'text-gray-500 hover:bg-gray-50'}`}>
                            <FileSpreadsheet size={20}/> Importer Excel
                        </button>
                    </nav>
                </div>

                {/* Main View */}
                <div className="flex-grow bg-gray-50 p-8 overflow-y-auto">
                    
                    {/* --- CLASSES TAB --- */}
                    {activeTab === 'classes' && (
                        <div className="max-w-5xl mx-auto">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-xl font-black text-gray-800">Toutes les classes</h2>
                                <button onClick={() => setEditingClass({})} className="bg-ivoryOrange text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2">
                                    <Plus size={18}/> Créer une classe
                                </button>
                            </div>

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {classes.map(cls => (
                                    <div key={cls.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-ivoryOrange transition-colors group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-ivoryOrange">
                                                <BookOpen size={24}/>
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => setEditingClass(cls)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><Edit size={16}/></button>
                                                <button onClick={() => handleDeleteClass(cls.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-400"><Trash2 size={16}/></button>
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-lg text-gray-900 mb-2">{cls.name}</h3>
                                        <p className="text-gray-500 text-sm mb-6 line-clamp-2">{cls.description || "Aucune description"}</p>
                                        <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                                            <span className="flex items-center gap-1"><Users size={14}/> {cls.studentIds.length} élèves</span>
                                            <span className="flex items-center gap-1"><BookOpen size={14}/> {cls.courseIds.length} cours</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- STUDENTS TAB --- */}
                    {activeTab === 'students' && (
                        <div className="max-w-5xl mx-auto">
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-6 border-b border-gray-100 flex items-center gap-4">
                                    <div className="relative flex-grow max-w-md">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                                        <input 
                                            type="text" 
                                            placeholder="Rechercher un étudiant..." 
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 ring-ivoryOrange/20 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wider font-bold text-left">
                                            <tr>
                                                <th className="px-6 py-4">Étudiant</th>
                                                <th className="px-6 py-4">Email</th>
                                                <th className="px-6 py-4">Matricule</th>
                                                <th className="px-6 py-4">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map(student => (
                                                <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden">
                                                                <img src={student.avatar} className="w-full h-full object-cover"/>
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-gray-900">{student.name} {student.firstName}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">{student.email}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-bold font-mono">
                                                            {student.studentId || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <button onClick={() => setSelectedStudentQR(student)} className="text-gray-400 hover:text-ivoryOrange transition-colors" title="Voir QR Code">
                                                            <QrCode size={20}/>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- IMPORT TAB --- */}
                    {activeTab === 'import' && (
                        <div className="max-w-3xl mx-auto">
                            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
                                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                                    <FileSpreadsheet size={40}/>
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 mb-2">Importer des étudiants</h2>
                                <p className="text-gray-500 mb-8 max-w-md mx-auto">Téléchargez un fichier Excel (.xlsx) contenant les colonnes : <strong>Nom</strong>, <strong>Prénom</strong>, <strong>Email</strong> (optionnel).</p>
                                
                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls" className="hidden" />
                                <button onClick={() => fileInputRef.current?.click()} className="bg-gray-900 text-white px-8 py-4 rounded-xl font-bold shadow-xl hover:scale-105 transition-all mb-4">
                                    Sélectionner un fichier
                                </button>
                                
                                {importPreview.length > 0 && (
                                    <div className="mt-8 text-left animate-in fade-in slide-in-from-bottom-4">
                                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <Check className="text-green-500" size={18}/> {importPreview.length} étudiants détectés
                                        </h3>
                                        <div className="bg-gray-50 rounded-xl p-4 max-h-60 overflow-y-auto mb-6 text-sm">
                                            {importPreview.map((row, i) => (
                                                <div key={i} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                                                    <span className="font-medium">{row['Nom'] || row['Name']} {row['Prénom'] || row['FirstName']}</span>
                                                    <span className="text-gray-400">{row['Email'] || 'Email généré auto'}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={processImport} className="w-full bg-ivoryGreen text-white py-4 rounded-xl font-black shadow-lg shadow-green-100 hover:scale-[1.02] transition-all">
                                            CONFIRMER L'IMPORTATION
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Class Modal */}
            {editingClass && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-black text-gray-900 mb-6">{editingClass.id ? 'Modifier la classe' : 'Nouvelle classe'}</h3>
                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Nom de la classe</label>
                                <input 
                                    type="text" 
                                    value={editingClass.name || ''} 
                                    onChange={e => setEditingClass({...editingClass, name: e.target.value})}
                                    className="w-full p-4 bg-gray-50 rounded-xl font-bold outline-none focus:ring-2 ring-ivoryOrange/20"
                                    placeholder="Ex: Classe A - Développement Web"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Description</label>
                                <textarea 
                                    value={editingClass.description || ''} 
                                    onChange={e => setEditingClass({...editingClass, description: e.target.value})}
                                    className="w-full p-4 bg-gray-50 rounded-xl font-medium outline-none focus:ring-2 ring-ivoryOrange/20 h-32 resize-none"
                                    placeholder="Description de la classe..."
                                />
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setEditingClass(null)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors">Annuler</button>
                            <button onClick={handleSaveClass} className="flex-1 py-3 bg-ivoryOrange text-white font-bold rounded-xl shadow-lg shadow-orange-100 hover:scale-105 transition-all">Enregistrer</button>
                        </div>
                    </div>
                </div>
            )}

            {/* QR Code Modal */}
            {selectedStudentQR && (
                <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 animate-in zoom-in-95">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center relative">
                        <button onClick={() => setSelectedStudentQR(null)} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20}/></button>
                        
                        <div className="w-20 h-20 rounded-full bg-gray-100 mx-auto mb-4 overflow-hidden border-4 border-white shadow-lg">
                            <img src={selectedStudentQR.avatar} className="w-full h-full object-cover"/>
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-1">{selectedStudentQR.name} {selectedStudentQR.firstName}</h3>
                        <p className="text-gray-400 font-medium text-sm mb-8">{selectedStudentQR.studentId}</p>

                        <div className="bg-white p-4 rounded-2xl shadow-inner border border-gray-100 inline-block mb-8">
                             <QRCodeCanvas 
                                id="qr-code-canvas"
                                value={JSON.stringify({ 
                                    type: 'akwaba_login', 
                                    studentId: selectedStudentQR.studentId, 
                                    secret: selectedStudentQR.id // In production, use a secure token!
                                })} 
                                size={200}
                                level={"H"}
                                includeMargin={true}
                            />
                        </div>

                        <button onClick={downloadQR} className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-colors">
                            <Download size={18}/> Télécharger le QR
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassroomManager;