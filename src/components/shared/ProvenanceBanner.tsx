import { ShieldAlert, Database } from 'lucide-react';

interface ProvenanceBannerProps {
  title?: string;
  message: string;
  isSimulated?: boolean;
  tone?: 'info' | 'caution';
}

export function ProvenanceBanner({
  title,
  message,
  isSimulated = true,
  tone = 'info',
}: ProvenanceBannerProps) {
  const isCaution = tone === 'caution';

  return (
    <div
      className={`rounded-[20px] px-4 py-3.5 flex items-start gap-3.5 border shadow-[0_8px_24px_-12px_rgba(30,64,175,0.08)] ${
        isCaution
          ? 'bg-amber-50/90 border-amber-200/90'
          : 'bg-white/95 border-blue-100'
      }`}
    >
      <div
        className={`w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0 ${
          isCaution ? 'bg-amber-100 text-amber-600' : 'bg-[#E8F0FE] text-[#1565F5]'
        }`}
      >
        {isCaution ? (
          <ShieldAlert className="w-4 h-4" aria-hidden="true" />
        ) : (
          <Database className="w-4 h-4" aria-hidden="true" />
        )}
      </div>
      <div className="text-xs leading-relaxed text-slate-600 space-y-0.5">
        <div className="flex flex-wrap items-center gap-2 font-semibold text-slate-900">
          {title && <span>{title}</span>}
          <span className="text-slate-300" aria-hidden="true">·</span>
          <span className={`font-mono ${isSimulated ? 'text-amber-600' : 'text-emerald-600'}`}>
            {isSimulated ? 'Simulated Demonstration Data' : 'Live Metadata Feed'}
          </span>
        </div>
        <p className="text-slate-600">{message}</p>
      </div>
    </div>
  );
}
