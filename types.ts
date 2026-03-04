export interface ParentInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  secondaryPhone?: string;
  address: string;
  zipCode: string;
  city: string;
}

export interface ChildInfo {
  firstName: string;
  lastName: string;
  birthDate: string; // Changed from birthYear to full date
  sex: 'M' | 'F';
  category: 'U11' | 'U13' | 'U15' | 'U18';
  club?: string;
  level?: 'Débutant' | 'Intermédiaire' | 'Confirmé' | 'Élite';
}

export interface HealthInfo {
  vaccinationsUpToDate: boolean;
  vaccinationsDetails?: string;
  allergies?: string;
  medicalTreatment: boolean;
  medicalTreatmentDetails?: string;
  specificDiet: boolean;
  specificDietDetails?: string;
  previousAccidents?: string;
  emergencyContact: string;
  emergencyPhone: string;
}

export interface Registration {
  id: string; // GRIND-XXXX
  timestamp: string;
  parent: ParentInfo;
  child: ChildInfo;
  health: HealthInfo;
  consents: {
    rules: boolean;
    imageRights: boolean;
    autonomousExit: boolean;
    rgpd: boolean;
  };
  status: 'pending' | 'confirmed' | 'paid' | 'cancelled';
  totalPrice: number;
}

export interface WaitlistEntry {
  id: string;
  email: string;
  category: string;
  comment?: string;
  timestamp: string;
}

export interface Coach {
  name: string;
  role: string;
  description: string;
  image: string;
  tags: string[];
}

export interface Drill {
  id: string;
  title: string;
  category: 'Handle' | 'Finition' | 'Shoot';
  description: string;
  difficulty: 1 | 2 | 3;
}

export interface StageConfig {
  name: string;
  tagline: string;
  location: string;
  dates: string;
  price: number;
  maxCapacity: number;
  contact: {
    phone: string;
    email: string;
  };
  features: string[];
}