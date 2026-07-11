import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Upload, AlertTriangle, CheckCircle, ArrowLeft, ArrowRight, FileUp, X, Info, RefreshCw } from 'lucide-react';
import api from '@/lib/api';

type Step = 'upload' | 'review' | 'commit' | 'report';

interface ImportReport {
  importedExpenses: number;
  importedSettlements: number;
  skippedRows: number;
  importReport: Array<{ rowIndex: number; action: string; description: string }>;
}

interface Anomaly {
  rowIndex: number;
  type: string;
  message: string;
  suggestedResolution: string;
  data: Record<string, unknown>;
  relatedRowIndex?: number;
}

interface PreviewData {
  sessionId: string;
  totalRows: number;
  validRows: number;
  anomalyCount: number;
  anomalies: Anomaly[];
  rows: unknown[];
}

const RESOLUTION_LABELS: Record<string, string> = {
  SKIP: 'Skip row',
  KEEP: 'Keep as-is',
  CONVERT_TO_SETTLEMENT: 'Convert to settlement',
  FIX_DATE: 'Fix year to 2026',
  FIX_CURRENCY: 'Default to INR',
  KEEP_AS_REFUND: 'Keep as refund',
  KEEP_AS_ZERO: 'Keep as ₹0',
  KEEP_FIRST: 'Keep first entry',
  KEEP_SECOND: 'Keep second entry',
  NORMALIZE_PERCENTAGES: 'Normalize percentages',
  REMOVE_STALE_MEMBER: 'Remove stale member',
  PENDING: 'Needs decision',
};

const ANOMALY_TYPE_COLORS: Record<string, string> = {
  DUPLICATE_EXPENSE: 'badge-yellow',
  SETTLEMENT_AS_EXPENSE: 'badge-blue',
  MISSING_PAID_BY: 'badge-red',
  WRONG_YEAR: 'badge-red',
  MISSING_CURRENCY: 'badge-yellow',
  NEGATIVE_AMOUNT: 'badge-blue',
  ZERO_AMOUNT: 'badge-yellow',
  CONFLICTING_DUPLICATE: 'badge-red',
  PERCENTAGE_SUM_MISMATCH: 'badge-yellow',
  STALE_MEMBER: 'badge-yellow',
  AMBIGUOUS_DATE: 'badge-yellow',
  SPLIT_TYPE_CONFLICT: 'badge-purple',
};

