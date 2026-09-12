import { db } from './connection';

// Clear existing data first, so this script can be re-run safely
db.exec('DELETE FROM opportunities');
db.exec('DELETE FROM contacts');

const insertContact = db.prepare(`
  INSERT INTO contacts (first_name, last_name, email, company, role)
  VALUES (?, ?, ?, ?, ?)
`);

const insertOpportunity = db.prepare(`
  INSERT INTO opportunities (contact_id, name, stage, amount, close_date, notes)
  VALUES (?, ?, ?, ?, ?, ?)
`);

// Wrap everything in a transaction: either all inserts succeed, or none do
const seed = db.transaction(() => {
  const contacts = [
    ['Marc', 'Dubreuil', 'm.dubreuil@atlantique-log.fr', 'Atlantique Logistique', 'Directeur des Achats'],
    ['Sophie', 'Lenoir', 's.lenoir@nordis.com', 'Nordis Retail', 'Responsable IT'],
    ['Karim', 'Belhadj', 'k.belhadj@vertconso.fr', 'VertConso', 'Directeur Général'],
    ['Julie', 'Fabre', 'j.fabre@meditrans.eu', 'Meditrans', 'Cheffe de Projet Digital'],
    ['Thomas', 'Girard', 't.girard@omnipharma.fr', 'OmniPharma', 'Directeur Commercial'],
    ['Anaïs', 'Roche', 'a.roche@citybuild.fr', 'CityBuild Promotion', 'Responsable Innovation'],
    ['Pierre', 'Vasseur', 'p.vasseur@fluxenergie.com', 'FluxEnergie', 'DSI'],
    ['Elodie', 'Marchand', 'e.marchand@nordis.com', 'Nordis Retail', 'Directrice des Opérations'],
  ];

  const contactIds = contacts.map((c) => insertContact.run(...c).lastInsertRowid);

  const opportunities: [number, string, string, number, string, string][] = [
    [
      contactIds[0] as number,
      'Renouvellement contrat logistique annuel',
      'negotiation',
      45000,
      '2026-10-15',
      "Client historique, satisfait du service actuel. Demande une remise de 8% sur le renouvellement suite à une offre concurrente reçue de LogiPro. A confirmé être toujours en discussion interne avec sa direction financière avant validation finale. Souhaite un geste commercial mais reste sur une base de fidélité forte.",
    ],
    [
      contactIds[1] as number,
      'Migration plateforme e-commerce',
      'proposal',
      78000,
      '2026-11-30',
      'Proposition envoyée le 2 septembre. Sophie a confirmé réception mais indique que le comité de décision ne se réunit que fin octobre. Aucun signal négatif pour le moment.',
    ],
    [
      contactIds[2] as number,
      'Audit RSE et mise en conformité',
      'closed_won',
      22000,
      '2026-08-01',
      'Signé rapidement, Karim très engagé sur les sujets RSE personnellement. Projet déjà démarré, bonne relation.',
    ],
    [
      contactIds[3] as number,
      'Refonte application mobile patients',
      'qualification',
      95000,
      '2026-12-20',
      "Premier échange très prometteur avec Julie. Le besoin est encore flou côté cahier des charges, elle doit consulter son équipe médicale avant d'aller plus loin. Budget évoqué à l'oral mais non confirmé par écrit. A prévoir une relance dans 3 semaines pour clarifier le périmètre exact.",
    ],
    [
      contactIds[4] as number,
      "Outil de suivi de la force de vente",
      'closed_lost',
      31000,
      '2026-07-10',
      "Perdu face à un concurrent moins cher. Thomas a été honnête sur le fait que le prix était le seul point bloquant, la solution technique leur plaisait davantage que celle retenue. A garder le contact pour un futur appel d'offres.",
    ],
    [
      contactIds[5] as number,
      'Plateforme de gestion de chantiers',
      'prospecting',
      60000,
      '2027-02-01',
      'Premier contact pris suite à un salon professionnel. Pas encore de rendez-vous qualifié planifié.',
    ],
    [
      contactIds[6] as number,
      "Dashboard de pilotage énergétique",
      'negotiation',
      54000,
      '2026-10-05',
      "Pierre est très technique et pose beaucoup de questions sur la sécurité des données et l'hébergement. Il a évoqué à plusieurs reprises des inquiétudes sur la conformité RGPD du sous-traitant hébergeur pressenti, ce qui bloque actuellement la signature malgré un accord de principe sur le prix et le périmètre fonctionnel. Une réunion technique dédiée est prévue la semaine prochaine avec son équipe sécurité pour lever ce point.",
    ],
    [
      contactIds[7] as number,
      "Extension du contrat existant, module analytics",
      'proposal',
      18000,
      '2026-11-05',
      'Extension logique du projet Nordis déjà en cours avec Sophie. Elodie valide le principe, en attente de signature administrative.',
    ],
    [
      contactIds[0] as number,
      'Formation équipe achats aux nouveaux outils',
      'closed_won',
      8000,
      '2026-06-15',
      'Petit projet complémentaire, livré sans accroc.',
    ],
    [
      contactIds[2] as number,
      'Deuxième phase audit RSE',
      'qualification',
      15000,
      '2027-01-15',
      "Karim évoque une suite possible à l'audit initial mais rien de concret pour l'instant, discussion informelle lors d'un point de suivi.",
    ],
    [
      contactIds[4] as number,
      "Module de reporting commercial additionnel",
      'prospecting',
      12000,
      '2027-03-01',
      'Reprise de contact après le deal perdu, sur un besoin plus restreint.',
    ],
    [
      contactIds[3] as number,
      "Maintenance évolutive application existante",
      'negotiation',
      27000,
      '2026-10-20',
      "Julie souhaite sécuriser un contrat de maintenance en parallèle du projet de refonte, pour l'application actuelle en attendant. Les conditions financières sont globalement actées, il reste un point de désaccord sur la durée d'engagement : elle pousse pour 6 mois renouvelables, nous proposions 12 mois fermes.",
    ],
  ];

  opportunities.forEach((opp) => insertOpportunity.run(...opp));
});

seed();

console.log('Seed complete: 8 contacts, 12 opportunities inserted.');