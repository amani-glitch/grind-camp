import React from 'react';
import { COACHES } from '../data/stageConfig';

const Team: React.FC = () => {
  return (
    <div className="min-h-screen bg-grind-black py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-5xl font-display text-white text-center mb-4 uppercase">L'Encadrement</h1>
        <p className="text-center text-gray-400 max-w-2xl mx-auto mb-16 text-lg">
          Une équipe choisie pour ses compétences techniques et son exigence.
          <br/>
          <span className="text-white font-bold">4 Coachs pour 45 joueurs maximum</span> : un taux d'encadrement exceptionnel pour garantir un suivi personnalisé et des corrections en temps réel.
        </p>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12 max-w-5xl mx-auto">
          {COACHES.map((coach, index) => {
            return (
              <div key={index} className="bg-grind-dark rounded-xl overflow-hidden border border-white/10 hover:border-grind-orange/50 transition-all group flex flex-col md:flex-row shadow-lg">
                <div className="md:w-2/5 relative overflow-hidden h-[300px] md:h-auto">
                  <img 
                    src={coach.image} 
                    alt={coach.name} 
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-grind-dark/90 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-grind-dark opacity-80 md:opacity-100"></div>
                </div>
                <div className="p-6 md:w-3/5 flex flex-col justify-center relative z-10">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {coach.tags.map(tag => (
                      <span key={tag} className="text-xs font-bold bg-grind-orange text-black px-2 py-1 rounded-sm uppercase">{tag}</span>
                    ))}
                  </div>
                  <h2 className="text-2xl font-display text-white uppercase mb-1">{coach.name}</h2>
                  <h3 className="text-grind-orange font-subhead uppercase tracking-widest text-sm mb-4">{coach.role}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {coach.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Team;