import type { ConstellationData } from './types';

export const PITCH_DATA: ConstellationData = {
  nodes: [
    // ── Hub ──────────────────────────────────────────────────────────────────
    {
      id: 'hub',
      label: 'Souveraineté Pharma',
      type: 'hub',
      depth: 0,
      title: 'Souveraineté pharmaceutique française',
      body: 'Cartographie des acteurs qui structurent la politique du médicament en France : régulateurs, industriels, financeurs publics et représentation parlementaire.',
      stat: '3',
      statLabel: 'piliers d\'analyse',
    },

    // ── Piliers ───────────────────────────────────────────────────────────────
    {
      id: 'p-reg',
      label: 'Régulation',
      type: 'pillar',
      parentId: 'hub',
      depth: 1,
      title: 'Cadre réglementaire',
      body: 'Les autorités qui encadrent l\'autorisation, le contrôle et la fixation du prix des médicaments sur le territoire français.',
      stat: '€2.4Mds',
      statLabel: 'budget ANSM + CEPS 2024',
    },
    {
      id: 'p-indus',
      label: 'Industrie',
      type: 'pillar',
      parentId: 'hub',
      depth: 1,
      title: 'Acteurs industriels',
      body: 'Les laboratoires et financeurs publics qui constituent le tissu industriel pharmaceutique français.',
      stat: '€62Mds',
      statLabel: 'CA secteur France 2023',
    },
    {
      id: 'p-parl',
      label: 'Parlement',
      type: 'pillar',
      parentId: 'hub',
      depth: 1,
      title: 'Influence parlementaire',
      body: 'Les élus en position de contrôle ou d\'influence directe sur la politique du médicament via la commission Affaires sociales et le vote de la LFSS.',
      stat: '12',
      statLabel: 'députés actifs sur le dossier',
    },

    // ── Régulation ────────────────────────────────────────────────────────────
    {
      id: 'inst-ansm',
      label: 'ANSM',
      type: 'institution',
      parentId: 'p-reg',
      depth: 2,
      title: 'Agence nationale de sécurité du médicament',
      body: 'Délivre les autorisations de mise sur le marché (AMM), surveille la pharmacovigilance et inspecte les sites de production pharmaceutique.',
      institutionKind: 'Autorité administrative indépendante',
      stat: '900',
      statLabel: 'agents · 150 inspections/an',
    },
    {
      id: 'inst-min',
      label: 'Min. Santé',
      type: 'institution',
      parentId: 'p-reg',
      depth: 2,
      title: 'Ministère de la Santé et de la Prévention',
      body: 'Fixe la politique nationale du médicament, exerce la tutelle sur l\'ANSM et pilote les négociations de prix via le Comité économique des produits de santé (CEPS).',
      institutionKind: 'Ministère',
    },

    // ── Industrie ─────────────────────────────────────────────────────────────
    {
      id: 'c-sanofi',
      label: 'Sanofi S.A.',
      type: 'company',
      parentId: 'p-indus',
      depth: 2,
      title: 'Sanofi S.A.',
      body: 'SIREN : 395 030 844 · PDG : Paul Hudson (depuis 2019). Premier laboratoire pharmaceutique français, présent dans 90 pays. Portefeuille centré sur immunologie, oncologie et vaccins (Opella). 91 000 collaborateurs.',
      stat: '€43Mds',
      statLabel: 'CA mondial 2023',
    },
    {
      id: 'inst-bpi',
      label: 'Bpifrance',
      type: 'institution',
      parentId: 'p-indus',
      depth: 2,
      title: 'Bpifrance',
      body: 'Co-finance les projets de relocalisation industrielle dans la santé via les fonds "Souveraineté" post-Covid et le Programme d\'investissements d\'avenir (PIA4).',
      institutionKind: 'Banque publique d\'investissement',
      stat: '€2Mds',
      statLabel: 'investis en santé 2020–2024',
    },
    {
      id: 'c-servier',
      label: 'Servier',
      type: 'company',
      parentId: 'p-indus',
      depth: 2,
      title: 'Groupe Servier',
      body: 'Groupe pharmaceutique français indépendant et familial, actif en cardiologie, oncologie et diabétologie. Siège à Gif-sur-Yvette.',
      stat: '€5.2Mds',
      statLabel: 'CA 2023',
    },

    // ── Parlement ─────────────────────────────────────────────────────────────
    {
      id: 'elu-liso',
      label: 'C. Lisowski',
      type: 'elu',
      parentId: 'p-parl',
      depth: 2,
      title: 'Caroline Lisowski',
      body: 'Rapporteure de la Commission des Affaires Sociales sur la proposition de loi relative au renforcement de la souveraineté pharmaceutique française.',
      eluMandate: 'Députée — Moselle 3e circonscription',
      eluParty: 'Ensemble',
      eluCommission: 'Commission des Affaires sociales',
    },
    {
      id: 'elu-tain',
      label: 'O. Tainturier',
      type: 'elu',
      parentId: 'p-parl',
      depth: 2,
      title: 'Olivier Tainturier',
      body: 'Co-signataire du rapport sur la désertification pharmaceutique et le rapatriement de la production de principes actifs (API) en France.',
      eluMandate: 'Député — Seine-et-Marne 2e circonscription',
      eluParty: 'Renaissance',
      eluCommission: 'Commission des Affaires sociales',
    },
    {
      id: 'elu-dhar',
      label: 'P. Dharréville',
      type: 'elu',
      parentId: 'p-parl',
      depth: 2,
      title: 'Pierre Dharréville',
      body: 'Auteur de plusieurs rapports sur l\'accès aux médicaments et la transparence des prix pratiqués par l\'industrie pharmaceutique. Voix critique du lobbying pharma à l\'Assemblée.',
      eluMandate: 'Député — Bouches-du-Rhône 14e circ.',
      eluParty: 'Gauche Démocrate et Républicaine',
      eluCommission: 'Commission des Affaires sociales',
    },

    // ── Contacts Sanofi (visibles en drill) ───────────────────────────────────
    {
      id: 'p-berard',
      label: 'T. Bérard',
      type: 'person',
      parentId: 'c-sanofi',
      depth: 3,
      title: 'Thomas Bérard',
      body: 'Directeur des affaires publiques France & Europe chez Sanofi depuis 2018. Ancien conseiller technique au cabinet du ministère de la Santé (2014–2017). Interlocuteur principal des parlementaires.',
      personPosition: 'Directeur Affaires Publiques',
      personCompany: 'Sanofi S.A.',
      personEmail: 't.berard@sanofi.com',
    },
    {
      id: 'p-nguyen',
      label: 'L. Nguyen',
      type: 'person',
      parentId: 'c-sanofi',
      depth: 3,
      title: 'Linh Nguyen',
      body: 'Directrice des relations institutionnelles. Coordonne les interactions avec l\'ANSM et le Ministère. Ancienne chargée de mission à la Direction générale de la santé (DGS).',
      personPosition: 'Directrice Relations Institutionnelles',
      personCompany: 'Sanofi S.A.',
    },
  ],

  edges: [
    // Régulation
    {
      id: 'r1', sourceId: 'inst-ansm', targetId: 'c-sanofi',
      label: 'délivre les AMM', relationType: 'regule',
      body: 'L\'ANSM évalue les dossiers d\'AMM déposés par Sanofi et assure le suivi de pharmacovigilance post-commercialisation sur l\'ensemble du portefeuille.',
    },
    {
      id: 'r2', sourceId: 'inst-min', targetId: 'inst-ansm',
      label: 'tutelle', relationType: 'regule',
      body: 'Le ministère exerce la tutelle administrative et budgétaire sur l\'ANSM. Il nomme son directeur général par décret en conseil des ministres.',
    },
    {
      id: 'r3', sourceId: 'inst-min', targetId: 'c-sanofi',
      label: 'négocie les prix', relationType: 'regule',
      body: 'Via le CEPS, le ministère négocie le prix de remboursement des médicaments Sanofi pris en charge par la Sécurité sociale. Enjeu : €1.2Mds de remises annuelles.',
    },
    // Finance
    {
      id: 'r4', sourceId: 'inst-bpi', targetId: 'c-sanofi',
      label: 'fonds souveraineté', relationType: 'finance',
      body: 'Bpifrance a co-investi dans le plan de relocalisation des principes actifs (API) de Sanofi en France, dans le cadre du fonds Souveraineté post-Covid (€400M engagés).',
    },
    {
      id: 'r5', sourceId: 'inst-bpi', targetId: 'c-servier',
      label: 'PIA Santé', relationType: 'finance',
      body: 'Financement PIA4 pour le développement d\'une ligne de production de thérapies innovantes chez Servier. Contrat signé en 2022.',
    },
    // Parlementaire
    {
      id: 'r6', sourceId: 'elu-liso', targetId: 'c-sanofi',
      label: 'auditionne', relationType: 'regule',
      body: 'Dans le cadre de la commission d\'enquête sur la souveraineté pharmaceutique, Caroline Lisowski a auditionné les dirigeants de Sanofi France sur les délocalisations.',
    },
    {
      id: 'r7', sourceId: 'elu-liso', targetId: 'inst-ansm',
      label: 'mission de contrôle', relationType: 'collabore',
      body: 'Membre de la mission d\'information sur les ATU (autorisations temporaires d\'utilisation). Échanges réguliers avec la direction de l\'ANSM sur les délais d\'AMM.',
    },
    {
      id: 'r8', sourceId: 'elu-tain', targetId: 'elu-liso',
      label: 'co-rapporteurs', relationType: 'collabore',
      body: 'Co-signataires du rapport "Souveraineté pharmaceutique : 40 propositions pour rapatrier la production en France" (Commission Affaires sociales, 2023).',
    },
    {
      id: 'r9', sourceId: 'elu-dhar', targetId: 'c-sanofi',
      label: 'rapport d\'investigation', relationType: 'regule',
      body: 'Pierre Dharréville a publié un rapport pointant les écarts entre les prix de cession intra-groupe de Sanofi et les prix facturés à l\'Assurance maladie française.',
    },
    // Contacts (visibles en drill Sanofi)
    {
      id: 'r10', sourceId: 'p-berard', targetId: 'elu-liso',
      label: 'échanges réguliers', relationType: 'collabore',
      body: 'Thomas Bérard rencontre le cabinet de Caroline Lisowski pour préparer les auditions parlementaires et partager les positions de Sanofi sur les textes en cours.',
    },
    {
      id: 'r11', sourceId: 'p-berard', targetId: 'inst-ansm',
      label: 'interlocuteur clé', relationType: 'emploie',
      body: 'Interlocuteur principal de l\'ANSM pour les dossiers de pharmacovigilance et les renouvellements d\'AMM du portefeuille Sanofi France.',
    },
  ],
};
