import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CONFIG } from '../data/stageConfig';
import { useChat } from '../contexts/ChatContext';
import { LOGO_IMAGE } from '../data/coachImages';

export const Layout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { openChat } = useChat();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const navLinks = [
    { name: 'Le Camp', path: '/' },
    { name: 'Encadrement', path: '/encadrement' },
    { name: 'FAQ', path: '/faq' },
    { name: 'Contact', path: '/contact' },
    { name: 'Espace Privé', path: '/acces', special: true },
  ];

  // Custom Basketball Icon Component
  const BasketballIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10"></path>
      <path d="M12 2a15.3 15.3 0 0 0-4 10 15.3 15.3 0 0 0 4 10"></path>
    </svg>
  );

  return (
    <div className="min-h-screen flex flex-col bg-grind-black font-body text-gray-200">
      {/* Navigation */}
      <nav className={`fixed w-full z-40 transition-all duration-300 ${isScrolled ? 'bg-black/90 backdrop-blur-md py-2 border-b border-white/5' : 'bg-transparent py-4'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 group">
             {/* Logo Image */}
             <img 
               src={LOGO_IMAGE} 
               alt="Grind Camp Logo" 
               className="w-10 h-10 object-contain transform group-hover:rotate-3 transition-transform"
             />
            <div className="flex flex-col">
              <span className="font-display text-xl md:text-2xl text-white leading-none tracking-wide">THE GRIND</span>
              <span className="font-subhead text-xs text-grind-orange tracking-[0.2em] leading-none">CAMP</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path}
                className={`font-subhead uppercase tracking-wider text-sm hover:text-grind-orange transition-colors ${link.special ? 'text-grind-orange border border-grind-orange px-3 py-1 rounded hover:bg-grind-orange hover:text-white' : ''} ${location.pathname === link.path ? 'text-grind-orange' : ''}`}
              >
                {link.name}
              </Link>
            ))}

            {/* BOTLER BUTTON */}
            <button 
              onClick={openChat}
              className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-gray-800 to-gray-900 border border-white/20 hover:border-grind-orange hover:text-grind-orange transition-all group"
            >
              <BasketballIcon className="h-6 w-6 text-grind-orange group-hover:scale-110 transition-transform" />
              <div className="flex flex-col items-start leading-none">
                <span className="font-display uppercase text-xs text-white group-hover:text-grind-orange">Botler</span>
                <span className="text-[9px] text-gray-400">Questions ?</span>
              </div>
            </button>

            <Link to="/inscription" className="bg-white text-black px-5 py-2 font-display uppercase tracking-wide hover:bg-gray-200 transition-colors text-sm rounded-sm">
              S'inscrire
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button 
            className="md:hidden text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-grind-dark border-b border-grind-orange/20 flex flex-col p-4 gap-4 animate-fade-in shadow-2xl">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path}
                className="font-display text-xl uppercase tracking-wider text-white hover:text-grind-orange"
              >
                {link.name}
              </Link>
            ))}
            <button 
              onClick={() => { openChat(); setIsMobileMenuOpen(false); }}
              className="flex items-center gap-3 font-display text-xl uppercase tracking-wider text-grind-orange"
            >
              <BasketballIcon className="h-6 w-6" />
              <span>Poser une question</span>
            </button>
            <Link to="/inscription" className="bg-grind-orange text-white text-center py-3 font-display uppercase tracking-wide rounded-sm mt-2">
              S'inscrire
            </Link>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-grow pt-20">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-neutral-900 border-t border-white/5 pt-12 pb-6">
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
             <div className="flex flex-col mb-4">
              <span className="font-display text-2xl text-white tracking-wide">THE GRIND</span>
              <span className="font-subhead text-sm text-grind-orange tracking-[0.2em]">CAMP BASKETBALL</span>
            </div>
            <p className="text-gray-400 text-sm max-w-md">
              Un camp intensif dédié à la progression technique et mentale. 
              Handle, finition, lecture de jeu. Exigence et passion.
            </p>
          </div>
          <div>
            <h4 className="font-display text-white uppercase tracking-wider mb-4">Navigation</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/" className="hover:text-grind-orange">Accueil</Link></li>
              <li><Link to="/encadrement" className="hover:text-grind-orange">Coachs</Link></li>
              <li><Link to="/documents" className="hover:text-grind-orange">Documents</Link></li>
              <li><Link to="/faq" className="hover:text-grind-orange">Questions fréquentes</Link></li>
              <li><Link to="/admin" className="hover:text-grind-orange">Admin</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-white uppercase tracking-wider mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <span className="text-grind-orange">📍</span> Pernes-les-Fontaines
              </li>
              <li className="flex items-center gap-2">
                <span className="text-grind-orange">📞</span> {CONFIG.contact.phone}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-grind-orange">✉️</span> {CONFIG.contact.email}
              </li>
              <li className="mt-2">
                <Link to="/contact" className="text-white underline decoration-grind-orange hover:text-grind-orange">Page Contact Complète</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 md:px-8 border-t border-white/5 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
          <div className="flex flex-col md:flex-row items-center gap-2">
            <p>© {new Date().getFullYear()} The Grind Camp. Tous droits réservés.</p>
            <span className="hidden md:block text-gray-700 mx-2">|</span>
            <p>
              Site créé par <a href="https://Botler360.com" target="_blank" rel="noopener noreferrer" className="hover:text-grind-orange transition-colors">Botler360</a>
            </p>
          </div>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link to="/mentions-legales" className="hover:text-white">Mentions Légales</Link>
            <Link to="/confidentialite" className="hover:text-white">Confidentialité</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};