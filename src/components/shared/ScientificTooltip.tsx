import { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

export const SCIENTIFIC_TERMS: Record<string, { term: string; unit?: string; explanation: string }> = {
  backscatter: {
    term: 'SAR Backscatter (σ⁰)',
    unit: 'Decibels (dB)',
    explanation:
      'Strength of the radar pulse reflected back to the satellite. Calm open floodwater acts like a mirror (specular reflection), causing a sharp drop in σ⁰ (often -3 dB or lower), whereas flooded vegetation or urban structures increase double-bounce reflection.',
  },
  coherence: {
    term: 'Interferometric Coherence (γ)',
    unit: '0.00 to 1.00',
    explanation:
      'Measures phase stability between two SAR acquisitions. High coherence (0.75–0.95) indicates stable bare rock or buildings; sudden coherence loss (< 0.45) suggests surface disturbance, flooding, vegetation growth, or wet soil change.',
  },
  insar: {
    term: 'InSAR LOS Displacement',
    unit: 'Millimetres (mm) or mm/yr',
    explanation:
      'Interferometric Synthetic Aperture Radar compares radar wave phase across repeat passes to estimate ground surface motion along the satellite Line-of-Sight (LOS). Negative values typically indicate movement away from the sensor (subsidence or downslope creep).',
  },
  polarization: {
    term: 'Dual-Polarisation (VV / VH / HH / HV)',
    unit: 'Transmit-Receive Mode',
    explanation:
      'L-band (24 cm) and S-band (9.4 cm) radar waves penetrate cloud cover and tree canopies differently. Cross-polarisation (HV or VH) responds strongly to vegetation volume, while co-polarisation (VV or HH) is sensitive to surface moisture and water.',
  },
  gpm: {
    term: 'NASA GPM IMERG',
    unit: 'mm/hr and mm accumulation',
    explanation:
      'Integrated Multi-satellitE Retrievals for GPM combines passive microwave and infrared satellite sensors to estimate rainfall globally every 30 minutes at ~10 km grid spacing.',
  },
  viirs: {
    term: 'NASA VIIRS Black Marble',
    unit: 'nW·cm⁻²·sr⁻¹',
    explanation:
      'Nighttime satellite radiance at ~500 m resolution. Useful for broad regional outage context, but it cannot measure individual streetlight bulbs or municipal IoT controller health.',
  },
};

interface ScientificTooltipProps {
  termKey: keyof typeof SCIENTIFIC_TERMS;
  label?: string;
}

export function ScientificTooltip({ termKey, label }: ScientificTooltipProps) {
  const [open, setOpen] = useState(false);
  const info = SCIENTIFIC_TERMS[termKey];

  return (
    <span className="relative inline-flex items-center gap-1">
      {label && <span>{label}</span>}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center w-4 h-4 text-slate-400 hover:text-[#1565F5] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1565F5] rounded cursor-pointer"
        aria-label={`Explain ${info.term}`}
        title={info.term}
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label={info.term}
          className="fixed sm:absolute z-50 left-4 right-4 sm:left-0 sm:right-auto sm:top-6 sm:w-80 bg-white border border-blue-100 rounded-2xl p-3.5 shadow-xl text-left"
        >
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div>
              <div className="text-xs font-bold text-[#1565F5]">{info.term}</div>
              {info.unit && <div className="text-[11px] font-mono text-slate-500">{info.unit}</div>}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
              aria-label="Close explanation"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">{info.explanation}</p>
        </div>
      )}
    </span>
  );
}
