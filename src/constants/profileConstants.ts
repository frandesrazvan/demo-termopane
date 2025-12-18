/**
 * Hardcoded lists for Romanian window profile manufacturers, types, and colors
 * These values are available to all users in Romania
 */

export const PROFILE_MANUFACTURERS = [
  'Rehau',
  'Salamander',
  'Veka Softline',
  'Veka',
  'Schüco',
  'Aluplast',
  'Gealan',
  'KBE',
  'Deceuninck',
  'Internorm',
  'Profilco',
  'Wicona',
  'Reynaers',
  'Aluprof',
  'Aluk',
  'Alumil',
  'Alcoa',
  'Other',
] as const;

export const PROFILE_TYPES = [
  'toc',
  'cercevea',
  'bagheta',
  'traverse',
  'impost',
  'montant',
  'toc exterior',
  'toc interior',
  'cercevea exterioară',
  'cercevea interioară',
] as const;

export const PROFILE_COLORS = [
  'Alb',
  'Negru',
  'Maro',
  'Antracit',
  'Alb mat',
  'Negru mat',
  'Maro mat',
  'Antracit mat',
  'Alb satinat',
  'Negru satinat',
  'Maro satinat',
  'Antracit satinat',
  'Alb lucios',
  'Negru lucios',
  'Maro lucios',
  'Antracit lucios',
  'Ral 9010',
  'Ral 9005',
  'Ral 8017',
  'Ral 7016',
  'Ral 9006',
  'Ral 7005',
  'Ral 6005',
  'Ral 5002',
  'Ral 5005',
  'Ral 6009',
  'Ral 7004',
  'Ral 8019',
  'Ral 9007',
  'Ral 7035',
] as const;

export type ProfileManufacturer = typeof PROFILE_MANUFACTURERS[number];
export type ProfileType = typeof PROFILE_TYPES[number];
export type ProfileColor = typeof PROFILE_COLORS[number];

