// Cliffwalkers — textes FR / EN.
export const DICT = {
  fr: {
    title: 'Cliffwalkers',
    tagline: 'Une file de petits marcheurs se jette dans le vide. À vous de les sauver !',
    play: 'Jouer',
    levels: 'Niveaux',
    continue: 'Continuer',
    howTo: 'Comment jouer',
    help1: 'Les marcheurs sortent de la trappe et avancent tout seuls, sans jamais s\'arrêter. Vous ne pouvez que leur donner des compétences. Grimpeur, parachutiste, bâtisseur, foreur, mineur, creuseur : choisissez-en une en bas, puis touchez le décor à l\'endroit voulu. Un repère s\'y plante et le premier marcheur qui passe dessus l\'exécute (touchez un repère pour le retirer).',
    help2: 'Bloqueur et kamikaze se donnent directement à un marcheur : touchez-le. Sauvez au moins le nombre demandé avant la fin du temps ; une chute de plus de 60 pixels est mortelle sans parachute.',
    help3: 'Clavier : 1 à 8 pour choisir une compétence, P ou Espace pour la pause, F pour accélérer, N pour tout faire exploser, + et − pour la cadence, R pour recommencer, Échap pour quitter.',
    allGames: 'Tous les jeux',
    github: 'GitHub',
    sound: 'Son',
    soundOn: 'Son : oui',
    soundOff: 'Son : non',
    langToggle: 'English',
    back: 'Retour',
    ok: 'OK',
    level: 'Niveau {n}',
    locked: 'Verrouillé',
    bestSaved: 'Meilleur : {n} sauvés',
    out: 'Sortis',
    saved: 'Sauvés',
    need: 'Objectif',
    time: 'Temps',
    briefing: 'Sauvez {need} marcheurs sur {count}.',
    start: 'C\'est parti',
    pause: 'Pause',
    resume: 'Reprendre',
    fast: 'Accélérer',
    nuke: 'Tout faire exploser',
    restart: 'Recommencer',
    menu: 'Menu',
    rateUp: 'Cadence +',
    rateDown: 'Cadence −',
    won: 'Bravo !',
    lost: 'Raté…',
    wonDetail: '{saved} sauvés sur {count} (objectif : {need}).',
    lostDetail: '{saved} sauvés sur {count} : il en fallait {need}.',
    lostTime: 'Le temps est écoulé.',
    next: 'Niveau suivant',
    retry: 'Réessayer',
    finished: 'Tous les niveaux sont terminés !',
    skill_climber: 'Grimpeur',
    skill_floater: 'Parachutiste',
    skill_bomber: 'Kamikaze',
    skill_blocker: 'Bloqueur',
    skill_builder: 'Bâtisseur',
    skill_basher: 'Foreur',
    skill_miner: 'Mineur',
    skill_digger: 'Creuseur',
    selectHint: 'Choisissez une compétence puis touchez le décor (ou un marcheur pour le bloqueur et le kamikaze).',
    offline: 'Hors ligne : le jeu fonctionne sans internet une fois chargé.',
  },
  en: {
    title: 'Cliffwalkers',
    tagline: 'A line of little walkers keeps marching toward the edge. Save them!',
    play: 'Play',
    levels: 'Levels',
    continue: 'Continue',
    howTo: 'How to play',
    help1: 'Walkers leave the hatch and keep walking on their own, never stopping. You can only give them skills. Climber, floater, builder, basher, miner, digger: pick one at the bottom, then tap the scenery where you want it. A marker is planted and the first walker passing over it carries it out (tap a marker to remove it).',
    help2: 'Blocker and bomber are given directly to a walker: tap it. Save at least the required number before time runs out; a fall of more than 60 pixels is deadly without a parachute.',
    help3: 'Keyboard: 1 to 8 pick a skill, P or Space pause, F fast-forward, N blow everyone up, + and − release rate, R restart, Esc leave.',
    allGames: 'All games',
    github: 'GitHub',
    sound: 'Sound',
    soundOn: 'Sound: on',
    soundOff: 'Sound: off',
    langToggle: 'Français',
    back: 'Back',
    ok: 'OK',
    level: 'Level {n}',
    locked: 'Locked',
    bestSaved: 'Best: {n} saved',
    out: 'Out',
    saved: 'Saved',
    need: 'Goal',
    time: 'Time',
    briefing: 'Save {need} walkers out of {count}.',
    start: 'Let\'s go',
    pause: 'Pause',
    resume: 'Resume',
    fast: 'Fast-forward',
    nuke: 'Blow everyone up',
    restart: 'Restart',
    menu: 'Menu',
    rateUp: 'Release rate +',
    rateDown: 'Release rate −',
    won: 'Well done!',
    lost: 'Failed…',
    wonDetail: '{saved} saved out of {count} (goal: {need}).',
    lostDetail: '{saved} saved out of {count}: you needed {need}.',
    lostTime: 'Time is up.',
    next: 'Next level',
    retry: 'Try again',
    finished: 'All levels are complete!',
    skill_climber: 'Climber',
    skill_floater: 'Floater',
    skill_bomber: 'Bomber',
    skill_blocker: 'Blocker',
    skill_builder: 'Builder',
    skill_basher: 'Basher',
    skill_miner: 'Miner',
    skill_digger: 'Digger',
    selectHint: 'Pick a skill, then tap the scenery (or a walker for the blocker and the bomber).',
    offline: 'Offline: the game works without internet once loaded.',
  },
};

export const LANGS = Object.keys(DICT);
let lang = 'fr';

export function detectLang() {
  try {
    const saved = localStorage.getItem('cliffwalkers.lang');
    if (saved && DICT[saved]) return saved;
  } catch { /* stockage indisponible */ }
  const nav = (typeof navigator !== 'undefined' && navigator.language) || 'fr';
  return nav.toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

export function setLang(l) {
  if (!DICT[l]) return;
  lang = l;
  try { localStorage.setItem('cliffwalkers.lang', l); } catch { /* ignoré */ }
  if (typeof document !== 'undefined') document.documentElement.lang = l;
}

export const getLang = () => lang;

export function t(key, vars = {}) {
  const s = DICT[lang]?.[key] ?? DICT.en[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}

/** Texte d'un champ { fr, en } d'un niveau. */
export const pick = (obj) => obj?.[lang] ?? obj?.en ?? '';

export function apply(root = document) {
  for (const el of root.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of root.querySelectorAll('[data-i18n-aria]')) el.setAttribute('aria-label', t(el.dataset.i18nAria));
  for (const el of root.querySelectorAll('[data-i18n-title]')) el.title = t(el.dataset.i18nTitle);
  document.title = t('title');
}
