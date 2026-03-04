// In a real implementation, this would call the Gemini API
// import { GoogleGenAI } from "@google/genai";

export const geminiService = {
  chat: async (userMessage: string): Promise<string> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const lowerMsg = userMessage.toLowerCase();

    // Identité
    if (lowerMsg.includes('qui es tu') || lowerMsg.includes('t\'es qui') || lowerMsg.includes('botler')) {
      return "Je suis Botler, l'assistant du Grind Camp ! Ma mission : te donner toutes les infos pour préparer ta saison. Passion, Rigueur, Basket !";
    }

    // Prix
    if (lowerMsg.includes('prix') || lowerMsg.includes('tarif') || lowerMsg.includes('combien') || lowerMsg.includes('cout')) {
      return "Le stage est à 240€ la semaine. C'est du tout inclus : repas du midi, tenue complète, tee-shirt du camp et même la sortie à Wave Island le mercredi !";
    }
    
    // Dates & Lieu
    if (lowerMsg.includes('date') || lowerMsg.includes('quand') || lowerMsg.includes('lieu') || lowerMsg.includes('ou') || lowerMsg.includes('c\'est ou')) {
      return "Rendez-vous du 3 au 7 août 2026 à Pernes-les-Fontaines (84), au complexe sportif Paul de Vivie. On t'attend sur le terrain !";
    }

    // Public / Niveau
    if (lowerMsg.includes('niveau') || lowerMsg.includes('age') || lowerMsg.includes('u11') || lowerMsg.includes('u13') || lowerMsg.includes('u15') || lowerMsg.includes('u18') || lowerMsg.includes('fille') || lowerMsg.includes('garcon')) {
      return "Le camp est ouvert aux U11, U13, U15 et U18 (filles et garçons). Si tu aimes le basket et que tu veux bosser dur pour progresser, ta place est ici !";
    }

    // Staff
    if (lowerMsg.includes('coach') || lowerMsg.includes('entraineur') || lowerMsg.includes('staff') || lowerMsg.includes('qui')) {
      return "Gros staff cette année : Pascal Mercier (Responsable, Coach Ligue), Melvyn Mercier (Coach U13), Bachir Mila (Coach U13 Ligue) et Mohammed Boumkar (Joueur International Marocain). Ça va envoyer !";
    }

    // Contact
    if (lowerMsg.includes('contact') || lowerMsg.includes('telephone') || lowerMsg.includes('mail') || lowerMsg.includes('joindre') || lowerMsg.includes('appeler')) {
      return "Tu peux joindre Pascal Mercier au 07 66 82 23 22 ou par email à grindcamp84@gmail.com.";
    }

    // Default fallback
    return "Je n'ai pas la réponse exacte là, tout de suite. Mais tu sais quoi ? Appelle Pascal au 07 66 82 23 22, il te répondra avec plaisir !";
  }
};