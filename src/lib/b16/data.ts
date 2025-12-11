
import type { Platform, Row } from './types';

export const platforms: Platform[] = [
  { id: '1xbet', name: '1XBET', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_1xBet.png' },
  { id: 'melbet', name: 'MelBet', logo: 'https://melbet.com/img/logo.svg' },
  { id: 'linebet', name: 'LineBet', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Logo_lbet.png' },
];

export const initialRows: Row[] = [
    { id: '0', rate:'1.23', seq:'+----'},
    { id: '1', rate:'1.53', seq:'-+---'},
    { id: '2', rate:'1.93', seq:'----+'},
    { id: '3', rate:'2.41', seq:'----+'},
    { id: '4', rate:'4.02', seq:'--+--'},
    { id: '5', rate:'6.71', seq:'----+'},
    { id: '6', rate:'11.18', seq:'+----'}
];
