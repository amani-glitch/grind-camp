import React, { useState } from 'react';
import { DRILLS } from '../data/stageConfig';

const PrivateDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'drills' | 'messages'>('schedule');

  // Hardcoded Schedule
  const SCHEDULE = [
    { time: '09:00', activity: 'Accueil & Échauffement proprioceptif' },
    { time: '09:45', activity: 'Atelier 1 : Handle & Dextérité' },
    { time: '11:00', activity: 'Atelier 2 : Finitions' },
    { time: '12:30', activity: 'Repas & Repos' },
    { time: '14:00', activity: 'Jeux réduits & Lecture (3x3)' },
    { time: '16:00', activity: 'Concours / Matchs' },
    { time: '17:00', activity: 'Fin de journée' },
  ];

  return (
    <div className="min-h-screen bg-grind-black text-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-grind-fire to-grind-orange p-6 md:p-10">
        <h1 className="font-display text-4xl uppercase mb-2">Tableau de bord</h1>
        <p className="font-subhead opacity-90 tracking-wide">Bienvenue dans la zone de travail.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 bg-grind-dark">
        {[
          { id: 'schedule', label: 'Planning', icon: '📅' },
          { id: 'drills', label: 'Drills', icon: '🏀' },
          { id: 'messages', label: 'Coach', icon: '💬' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-4 text-center font-subhead uppercase tracking-wider text-sm transition-colors ${activeTab === tab.id ? 'bg-grind-black border-t-2 border-grind-orange text-white' : 'text-gray-500 hover:text-white'}`}
          >
            <span className="md:hidden mr-1">{tab.icon}</span>
            <span className="hidden md:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="container mx-auto px-4 py-8">
        
        {/* SCHEDULE */}
        {activeTab === 'schedule' && (
          <div className="max-w-2xl mx-auto animate-fade-in">
            <h2 className="font-display text-2xl mb-6 text-grind-orange">Journée Type</h2>
            <div className="space-y-4 relative">
              <div className="absolute left-[7px] top-4 bottom-4 w-0.5 bg-white/10"></div>
              {SCHEDULE.map((item, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-4 h-4 rounded-full bg-grind-orange mt-1.5 relative z-10 ring-4 ring-black"></div>
                  <div className="bg-grind-dark p-4 rounded border border-white/5 w-full">
                    <span className="text-grind-orange font-bold font-mono">{item.time}</span>
                    <p className="text-gray-300">{item.activity}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 p-4 bg-blue-900/20 border border-blue-500/20 rounded">
              <p className="text-sm text-blue-200">ℹ️ Mercredi après-midi : Départ 13h30 pour Wave Island.</p>
            </div>
          </div>
        )}

        {/* DRILLS */}
        {activeTab === 'drills' && (
          <div className="animate-fade-in">
             <h2 className="font-display text-2xl mb-6 text-grind-orange">Bibliothèque d'exercices</h2>
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {DRILLS.map(drill => (
                  <div key={drill.id} className="bg-grind-dark p-6 rounded border border-white/10 hover:border-grind-orange transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${drill.category === 'Handle' ? 'bg-purple-900 text-purple-200' : drill.category === 'Finition' ? 'bg-orange-900 text-orange-200' : 'bg-blue-900 text-blue-200'}`}>
                        {drill.category}
                      </span>
                      <div className="flex gap-0.5">
                        {[1,2,3].map(s => (
                          <div key={s} className={`w-1.5 h-4 rounded-sm ${s <= drill.difficulty ? 'bg-grind-orange' : 'bg-gray-700'}`}></div>
                        ))}
                      </div>
                    </div>
                    <h3 className="font-display text-xl mb-2">{drill.title}</h3>
                    <p className="text-sm text-gray-400 mb-4">{drill.description}</p>
                    <button className="text-xs uppercase font-bold text-white border-b border-grind-orange pb-0.5 hover:text-grind-orange">Voir la vidéo (Bientôt)</button>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* MESSAGES (POC) */}
        {activeTab === 'messages' && (
          <div className="max-w-2xl mx-auto animate-fade-in text-center py-12">
             <div className="w-20 h-20 bg-grind-gray rounded-full mx-auto flex items-center justify-center text-4xl mb-6">💬</div>
             <h2 className="font-display text-2xl mb-4">Ligne Directe</h2>
             <p className="text-gray-400 mb-8">Pose une question technique aux coachs. Ils te répondront ici.</p>
             <textarea className="w-full bg-grind-dark border border-white/20 rounded p-4 text-white mb-4 h-32" placeholder="Ta question..."></textarea>
             <button className="bg-white text-black font-display uppercase px-8 py-3 hover:bg-gray-200">Envoyer</button>
          </div>
        )}

      </div>
    </div>
  );
};

export default PrivateDashboard;