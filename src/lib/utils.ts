import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...args: ClassValue[]) => twMerge(clsx(args));

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** 9990 → "R$ 99,90" */
export const formatarPreco = (centavos: number) => BRL.format(centavos / 100);

/** 9990, 14990 → 33 (inteiro, para tarja "-33%") */
export const percentualDesconto = (preco: number, precoDe?: number) =>
  precoDe && precoDe > preco ? Math.round((1 - preco / precoDe) * 100) : 0;
