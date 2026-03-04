import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '../components/Button';

const TOPICS: Record<string, any> = {
  handle: {
    title: "Elite Handle",
    subtitle: "Maîtrise & Situations de Jeu",
    icon: "🏀",
    description: "Le stage base son travail sur une approche progressive : nous commençons par des exercices analytiques pour construire la technique, puis nous les intégrons rapidement à des situations de jeu pour développer la capacité à utiliser ces armes sous pression.",
    image: "https://grindcamp-cmnxxpe2.manus.space/images/training-bg.jpg",
    modules: [
      {
        title: "Approche Analytique",
        content: "Travail de détail sur la mécanique du dribble. Pound, dissociation, rythme, changements de hauteur. L'objectif est de rendre le ballon transparent."
      },
      {
        title: "Intégration en Jeu",
        content: "Transposition immédiate des acquis face à une défense. Apprendre à utiliser le dribble pour créer un avantage, pas juste pour dribbler."
      },
      {
        title: "Travail de Continuité",
        content: "Exercices sur traversées de terrain pour développer la maîtrise du ballon en pleine course et la prise d'information (tête levée)."
      }
    ],
    outcome: "Transformer la technique pure en une arme offensive utilisable en match."
  },
  finition: {
    title: "Finition & Efficacité",
    subtitle: "Proche du Panier & Lecture",
    icon: "⚡",
    description: "L'objectif final est l'efficacité réelle. Nous mettons en place un travail de continuité qui lie le dribble à la finition pour développer la lecture de jeu et la capacité à scorer malgré le contact ou les aides défensives.",
    image: "https://grindcamp-cmnxxpe2.manus.space/images/cta-bg.jpg",
    modules: [
      {
        title: "Travail de Continuité",
        content: "Enchaînement dribble-finition sur tout le terrain. Développement de la condition physique spécifique et de la lucidité dans l'effort."
      },
      {
        title: "Lecture de Jeu",
        content: "Savoir quand finir et comment. Analyse rapide de la position du défenseur pour choisir la bonne solution (Floater, Eurostep, Puissance)."
      },
      {
        title: "Efficacité Offensive",
        content: "Finitions variées proches du cercle. Travail des appuis, protection de balle et finition avec contact pour augmenter son pourcentage de réussite."
      }
    ],
    outcome: "Devenir un joueur qui ne se contente pas d'arriver au panier, mais qui marque."
  }
};

const ProgramDetail: React.FC = () => {
  const { topic } = useParams<{ topic: string }>();
  const data = topic ? TOPICS[topic] : null;

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-grind-black text-white">
        <div className="text-center">
          <h2 className="text-4xl font-display mb-4">Programme non trouvé</h2>
          <Link to="/"><Button>Retour à l'accueil</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grind-black text-white">
      {/* HERO */}
      <div className="relative h-[50vh] overflow-hidden">
        <img src={data.image} alt={data.title} className="w-full h-full object-cover opacity-50 grayscale" />
        <div className="absolute inset-0 bg-gradient-to-t from-grind-black via-grind-black/50 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-16">
          <div className="container mx-auto">
             <div className="flex items-center gap-4 mb-2 animate-fade-in-up">
                <span className="text-4xl md:text-6xl">{data.icon}</span>
                <h1 className="text-5xl md:text-7xl font-display uppercase tracking-tighter">{data.title}</h1>
             </div>
             <p className="text-xl md:text-2xl text-grind-orange font-subhead uppercase tracking-widest animate-fade-in-up delay-100">{data.subtitle}</p>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-12">
          
          {/* Main Description */}
          <div className="md:col-span-1">
            <h3 className="font-display text-3xl uppercase mb-6 border-l-4 border-grind-orange pl-4">Concept</h3>
            <p className="text-gray-300 text-lg leading-relaxed mb-8">
              {data.description}
            </p>
            <div className="bg-grind-dark p-6 rounded border border-white/10">
              <h4 className="text-grind-orange font-bold uppercase mb-2 text-sm tracking-wider">Objectif Final</h4>
              <p className="text-white font-display text-xl leading-tight">{data.outcome}</p>
            </div>
            <div className="mt-8">
              <Link to="/inscription">
                <Button fullWidth className="animate-pulse">Je m'inscris</Button>
              </Link>
            </div>
          </div>

          {/* Modules List */}
          <div className="md:col-span-2 space-y-8">
             {data.modules.map((mod: any, index: number) => (
               <div key={index} className="flex gap-6 group">
                 <div className="flex-shrink-0 w-12 h-12 bg-grind-dark border border-white/10 rounded-full flex items-center justify-center font-display text-xl text-grind-orange group-hover:bg-grind-orange group-hover:text-black transition-colors">
                   {index + 1}
                 </div>
                 <div>
                   <h4 className="font-display text-2xl uppercase mb-2 text-white group-hover:text-grind-orange transition-colors">{mod.title}</h4>
                   <p className="text-gray-400 leading-relaxed border-b border-white/10 pb-6 group-hover:border-grind-orange/30 transition-colors">
                     {mod.content}
                   </p>
                 </div>
               </div>
             ))}
          </div>

        </div>
      </div>
      
      {/* Navigation Footer */}
      <div className="border-t border-white/10 py-8 bg-grind-dark">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link to="/" className="text-gray-400 hover:text-white uppercase font-subhead tracking-wider text-sm">&larr; Retour à l'accueil</Link>
          <div className="flex gap-4">
             {Object.keys(TOPICS).map(key => (
               key !== topic && (
                 <Link key={key} to={`/programme/${key}`} className="text-grind-orange hover:text-white uppercase font-subhead tracking-wider text-sm">
                    {TOPICS[key].title} &rarr;
                 </Link>
               )
             ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default ProgramDetail;