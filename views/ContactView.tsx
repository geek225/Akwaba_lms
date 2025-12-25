import React from 'react';
import { Mail, Phone, MapPin, Globe } from 'lucide-react';

const ContactView: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 md:py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10 md:mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 md:mb-6 tracking-tighter">Contactez-nous</h1>
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto">
            Une question ? Un partenariat ? Nous sommes à votre écoute pour bâtir ensemble l'avenir de l'éducation en Côte d'Ivoire.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          <div className="bg-white p-6 md:p-10 rounded-[32px] md:rounded-[48px] shadow-xl border border-gray-100">
            <h3 className="text-xl md:text-2xl font-black mb-6 md:mb-8 text-ivoryOrange">Nos Coordonnées</h3>
            <div className="space-y-6 md:space-y-8">
              <div className="flex items-center gap-4 md:gap-6">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-ivoryOrange shrink-0">
                  <Mail size={24} className="md:w-7 md:h-7" />
                </div>
                <div>
                  <p className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">Email</p>
                  <a href="mailto:contact@akwaba.ci" className="text-base md:text-lg font-bold text-gray-900 hover:text-ivoryOrange transition-colors break-all">contact@akwaba.ci</a>
                </div>
              </div>

              <div className="flex items-center gap-4 md:gap-6">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-green-50 flex items-center justify-center text-ivoryGreen shrink-0">
                  <Phone size={24} className="md:w-7 md:h-7" />
                </div>
                <div>
                  <p className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">Téléphone</p>
                  <a href="tel:+2250700000000" className="text-base md:text-lg font-bold text-gray-900 hover:text-ivoryGreen transition-colors">+225 07 00 00 00 00</a>
                </div>
              </div>

              <div className="flex items-center gap-4 md:gap-6">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-ivoryOrange shrink-0">
                  <MapPin size={24} className="md:w-7 md:h-7" />
                </div>
                <div>
                  <p className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">Adresse</p>
                  <p className="text-base md:text-lg font-bold text-gray-900">Cocody, Abidjan, Côte d'Ivoire</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-ivoryGreen text-white p-6 md:p-10 rounded-[32px] md:rounded-[48px] shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
             <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                    <h3 className="text-2xl font-black mb-4">Rejoignez la communauté</h3>
                    <p className="text-green-100 font-medium leading-relaxed mb-8">
                        Suivez-nous sur nos réseaux sociaux pour ne rien manquer de nos actualités et événements.
                    </p>
                </div>
                <div className="flex gap-4">
                    <a href="#" className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white hover:text-ivoryGreen transition-all">
                        <Globe size={24}/>
                    </a>
                    {/* Add more social icons as needed */}
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactView;
