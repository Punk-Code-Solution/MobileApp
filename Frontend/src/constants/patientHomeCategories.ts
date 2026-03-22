/**
 * Categorias da home do paciente — palavras-chave batem com nomes de especialidade vindos da API.
 */

export type QuickCategoryId =
  | 'medico'
  | 'nutricionista'
  | 'psicologo'
  | 'dentista'
  | 'advogado';

export type MacroCategoryId = 'saude' | 'bemestar' | 'consultoria' | 'servicos';

export interface QuickCategoryDef {
  id: QuickCategoryId;
  label: string;
  icon: string;
  keywords: string[];
}

export interface MacroCategoryDef {
  id: MacroCategoryId;
  label: string;
  subtitle: string;
  icon: string;
  wide?: boolean;
  keywords: string[];
}

/** Primeira linha — ícones pequenos */
export const QUICK_CATEGORIES: QuickCategoryDef[] = [
  {
    id: 'medico',
    label: 'Médico',
    icon: '🩺',
    keywords: ['médico', 'medico', 'cardio', 'clínico', 'clinico', 'derma', 'pediatra', 'gineco', 'oftalmo', 'ortoped', 'neuro', 'urolog', 'psiquiatra'],
  },
  {
    id: 'nutricionista',
    label: 'Nutricionista',
    icon: '🍎',
    keywords: ['nutri', 'nutricion'],
  },
  {
    id: 'psicologo',
    label: 'Psicólogo',
    icon: '🧠',
    keywords: ['psico', 'terapia', 'comportamental'],
  },
  {
    id: 'dentista',
    label: 'Dentista',
    icon: '🦷',
    keywords: ['dent', 'odonto', 'ortodont'],
  },
  {
    id: 'advogado',
    label: 'Advogado',
    icon: '⚖️',
    keywords: ['advog', 'juríd', 'jurid', 'direito'],
  },
];

/** Segunda linha — grupos maiores */
export const MACRO_CATEGORIES: MacroCategoryDef[] = [
  {
    id: 'saude',
    label: 'Saúde',
    subtitle: 'Mais opções',
    icon: '➕',
    wide: true,
    keywords: [
      'médico',
      'medico',
      'cardio',
      'clínico',
      'enferm',
      'fisio',
      'nutri',
      'dent',
      'odonto',
      'psico',
      'terapia',
    ],
  },
  {
    id: 'bemestar',
    label: 'Bem-estar e Fitness',
    icon: '🏋️',
    subtitle: '',
    keywords: ['nutri', 'fisio', 'pilates', 'fitness', 'esporte', 'massag'],
  },
  {
    id: 'consultoria',
    label: 'Consultoria e Direito',
    icon: '💼',
    subtitle: '',
    keywords: ['advog', 'juríd', 'jurid', 'consult', 'contábil', 'contab'],
  },
  {
    id: 'servicos',
    label: 'Serviços Técnicos',
    icon: '🔧',
    subtitle: '',
    keywords: ['técnic', 'tecnico', 'engenh', 'informática', 'ti ', 'ti.'],
  },
];

export function specialtyMatchesKeywords(specialtyLower: string, keywords: string[]): boolean {
  if (!specialtyLower.trim()) {
    return false;
  }
  return keywords.some((k) => specialtyLower.includes(k.toLowerCase()));
}
