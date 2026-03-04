import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { CONFIG, COACHES } from '../data/stageConfig';
import { storageService } from '../services/storageService';
import { googleSheetsService } from '../services/googleSheetsService';

const Home: React.FC = () => {
  const [customImages, setCustomImages] = useState<Record<string, string>>({});
  const [placesRestantes, setPlacesRestantes] = useState<number>(CONFIG.maxCapacity);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(true);

  useEffect(() => {
    setCustomImages(storageService.getCoachImages());

    // Charger le nombre de places depuis Google Sheets (avec fallback local)
    const fetchPlaces = async () => {
      try {
        const sheetsData = await googleSheetsService.getPlacesRestantes();
        if (sheetsData) {
          setPlacesRestantes(sheetsData.placesRestantes);
        } else {
          // Fallback : utiliser le calcul local
          const status = await storageService.getCapacityStatus();
          setPlacesRestantes(status.max - status.current);
        }
      } catch {
        // Fallback silencieux
        setPlacesRestantes(CONFIG.maxCapacity);
      } finally {
        setIsLoadingPlaces(false);
      }
    };
    fetchPlaces();
  }, []);

  return (
    <div className="flex flex-col">
      {/* HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background with overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://grindcamp-cmnxxpe2.manus.space/images/hero-bg.jpg" 
            alt="Basketball court dark" 
            className="w-full h-full object-cover opacity-40 grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-grind-black via-grind-black/80 to-transparent"></div>
          <div className="absolute inset-0 bg-grunge-texture opacity-30 mix-blend-overlay"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          
          {/* URGENCY BADGE WITH EXPLOSION ANIMATION */}
          <div className="mb-10 flex justify-center">
             <div className="relative animate-explosion">
               {/* Glowing background effect */}
               <div className="absolute inset-0 bg-red-600 blur-xl opacity-50 animate-pulse"></div>
               
               <div className="relative bg-red-600 text-white px-8 py-4 rounded-lg transform -skew-x-12 border-2 border-white/20 shadow-[0_0_50px_rgba(220,38,38,0.8)] flex flex-col items-center">
                 <span className="font-subhead uppercase text-xs tracking-[0.2em] mb-1 text-red-100">Attention</span>
                 <span className="font-display text-2xl md:text-4xl uppercase tracking-wider leading-none">
                   🔥 Plus que {isLoadingPlaces ? '...' : placesRestantes} places !
                 </span>
                 <span className="text-[10px] uppercase font-bold mt-1 animate-pulse">Inscription Immédiate Recommandée</span>
               </div>
             </div>
          </div>

          <div className="inline-flex items-center gap-3 border border-grind-orange/50 bg-black/50 backdrop-blur px-6 py-2 rounded-full mb-6 animate-fade-in animation-delay-500">
            <span className="text-grind-orange text-lg">★</span>
            <span className="text-white font-subhead uppercase tracking-widest text-sm">Session Premium • Août 2026</span>
            <span className="text-grind-orange text-lg">★</span>
          </div>
          
          <h1 className="font-display text-6xl md:text-8xl lg:text-9xl text-white uppercase tracking-tighter leading-none mb-6 drop-shadow-2xl animate-fade-in-up">
            THE <span className="text-transparent bg-clip-text bg-gradient-to-br from-grind-orange to-grind-fire">GRIND</span> CAMP
          </h1>
          
          <p className="font-subhead text-xl md:text-2xl text-gray-300 tracking-[0.3em] uppercase mb-10 animate-fade-in-up delay-100">
            {CONFIG.tagline}
          </p>

          <div className="flex flex-col md:flex-row gap-4 justify-center items-center animate-fade-in-up delay-200">
            <Link to="/inscription">
              <Button className="text-lg px-10 py-4 shadow-grind-orange/50 shadow-lg hover:scale-105 transition-transform">
                S'inscrire au stage
              </Button>
            </Link>
            <Link to="/encadrement">
              <Button variant="outline" className="text-lg px-10 py-4">
                Découvrir le staff
              </Button>
            </Link>
          </div>
          
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto border-t border-white/10 pt-8 animate-fade-in delay-300">
            <div className="text-center">
              <span className="block font-display text-3xl text-white">5</span>
              <span className="text-xs text-gray-500 uppercase tracking-widest">Jours intenses</span>
            </div>
            <div className="text-center">
              <span className="block font-display text-3xl text-white">4</span>
              <span className="text-xs text-gray-500 uppercase tracking-widest">Coachs Diplômés</span>
            </div>
            <div className="text-center">
              <span className="block font-display text-3xl text-white text-grind-orange">{CONFIG.maxCapacity}</span>
              <span className="text-xs text-gray-500 uppercase tracking-widest">Places Max</span>
            </div>
            <div className="text-center">
              <span className="block font-display text-3xl text-white">100%</span>
              <span className="text-xs text-gray-500 uppercase tracking-widest">Passion</span>
            </div>
          </div>
        </div>
      </section>

      {/* PHILOSOPHY SECTION */}
      <section className="py-20 bg-grind-dark relative border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display text-4xl md:text-5xl text-white mb-6 uppercase">
                Pas de magie.<br/>Juste du <span className="text-grind-orange">travail</span>.
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed mb-6">
                Le Grind Camp n'est pas une colonie de vacances. C'est un stage de perfectionnement <strong>exclusivement basé</strong> sur deux thématiques fondamentales :
                le <strong className="text-white">Handle</strong> (maîtrise du ballon) et la <strong className="text-white">Finition proche du panier</strong>.
              </p>
              <ul className="space-y-4">
                {['Approche Analytique & Jeu', 'Transfert en situation de match', 'Travail de Continuité (Traversées)', 'Efficacité Réelle'].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-grind-orange flex items-center justify-center text-black text-xs font-bold">✓</span>
                    <span className="font-subhead uppercase tracking-wide text-white">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-grind-orange/20 blur-xl rounded-lg"></div>
              <img 
                src="https://grindcamp-cmnxxpe2.manus.space/images/training-bg.jpg" 
                alt="Training session" 
                className="relative rounded-lg shadow-2xl border border-white/10 grayscale hover:grayscale-0 transition-all duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT / FEATURES */}
      <section className="py-20 bg-grind-black">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-4xl text-center text-white mb-6 uppercase">Contenu Technique</h2>
          <p className="text-center text-gray-400 max-w-2xl mx-auto mb-16">
            L'objectif est clair : transformer le travail technique en <span className="text-grind-orange font-bold">efficacité réelle</span> en situation de match.
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            <Link to="/programme/handle" className="block">
              <div className="h-full bg-grind-dark p-10 rounded border border-white/5 hover:border-grind-orange/50 transition-all hover:transform hover:-translate-y-2 group cursor-pointer relative overflow-hidden">
                 <div className="absolute inset-0 bg-grind-orange/0 group-hover:bg-grind-orange/5 transition-colors"></div>
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-gray-800 rounded-full mb-6 flex items-center justify-center text-4xl group-hover:bg-grind-orange group-hover:text-black transition-colors shadow-lg">🏀</div>
                  <h3 className="font-display text-3xl text-white mb-4 group-hover:text-grind-orange transition-colors">Elite Handle</h3>
                  <p className="text-gray-400 mb-6 leading-relaxed">
                    Un travail progressif : de l'analytique pur vers l'intégration en situation de jeu.
                    Développement de la dextérité, du rythme et de la dissociation pour ne plus subir la pression.
                  </p>
                  <span className="text-grind-orange text-sm uppercase font-bold tracking-widest border-b-2 border-grind-orange pb-1">Détails du module &rarr;</span>
                </div>
              </div>
            </Link>

            <Link to="/programme/finition" className="block">
              <div className="h-full bg-grind-dark p-10 rounded border border-white/5 hover:border-grind-orange/50 transition-all hover:transform hover:-translate-y-2 group cursor-pointer relative overflow-hidden">
                <div className="absolute inset-0 bg-grind-orange/0 group-hover:bg-grind-orange/5 transition-colors"></div>
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-gray-800 rounded-full mb-6 flex items-center justify-center text-4xl group-hover:bg-grind-orange group-hover:text-black transition-colors shadow-lg">⚡</div>
                  <h3 className="font-display text-3xl text-white mb-4 group-hover:text-grind-orange transition-colors">Finition & Efficacité</h3>
                  <p className="text-gray-400 mb-6 leading-relaxed">
                    Focus sur la zone proche du panier. Travail de continuité sur traversées de terrain pour développer 
                    la lecture de jeu, la maîtrise en course et l'efficacité au contact.
                  </p>
                  <span className="text-grind-orange text-sm uppercase font-bold tracking-widest border-b-2 border-grind-orange pb-1">Détails du module &rarr;</span>
                </div>
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* COACHES PREVIEW */}
      <section className="py-20 bg-gradient-to-b from-grind-dark to-grind-black border-y border-white/5">
        <div className="container mx-auto px-4">
           <div className="flex justify-between items-end mb-12">
             <h2 className="font-display text-4xl text-white uppercase">Le Staff</h2>
             <Link to="/encadrement" className="text-grind-orange font-subhead uppercase tracking-widest text-sm hover:text-white transition-colors">Voir tout l'équipe &rarr;</Link>
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {COACHES.map((coach) => {
               const displayImage = customImages[coach.name] || coach.image;
               return (
                 <div key={coach.name} className="group relative overflow-hidden rounded-lg aspect-[3/4]">
                   <img src={displayImage} alt={coach.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90"></div>
                   <div className="absolute bottom-0 left-0 p-4 w-full">
                     <p className="text-grind-orange font-subhead uppercase text-xs tracking-wider mb-1">{coach.role}</p>
                     <h3 className="text-white font-display text-xl uppercase leading-none">{coach.name}</h3>
                   </div>
                 </div>
               );
             })}
           </div>
        </div>
      </section>

      {/* PREMIUM PACKAGE / INCLUDED */}
      <section className="py-24 bg-grind-black relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full bg-grind-orange/5 blur-3xl rounded-full pointer-events-none"></div>

        <div className="container mx-auto px-4 max-w-5xl relative z-10">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl md:text-5xl text-white uppercase mb-4">L'Expérience <span className="text-grind-orange">Premium</span></h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Nous ne proposons pas un simple stage, mais une prestation complète de haut niveau. 
              Zéro coût caché, une qualité de service professionnelle.
            </p>
          </div>

          <div className="bg-neutral-900/80 backdrop-blur rounded-2xl p-8 md:p-12 border border-grind-orange/30 relative overflow-hidden shadow-[0_0_50px_rgba(255,106,0,0.1)]">
             
             {/* Badge */}
             <div className="absolute top-0 right-0 bg-grind-orange text-black font-bold font-subhead uppercase text-xs px-4 py-2 rounded-bl-lg">
               Tout inclus
             </div>

             <div className="grid md:grid-cols-2 gap-12 items-center">
               <div className="space-y-8">
                 <div className="space-y-6">
                   
                   {/* Item 1 */}
                   <div className="flex gap-4">
                     <div className="flex-shrink-0 w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-2xl border border-white/10">🍽️</div>
                     <div>
                       <h4 className="text-white font-display uppercase text-lg">Restauration Complète</h4>
                       <p className="text-gray-400 text-sm leading-relaxed">Repas du midi sain et équilibré + collation inclus. Pas besoin de préparer un pique-nique.</p>
                     </div>
                   </div>

                   {/* Item 2 */}
                   <div className="flex gap-4">
                     <div className="flex-shrink-0 w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-2xl border border-white/10">👕</div>
                     <div>
                       <h4 className="text-white font-display uppercase text-lg">Pack Équipement</h4>
                       <p className="text-gray-400 text-sm leading-relaxed">Chaque joueur reçoit une tenue d'entraînement complète (Short + Maillot) et le T-shirt officiel du camp.</p>
                     </div>
                   </div>

                   {/* Item 3 */}
                   <div className="flex gap-4">
                     <div className="flex-shrink-0 w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-2xl border border-white/10">🌊</div>
                     <div>
                       <h4 className="text-white font-display uppercase text-lg">Sortie Wave Island</h4>
                       <p className="text-gray-400 text-sm leading-relaxed">Après-midi détente offerte le mercredi : Entrée parc + Transport inclus pour la récupération.</p>
                     </div>
                   </div>

                 </div>
               </div>

               {/* Price Card */}
               <div className="flex flex-col justify-center items-center text-center bg-black/60 rounded-xl p-8 border border-white/10 relative">
                  <div className="absolute -top-3 bg-white text-black font-bold uppercase text-xs px-3 py-1 rounded-full tracking-wider">
                    Tarif Unique
                  </div>
                  <div className="font-display text-7xl text-white mb-2">{CONFIG.price}€</div>
                  <p className="text-gray-400 text-sm mb-6 uppercase tracking-widest">La semaine complète</p>
                  
                  <div className="w-full h-px bg-white/10 mb-6"></div>
                  
                  <ul className="text-left text-sm text-gray-300 space-y-2 mb-8 w-full px-4">
                    <li className="flex justify-between"><span>Encadrement Pro</span> <span>✓</span></li>
                    <li className="flex justify-between"><span>Assurance</span> <span>✓</span></li>
                    <li className="flex justify-between"><span>Pack Photos/Vidéos</span> <span>✓</span></li>
                  </ul>

                  <Link to="/inscription" className="w-full">
                    <Button fullWidth className="animate-pulse shadow-grind-orange/20">Réserver ma place</Button>
                  </Link>
                  <p className="text-gray-500 text-[10px] mt-3">Paiement sécurisé ultérieur (Virement/Chèque)</p>
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* WAVE ISLAND TEASER (Simplified since it's now in the premium pack) */}
      <section className="py-16 bg-blue-900/10 border-y border-blue-500/20 relative overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <span className="text-blue-400 font-subhead uppercase tracking-widest text-sm mb-2 block">Récupération & Fun</span>
          <h2 className="font-display text-4xl text-white uppercase mb-4">Le Mercredi c'est Wave Island</h2>
          <p className="text-gray-300 max-w-2xl mx-auto mb-8">
            Parce que la performance passe aussi par la récupération mentale. Une demi-journée de cohésion inoubliable offerte à tous les stagiaires.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;