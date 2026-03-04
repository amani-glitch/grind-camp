// Email Service - Connects to Google Cloud Function
// Configure the CLOUD_FUNCTION_URL after deploying the function

const CLOUD_FUNCTION_URL = 'https://sendregistrationemail-u5azdc2cvq-ew.a.run.app';

interface RegistrationData {
  id: string;
  parent: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    postalCode: string;
    city: string;
  };
  child: {
    firstName: string;
    lastName: string;
    birthDate: string;
    category: string;
    club?: string;
    level: string;
    tshirtSize: string;
  };
  health: {
    allergies?: string;
    treatment?: string;
    medicalInfo?: string;
  };
}

export const emailService = {
  /**
   * Send registration notification emails
   * - Admin receives full registration details
   * - Parent receives confirmation email
   */
  sendRegistrationEmails: async (registration: RegistrationData): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('📧 Appel Cloud Function:', CLOUD_FUNCTION_URL);
      console.log('📦 Données:', registration);
      
      const response = await fetch(CLOUD_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registration),
      });

      console.log('📊 Réponse HTTP:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur serveur (raw):', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText };
        }
        
        console.error('❌ Erreur serveur (parsed):', errorData);
        throw new Error(errorData.error || errorData.message || 'Erreur lors de l\'envoi des emails');
      }

      const result = await response.json();
      console.log('✅ Succès:', result);
      return {
        success: true,
        message: result.message || 'Emails envoyés avec succès'
      };
    } catch (error) {
      console.error('💥 Email service error:', error);

      // Don't block registration if email fails - just log it
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }
};
