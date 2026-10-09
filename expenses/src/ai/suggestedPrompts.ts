export const SUGGESTED_PROMPTS = [
  // Current month
  'Cum arată luna curentă față de media mea?',
  'Cât voi cheltui până la sfârșitul lunii, în ritmul actual?',
  'Ce categorie a crescut cel mai mult luna aceasta?',
  'Care au fost cele mai mari 5 cheltuieli luna aceasta?',
  'Sunt pe drumul cel bun să economisesc luna aceasta?',
  'Ce cheltuieli neobișnuite am avut luna aceasta?',
  'Compară luna aceasta cu aceeași lună de anul trecut',

  // Saving
  'Unde pot economisi 2000 luna viitoare?',
  'Care sunt abonamentele mele și cât mă costă pe an?',
  'Ce cheltuieli mici, dar frecvente, mă costă cel mai mult?',
  'Ce categorie ar trebui să reduc prima?',
  'Fă-mi un buget lunar realist pe categorii',
  'Câți bani aș economisi pe an dacă reduc mâncarea în oraș la jumătate?',
  'Ce rată de economisire am avut în fiecare an?',
  'În ce luni am cheltuit mai mult decât am câștigat?',

  // Trends
  'Care a fost cea mai scumpă lună și de ce?',
  'Care a fost cea mai ieftină lună din ultimii 2 ani?',
  'Cum au evoluat cheltuielile mele lunare în ultimii 5 ani?',
  'Ce categorii cresc constant de la an la an?',
  'Cheltuiesc mai mult vara sau iarna?',
  'Cât de mult au crescut costurile la utilități în timp?',
  'Cum s-a schimbat media zilnică a cheltuielilor de-a lungul anilor?',
  'Care e trendul cheltuielilor mele în ultimele 6 luni?',

  // Categories
  'Cât am cheltuit pe mâncare anul acesta vs anul trecut?',
  'Cât mă costă transportul pe lună, în medie?',
  'Cât am cheltuit pe călătorii în fiecare an?',
  'Cât am investit în total și cum a evoluat pe ani?',
  'Cât am cheltuit pe sănătate în ultimul an?',
  'Cât cheltui pe haine, în medie, pe an?',
  'Cât am dat pe cadouri în fiecare an?',
  'Ce pondere au cheltuielile pe locuință din total?',
  'Cât am cheltuit pe distracție în ultimele 12 luni?',

  // Habits
  'În ce zi a săptămânii cheltui cel mai mult?',
  'La ce magazine las cei mai mulți bani?',
  'Care sunt cele mai frecvente cheltuieli ale mele?',
  'Ce hashtag-uri mă costă cel mai mult?',
  'Cât cheltui de obicei într-un weekend?',
  'Câte tranzacții fac, în medie, pe lună?',
  'Care a fost cea mai mare cheltuială din istoric?',
  'Am cheltuieli care se repetă lunar cu aceeași sumă?',

  // Income
  'Cum au evoluat veniturile mele pe ani?',
  'Care sunt principalele mele surse de venit?',
  'Ce procent din venit cheltui, în medie?',
  'În ce lună am avut cel mai mare venit?',
  'Cât am economisit în total în ultimii 5 ani?',
  'Veniturile mele cresc mai repede decât cheltuielile?',

  // Fun / overview
  'Fă-mi un rezumat al anului trecut',
  'Ce ar spune un consultant financiar despre cheltuielile mele?',
  'Care sunt 3 lucruri pe care le fac bine cu banii?',
  'Care sunt 3 obiceiuri care mă costă cel mai mult?',
  'Dacă păstrez ritmul actual, cât voi economisi până la sfârșitul anului?',
];

/** Picks `count` random prompts (Fisher–Yates on a copy). */
export const pickSuggestedPrompts = (count = 6): string[] => {
  const prompts = [...SUGGESTED_PROMPTS];
  for (let i = prompts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [prompts[i], prompts[j]] = [prompts[j], prompts[i]];
  }
  return prompts.slice(0, count);
};
