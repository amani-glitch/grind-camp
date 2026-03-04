/**
 * Google Apps Script - Gestion des inscriptions Grind Camp
 *
 * INSTRUCTIONS DE DEPLOIEMENT :
 * 1. Créer un Google Sheet avec 2 feuilles : "Inscriptions" et "Config"
 *
 * 2. Feuille "Inscriptions" - Ajouter les en-têtes en ligne 1 (colonnes A à V) :
 *    A: ID Inscription | B: Nom Parent | C: Prénom Parent | D: Email Parent |
 *    E: Téléphone | F: Téléphone Secondaire | G: Adresse | H: Code Postal |
 *    I: Ville | J: Nom Enfant | K: Prénom Enfant | L: Date Naissance |
 *    M: Sexe | N: Catégorie | O: Club | P: Contact Urgence |
 *    Q: Tél Urgence | R: Allergies/Santé | S: Date d'inscription |
 *    T: Confirmé | U: Date de confirmation | V: Commentaires
 *
 * 3. Feuille "Config" - Remplir :
 *    A1: 38  (places totales)
 *    B1: =COUNTIF(Inscriptions!T:T,"Oui")  (confirmés)
 *    C1: =A1-B1  (places restantes)
 *
 * 4. Ouvrir Extensions > Apps Script
 * 5. Coller ce script et sauvegarder
 * 6. Déployer > Nouvelle déploiement > Application Web
 *    - Exécuter en tant que : Moi
 *    - Accès : Tout le monde
 * 7. Copier l'URL de déploiement et la coller dans googleSheetsService.ts
 * 8. Ajouter un trigger "onEdit" : Éditeur de déclencheurs > Ajouter > onEdit > Au modification
 *
 * ACTIONS ADMIN (via doGet) :
 *   ?action=registrations          → retourne toutes les inscriptions en JSON
 *   ?action=confirm&id=GRIND-XXXX  → confirme une inscription (col T = "Oui")
 *   ?action=cancel&id=GRIND-XXXX   → annule une inscription (col T = "Non")
 *   ?action=updateComment&id=GRIND-XXXX&comment=... → met à jour le commentaire (col V)
 *   (sans paramètre)               → retourne les places restantes (rétrocompatible)
 */

// ============================================================
// Configuration
// ============================================================
var SHEET_INSCRIPTIONS = "Inscriptions";
var SHEET_CONFIG = "Config";

// ============================================================
// doGet - Dispatcher : places restantes (défaut) + actions admin
// ============================================================
function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : null;

    if (action === "registrations") {
      return jsonResponse_(getRegistrations_());
    }

    if (action === "confirm") {
      var id = e.parameter.id;
      if (!id) return jsonResponse_({ success: false, error: "Paramètre 'id' manquant" });
      return jsonResponse_(confirmRegistration_(id));
    }

    if (action === "cancel") {
      var id = e.parameter.id;
      if (!id) return jsonResponse_({ success: false, error: "Paramètre 'id' manquant" });
      return jsonResponse_(cancelRegistration_(id));
    }

    if (action === "updateComment") {
      var id = e.parameter.id;
      var comment = e.parameter.comment || "";
      if (!id) return jsonResponse_({ success: false, error: "Paramètre 'id' manquant" });
      return jsonResponse_(updateComment_(id, comment));
    }

    // --- Comportement par défaut : places restantes (rétrocompatible) ---
    return jsonResponse_(getPlacesRestantes_());

  } catch (error) {
    return jsonResponse_({ success: false, error: error.message });
  }
}

// ============================================================
// doPost - Reçoit une inscription depuis le formulaire React
// (inchangé, rétrocompatible)
// ============================================================
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var result = registerNewInscription_(data);
    return jsonResponse_(result);
  } catch (error) {
    return jsonResponse_({ success: false, error: error.message });
  }
}

