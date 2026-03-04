/**
 * Service de synchronisation avec Google Sheets
 *
 * Pour activer : remplacer l'URL ci-dessous par l'URL de déploiement
 * de votre Google Apps Script (voir google-apps-script.js pour les instructions)
 */

// ⚠️ REMPLACER PAR VOTRE URL DE DEPLOIEMENT GOOGLE APPS SCRIPT
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwoFLHF2ZM9hdn2pDMveVVpDnkg5FDIKsHJiXOl6CokNZ26qAG0zpqTrnB4vsJhbLikXQ/exec';

function isConfigured(): boolean {
  const url: string = GOOGLE_SCRIPT_URL;
  return url !== 'VOTRE_URL_GOOGLE_APPS_SCRIPT_ICI' && url.startsWith('https://');
}

// ============================================================
// Interfaces existantes
// ============================================================

export interface PlacesInfo {
  placesRestantes: number;
  totalPlaces: number;
  confirmes: number;
  isFull: boolean;
}

export interface SheetRegistrationData {
  parentFirstName: string;
  parentLastName: string;
  parentEmail: string;
  phone: string;
  secondaryPhone?: string;
  address: string;
  zipCode: string;
  city: string;
  childFirstName: string;
  childLastName: string;
  birthDate: string;
  sex: string;
  category: string;
  club?: string;
  emergencyContact: string;
  emergencyPhone: string;
  allergies?: string;
  medicalTreatment?: string;
  previousAccidents?: string;
  specificDiet?: string;
}

// ============================================================
// Interfaces admin
// ============================================================

export interface SheetRegistrationRow {
  id: string;
  parentLastName: string;
  parentFirstName: string;
  parentEmail: string;
  phone: string;
  secondaryPhone: string;
  address: string;
  zipCode: string;
  city: string;
  childLastName: string;
  childFirstName: string;
  birthDate: string;
  sex: string;
  category: string;
  club: string;
  emergencyContact: string;
  emergencyPhone: string;
  healthInfo: string;
  registrationDate: string;
  confirmed: string;
  confirmationDate: string;
  comment: string;
}

export interface RegistrationsResponse {
  success: boolean;
  registrations: SheetRegistrationRow[];
  totalPlaces: number;
  confirmes: number;
  placesRestantes: number;
  error?: string;
}

export interface AdminActionResponse {
  success: boolean;
  id?: string;
  message?: string;
  confirmationDate?: string;
  error?: string;
}

// ============================================================
// Methodes existantes (inchangees)
// ============================================================

/**
 * Récupère le nombre de places restantes depuis Google Sheets
 * Retourne null si le service n'est pas configuré ou injoignable
 */
export async function getPlacesRestantes(): Promise<PlacesInfo | null> {
  if (!isConfigured()) {
    return null;
  }

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      console.warn('Google Sheets API responded with status:', response.status);
      return null;
    }

    const data = await response.json();

    if (!data.success) {
      console.warn('Google Sheets API error:', data.error);
      return null;
    }

    return {
      placesRestantes: data.placesRestantes,
      totalPlaces: data.totalPlaces,
      confirmes: data.confirmes,
      isFull: data.isFull
    };
  } catch (error) {
    console.warn('Google Sheets injoignable, fallback local:', error);
    return null;
  }
}

/**
 * Envoie les données d'inscription vers Google Sheets
 * Non-bloquant : ne fait pas échouer l'inscription si le service est indisponible
 */
export async function submitToGoogleSheet(data: SheetRegistrationData): Promise<boolean> {
  if (!isConfigured()) {
    console.info('Google Sheets non configuré, données non envoyées');
    return false;
  }

  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      mode: 'no-cors' // Apps Script ne supporte pas CORS preflight sur POST
    });

    // Avec no-cors, on ne peut pas lire la réponse, mais l'envoi est fait
    console.log('Données envoyées vers Google Sheets');
    return true;
  } catch (error) {
    console.error('Erreur envoi Google Sheets:', error);
    return false;
  }
}

// ============================================================
// Methodes admin
// ============================================================

/**
 * Helper interne pour les appels admin via GET
 */
async function adminAction(params: Record<string, string>): Promise<any> {
  if (!isConfigured()) {
    throw new Error('Google Sheets non configuré');
  }

  const url = new URL(GOOGLE_SCRIPT_URL);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Erreur inconnue');
  }

  return data;
}

/**
 * Récupère toutes les inscriptions depuis Google Sheets
 */
export async function getAllRegistrations(): Promise<RegistrationsResponse> {
  const data = await adminAction({ action: 'registrations' });
  return {
    success: data.success,
    registrations: data.registrations || [],
    totalPlaces: data.totalPlaces ?? 38,
    confirmes: data.confirmes ?? 0,
    placesRestantes: data.placesRestantes ?? 38,
    error: data.error
  };
}

/**
 * Confirme une inscription (colonne T = "Oui")
 */
export async function confirmRegistration(id: string): Promise<AdminActionResponse> {
  return await adminAction({ action: 'confirm', id }) as AdminActionResponse;
}

/**
 * Annule une inscription (colonne T = "Non")
 */
export async function cancelRegistration(id: string): Promise<AdminActionResponse> {
  return await adminAction({ action: 'cancel', id }) as AdminActionResponse;
}

/**
 * Met à jour le commentaire d'une inscription (colonne V)
 */
export async function updateComment(id: string, comment: string): Promise<AdminActionResponse> {
  return await adminAction({ action: 'updateComment', id, comment }) as AdminActionResponse;
}

// ============================================================
// Export
// ============================================================

export const googleSheetsService = {
  getPlacesRestantes,
  submitToGoogleSheet,
  isConfigured,
  getAllRegistrations,
  confirmRegistration,
  cancelRegistration,
  updateComment
};
