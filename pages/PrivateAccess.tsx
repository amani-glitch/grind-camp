import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { storageService } from '../services/storageService';

const PrivateAccess: React.FC = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();

    // Validate code format (GRIND-XXXX where X is a digit)
    const codePattern = /^GRIND-\d{4}$/;
    if (!codePattern.test(cleanCode)) {
      setError("Format de code invalide. Le code doit être au format GRIND-XXXX.");
      return;
    }

    // Check if code exists in local storage registrations
    const reg = await storageService.getRegistrationById(cleanCode);

    // Also allow the code from the last registration in this session
    const lastReg = sessionStorage.getItem('last_registration_id');
    const isLastReg = lastReg && cleanCode === lastReg;

    if (reg || isLastReg) {
      sessionStorage.setItem('grind_auth_token', cleanCode);
      navigate('/espace-prive');
    } else {
      setError("Code invalide. Vérifiez votre email de confirmation.");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-grind-black relative overflow-hidden">
      <div className="absolute inset-0 bg-grunge-texture opacity-20"></div>
      <div className="bg-grind-dark p-8 md:p-12 rounded-xl border border-white/10 shadow-2xl max-w-md w-full relative z-10 mx-4">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl text-white uppercase mb-2">Espace Privé</h1>
          <p className="text-gray-400 text-sm">Accédez au contenu exclusif réservé aux inscrits.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm text-gray-500 mb-2 uppercase tracking-wider font-subhead">Code d'accès (GRIND-XXXX)</label>
            <input 
              type="text" 
              value={code} 
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="GRIND-XXXX"
              className="w-full bg-black border-2 border-white/10 focus:border-grind-orange rounded p-4 text-center text-2xl font-display tracking-widest text-white uppercase placeholder-gray-700 outline-none transition-colors"
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <Button fullWidth type="submit">Entrer</Button>
        </form>

        <div className="mt-8 text-center text-xs text-gray-600">
          <p>Code reçu après validation de l'inscription.</p>
        </div>
      </div>
    </div>
  );
};

export default PrivateAccess;