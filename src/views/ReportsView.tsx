import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { sarwatchApi } from '../services/api';
import type { Facility, Hazard, StudyArea } from '../types/sarwatch';
import { HazardStatus } from '../components/shared/HazardBadge';
import { ProvenanceBanner } from '../components/shared/ProvenanceBanner';

interface ReportsViewProps {
  studyArea: StudyArea;
}

export function ReportsView({ studyArea }: ReportsViewProps) {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<{
    generatedAt: string;
    studyArea: StudyArea;
    hazards: Hazard[];
    exposedFacilities: Facility[];
    areaComparison: {
      studyAreaId: string;
      name: string;
      totalFacilities: number;
      exposedFacilities: number;
      infrastructureCount: number;
      agriculturalZones: number;
    }[];
    scenarioComparison: {
      timeOffsetLabel: string;
      elevatedRainfallMm: number;
      severeRainfallMm: number;
      elevatedExposedFacilities: number;
      severeExposedFacilities: number;
    }[];
    observationsCount: number;
    sources: string[];
  } | null>(null);

  const [generatedBrief, setGeneratedBrief] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    sarwatchApi
      .getReportSummary(studyArea.id)
      .then((res) => {
        if (mounted) setReport(res);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [studyArea.id]);

  const handleGenerateSummary = () => {
    if (!report) return;
    const exposedNames = report.exposedFacilities.map((f) => f.name).join(', ') || 'None';
    setGeneratedBrief(
      `STUDY AREA BRIEF — ${report.studyArea.name} (${report.studyArea.province})\n` +
        `Generated: ${report.generatedAt}\n` +
        `Classification: Simulated Demonstration Summary (Not an official emergency bulletin)\n\n` +
        `Active Hazard Screening Records: ${report.hazards.length}\n` +
        `Potentially Exposed Facilities across KZN Registry: ${report.exposedFacilities.length} (${exposedNames})\n` +
        `Satellite Data Sources Referenced: ${report.sources.join('; ')}`
    );
  };

  if (loading || !report) {
    return <div className="p-8 text-center text-xs text-slate-500">Generating analytics summary...</div>;
  }

  return (
    <div className="space-y-6">
      <ProvenanceBanner
        title="Demonstration Reports & Multi-Area Comparison"
        message="All exported JSON/CSV reports and analytical summaries are explicitly tagged as simulated demonstration outputs with complete data-source references."
        isSimulated={true}
      />

      {/* Export & Summary Controls */}
      <div className="sar-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-sm font-bold text-slate-900">
            Export Demonstration Report — {studyArea.name}
          </h3>
          <p className="text-xs text-slate-500">
            Download structured facility exposure, hazard records, and provenance metadata.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleGenerateSummary}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E8F0FE] text-[#1565F5] text-xs font-bold hover:bg-blue-100 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Generate Area Summary</span>
          </button>

          <a
            href={`/api/reports/export?format=csv&areaId=${encodeURIComponent(studyArea.id)}`}
            download
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-[#F8FAFF] text-slate-700 text-xs font-semibold hover:border-[#1565F5]"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </a>

          <a
            href={`/api/reports/export?format=json&areaId=all`}
            download
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl sar-blue-gradient text-white text-xs font-bold hover:opacity-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Full JSON</span>
          </a>
        </div>
      </div>

      {generatedBrief && (
        <div className="sar-card p-5 border-blue-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1565F5]">Generated Study Area Summary</span>
            <button
              type="button"
              onClick={() => setGeneratedBrief(null)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
          <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed bg-[#F8FAFF] p-3.5 rounded-2xl border border-slate-100">
            {generatedBrief}
          </pre>
        </div>
      )}

      {/* Charts: Area Comparison & Scenario Progression */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="sar-card p-5 space-y-3">
          <h3 className="font-display text-sm font-bold text-slate-900">
            KwaZulu-Natal Study Area Comparison
          </h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.areaComparison} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} interval={0} angle={-10} textAnchor="end" height={45} />
                <YAxis allowDecimals={false} stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '14px',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="totalFacilities" name="Tagged Facilities" fill="#1565F5" radius={[6, 6, 0, 0]} />
                <Bar dataKey="exposedFacilities" name="Exposed Facilities" fill="#F97316" radius={[6, 6, 0, 0]} />
                <Bar dataKey="infrastructureCount" name="Water Assets" fill="#38BDF8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="sar-card p-5 space-y-3">
          <h3 className="font-display text-sm font-bold text-slate-900">
            Scenario Outcome Comparison (Elevated vs. Severe)
          </h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={report.scenarioComparison} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="timeOffsetLabel" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '14px',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line
                  type="monotone"
                  dataKey="elevatedRainfallMm"
                  name="Elevated Cumul. Rain (mm)"
                  stroke="#F59E0B"
                  strokeWidth={2.5}
                />
                <Line
                  type="monotone"
                  dataKey="severeRainfallMm"
                  name="Severe Cumul. Rain (mm)"
                  stroke="#EF4444"
                  strokeWidth={2.5}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Hazard Records Table */}
      <div className="sar-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-display text-sm font-bold text-slate-900">
            Active Screening Hazards &amp; Confidence Metadata
          </h3>
          <span className="text-[11px] font-mono text-amber-600">Non-Official Demonstration Records</span>
        </div>
        <div className="divide-y divide-slate-100">
          {report.hazards.map((h) => (
            <div key={h.id} className="p-5 space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-bold text-slate-900">
                  {h.id} · {h.type} — {h.area}
                </div>
                <HazardStatus level={h.severity} compact={true} />
              </div>
              <div className="text-slate-500">
                Source: {h.source} · Classification: <span className="font-mono font-semibold text-amber-600">{h.classification}</span> · Confidence: {h.confidence}
              </div>
              <div className="text-slate-700">
                Precautions: {h.recommendedPrecautions.join(' ')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
