import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Stethoscope, Pill, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface Slide {
  id: string;
  tag: string;
  titulo: string;
  imagem: string;
  icone: React.ElementType;
  indicadores: string[];
}

const SLIDES_HOSPITAL: Slide[] = [
  {
    id: 'prontuario-clinico',
    tag: 'Atendimento Clínico',
    titulo: 'Prontuário Electrónico e Prescrição Digital',
    imagem: '/images/hospital-ehr-system.jpg',
    icone: Stethoscope,
    indicadores: ['Triagem Rápida', 'Receita Integrada'],
  },
  {
    id: 'farmacia-stock',
    tag: 'Farmácia Hospitalar',
    titulo: 'Controlo de Medicamentos e Reposição Segura',
    imagem: '/images/hospital-pharmacy-stock.jpg',
    icone: Pill,
    indicadores: ['Zero Ruturas', 'Baixa Automática'],
  },
  {
    id: 'gestao-corporativa',
    tag: 'Tecnologia & Diagnóstico',
    titulo: 'Exames, Especialidades e Gestão Clínica Integrada',
    imagem: '/images/hospital-diagnostics-tech.jpg',
    icone: ShieldCheck,
    indicadores: ['4 Perfis de Acesso', 'Recibos Oficiais'],
  },
];

export function HospitalCarousel() {
  const [slideAtual, setSlideAtual] = useState(0);
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    if (pausado) return;
    const timer = setInterval(() => {
      setSlideAtual((prev) => (prev + 1) % SLIDES_HOSPITAL.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [pausado]);

  const proximoSlide = () => {
    setSlideAtual((prev) => (prev + 1) % SLIDES_HOSPITAL.length);
  };

  const slideAnterior = () => {
    setSlideAtual((prev) => (prev - 1 + SLIDES_HOSPITAL.length) % SLIDES_HOSPITAL.length);
  };

  const slide = SLIDES_HOSPITAL[slideAtual];
  const IconeSlide = slide.icone;

  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-lg"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      {/* Área da Imagem 16:9 Limpa e Harmoniosa */}
      <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-slate-900">
        {SLIDES_HOSPITAL.map((item, index) => (
          <div
            key={item.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              index === slideAtual ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <img
              src={item.imagem}
              alt={item.titulo}
              width={960}
              height={540}
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/hospital-ehr-system.jpg';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
          </div>
        ))}

        {/* Informação Essencial e Indicadores de Benefício */}
        <div className="absolute inset-x-0 bottom-0 z-20 p-5 sm:p-6 flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#0284C7] text-white shadow-xs">
              <IconeSlide className="w-3.5 h-3.5" aria-hidden="true" />
              {slide.tag}
            </span>

            <div className="flex items-center gap-1.5">
              {SLIDES_HOSPITAL.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSlideAtual(index)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    index === slideAtual ? 'w-6 bg-[#0284C7]' : 'w-1.5 bg-white/50 hover:bg-white/80'
                  }`}
                  aria-label={`Ir para slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug">
            {slide.titulo}
          </h3>

          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            {slide.indicadores.map((ind) => (
              <span
                key={ind}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/95 text-slate-900 text-xs font-semibold shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0284C7] shrink-0" aria-hidden="true" />
                {ind}
              </span>
            ))}
          </div>
        </div>

        {/* Botões de Navegação Simples */}
        <button
          type="button"
          onClick={slideAnterior}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-900 flex items-center justify-center shadow-sm transition-colors cursor-pointer"
          aria-label="Slide anterior"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={proximoSlide}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-900 flex items-center justify-center shadow-sm transition-colors cursor-pointer"
          aria-label="Próximo slide"
        >
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
