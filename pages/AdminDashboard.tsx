import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  googleSheetsService,
  SheetRegistrationRow,
} from '../services/googleSheetsService';
import { storageService } from '../services/storageService';
import { Registration } from '../types';

// ============================================================
// Types locaux
// ============================================================

type SortKey = 'id' | 'parentLastName' | 'childFirstName' | 'category' | 'confirmed' | 'registrationDate';
type SortDir = 'asc' | 'desc';

interface DashboardData {
  registrations: SheetRegistrationRow[];
  totalPlaces: number;
  confirmes: number;
  placesRestantes: number;
}

// ============================================================
// Composant : Donut SVG
// ============================================================

const DonutChart: React.FC<{
  data: { label: string; value: number; color: string }[];
  title: string;
}> = ({ data, title }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return (
      <div className="flex flex-col items-center">
        <p className="text-xs text-gray-500 mb-2">{title}</p>
        <p className="text-gray-600 text-sm">Aucune donnee</p>
      </div>
    );
  }

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col items-center">
      <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 font-subhead">{title}</p>
      <svg width="120" height="120" viewBox="0 0 120 120">
        {data.map((d, i) => {
          const pct = d.value / total;
          const dashLength = pct * circumference;
          const dashOffset = -offset;
          offset += dashLength;
          return (
            <circle
              key={i}
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth="18"
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 60 60)"
            />
          );
        })}
        <text x="60" y="58" textAnchor="middle" className="fill-white text-lg font-bold" fontSize="20">{total}</text>
        <text x="60" y="74" textAnchor="middle" className="fill-gray-400" fontSize="10">total</text>
      </svg>
      <div className="flex flex-wrap justify-center gap-3 mt-3">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-gray-300">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
            {d.label} ({d.value})
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// Composant : Barre horizontale
// ============================================================

