import type { TranslationDefinition } from '../types'

export const translationDefinitions: TranslationDefinition[] = [
  {
    id: 'kjv',
    name: 'King James Version',
    shortName: 'KJV',
    description: 'Public-domain King James Version.',
    sourceUrl:
      'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_kjv.json',
    color: '#9c27b0',
  },
  {
    id: 'bbe',
    name: 'Bible in Basic English',
    shortName: 'BBE',
    description: 'Simplified English translation (1949).',
    sourceUrl:
      'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_bbe.json',
    color: '#ff9800',
  },
  {
    id: 'es_rvr',
    name: 'Reina-Valera (Español)',
    shortName: 'RVR',
    description: 'Spanish Reina-Valera Revision.',
    sourceUrl:
      'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/es_rvr.json',
    color: '#2196f3',
  },
  {
    id: 'pt_nvi',
    name: 'Nova Versão Internacional (Português)',
    shortName: 'NVI',
    description: 'Portuguese NVI translation.',
    sourceUrl:
      'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/pt_nvi.json',
    color: '#4caf50',
  },
  {
    id: 'fr_apee',
    name: 'La Bible APEE (Français)',
    shortName: 'APEE',
    description: 'French APEE translation.',
    sourceUrl:
      'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/fr_apee.json',
    color: '#f06292',
  },
]
