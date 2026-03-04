import React, { useState } from 'react';
import { Button } from '../components/Button';

// Document Templates based on the provided OCR
const DOCS = [
  { id: 'parental', title: "Autorisation Parentale", icon: "👨‍👩‍👦" },
  { id: 'sortie', title: "Autorisation Sortie Autonome", icon: "🚪" },
  { id: 'image', title: "Droit à l'Image", icon: "📷" },
  { id: 'sanitaire', title: "Fiche Sanitaire", icon: "🏥" }
];

const Documents: React.FC = () => {
  const [activeDoc, setActiveDoc] = useState<string | null>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-grind-black py-12 px-4 print:bg-white print:p-0">
      
      {/* SCREEN VIEW HEADER */}
      <div className="max-w-4xl mx-auto print:hidden">
        <h1 className="text-4xl font-display text-white mb-6 text-center uppercase">Documents Officiels</h1>
        <p className="text-gray-400 text-center mb-8">
          Veuillez télécharger et imprimer les documents nécessaires. 
          Ils devront être remis signés le premier jour du stage.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {DOCS.map(doc => (
            <button 
              key={doc.id}
              onClick={() => setActiveDoc(doc.id)}
              className={`p-4 rounded border transition-all flex flex-col items-center gap-2 ${activeDoc === doc.id ? 'bg-grind-orange text-black border-grind-orange' : 'bg-grind-dark text-white border-white/10 hover:border-grind-orange'}`}
            >
              <span className="text-3xl">{doc.icon}</span>
              <span className="font-subhead uppercase text-sm text-center">{doc.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* DOCUMENT VIEW */}
      {activeDoc && (
        <div className="max-w-[210mm] mx-auto bg-white text-black p-[10mm] shadow-2xl print:shadow-none print:w-full print:max-w-none">
          
          <div className="flex justify-between items-start mb-8 print:hidden">
             <h2 className="font-bold text-gray-500 uppercase tracking-widest text-xs">Prévisualisation</h2>
             <Button onClick={handlePrint} className="!py-2 !px-4 text-xs">Imprimer ce document</Button>
          </div>

          {/* HEADER LOGO COMMON */}
          <div className="text-center mb-8">
            <div className="inline-block bg-black text-white p-2 font-display text-2xl border-4 border-orange-500 rounded-full w-24 h-24 flex items-center justify-center mb-2 mx-auto">
              GRIND
            </div>
            <h1 className="font-bold text-2xl uppercase">THE GRIND CAMP</h1>
            <p className="text-sm">Camp de perfectionnement basketball – Pernes-les-Fontaines</p>
            <p className="text-sm font-bold">Du 03 août au 07 août 2026</p>
          </div>

          {/* --- AUTORISATION PARENTALE --- */}
          {activeDoc === 'parental' && (
            <div className="space-y-6 text-sm font-serif leading-relaxed">
              <h2 className="text-center text-xl font-bold uppercase border-b-2 border-black pb-2 mb-6">Autorisation Parentale</h2>
              
              <section>
                <h3 className="font-bold uppercase mb-2">1) Identité du Responsable Légal</h3>
                <p>Je soussigné(e) : Nom / Prénom : ....................................................................................................</p>
                <p>Adresse : .............................................................................................................................................</p>
                <p>Code postal / Ville : ............................................................................................................................</p>
                <p>Téléphone principal : .............................................. Téléphone secondaire : ...........................................</p>
                <p>Email : ...................................................................................................................................................</p>
              </section>

              <section>
                <h3 className="font-bold uppercase mb-2">2) Identité du Mineur</h3>
                <p>Nom / Prénom : ....................................................................................................................................</p>
                <p>Date de naissance : ..... / ..... / ......... Catégorie : □ U11 □ U13 □ U15 □ U18</p>
                <p>Club (si licencié) : ..................................................................................................................................</p>
              </section>

              <section>
                <h3 className="font-bold uppercase mb-2">3) Autorisation de Participation</h3>
                <p className="text-justify">
                  J’autorise mon enfant à participer au <strong>THE GRIND CAMP</strong> (03 au 07 août 2026) et à pratiquer le basketball ainsi que les ateliers physiques et techniques encadrés par l’équipe pédagogique.
                </p>
              </section>

              <section>
                <h3 className="font-bold uppercase mb-2">4) Sorties / Déplacements</h3>
                <p>□ J’autorise les déplacements encadrés nécessaires à l’activité (sortie, déplacement gymnase, activité prévue).</p>
                <p>□ Je n’autorise pas les déplacements en dehors du site principal du camp.</p>
              </section>

              <section>
                <h3 className="font-bold uppercase mb-2">5) Droit à intervention / Urgence Médicale</h3>
                <p className="text-justify">En cas d’urgence, j’autorise les responsables du camp à :</p>
                <ul className="list-disc pl-5">
                  <li>Prendre toute mesure jugée nécessaire (appel des secours, transport, orientation vers un médecin / hôpital),</li>
                  <li>Faire pratiquer les soins médicaux urgents, examens et interventions indispensables à la santé de mon enfant,</li>
                  <li>Confier mon enfant aux services de secours (SAMU / pompiers) si besoin.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-bold uppercase mb-2">6) Responsabilité / Assurance</h3>
                <p className="text-justify">
                  Je certifie que mon enfant est apte à la pratique sportive et qu’il est couvert par une assurance responsabilité civile. 
                  Je reconnais avoir pris connaissance que l’organisation ne pourra être tenue responsable en cas de non-respect des consignes.
                </p>
              </section>

              <div className="mt-8 pt-4">
                <p>Fait à : ......................................................... Le : ..... / ..... / 2026</p>
                <div className="grid grid-cols-2 gap-8 mt-4 h-32">
                  <div className="border border-gray-300 p-2">
                    <p className="text-xs text-gray-500">Signature du responsable légal (précédée de "Lu et approuvé") :</p>
                  </div>
                  <div className="border border-gray-300 p-2">
                    <p className="text-xs text-gray-500">Signature du joueur :</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- SORTIE AUTONOME --- */}
          {activeDoc === 'sortie' && (
            <div className="space-y-6 text-sm font-serif leading-relaxed">
              <h2 className="text-center text-xl font-bold uppercase border-b-2 border-black pb-2 mb-6">Autorisation de Sortie Autonome</h2>
              
              <section>
                <h3 className="font-bold uppercase mb-2">1 – Identité du Responsable Légal</h3>
                <p>Je soussigné(e), Nom et prénom : ....................................................................................................</p>
                <p>Téléphone : .......................................................................................................................................</p>
              </section>

              <section>
                <h3 className="font-bold uppercase mb-2">2 – Identité du Mineur</h3>
                <p>Nom et prénom de l’enfant : ...............................................................................................................</p>
                <p>Catégorie : □ U11 □ U13 □ U15 □ U18</p>
              </section>

              <section>
                <h3 className="font-bold uppercase mb-2">3 – Autorisation de Sortie</h3>
                <p className="text-justify">
                  J’autorise mon enfant à quitter seul le lieu du THE GRIND CAMP à la fin des activités quotidiennes, sans accompagnement par un responsable du camp.
                  Cette autorisation est valable pour toute la durée du camp, soit du 03 au 07 août 2026.
                </p>
              </section>

              <section>
                <h3 className="font-bold uppercase mb-2">4 – Décharge de Responsabilité</h3>
                <p className="text-justify">
                  Je reconnais que la responsabilité de l’organisation et de l’encadrement du THE GRIND CAMP cesse dès la sortie effective de mon enfant du site du camp. 
                  Toute responsabilité liée au trajet domicile / camp est assumée exclusivement par le responsable légal.
                </p>
              </section>

              <div className="mt-12 pt-4">
                <p>Fait à : ......................................................... Le : ..... / ..... / 2026</p>
                <div className="mt-8 h-32 border border-gray-300 p-4 w-1/2">
                   <p className="text-xs text-gray-500">Signature du responsable légal :</p>
                </div>
              </div>
            </div>
          )}

          {/* --- DROIT IMAGE --- */}
          {activeDoc === 'image' && (
            <div className="space-y-6 text-sm font-serif leading-relaxed">
              <h2 className="text-center text-xl font-bold uppercase border-b-2 border-black pb-2 mb-6">Autorisation de Droit à l'Image</h2>
              
              <section>
                <h3 className="font-bold uppercase mb-2">1 – Identité du Responsable Légal</h3>
                <p>Je soussigné(e), Nom et prénom : ....................................................................................................</p>
              </section>

              <section>
                <h3 className="font-bold uppercase mb-2">2 – Identité du Mineur</h3>
                <p>Nom et prénom de l’enfant : ...............................................................................................................</p>
              </section>

              <section>
                <h3 className="font-bold uppercase mb-2">3 – Autorisation d'Utilisation</h3>
                <p className="text-justify">
                  J’autorise l’organisation du THE GRIND CAMP à capter, fixer, enregistrer et diffuser l’image de mon enfant (photographies et vidéos), prises exclusivement dans le cadre des activités du camp.
                </p>
              </section>

              <section>
                <h3 className="font-bold uppercase mb-2">4 – Supports et Finalité</h3>
                <p className="text-justify">
                  Ces images pourront être utilisées, sans contrepartie financière, sur les supports suivants : site internet, réseaux sociaux, supports de communication, affiches, flyers, vidéos promotionnelles, dans un but strictement informatif et promotionnel lié au THE GRIND CAMP.
                </p>
              </section>

              <section>
                <h3 className="font-bold uppercase mb-2">5 – Durée et Territoire</h3>
                <p className="text-justify">
                  La présente autorisation est consentie pour une durée illimitée et pour une diffusion sur tout support et tout territoire, dans le respect de la dignité et de l’image de l’enfant.
                </p>
              </section>

              <div className="mt-12 pt-4">
                <p>Fait à : ......................................................... Le : ..... / ..... / 2026</p>
                 <div className="grid grid-cols-2 gap-8 mt-4 h-32">
                  <div className="border border-gray-300 p-2">
                    <p className="text-xs text-gray-500">Signature du responsable légal :</p>
                  </div>
                  <div className="border border-gray-300 p-2">
                    <p className="text-xs text-gray-500">Signature du joueur :</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- SANITAIRE --- */}
          {activeDoc === 'sanitaire' && (
            <div className="space-y-4 text-xs font-serif leading-relaxed">
              <h2 className="text-center text-xl font-bold uppercase border-b-2 border-black pb-2 mb-4">Fiche Sanitaire de Liaison</h2>
              <p className="text-center italic text-xs mb-4">Document conforme au modèle CERFA n°10008 – Accueils collectifs de mineurs</p>
              
              <div className="border border-black p-4">
                <h3 className="font-bold uppercase mb-2 border-b border-gray-300">1) Identité de l'Enfant</h3>
                <p>Nom : ............................................................ Prénom : ............................................................</p>
                <p className="mt-2">Date de naissance : ..... / ..... / ......... Sexe : □ F □ M</p>
              </div>

               <div className="border border-black p-4 mt-4">
                <h3 className="font-bold uppercase mb-2 border-b border-gray-300">2) Responsable Légal</h3>
                <p>Nom / Prénom : ............................................................................................................................</p>
                <p className="mt-2">Tél Principal : ......................................... Tél Secondaire : .........................................</p>
              </div>

              <div className="border border-black p-4 mt-4">
                <h3 className="font-bold uppercase mb-2 border-b border-gray-300">3) Vaccinations</h3>
                <p>L’enfant est-il à jour des vaccinations obligatoires ? □ Oui □ Non</p>
                <p>Si non, préciser : ............................................................................................................................</p>
              </div>

              <div className="border border-black p-4 mt-4">
                <h3 className="font-bold uppercase mb-2 border-b border-gray-300">4) Informations Médicales</h3>
                <p className="font-bold">Allergies (alimentaires, médicamenteuses, asthme...) :</p>
                <div className="h-12 border-b border-dotted border-gray-400 mb-2"></div>
                <p className="font-bold">Maladies ou accidents notables :</p>
                <div className="h-12 border-b border-dotted border-gray-400 mb-2"></div>
                <p>Régime alimentaire particulier : □ Non □ Oui (préciser) ................................................................</p>
              </div>

              <div className="border border-black p-4 mt-4">
                <h3 className="font-bold uppercase mb-2 border-b border-gray-300">5) Traitements Médicaux</h3>
                <p>L’enfant suit-il un traitement médical pendant le camp ? □ Oui □ Non</p>
                <p className="italic text-[10px]">(Si oui, joindre ordonnance + médicaments dans leur emballage d’origine)</p>
              </div>

              <div className="border border-black p-4 mt-4 bg-gray-50">
                <h3 className="font-bold uppercase mb-2 border-b border-gray-300">6) Urgence & Autorisation</h3>
                <p><strong>Personne à contacter en cas d'urgence :</strong></p>
                <p>Nom : ............................................................ Tél : ............................................................</p>
                <p className="mt-4 text-justify">
                  Je soussigné(e), responsable légal de l’enfant, autorise les responsables du THE GRIND CAMP à prendre toute décision médicale nécessaire en cas d’urgence (transport, soins, hospitalisation).
                </p>
                 <div className="mt-4 pt-4 border-t border-gray-300">
                  <p>Fait à : ............................................ Le : ..... / ..... / 2026</p>
                  <p className="mt-4">Signature du responsable légal :</p>
                  <div className="h-16"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Documents;