// ============================================================
// onEdit - Met à jour la date de confirmation automatiquement
// Quand la colonne T (Confirmé) passe à "Oui",
// la colonne U (Date de confirmation) se remplit automatiquement
// ============================================================
function onEdit(e) {
  try {
    var sheet = e.source.getActiveSheet();
    var range = e.range;

    // Vérifier qu'on est sur la feuille "Inscriptions" et la colonne T (20)
    if (sheet.getName() !== SHEET_INSCRIPTIONS) return;
    if (range.getColumn() !== 20) return; // Colonne T = 20

    var value = range.getValue().toString().trim();
    var row = range.getRow();

    // Ignorer la ligne d'en-tête
    if (row <= 1) return;

    if (value.toLowerCase() === "oui") {
      // Remplir la date de confirmation en colonne U (21)
      var dateConfirmation = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" });
      sheet.getRange(row, 21).setValue(dateConfirmation);
    } else {
      // Si on remet à "Non", effacer la date de confirmation
      sheet.getRange(row, 21).setValue("");
    }
  } catch (error) {
    // Silently fail for onEdit to avoid disrupting the user
    Logger.log("onEdit error: " + error.message);
  }
}

// ============================================================
// Helper : JSON response
// ============================================================
function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// Helper : Places restantes (comportement doGet original)
// ============================================================
function getPlacesRestantes_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var configSheet = ss.getSheetByName(SHEET_CONFIG);

  var totalPlaces = configSheet.getRange("A1").getValue();
  var confirmes = configSheet.getRange("B1").getValue();
  var placesRestantes = configSheet.getRange("C1").getValue();

  return {
    success: true,
    placesRestantes: placesRestantes,
    totalPlaces: totalPlaces,
    confirmes: confirmes,
    isFull: placesRestantes <= 0
  };
}

// ============================================================
// Helper : Enregistrer une nouvelle inscription (extraite de doPost)
// ============================================================
function registerNewInscription_(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_INSCRIPTIONS);

  // Générer un ID unique
  var id = "GRIND-" + Math.floor(1000 + Math.random() * 9000);
  var timestamp = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" });

  // Construire les informations santé
  var healthInfo = [];
  if (data.allergies) healthInfo.push("Allergies: " + data.allergies);
  if (data.medicalTreatment) healthInfo.push("Traitement: " + data.medicalTreatment);
  if (data.previousAccidents) healthInfo.push("Antécédents: " + data.previousAccidents);
  if (data.specificDiet) healthInfo.push("Régime: " + data.specificDiet);
  var healthString = healthInfo.length > 0 ? healthInfo.join(" | ") : "RAS";

  // Ajouter la ligne (colonnes A à V)
  sheet.appendRow([
    id,                          // A - ID Inscription
    data.parentLastName || "",   // B - Nom Parent
    data.parentFirstName || "",  // C - Prénom Parent
    data.parentEmail || "",      // D - Email Parent
    data.phone || "",            // E - Téléphone
    data.secondaryPhone || "",   // F - Téléphone Secondaire
    data.address || "",          // G - Adresse
    data.zipCode || "",          // H - Code Postal
    data.city || "",             // I - Ville
    data.childLastName || "",    // J - Nom Enfant
    data.childFirstName || "",   // K - Prénom Enfant
    data.birthDate || "",        // L - Date Naissance
    data.sex || "",              // M - Sexe
    data.category || "",         // N - Catégorie
    data.club || "",             // O - Club
    data.emergencyContact || "", // P - Contact Urgence
    data.emergencyPhone || "",   // Q - Tél Urgence
    healthString,                // R - Allergies/Santé
    timestamp,                   // S - Date d'inscription
    "Non",                       // T - Confirmé (défaut)
    "",                          // U - Date de confirmation
    ""                           // V - Commentaires
  ]);

  return {
    success: true,
    id: id,
    message: "Inscription enregistrée avec succès"
  };
}

// ============================================================
// Helper : Trouver le numéro de ligne par ID d'inscription
// Retourne -1 si non trouvé
// ============================================================
function findRowById_(id) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_INSCRIPTIONS);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;

  var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues(); // Colonne A à partir de la ligne 2
  for (var i = 0; i < ids.length; i++) {
    if (ids[i][0].toString().trim() === id.toString().trim()) {
      return i + 2; // +2 car on commence à la ligne 2 et l'index est 0-based
    }
  }
  return -1;
}

