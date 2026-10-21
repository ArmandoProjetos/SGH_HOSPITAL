import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatarMoeda(valor: number) {
  return new Intl.NumberFormat('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valor) + ' MT';
}

export function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-PT');
}

export function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' });
}

export function formatarHora(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

export function idade(dataNascimento: string) {
  const n = new Date(dataNascimento);
  const h = new Date();
  let a = h.getFullYear() - n.getFullYear();
  const m = h.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && h.getDate() < n.getDate())) a--;
  return a;
}

export function uid() {
  return crypto.randomUUID();
}

export function descarregarCSV(nomeFicheiro: string, colunas: string[], linhas: (string | number)[][]) {
  const escapeCSV = (val: string | number) => {
    const s = String(val ?? '').replace(/"/g, '""');
    return `"${s}"`;
  };

  const cabecalho = colunas.map(escapeCSV).join(';');
  const corpo = linhas.map((row) => row.map(escapeCSV).join(';')).join('\r\n');
  const conteudoCSV = '\uFEFF' + cabecalho + '\r\n' + corpo;

  const blob = new Blob([conteudoCSV], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${nomeFicheiro}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
