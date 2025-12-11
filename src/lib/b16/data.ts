
import type { Platform, Row } from './types';

export const platforms: Platform[] = [
  { id: '1xbet', name: '1XBET', logo: 'https://cdn.worldvectorlogo.com/logos/1xbet-logo.svg' },
  { id: 'linebet', name: 'LINEBET', logo: 'https://linebet.com/assets/images/logo.svg' },
  { id: 'melbet', name: 'MELBET', logo: 'https://melbet.com/img/logo.svg' },
  { id: '888starz', name: '888STARZ', logo: 'https://888starz.bet/img/logo.svg' },
  { id: 'mostbet', name: 'MOSTBET', logo: 'https://mostbet.com/img/logo.svg' },
  { id: 'betwinner', name: 'BETWINNER', logo: 'https://betwinner.com/img/logo.svg' },
];

export const initialRows: Row[] = [
  { id: '0', name: 'Cell-Alpha', value: '1.92', seq: '-+---' },
  { id: '1', name: 'Cell-Beta', value: '3.84', seq: '--+--' },
  { id: '2', name: 'Cell-Gamma', value: '7.68', seq: '---+-' },
  { id: '3', name: 'Cell-Delta', value: '15.36', seq: '+----' },
  { id: '4', name: 'Cell-Epsilon', value: '30.72', seq: '----+' },
];
