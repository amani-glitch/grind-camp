import { Registration, WaitlistEntry } from '../types';
import { CONFIG as STAGE_CONFIG } from '../data/stageConfig';
import { cryptoService } from './cryptoService';
import { googleSheetsService } from './googleSheetsService';

const KEYS = {
  REGISTRATIONS: 'grind_registrations_v2', // New key for encrypted data
  WAITLIST: 'grind_waitlist_v2',
  MESSAGES: 'grind_messages',
  CONFIG: 'grind_config'
};

// Legacy keys for migration
const LEGACY_KEYS = {
  REGISTRATIONS: 'grind_registrations',
  WAITLIST: 'grind_waitlist'
};

// Helper to get typed data with encryption
const get = async <T,>(key: string, defaultValue: T, legacyKey?: string): Promise<T> => {
  const data = localStorage.getItem(key);

  if (data) {
    try {
      const decrypted = await cryptoService.decrypt(data);
      return JSON.parse(decrypted);
    } catch {
      // If parsing fails, return default
      return defaultValue;
    }
  }

  // Check for legacy unencrypted data and migrate
  if (legacyKey) {
    const legacyData = localStorage.getItem(legacyKey);
    if (legacyData) {
      try {
        const parsed = JSON.parse(legacyData);
        // Migrate to encrypted storage
        await set(key, parsed);
        // Remove legacy data
        localStorage.removeItem(legacyKey);
        return parsed;
      } catch {
        return defaultValue;
      }
    }
  }

  return defaultValue;
};

// Helper to set data with encryption
const set = async <T,>(key: string, value: T): Promise<void> => {
  const encrypted = await cryptoService.encrypt(JSON.stringify(value));
  localStorage.setItem(key, encrypted);
};

// Synchronous helpers for non-sensitive data
const getSync = <T,>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

const setSync = <T,>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const storageService = {
  // Registrations (async for encryption)
  getRegistrations: async (): Promise<Registration[]> => {
    return get<Registration[]>(KEYS.REGISTRATIONS, [], LEGACY_KEYS.REGISTRATIONS);
  },

  addRegistration: async (reg: Omit<Registration, 'id' | 'timestamp' | 'status' | 'totalPrice'>): Promise<Registration> => {
    const registrations = await storageService.getRegistrations();
    const id = `GRIND-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRegistration: Registration = {
      ...reg,
      id,
      timestamp: new Date().toISOString(),
      status: 'pending',
      totalPrice: STAGE_CONFIG.price
    };

    registrations.push(newRegistration);
    await set(KEYS.REGISTRATIONS, registrations);
    return newRegistration;
  },

  getRegistrationById: async (id: string): Promise<Registration | undefined> => {
    const registrations = await storageService.getRegistrations();
    return registrations.find(r => r.id === id);
  },

  // Waitlist (async for encryption)
  getWaitlist: async (): Promise<WaitlistEntry[]> => {
    return get<WaitlistEntry[]>(KEYS.WAITLIST, [], LEGACY_KEYS.WAITLIST);
  },

  addToWaitlist: async (email: string, category: string, comment?: string): Promise<void> => {
    const list = await storageService.getWaitlist();
    list.push({
      id: crypto.randomUUID(),
      email,
      category,
      comment,
      timestamp: new Date().toISOString()
    });
    await set(KEYS.WAITLIST, list);
  },

  // Config (sync - not sensitive data)
  getConfig: (): Partial<typeof STAGE_CONFIG> => getSync(KEYS.CONFIG, {}),

  updateConfig: (cfg: Partial<typeof STAGE_CONFIG>): void => {
    const current = storageService.getConfig();
    setSync(KEYS.CONFIG, { ...current, ...cfg });
  },

  getCapacityStatus: async () => {
    // Essayer Google Sheets d'abord (source de vérité)
    try {
      const sheetsData = await googleSheetsService.getPlacesRestantes();
      if (sheetsData) {
        return {
          current: sheetsData.confirmes,
          max: sheetsData.totalPlaces,
          isFull: sheetsData.isFull
        };
      }
    } catch {
      // Fallback silencieux vers le calcul local
    }

    // Fallback : calcul local via localStorage
    const regs = (await storageService.getRegistrations()).filter(r => r.status !== 'cancelled');
    const dynamicConfig = storageService.getConfig();
    const max = dynamicConfig.maxCapacity || STAGE_CONFIG.maxCapacity;
    return {
      current: regs.length,
      max: max,
      isFull: regs.length >= max
    };
  },

  // Coach images (sync - not sensitive data)
  getCoachImages: (): Record<string, string> => getSync('grind_coach_images', {}),

  setCoachImages: (images: Record<string, string>): void => {
    setSync('grind_coach_images', images);
  }
};