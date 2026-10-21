import React from 'react';

interface HospitalLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  hospitalName?: string;
  subtitle?: string;
}

export function HospitalLogo({
  className = '',
  size = 'md',
  showText = false,
  hospitalName = 'Hospital Geral & Centro Clínico',
  subtitle = 'Sistema de Gestão & Cuidados de Saúde',
}: HospitalLogoProps) {
  const sizeMap = {
    sm: { box: 'w-7 h-7', icon: 'w-4 h-4', text: 'text-xs', sub: 'text-[9px]' },
    md: { box: 'w-9 h-9', icon: 'w-5 h-5', text: 'text-sm', sub: 'text-[10px]' },
    lg: { box: 'w-12 h-12', icon: 'w-7 h-7', text: 'text-base', sub: 'text-xs' },
    xl: { box: 'w-16 h-16', icon: 'w-9 h-9', text: 'text-xl', sub: 'text-xs' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Insígnia / Logotipo Vetorial com Cruz Médica e Pulso Cardíaco */}
      <div
        className={`${currentSize.box} rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-sky-800 text-white flex items-center justify-center shadow-sm shrink-0 border border-blue-500/30 relative overflow-hidden`}
      >
        {/* Reflexo sutil de vidro */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/20 pointer-events-none" />

        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${currentSize.icon} relative z-10 drop-shadow-xs`}
        >
          {/* Cruz Médica com Linha de Pulso Dinâmica */}
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" strokeWidth="2.2" />
          <path
            d="M3 12h3l2-4 3 8 2-6 2 3h6"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold tracking-tight text-slate-900 leading-tight ${currentSize.text}`}>
            {hospitalName}
          </span>
          <span className={`text-slate-500 font-medium ${currentSize.sub}`}>
            {subtitle}
          </span>
        </div>
      )}
    </div>
  );
}
