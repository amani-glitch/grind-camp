import React from 'react';
import { CONFIG } from '../data/stageConfig';
import { Button } from '../components/Button';

const Contact: React.FC = () => {
  return (
    <div className="min-h-screen bg-grind-black py-12">
      <div className="container mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-display text-white mb-4 uppercase">Contactez-nous</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Une question sur le stage, l'inscription ou la logistique ?<br/>
            L'équipe du Grind Camp est à votre disposition.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          
          {/* Info Card */}
          <div className="bg-grind-dark p-8 rounded-xl border border-white/10 shadow-2xl space-y-8">
            
            {/* Referent */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-grind-orange/20 rounded-full flex items-center justify-center text-2xl">
                👨‍💼
              </div>
              <div>
                <h3 className="font-display text-xl text-white uppercase">Référent Sportif</h3>
                <p className="text-grind-orange font-bold text-lg">Pascal MERCIER</p>
                <p className="text-gray-400 text-sm">Responsable du stage & Head Coach</p>
              </div>
            </div>

            <div className="border-t border-white/5 my-4"></div>

            {/* Coordinates */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center text-xl">📞</div>
                <div>
                  <h4 className="text-gray-400 text-xs uppercase tracking-wider mb-1">Téléphone</h4>
                  <a href={`tel:${CONFIG.contact.phone.replace(/ /g, '')}`} className="text-white text-lg hover:text-grind-orange transition-colors">
                    {CONFIG.contact.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center text-xl">✉️</div>
                <div>
                  <h4 className="text-gray-400 text-xs uppercase tracking-wider mb-1">Email</h4>
                  <a href={`mailto:${CONFIG.contact.email}`} className="text-white text-lg hover:text-grind-orange transition-colors">
                    {CONFIG.contact.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center text-xl">📍</div>
                <div>
                  <h4 className="text-gray-400 text-xs uppercase tracking-wider mb-1">Lieu du Stage</h4>
                  <p className="text-white text-lg leading-tight">
                    Complexe Sportif Paul de Vivie<br/>
                    391 Avenue René Char<br/>
                    <span className="text-grind-orange">84210 Pernes-les-Fontaines</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Button fullWidth onClick={() => window.location.href = `mailto:${CONFIG.contact.email}`}>
                Envoyer un email
              </Button>
            </div>
          </div>

          {/* Map & Form Placeholder */}
          <div className="space-y-8">
            {/* Fake Map */}
            <div className="w-full h-64 bg-gray-800 rounded-xl overflow-hidden relative group border border-white/10">
              <img 
                src="https://grindcamp-cmnxxpe2.manus.space/images/cta-bg.jpg" 
                alt="Carte Pernes les Fontaines" 
                className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <a 
                  href="https://www.google.com/maps/search/?api=1&query=Complexe+Sportif+Paul+de+Vivie+Pernes-les-Fontaines" 
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-white text-black px-4 py-2 rounded font-bold uppercase hover:bg-grind-orange hover:text-white transition-colors shadow-lg"
                >
                  Voir sur Google Maps
                </a>
              </div>
            </div>

            {/* Socials */}
            <div className="bg-gradient-to-r from-grind-fire to-grind-orange p-8 rounded-xl text-white text-center">
              <h3 className="font-display text-2xl uppercase mb-2">Suivez le Grind</h3>
              <p className="mb-6 opacity-90 text-sm">Photos, vidéos et actus du camp sur nos réseaux.</p>
              <div className="flex justify-center gap-4">
                <a href="#" className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-white hover:text-grind-orange transition-colors text-2xl">📸</a>
                <a href="#" className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-white hover:text-grind-orange transition-colors text-2xl">📘</a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Contact;