const HorizontalBarChart: React.FC<{
  data: { label: string; value: number; color: string }[];
  title: string;
}> = ({ data, title }) => {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wider mb-4 font-subhead">{title}</p>
      <div className="space-y-3">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="w-8 text-right text-xs text-gray-400 font-mono">{d.label}</span>
            <div className="flex-1 h-6 bg-black/40 rounded overflow-hidden">
              <div
                className="h-full rounded transition-all duration-500"
                style={{
                  width: `${(d.value / maxVal) * 100}%`,
                  backgroundColor: d.color,
                  minWidth: d.value > 0 ? '20px' : '0'
                }}
              />
            </div>
            <span className="w-6 text-xs text-gray-300 font-mono">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// Composant : KPI Card
// ============================================================

const KpiCard: React.FC<{
  label: string;
  value: string | number;
  icon: string;
  accent?: boolean;
  sub?: string;
}> = ({ label, value, icon, accent, sub }) => (
  <div className={`rounded-lg p-4 border ${accent ? 'bg-grind-orange/10 border-grind-orange/30' : 'bg-grind-dark border-white/10'}`}>
    <div className="flex items-center gap-2 mb-1">
      <span className="text-lg">{icon}</span>
      <span className="text-xs text-gray-400 uppercase font-subhead tracking-wider">{label}</span>
    </div>
    <p className={`text-2xl font-display ${accent ? 'text-grind-orange' : 'text-white'}`}>{value}</p>
    {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
  </div>
);

// ============================================================
// Composant : Modal Commentaire
// ============================================================

const CommentModal: React.FC<{
  reg: SheetRegistrationRow;
  onSave: (id: string, comment: string) => void;
  onClose: () => void;
}> = ({ reg, onSave, onClose }) => {
  const [text, setText] = useState(reg.comment || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(reg.id, text);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="bg-grind-dark border border-white/10 rounded-lg p-6 w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-display text-lg text-white mb-1">COMMENTAIRE</h3>
        <p className="text-sm text-gray-400 mb-4">{reg.id} — {reg.childFirstName} {reg.childLastName}</p>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={4}
          className="w-full bg-black border border-white/20 rounded p-3 text-white text-sm resize-none focus:outline-none focus:border-grind-orange"
          placeholder="Ajouter un commentaire..."
          autoFocus
        />
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-grind-orange text-white text-sm font-bold rounded hover:bg-grind-fire transition-colors disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Composant principal : AdminDashboard
// ============================================================

const AdminDashboard: React.FC = () => {
  // --- State ---
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isLocalData, setIsLocalData] = useState(false);

  // Filtres
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSex, setFilterSex] = useState('');

  // Tri
  const [sortKey, setSortKey] = useState<SortKey>('registrationDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Modal
  const [commentModalReg, setCommentModalReg] = useState<SheetRegistrationRow | null>(null);

  // --- Convertir Registration locale -> SheetRegistrationRow ---
  const localToSheetRow = (r: Registration): SheetRegistrationRow => ({
    id: r.id,
    parentLastName: r.parent.lastName,
    parentFirstName: r.parent.firstName,
    parentEmail: r.parent.email,
    phone: r.parent.phone,
    secondaryPhone: r.parent.secondaryPhone || '',
    address: r.parent.address,
    zipCode: r.parent.zipCode,
    city: r.parent.city,
    childLastName: r.child.lastName,
    childFirstName: r.child.firstName,
    birthDate: r.child.birthDate,
    sex: r.child.sex,
    category: r.child.category,
    club: r.child.club || '',
    emergencyContact: r.health.emergencyContact,
    emergencyPhone: r.health.emergencyPhone,
    healthInfo: [
      r.health.allergies ? `Allergies: ${r.health.allergies}` : '',
      r.health.medicalTreatmentDetails ? `Traitement: ${r.health.medicalTreatmentDetails}` : '',
      r.health.specificDietDetails ? `Regime: ${r.health.specificDietDetails}` : '',
    ].filter(Boolean).join(' | ') || 'RAS',
    registrationDate: r.timestamp,
    confirmed: r.status === 'confirmed' || r.status === 'paid' ? 'Oui' : 'Non',
    confirmationDate: '',
    comment: ''
  });

  // --- Chargement des donnees ---
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const result = await googleSheetsService.getAllRegistrations();

      // Si Google Sheets retourne des inscriptions, les utiliser
      if (result.registrations.length > 0) {
        setIsLocalData(false);
        setData({
          registrations: result.registrations,
          totalPlaces: result.totalPlaces,
          confirmes: result.confirmes,
          placesRestantes: result.placesRestantes
        });
      } else {
        // Sinon, fallback vers les donnees locales (localStorage)
        setIsLocalData(true);
        const localRegs = await storageService.getRegistrations();
        const sheetRows = localRegs.map(localToSheetRow);
        const confirmedCount = sheetRows.filter(r => r.confirmed === 'Oui').length;
        const totalPlaces = result.totalPlaces || 38;
        setData({
          registrations: sheetRows,
          totalPlaces,
          confirmes: confirmedCount,
          placesRestantes: totalPlaces - confirmedCount
        });
      }
    } catch (err: any) {
      // Meme en cas d'erreur reseau, essayer le localStorage
      try {
        const localRegs = await storageService.getRegistrations();
        if (localRegs.length > 0) {
          setIsLocalData(true);
          const sheetRows = localRegs.map(localToSheetRow);
          const confirmedCount = sheetRows.filter(r => r.confirmed === 'Oui').length;
          setData({
            registrations: sheetRows,
            totalPlaces: 38,
            confirmes: confirmedCount,
            placesRestantes: 38 - confirmedCount
          });
        } else {
          setError(err.message || 'Erreur de chargement');
        }
      } catch {
        setError(err.message || 'Erreur de chargement');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // --- Actions ---
  const handleConfirm = async (id: string) => {
    if (!confirm(`Confirmer l'inscription ${id} ?`)) return;
    setActionLoading(id);
    try {
      await googleSheetsService.confirmRegistration(id);
      await fetchData();
    } catch (err: any) {
      alert('Erreur: ' + (err.message || 'Action echouee'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm(`Annuler l'inscription ${id} ?`)) return;
    setActionLoading(id);
    try {
      await googleSheetsService.cancelRegistration(id);
      await fetchData();
    } catch (err: any) {
      alert('Erreur: ' + (err.message || 'Action echouee'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveComment = async (id: string, comment: string) => {
    try {
      await googleSheetsService.updateComment(id, comment);
      await fetchData();
    } catch (err: any) {
      alert('Erreur: ' + (err.message || 'Action echouee'));
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('grind_admin_auth');
    window.location.href = '#/admin-login';
  };

  // --- Filtrage et tri ---
  const filtered = useMemo(() => {
    if (!data) return [];
    let list = [...data.registrations];

    // Recherche textuelle
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.id.toLowerCase().includes(q) ||
        r.parentLastName.toLowerCase().includes(q) ||
        r.parentFirstName.toLowerCase().includes(q) ||
        r.childFirstName.toLowerCase().includes(q) ||
        r.childLastName.toLowerCase().includes(q) ||
        r.parentEmail.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q)
      );
    }

    // Filtres
    if (filterCategory) list = list.filter(r => r.category === filterCategory);
    if (filterStatus) {
      const isConfirmed = filterStatus === 'oui';
      list = list.filter(r => (r.confirmed.toString().toLowerCase().trim() === 'oui') === isConfirmed);
    }
    if (filterSex) list = list.filter(r => r.sex.toString().toUpperCase().trim() === filterSex);

    // Tri
    list.sort((a, b) => {
      const va = (a[sortKey] ?? '').toString().toLowerCase();
      const vb = (b[sortKey] ?? '').toString().toLowerCase();
      const cmp = va.localeCompare(vb);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [data, search, filterCategory, filterStatus, filterSex, sortKey, sortDir]);

  // --- Stats ---
  const stats = useMemo(() => {
    if (!data) return null;
    const regs = data.registrations;
    const total = regs.length;
    const confirmedCount = regs.filter(r => r.confirmed.toString().toLowerCase().trim() === 'oui').length;
    const pendingCount = total - confirmedCount;
    const fillRate = data.totalPlaces > 0 ? Math.round((confirmedCount / data.totalPlaces) * 100) : 0;

    // Par categorie
    const categories: Record<string, number> = {};
    regs.forEach(r => {
      const cat = r.category.toString().trim() || 'Autre';
      categories[cat] = (categories[cat] || 0) + 1;
    });

    // Par sexe
    const sexM = regs.filter(r => r.sex.toString().toUpperCase().trim() === 'M').length;
    const sexF = regs.filter(r => r.sex.toString().toUpperCase().trim() === 'F').length;

    return { total, confirmedCount, pendingCount, fillRate, categories, sexM, sexF };
  }, [data]);

  // --- Export CSV ---
  const exportCSV = () => {
    if (!data) return;
    const BOM = '\uFEFF';
    const headers = [
      'ID', 'Nom Parent', 'Prenom Parent', 'Email', 'Telephone',
      'Tel Secondaire', 'Adresse', 'CP', 'Ville',
      'Nom Enfant', 'Prenom Enfant', 'Date Naissance', 'Sexe',
      'Categorie', 'Club', 'Contact Urgence', 'Tel Urgence',
      'Sante', 'Date Inscription', 'Confirme', 'Date Confirmation', 'Commentaire'
    ];

    const escapeCSV = (val: string) => {
      const s = (val ?? '').toString();
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    };

    const rows = filtered.map(r => [
      r.id, r.parentLastName, r.parentFirstName, r.parentEmail, r.phone,
      r.secondaryPhone, r.address, r.zipCode, r.city,
      r.childLastName, r.childFirstName, r.birthDate, r.sex,
      r.category, r.club, r.emergencyContact, r.emergencyPhone,
      r.healthInfo, r.registrationDate, r.confirmed, r.confirmationDate, r.comment
    ].map(escapeCSV).join(','));

    const csv = BOM + headers.map(escapeCSV).join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grind_inscriptions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Tri toggle ---
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIcon: React.FC<{ col: SortKey }> = ({ col }) => {
    if (sortKey !== col) return <span className="text-gray-600 ml-1">↕</span>;
    return <span className="text-grind-orange ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  // --- Categories uniques pour le filtre ---
  const allCategories = useMemo(() => {
    if (!data) return [];
    const cats = new Set(data.registrations.map(r => r.category.toString().trim()).filter(Boolean));
    return Array.from(cats).sort();
  }, [data]);

  // ============================================================
  // Rendu : Loading
  // ============================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-grind-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-4 border-grind-orange border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-400 font-subhead">CHARGEMENT DES DONNEES...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // Rendu : Erreur
  // ============================================================
  if (error) {
    return (
      <div className="min-h-screen bg-grind-black flex items-center justify-center p-4">
        <div className="bg-grind-dark border border-red-500/30 rounded-lg p-8 max-w-md text-center">
          <p className="text-red-400 text-lg font-display mb-2">ERREUR</p>
          <p className="text-gray-400 text-sm mb-6">{error}</p>
          <button
            onClick={() => { setLoading(true); fetchData(); }}
            className="bg-grind-orange text-white px-6 py-2 rounded font-bold hover:bg-grind-fire transition-colors"
          >
            REESSAYER
          </button>
        </div>
      </div>
    );
  }

  if (!stats || !data) return null;

  const categoryColors: Record<string, string> = {
    U11: '#FF6A00',
    U13: '#FFB347',
    U15: '#FF4444',
    U18: '#C84A00',
  };

  // ============================================================
  // Rendu : Dashboard
  // ============================================================
  return (
    <div className="min-h-screen bg-grind-black text-white">
      {/* --- Header --- */}
      <div className="border-b border-white/10 bg-grind-dark">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h1 className="font-display text-2xl sm:text-3xl tracking-wide">
            THE GRIND CAMP <span className="text-grind-orange">— ADMIN</span>
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setLoading(true); fetchData(); }}
              className="text-xs uppercase font-bold text-gray-400 hover:text-white border border-white/20 px-3 py-1.5 rounded transition-colors"
            >
              Rafraichir
            </button>
            <button
              onClick={handleLogout}
              className="text-xs uppercase font-bold text-red-400 hover:text-red-300 border border-red-500/30 px-3 py-1.5 rounded transition-colors"
            >
              Deconnexion
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* --- Bandeau mode local --- */}
        {isLocalData && (
          <div className="bg-yellow-900/30 border border-yellow-500/40 rounded-lg px-4 py-3 text-sm text-yellow-300">
            Donnees locales (localStorage). Pour les donnees Google Sheets en temps reel, redeployez le script Apps Script avec le nouveau code.
          </div>
        )}

        {/* --- KPI Cards --- */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <KpiCard label="Total Inscrits" value={stats.total} icon="📋" />
          <KpiCard label="Confirmes" value={stats.confirmedCount} icon="✓" accent />
          <KpiCard label="En Attente" value={stats.pendingCount} icon="⏳" />
          <KpiCard label="Places" value={`${data.placesRestantes}/${data.totalPlaces}`} icon="🏀" />
          <KpiCard
            label="Remplissage"
            value={`${stats.fillRate}%`}
            icon="📊"
            accent
            sub={
              (() => {
                const blocks = Math.round(stats.fillRate / 10);
                return '█'.repeat(blocks) + '░'.repeat(10 - blocks);
              })()
            }
          />
        </div>

        {/* --- Graphiques --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Barres par categorie */}
          <div className="bg-grind-dark border border-white/10 rounded-lg p-5 lg:col-span-1">
            <HorizontalBarChart
              title="Repartition par Categorie"
              data={['U11', 'U13', 'U15', 'U18'].map(cat => ({
                label: cat,
                value: stats.categories[cat] || 0,
                color: categoryColors[cat] || '#666'
              }))}
            />
          </div>

          {/* Donuts */}
          <div className="bg-grind-dark border border-white/10 rounded-lg p-5 flex flex-col sm:flex-row items-center justify-around gap-6 lg:col-span-2">
            <DonutChart
              title="Statut"
              data={[
                { label: 'Confirmes', value: stats.confirmedCount, color: '#22C55E' },
                { label: 'En attente', value: stats.pendingCount, color: '#EAB308' },
              ]}
            />
            <DonutChart
              title="Sexe"
              data={[
                { label: 'Garcons', value: stats.sexM, color: '#3B82F6' },
                { label: 'Filles', value: stats.sexF, color: '#EC4899' },
              ]}
            />
          </div>
        </div>

        {/* --- Filtres --- */}
        <div className="bg-grind-dark border border-white/10 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-center">
            {/* Recherche */}
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher (nom, email, ID...)"
                className="w-full bg-black border border-white/20 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-grind-orange"
              />
            </div>

            {/* Filtre Categorie */}
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="bg-black border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-grind-orange"
            >
              <option value="">Toutes categories</option>
              {allCategories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Filtre Statut */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="bg-black border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-grind-orange"
            >
              <option value="">Tous statuts</option>
              <option value="oui">Confirme</option>
              <option value="non">En attente</option>
            </select>

            {/* Filtre Sexe */}
            <select
              value={filterSex}
              onChange={e => setFilterSex(e.target.value)}
              className="bg-black border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-grind-orange"
            >
              <option value="">Tous sexes</option>
              <option value="M">Garcon</option>
              <option value="F">Fille</option>
            </select>

            {/* Export */}
            <button
              onClick={exportCSV}
              className="bg-white text-black px-4 py-2 rounded text-sm font-bold uppercase hover:bg-gray-200 transition-colors whitespace-nowrap"
            >
              Export CSV
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            {filtered.length} inscription{filtered.length !== 1 ? 's' : ''} affichee{filtered.length !== 1 ? 's' : ''}
            {(search || filterCategory || filterStatus || filterSex) ? ' (filtrees)' : ''}
          </p>
        </div>

        {/* --- Tableau --- */}
        <div className="bg-grind-dark border border-white/10 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/50 text-gray-400 uppercase font-subhead text-xs border-b border-white/10">
                <tr>
                  <th className="p-3 cursor-pointer hover:text-white whitespace-nowrap" onClick={() => toggleSort('id')}>
                    ID<SortIcon col="id" />
                  </th>
                  <th className="p-3 cursor-pointer hover:text-white whitespace-nowrap" onClick={() => toggleSort('parentLastName')}>
                    Parent<SortIcon col="parentLastName" />
                  </th>
                  <th className="p-3 whitespace-nowrap">Contact</th>
                  <th className="p-3 cursor-pointer hover:text-white whitespace-nowrap" onClick={() => toggleSort('childFirstName')}>
                    Enfant<SortIcon col="childFirstName" />
                  </th>
                  <th className="p-3 cursor-pointer hover:text-white whitespace-nowrap" onClick={() => toggleSort('category')}>
                    Cat.<SortIcon col="category" />
                  </th>
                  <th className="p-3 cursor-pointer hover:text-white whitespace-nowrap" onClick={() => toggleSort('confirmed')}>
                    Statut<SortIcon col="confirmed" />
                  </th>
                  <th className="p-3 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      Aucune inscription trouvee
                    </td>
                  </tr>
                ) : filtered.map(reg => {
                  const isConfirmed = reg.confirmed.toString().toLowerCase().trim() === 'oui';
                  const isLoading = actionLoading === reg.id;
                  return (
                    <tr key={reg.id} className="hover:bg-white/5 transition-colors">
                      {/* ID */}
                      <td className="p-3 font-mono text-grind-orange text-xs whitespace-nowrap">{reg.id}</td>

                      {/* Parent */}
                      <td className="p-3">
                        <span className="font-bold text-white">{reg.parentLastName.toUpperCase()}</span>{' '}
                        <span className="text-gray-400">{reg.parentFirstName}</span>
                      </td>

                      {/* Contact */}
                      <td className="p-3">
                        <div className="text-xs">{reg.parentEmail}</div>
                        <div className="text-xs text-gray-500">{reg.phone}</div>
                      </td>

                      {/* Enfant */}
                      <td className="p-3">
                        <div>{reg.childFirstName} {reg.childLastName}</div>
                        <div className="text-xs text-gray-500">{reg.birthDate} · {reg.sex}</div>
                      </td>

                      {/* Categorie */}
                      <td className="p-3">
                        <span
                          className="px-2 py-0.5 rounded text-xs font-bold"
                          style={{ backgroundColor: (categoryColors[reg.category.trim()] || '#666') + '33', color: categoryColors[reg.category.trim()] || '#aaa' }}
                        >
                          {reg.category}
                        </span>
                      </td>

                      {/* Statut */}
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${
                          isConfirmed
                            ? 'bg-green-900/60 text-green-300'
                            : 'bg-yellow-900/60 text-yellow-300'
                        }`}>
                          {isConfirmed ? '✓ Oui' : '⏳ Non'}
                        </span>
                        {reg.comment && (
                          <span className="ml-1.5 text-gray-500" title={reg.comment}>💬</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {isLoading ? (
                            <div className="w-5 h-5 border-2 border-grind-orange border-t-transparent rounded-full animate-spin" />
                          ) : isLocalData ? (
                            <span className="text-xs text-gray-600">Lecture seule</span>
                          ) : (
                            <>
                              {isConfirmed ? (
                                <button
                                  onClick={() => handleCancel(reg.id)}
                                  className="text-xs px-2.5 py-1 rounded border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors whitespace-nowrap"
                                >
                                  Annuler
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleConfirm(reg.id)}
                                  className="text-xs px-2.5 py-1 rounded border border-green-500/40 text-green-400 hover:bg-green-500/10 transition-colors whitespace-nowrap"
                                >
                                  Confirmer
                                </button>
                              )}
                              <button
                                onClick={() => setCommentModalReg(reg)}
                                className="text-xs px-2.5 py-1 rounded border border-white/20 text-gray-400 hover:text-white hover:border-white/40 transition-colors whitespace-nowrap"
                              >
                                Note
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- Modal Commentaire --- */}
      {commentModalReg && (
        <CommentModal
          reg={commentModalReg}
          onSave={handleSaveComment}
          onClose={() => setCommentModalReg(null)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