// ============================================================
// Action : Retourner toutes les inscriptions
// ============================================================
function getRegistrations_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_INSCRIPTIONS);
  var configSheet = ss.getSheetByName(SHEET_CONFIG);
  var lastRow = sheet.getLastRow();

  // Info places
  var totalPlaces = configSheet.getRange("A1").getValue();
  var confirmes = configSheet.getRange("B1").getValue();
  var placesRestantes = configSheet.getRange("C1").getValue();

  if (lastRow < 2) {
    return {
      success: true,
      registrations: [],
      totalPlaces: totalPlaces,
      confirmes: confirmes,
      placesRestantes: placesRestantes
    };
  }

  // Lire toutes les lignes (A2:V{lastRow})
  var data = sheet.getRange(2, 1, lastRow - 1, 22).getValues();
  var registrations = [];

  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    registrations.push({
      id: row[0],               // A - ID
      parentLastName: row[1],   // B
      parentFirstName: row[2],  // C
      parentEmail: row[3],      // D
      phone: row[4],            // E
      secondaryPhone: row[5],   // F
      address: row[6],          // G
      zipCode: row[7],          // H
      city: row[8],             // I
      childLastName: row[9],    // J
      childFirstName: row[10],  // K
      birthDate: row[11] instanceof Date
        ? Utilities.formatDate(row[11], "Europe/Paris", "dd/MM/yyyy")
        : row[11].toString(),   // L
      sex: row[12],             // M
      category: row[13],        // N
      club: row[14],            // O
      emergencyContact: row[15],// P
      emergencyPhone: row[16],  // Q
      healthInfo: row[17],      // R
      registrationDate: row[18] instanceof Date
        ? Utilities.formatDate(row[18], "Europe/Paris", "dd/MM/yyyy HH:mm")
        : row[18].toString(),   // S
      confirmed: row[19],       // T
      confirmationDate: row[20] instanceof Date
        ? Utilities.formatDate(row[20], "Europe/Paris", "dd/MM/yyyy HH:mm")
        : row[20].toString(),   // U
      comment: row[21]          // V
    });
  }

  return {
    success: true,
    registrations: registrations,
    totalPlaces: totalPlaces,
    confirmes: confirmes,
    placesRestantes: placesRestantes
  };
}

// ============================================================
// Action : Confirmer une inscription (col T = "Oui", col U = date)
// ============================================================
function confirmRegistration_(id) {
  var row = findRowById_(id);
  if (row === -1) {
    return { success: false, error: "Inscription '" + id + "' non trouvée" };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_INSCRIPTIONS);
  var dateConfirmation = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" });

  sheet.getRange(row, 20).setValue("Oui"); // Colonne T
  sheet.getRange(row, 21).setValue(dateConfirmation); // Colonne U

  return {
    success: true,
    id: id,
    message: "Inscription " + id + " confirmée",
    confirmationDate: dateConfirmation
  };
}

// ============================================================
// Action : Annuler une inscription (col T = "Non", col U = vide)
// ============================================================
function cancelRegistration_(id) {
  var row = findRowById_(id);
  if (row === -1) {
    return { success: false, error: "Inscription '" + id + "' non trouvée" };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_INSCRIPTIONS);

  sheet.getRange(row, 20).setValue("Non"); // Colonne T
  sheet.getRange(row, 21).setValue("");     // Colonne U

  return {
    success: true,
    id: id,
    message: "Inscription " + id + " annulée"
  };
}

// ============================================================
// Action : Mettre à jour le commentaire (col V)
// ============================================================
function updateComment_(id, comment) {
  var row = findRowById_(id);
  if (row === -1) {
    return { success: false, error: "Inscription '" + id + "' non trouvée" };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_INSCRIPTIONS);

  sheet.getRange(row, 22).setValue(comment); // Colonne V

  return {
    success: true,
    id: id,
    message: "Commentaire mis à jour pour " + id
  };
}