export function ImportPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [resolutions, setResolutions] = useState<Record<number, string>>({});
  const [reportData, setReportData] = useState<ImportReport | null>(null);
  const [dragging, setDragging] = useState(false);

  const previewMutation = useMutation({
    mutationFn: (formData: FormData) => api.post('/import/preview', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data),
    onSuccess: (data: PreviewData) => {
      setPreview(data);
      // Pre-fill resolutions with suggestions
      const initialResolutions: Record<number, string> = {};
      for (const anomaly of data.anomalies) {
        initialResolutions[anomaly.rowIndex] = anomaly.suggestedResolution;
      }
      setResolutions(initialResolutions);
      setStep('review');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to parse file'),
  });

  const commitMutation = useMutation({
    mutationFn: (payload: object) => api.post('/import/commit', payload).then((r) => r.data.data),
    onSuccess: (data) => {
      setReportData(data);
      setStep('report');
      toast.success(`Imported ${data.importedExpenses} expenses!`);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Import failed'),
  });

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.name.match(/\.(csv|xlsx|xls)$/i)) {
      toast.error('Only CSV and Excel files are accepted');
      return;
    }
    setFile(selectedFile);
  };

  const handleUpload = () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('groupId', groupId!);
    previewMutation.mutate(formData);
  };

  const handleCommit = () => {
    if (!preview) return;
    commitMutation.mutate({
      sessionId: preview.sessionId,
      groupId,
      resolutions,
      rows: preview.rows,
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  }, []);

  const getAnomalyForRow = (rowIndex: number) => preview?.anomalies.find((a) => a.rowIndex === rowIndex);

  const resolutionOptions = (anomalyType: string): string[] => {
    const baseOptions = ['SKIP', 'KEEP'];
    const typeOptions: Record<string, string[]> = {
      SETTLEMENT_AS_EXPENSE: ['CONVERT_TO_SETTLEMENT', 'KEEP', 'SKIP'],
      MISSING_PAID_BY: ['SKIP', 'KEEP'],
      WRONG_YEAR: ['FIX_DATE', 'KEEP', 'SKIP'],
      MISSING_CURRENCY: ['FIX_CURRENCY', 'SKIP'],
      NEGATIVE_AMOUNT: ['KEEP_AS_REFUND', 'SKIP'],
      ZERO_AMOUNT: ['SKIP', 'KEEP_AS_ZERO'],
      CONFLICTING_DUPLICATE: ['KEEP_FIRST', 'KEEP_SECOND', 'SKIP'],
      PERCENTAGE_SUM_MISMATCH: ['NORMALIZE_PERCENTAGES', 'SKIP'],
      SPLIT_TYPE_CONFLICT: ['KEEP', 'SKIP'],
    };
    return typeOptions[anomalyType] ?? baseOptions;
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-muted hover:text-white transition-colors mb-6 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <h1 className="page-title mb-2">Import Expenses</h1>
      <p className="text-muted mb-6">Upload your CSV or Excel file to import expenses with anomaly review</p>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {(['upload', 'review', 'commit', 'report'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step === s
                  ? 'bg-gradient-brand text-white'
                  : (['upload', 'review', 'commit', 'report'] as Step[]).indexOf(step) > i
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-surface-elevated text-zinc-500 border border-surface-border'
              }`}
            >
              {(['upload', 'review', 'commit', 'report'] as Step[]).indexOf(step) > i ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                i + 1
              )}
            </div>
            <span className={`text-sm font-medium capitalize ${step === s ? 'text-white' : 'text-zinc-500'}`}>{s}</span>
            {i < 3 && <ArrowRight className="w-3.5 h-3.5 text-zinc-700 ml-1" />}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="card p-8">
          <div
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
              dragging ? 'border-brand-500 bg-brand-600/5' : 'border-surface-border hover:border-brand-600/50'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <div className="w-16 h-16 rounded-2xl bg-brand-600/15 flex items-center justify-center mx-auto mb-4">
              <FileUp className="w-8 h-8 text-brand-400" />
            </div>
            {file ? (
              <div>
                <p className="text-white font-semibold mb-1">{file.name}</p>
                <p className="text-muted text-sm mb-4">{(file.size / 1024).toFixed(1)} KB</p>
                <button
                  onClick={() => setFile(null)}
                  className="text-xs text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-1 mx-auto"
                >
                  <X className="w-3 h-3" /> Remove
                </button>
              </div>
            ) : (
              <div>
                <p className="text-white font-semibold mb-1">Drop your file here</p>
                <p className="text-muted text-sm mb-4">Accepts CSV, XLSX, XLS</p>
              </div>
            )}
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
              <span className="btn-secondary inline-flex items-center gap-2 text-sm">
                <Upload className="w-4 h-4" />
                Browse files
              </span>
            </label>
          </div>

          <div className="mt-4 p-4 rounded-xl bg-surface-elevated border border-surface-border">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-brand-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-zinc-400">
                <p className="font-medium text-zinc-300 mb-1">Expected columns:</p>
                <p className="font-mono text-xs text-zinc-500">date, description, paid_by, amount, currency, split_type, split_with, split_details, notes</p>
              </div>
            </div>
          </div>

          <button
            className="btn-primary w-full mt-5 flex items-center justify-center gap-2"
            onClick={handleUpload}
            disabled={!file || previewMutation.isPending}
          >
            {previewMutation.isPending ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Analysing...</>
            ) : (
              <><Upload className="w-4 h-4" /> Analyse File</>
            )}
          </button>
        </div>
      )}

      {/* Step 2: Review anomalies */}
      {step === 'review' && preview && (
        <div className="space-y-4">
          {/* Summary bar */}
          <div className="card p-5">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-white">{preview.totalRows}</p>
                <p className="text-xs text-muted">Total rows</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-400">{preview.anomalyCount}</p>
                <p className="text-xs text-muted">Anomalies</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-400">
                  {preview.totalRows - preview.anomalies.filter((a) => resolutions[a.rowIndex] === 'SKIP').length}
                </p>
                <p className="text-xs text-muted">Will import</p>
              </div>
            </div>
          </div>

          {preview.anomalies.length === 0 ? (
            <div className="card p-8 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <p className="text-white font-semibold">No anomalies detected</p>
              <p className="text-muted text-sm mt-1">All rows look clean and ready to import.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-zinc-400">
                Review each anomaly and choose how to handle it. <span className="text-white">Meera: you can approve or skip anything flagged for deletion.</span>
              </p>
              {preview.anomalies.map((anomaly) => (
                <div key={anomaly.rowIndex} className="card p-5 border-l-4 border-yellow-500/40">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs text-zinc-500 font-mono">Row {anomaly.rowIndex}</span>
                        <span className={`badge ${ANOMALY_TYPE_COLORS[anomaly.type] ?? 'badge-yellow'}`}>
                          {anomaly.type.replace(/_/g, ' ')}
                        </span>
                        {anomaly.relatedRowIndex && (
                          <span className="text-xs text-zinc-500">→ relates to row {anomaly.relatedRowIndex}</span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-300 mb-1">{anomaly.message}</p>
                      {anomaly.data.description != null && (
                        <p className="text-xs text-zinc-500 italic">"{String(anomaly.data.description as string)}"</p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <select
                        className="input text-sm py-2 min-w-40"
                        value={resolutions[anomaly.rowIndex] ?? anomaly.suggestedResolution}
                        onChange={(e) => setResolutions({ ...resolutions, [anomaly.rowIndex]: e.target.value })}
                      >
                        {resolutionOptions(anomaly.type).map((opt) => (
                          <option key={opt} value={opt}>
                            {RESOLUTION_LABELS[opt] ?? opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button className="btn-secondary flex-1" onClick={() => setStep('upload')}>
              Back
            </button>
            <button className="btn-primary flex-1" onClick={() => setStep('commit')}>
              Continue to Import
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 'commit' && preview && (
        <div className="card p-8 space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-600/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-brand-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Ready to Import</h2>
            <p className="text-muted">
              {preview.totalRows - Object.values(resolutions).filter((r) => r === 'SKIP').length} rows will be imported,{' '}
              {Object.values(resolutions).filter((r) => r === 'SKIP').length} will be skipped.
            </p>
          </div>

          {/* Resolution summary */}
          <div className="bg-surface-elevated rounded-xl p-4 space-y-2">
            {Object.entries(
              Object.entries(resolutions).reduce<Record<string, number>>((acc, [, v]) => {
                acc[v] = (acc[v] ?? 0) + 1;
                return acc;
              }, {})
            ).map(([resolution, count]) => (
              <div key={resolution} className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">{RESOLUTION_LABELS[resolution] ?? resolution}</span>
                <span className="text-white font-medium">{count} row{count !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-300">
                This action will create expenses in your group. It cannot be automatically undone, but you can delete individual expenses afterwards.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setStep('review')}>
              Back
            </button>
            <button
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              onClick={handleCommit}
              disabled={commitMutation.isPending}
            >
              {commitMutation.isPending ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Importing...</>
              ) : (
                'Confirm Import'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Report */}
      {step === 'report' && reportData && (
        <div className="space-y-4">
          <div className="card p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Import Complete</h2>
            <div className="grid grid-cols-3 gap-4 mt-5">
              <div className="bg-surface-elevated rounded-xl p-3">
                <p className="text-2xl font-bold text-emerald-400">{reportData.importedExpenses}</p>
                <p className="text-xs text-muted">Expenses</p>
              </div>
              <div className="bg-surface-elevated rounded-xl p-3">
                <p className="text-2xl font-bold text-blue-400">{reportData.importedSettlements}</p>
                <p className="text-xs text-muted">Settlements</p>
              </div>
              <div className="bg-surface-elevated rounded-xl p-3">
                <p className="text-2xl font-bold text-yellow-400">{reportData.skippedRows}</p>
                <p className="text-xs text-muted">Skipped</p>
              </div>
            </div>
          </div>

          {/* Import report table */}
          <div className="card p-5">
            <h2 className="section-title mb-4">Import Report</h2>
            <div className="space-y-1.5 max-h-80 overflow-y-auto">
              {(reportData.importReport ?? []).map((item) => (
                <div key={item.rowIndex} className="flex items-center gap-3 py-2 border-b border-surface-border last:border-0">
                  <span className="text-xs text-zinc-600 font-mono w-14">Row {item.rowIndex}</span>
                  <span
                    className={`badge text-xs flex-shrink-0 ${
                      item.action === 'IMPORTED' ? 'badge-green'
                      : item.action === 'SKIPPED' ? 'badge-yellow'
                      : 'badge-blue'
                    }`}
                  >
                    {item.action.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm text-zinc-300 truncate flex-1">{item.description}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            className="btn-primary w-full"
            onClick={() => navigate(`/groups/${groupId}`)}
          >
            View Group
          </button>
        </div>
      )}
    </div>
  );
}
