import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ChatWidget } from './components/ChatWidget';
import Home from './pages/Home';
import Register from './pages/Register';
import Team from './pages/Team';
import PrivateAccess from './pages/PrivateAccess';
import PrivateDashboard from './pages/PrivateDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProgramDetail from './pages/ProgramDetail'; // New Import
import Documents from './pages/Documents';
import Contact from './pages/Contact';
import { storageService } from './services/storageService';
import { FAQ_ITEMS } from './data/stageConfig';
import { ChatProvider } from './contexts/ChatContext';

// Simple protection for private routes
const PrivateRoute = ({ children }: { children?: React.ReactNode }) => {
  const isAuth = sessionStorage.getItem('grind_auth_token');
  return isAuth ? <>{children}</> : <Navigate to="/acces" replace />;
};

const AdminRoute = ({ children }: { children?: React.ReactNode }) => {
  const isAdmin = sessionStorage.getItem('grind_admin_auth');
  return isAdmin ? <>{children}</> : <Navigate to="/admin-login" replace />;
};

// Admin Login Component inline for simplicity
const AdminLogin = () => {
  const [pass, setPass] = React.useState('');
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // Hash the password and compare with stored hash
    // Using SHA-256 for basic security (in production, use bcrypt on backend)
    const hashPassword = async (password: string): Promise<string> => {
      const encoder = new TextEncoder();
      const data = encoder.encode(password + 'grind_salt_2026');
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const inputHash = await hashPassword(pass);
    const validHash = process.env.REACT_APP_ADMIN_HASH;

    if (validHash && inputHash === validHash) {
      sessionStorage.setItem('grind_admin_auth', 'true');
      window.location.href = '#/admin';
    } else {
      alert('Mot de passe incorrect');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-grind-black">
      <form onSubmit={handleLogin} className="bg-grind-dark p-8 border border-white/10 rounded-lg">
        <h2 className="text-white font-display text-2xl mb-4">ADMINISTRATION</h2>
        <input 
          type="password" 
          value={pass}
          onChange={e => setPass(e.target.value)}
          placeholder="Mot de passe"
          className="w-full bg-black border border-white/20 p-2 text-white mb-4 rounded"
        />
        <button className="w-full bg-grind-orange text-white font-display py-2">ENTRER</button>
      </form>
    </div>
  );
};

// Waitlist Component inline
const Waitlist = () => {
  const [email, setEmail] = React.useState('');
  const [cat, setCat] = React.useState('U13');
  const [done, setDone] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await storageService.addToWaitlist(email, cat);
    setDone(true);
  };

  if (done) return (
    <div className="text-center py-20 px-4">
      <h2 className="text-3xl font-display text-grind-orange mb-4">C'EST NOTÉ !</h2>
      <p className="text-gray-300">Vous êtes sur la liste d'attente. Nous vous contacterons si une place se libère.</p>
    </div>
  );

  return (
    <div className="max-w-md mx-auto py-20 px-4">
      <h2 className="text-3xl font-display text-white mb-2">LISTE D'ATTENTE</h2>
      <p className="text-gray-400 mb-8">Le stage est complet. Inscrivez-vous pour être prévenu.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Email</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black/50 border border-white/20 p-3 rounded text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Catégorie</label>
          <select value={cat} onChange={e => setCat(e.target.value)} className="w-full bg-black/50 border border-white/20 p-3 rounded text-white">
            <option value="U11">U11</option>
            <option value="U13">U13</option>
            <option value="U15">U15</option>
            <option value="U18">U18</option>
          </select>
        </div>
        <button className="w-full bg-white text-black font-display py-3 hover:bg-gray-200">S'INSCRIRE</button>
      </form>
    </div>
  );
}

const FAQPage = () => (
  <div className="max-w-3xl mx-auto py-12 px-4">
    <h1 className="text-4xl font-display text-white mb-8 text-center"><span className="text-grind-orange">FAQ</span> QUESTIONS FRÉQUENTES</h1>
    <div className="space-y-6">
      {FAQ_ITEMS.map((item: any, i: number) => (
        <div key={i} className="bg-grind-dark p-6 rounded border-l-4 border-grind-orange">
          <h3 className="font-subhead text-xl text-white mb-2">{item.q}</h3>
          <p className="text-gray-400">{item.a}</p>
        </div>
      ))}
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <ChatProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/programme/:topic" element={<ProgramDetail />} />
            <Route path="/encadrement" element={<Team />} />
            <Route path="/inscription" element={<Register />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/liste-attente" element={<Waitlist />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/acces" element={<PrivateAccess />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/mentions-legales" element={<div className="p-20 text-center text-white">Mentions Légales (Contenu Standard)</div>} />
            <Route path="/confidentialite" element={<div className="p-20 text-center text-white">Politique de Confidentialité</div>} />
            
            {/* Private Routes */}
            <Route path="/espace-prive" element={
              <PrivateRoute>
                <PrivateDashboard />
              </PrivateRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />

            {/* Catch-all redirect to Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
        <ChatWidget />
      </HashRouter>
    </ChatProvider>
  );
};

export default App;