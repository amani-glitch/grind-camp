import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { emailService } from '../services/emailService';
import { googleSheetsService } from '../services/googleSheetsService';
import { Button } from '../components/Button';
import { ParentInfo, ChildInfo, HealthInfo } from '../types';

const STEPS = ['Parent', 'Enfant', 'Santé', 'Validation'];

// Validation functions
const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.toLowerCase());
};

const validatePhone = (phone: string): boolean => {
  // Accept international phone formats: +33123456789, 0123456789, +1234567890, etc.
  // Minimum 8 digits, maximum 15 digits (ITU-T E.164 standard)
  const cleaned = phone.replace(/[\s.\-()]/g, '');
  return /^[\+]?[(]?[0-9]{1,4}[)]?[\s\.\-]?[(]?[0-9]{1,4}[)]?[\s\.\-]?[0-9]{1,5}[\s\.\-]?[0-9]{1,5}$/.test(phone) && cleaned.replace(/\+/g, '').length >= 8 && cleaned.replace(/\+/g, '').length <= 15;
};

const formatPhone = (phone: string): string => {
  // Remove spaces, dots, dashes, parentheses but keep the + for international
  return phone.replace(/[\s.\-()]/g, '');
};

const validateRegistrationData = (parent: ParentInfo, child: ChildInfo): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Parent validation
  if (!parent.firstName?.trim()) errors.push('Le prénom du parent est requis');
  if (!parent.lastName?.trim()) errors.push('Le nom du parent est requis');
  if (!parent.email?.trim()) {
    errors.push('L\'email du parent est requis');
  } else if (!validateEmail(parent.email)) {
    errors.push('L\'email du parent n\'est pas valide');
  }
  if (!parent.phone?.trim()) {
    errors.push('Le téléphone du parent est requis');
  } else if (!validatePhone(parent.phone)) {
    errors.push('Le téléphone doit contenir entre 8 et 15 chiffres (format international accepté)');
  }
  if (!parent.address?.trim()) errors.push('L\'adresse est requise');
  if (!parent.zipCode?.trim()) errors.push('Le code postal est requis');
  if (!parent.city?.trim()) errors.push('La ville est requise');

  // Child validation
  if (!child.firstName?.trim()) errors.push('Le prénom de l\'enfant est requis');
  if (!child.lastName?.trim()) errors.push('Le nom de l\'enfant est requis');
  if (!child.birthDate) errors.push('La date de naissance est requise');
  if (!['U11', 'U13', 'U15', 'U18'].includes(child.category)) errors.push("La catégorie doit être U11, U13, U15 ou U18");

  return { valid: errors.length === 0, errors };
};

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [capacity, setCapacity] = useState({ current: 0, max: 40, isFull: false });

  // Form State
  const [parent, setParent] = useState<ParentInfo>({ 
    firstName: '', lastName: '', email: '', phone: '', 
    address: '', zipCode: '', city: '', secondaryPhone: '' 
  });
  const [child, setChild] = useState<ChildInfo>({ 
    firstName: '', lastName: '', birthDate: '', sex: 'M',
    category: 'U13', level: 'Intermédiaire' 
  });
  const [health, setHealth] = useState<HealthInfo>({ 
    vaccinationsUpToDate: true,
    medicalTreatment: false,
    specificDiet: false,
    allergies: '', 
    previousAccidents: '',
    emergencyContact: '',
    emergencyPhone: ''
  });
  const [consents, setConsents] = useState({ 
    rules: false, 
    imageRights: false, 
    autonomousExit: false,
    rgpd: false 
  });

  useEffect(() => {
    const checkCapacity = async () => {
      const status = await storageService.getCapacityStatus();
      setCapacity(status);
      if (status.isFull) {
        navigate('/liste-attente');
      }
    };
    checkCapacity();
  }, [navigate]);

  const handleNext = () => setActiveStep(p => p + 1);
  const handleBack = () => setActiveStep(p => p - 1);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!consents.rules || !consents.rgpd) {
      alert("Veuillez accepter le règlement et la politique RGPD.");
      return;
    }

    // Validate registration data
    const validation = validateRegistrationData(parent, child);
    if (!validation.valid) {
      alert('❌ Erreurs de validation :\n\n' + validation.errors.join('\n'));
      return;
    }

    setIsSubmitting(true);

    try {
      const registration = await storageService.addRegistration({
        parent,
        child,
        health,
        consents
      });

      // Send notification emails (admin + parent confirmation)
      const emailData = {
        id: registration.id,
        parent: {
          firstName: parent.firstName,
          lastName: parent.lastName,
          email: parent.email,
          phone: formatPhone(parent.phone), // Format phone number
          address: parent.address,
          postalCode: parent.zipCode,
          city: parent.city
        },
        child: {
          firstName: child.firstName,
          lastName: child.lastName,
          birthDate: child.birthDate,
          category: child.category,
          club: child.club,
          level: child.level || 'Non spécifié',
          tshirtSize: 'M' // Default, can be added to form later
        },
        health: {
          allergies: health.allergies,
          treatment: health.medicalTreatmentDetails,
          medicalInfo: health.previousAccidents
        }
      };

      // Send emails (don't block registration if it fails)
      console.log('🔵 Tentative envoi email...', emailData);
      emailService.sendRegistrationEmails(emailData).then(result => {
        if (result.success) {
          console.log('✅ Email envoyé avec succès!', result);
        } else {
          console.error('❌ Échec envoi email:', result.message);
          alert(`⚠️ Inscription enregistrée mais email non envoyé: ${result.message}`);
        }
      }).catch(error => {
        console.error('❌ Erreur critique email:', error);
        alert(`⚠️ Inscription enregistrée mais erreur email: ${error.message}`);
      });

      // Envoi vers Google Sheets (non-bloquant, en parallèle)
      googleSheetsService.submitToGoogleSheet({
        parentFirstName: parent.firstName,
        parentLastName: parent.lastName,
        parentEmail: parent.email,
        phone: formatPhone(parent.phone),
        secondaryPhone: parent.secondaryPhone || '',
        address: parent.address,
        zipCode: parent.zipCode,
        city: parent.city,
        childFirstName: child.firstName,
        childLastName: child.lastName,
        birthDate: child.birthDate,
        sex: child.sex,
        category: child.category,
        club: child.club || '',
        emergencyContact: health.emergencyContact,
        emergencyPhone: health.emergencyPhone,
        allergies: health.allergies || '',
        medicalTreatment: health.medicalTreatment ? (health.medicalTreatmentDetails || 'Oui') : '',
        previousAccidents: health.previousAccidents || '',
        specificDiet: health.specificDiet ? (health.specificDietDetails || 'Oui') : ''
      }).then(success => {
        if (success) {
          console.log('✅ Données envoyées vers Google Sheets');
        } else {
          console.warn('⚠️ Google Sheets non disponible ou non configuré');
        }
      }).catch(error => {
        console.error('❌ Erreur Google Sheets:', error);
      });

      // Store a temporary token for the confirmation page or auto-login
      sessionStorage.setItem('last_registration_id', registration.id);
      sessionStorage.setItem('grind_auth_token', registration.id); // Auto-login for POC

      alert(`Inscription enregistrée ! Votre code d'accès est ${registration.id}. Il vous servira à accéder à l'espace privé. Un email de confirmation a été envoyé.`);
      navigate('/espace-prive');
    } catch (error) {
      console.error('Registration error:', error);
      alert("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const InputClass = "w-full bg-black/50 border border-white/20 p-3 rounded text-white focus:border-grind-orange focus:outline-none transition-colors";
  const LabelClass = "block text-sm text-gray-400 mb-1 uppercase tracking-wider font-subhead";
  const CheckboxClass = "w-5 h-5 text-grind-orange bg-black border-white/20 rounded focus:ring-grind-orange focus:ring-2";

  return (
    <div className="min-h-screen py-12 px-4 bg-grind-black">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-display text-white mb-2 text-center">INSCRIPTION</h1>
        <p className="text-center text-gray-400 mb-8">Rejoignez The Grind Camp 2026. Places restantes : <span className="text-grind-orange">{capacity.max - capacity.current}</span></p>

        {/* Stepper */}
        <div className="flex justify-between mb-8 relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-800 -z-10"></div>
          {STEPS.map((step, i) => (
            <div key={i} className={`flex flex-col items-center bg-grind-black px-2 ${i <= activeStep ? 'text-grind-orange' : 'text-gray-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 mb-2 ${i <= activeStep ? 'border-grind-orange bg-grind-orange text-black' : 'border-gray-800 bg-black'}`}>
                {i + 1}
              </div>
              <span className="text-xs uppercase font-subhead hidden md:block">{step}</span>
            </div>
          ))}
        </div>

        <div className="bg-grind-dark p-6 md:p-8 rounded-lg border border-white/10 shadow-2xl">
          {activeStep === 0 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-xl font-display text-white mb-4">1. Identité du Responsable Légal</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={LabelClass}>Prénom *</label>
                  <input type="text" className={InputClass} value={parent.firstName} onChange={e => setParent({...parent, firstName: e.target.value})} required />
                </div>
                <div>
                  <label className={LabelClass}>Nom *</label>
                  <input type="text" className={InputClass} value={parent.lastName} onChange={e => setParent({...parent, lastName: e.target.value})} required />
                </div>
              </div>
              
              <div>
                <label className={LabelClass}>Adresse Complète *</label>
                <input type="text" className={InputClass} value={parent.address} onChange={e => setParent({...parent, address: e.target.value})} required />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                 <div>
                  <label className={LabelClass}>Code Postal *</label>
                  <input type="text" className={InputClass} value={parent.zipCode} onChange={e => setParent({...parent, zipCode: e.target.value})} required />
                </div>
                <div>
                  <label className={LabelClass}>Ville *</label>
                  <input type="text" className={InputClass} value={parent.city} onChange={e => setParent({...parent, city: e.target.value})} required />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={LabelClass}>Email *</label>
                  <input 
                    type="email" 
                    className={InputClass} 
                    value={parent.email} 
                    onChange={e => setParent({...parent, email: e.target.value})}
                    placeholder="exemple@email.com"
                    required
                  />
                </div>
                <div>
                  <label className={LabelClass}>Téléphone Principal *</label>
                  <input 
                    type="tel" 
                    className={InputClass} 
                    value={parent.phone} 
                    onChange={e => setParent({...parent, phone: e.target.value})}
                    placeholder="+33612345678, 0612345678, +14155552671..."
                    title="Format international accepté"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">Format international accepté (ex: +33612345678, +14155552671, 0612345678)</p>
                </div>
              </div>
               <div>
                  <label className={LabelClass}>Téléphone Secondaire (Optionnel)</label>
                  <input 
                    type="tel" 
                    className={InputClass} 
                    value={parent.secondaryPhone} 
                    onChange={e => setParent({...parent, secondaryPhone: e.target.value})}
                    placeholder="0612345678 (optionnel)"
                  />
                </div>
              <div className="flex justify-end mt-6">
                <Button onClick={handleNext} disabled={!parent.email || !parent.lastName || !parent.address}>Suivant</Button>
              </div>
            </div>
          )}

          {activeStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-xl font-display text-white mb-4">2. Identité du Mineur</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={LabelClass}>Prénom *</label>
                  <input type="text" className={InputClass} value={child.firstName} onChange={e => setChild({...child, firstName: e.target.value})} required />
                </div>
                <div>
                  <label className={LabelClass}>Nom *</label>
                  <input type="text" className={InputClass} value={child.lastName} onChange={e => setChild({...child, lastName: e.target.value})} required />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={LabelClass}>Date de Naissance *</label>
                  <input type="date" className={InputClass} value={child.birthDate} onChange={e => setChild({...child, birthDate: e.target.value})} required />
                </div>
                 <div>
                  <label className={LabelClass}>Sexe</label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 text-gray-300">
                      <input type="radio" name="sex" checked={child.sex === 'M'} onChange={() => setChild({...child, sex: 'M'})} /> Garçon
                    </label>
                    <label className="flex items-center gap-2 text-gray-300">
                      <input type="radio" name="sex" checked={child.sex === 'F'} onChange={() => setChild({...child, sex: 'F'})} /> Fille
                    </label>
                  </div>
                </div>
              </div>
               <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={LabelClass}>Catégorie</label>
                  <select className={InputClass} value={child.category} onChange={e => setChild({...child, category: e.target.value as any})}>
                    <option value="U11">U11</option>
                    <option value="U13">U13</option>
                    <option value="U15">U15</option>
                    <option value="U18">U18</option>
                  </select>
                </div>
                 <div>
                  <label className={LabelClass}>Club actuel (Optionnel)</label>
                  <input type="text" className={InputClass} value={child.club || ''} onChange={e => setChild({...child, club: e.target.value})} />
                </div>
              </div>
              
              <div className="flex justify-between mt-6">
                <Button variant="secondary" onClick={handleBack}>Retour</Button>
                <Button onClick={handleNext} disabled={!child.firstName || !child.birthDate}>Suivant</Button>
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-xl font-display text-white mb-4">3. Fiche Sanitaire de Liaison</h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                 <div>
                  <label className={LabelClass}>Personne à contacter (Urgence)</label>
                  <input type="text" className={InputClass} placeholder="Nom / Prénom" value={health.emergencyContact} onChange={e => setHealth({...health, emergencyContact: e.target.value})} />
                </div>
                 <div>
                  <label className={LabelClass}>Tél. Urgence</label>
                  <input type="tel" className={InputClass} value={health.emergencyPhone} onChange={e => setHealth({...health, emergencyPhone: e.target.value})} />
                </div>
              </div>

              <div className="border-t border-white/10 pt-4 space-y-3">
                <label className="flex items-center gap-3">
                  <input type="checkbox" className={CheckboxClass} checked={health.vaccinationsUpToDate} onChange={e => setHealth({...health, vaccinationsUpToDate: e.target.checked})} />
                  <span className="text-gray-300">Vaccinations obligatoires à jour ?</span>
                </label>
                {!health.vaccinationsUpToDate && (
                  <input type="text" className={InputClass} placeholder="Précisez les vaccins manquants" value={health.vaccinationsDetails} onChange={e => setHealth({...health, vaccinationsDetails: e.target.value})} />
                )}

                <label className="flex items-center gap-3">
                  <input type="checkbox" className={CheckboxClass} checked={health.medicalTreatment} onChange={e => setHealth({...health, medicalTreatment: e.target.checked})} />
                  <span className="text-gray-300">Traitement médical en cours ?</span>
                </label>
                {health.medicalTreatment && (
                  <input type="text" className={InputClass} placeholder="Détails du traitement (Ordonnance obligatoire)" value={health.medicalTreatmentDetails} onChange={e => setHealth({...health, medicalTreatmentDetails: e.target.value})} />
                )}

                 <label className="flex items-center gap-3">
                  <input type="checkbox" className={CheckboxClass} checked={health.specificDiet} onChange={e => setHealth({...health, specificDiet: e.target.checked})} />
                  <span className="text-gray-300">Régime alimentaire particulier ?</span>
                </label>
                {health.specificDiet && (
                  <input type="text" className={InputClass} placeholder="Précisez (Sans porc, végétarien...)" value={health.specificDietDetails} onChange={e => setHealth({...health, specificDietDetails: e.target.value})} />
                )}
              </div>

              <div>
                <label className={LabelClass}>Allergies / Asthme</label>
                <textarea className={InputClass} rows={2} placeholder="RAS ou détails..." value={health.allergies} onChange={e => setHealth({...health, allergies: e.target.value})} />
              </div>

               <div>
                <label className={LabelClass}>Maladies ou accidents notables</label>
                <textarea className={InputClass} rows={2} placeholder="Antécédents..." value={health.previousAccidents} onChange={e => setHealth({...health, previousAccidents: e.target.value})} />
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="secondary" onClick={handleBack}>Retour</Button>
                <Button onClick={handleNext} disabled={!health.emergencyContact || !health.emergencyPhone}>Suivant</Button>
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-display text-white mb-4">4. Validations & Documents</h2>
              
              <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded mb-6">
                 <p className="text-sm text-blue-200 mb-2">
                   <strong>IMPORTANT :</strong> Pour finaliser l'inscription, vous devrez nous remettre les documents officiels signés. Vous pouvez les télécharger maintenant ou plus tard.
                 </p>
                 <Link to="/documents" target="_blank" className="text-grind-orange text-sm font-bold hover:underline">
                   Voir et imprimer les documents modèles &rarr;
                 </Link>
              </div>

              <div className="space-y-4">
                 <label className="flex items-start gap-3 cursor-pointer p-3 rounded hover:bg-white/5 transition-colors">
                  <input type="checkbox" className={`mt-1 ${CheckboxClass}`} checked={consents.rules} onChange={e => setConsents({...consents, rules: e.target.checked})} />
                  <div>
                    <span className="block text-white font-bold text-sm">Règlement & Paiement</span>
                    <span className="text-xs text-gray-400">J'accepte le règlement intérieur et m'engage à régler 240€.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer p-3 rounded hover:bg-white/5 transition-colors">
                  <input type="checkbox" className={`mt-1 ${CheckboxClass}`} checked={consents.autonomousExit} onChange={e => setConsents({...consents, autonomousExit: e.target.checked})} />
                   <div>
                    <span className="block text-white font-bold text-sm">Autorisation de Sortie Autonome</span>
                    <span className="text-xs text-gray-400">J'autorise mon enfant à quitter seul le lieu du camp à la fin des activités (17h).</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer p-3 rounded hover:bg-white/5 transition-colors">
                  <input type="checkbox" className={`mt-1 ${CheckboxClass}`} checked={consents.imageRights} onChange={e => setConsents({...consents, imageRights: e.target.checked})} />
                   <div>
                    <span className="block text-white font-bold text-sm">Droit à l'image</span>
                    <span className="text-xs text-gray-400">J'autorise The Grind Camp à utiliser l'image de mon enfant (photos/vidéos) pour sa communication (Site, Réseaux sociaux).</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer p-3 rounded hover:bg-white/5 transition-colors">
                  <input type="checkbox" className={`mt-1 ${CheckboxClass}`} checked={consents.rgpd} onChange={e => setConsents({...consents, rgpd: e.target.checked})} />
                   <div>
                    <span className="block text-white font-bold text-sm">Données Personnelles (RGPD)</span>
                    <span className="text-xs text-gray-400">J'accepte que ces données soient traitées pour la gestion administrative et médicale du stage.</span>
                  </div>
                </label>
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="secondary" onClick={handleBack}>Retour</Button>
                <Button onClick={handleSubmit} disabled={!consents.rules || !consents.rgpd || isSubmitting}>
                  {isSubmitting ? 'Envoi en cours...' : 'Confirmer l\'inscription'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;