import { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Upload, AlertTriangle, CheckCircle, ArrowLeft, ArrowRight, FileUp, X, Info, RefreshCw, Copy, ShieldAlert, Info as InfoIcon } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

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

export function ImportPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

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
      
      if (data.anomalies.length === 0) {
        setStep('commit'); // skip review if clean
      } else {
        setStep('review');
      }
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to parse file'),
  });

  const qc = useQueryClient();

  const commitMutation = useMutation({
    mutationFn: (payload: object) => api.post('/import/commit', payload).then((r) => r.data.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['expenses', groupId] });
      qc.invalidateQueries({ queryKey: ['group', groupId] });
      qc.invalidateQueries({ queryKey: ['activity'] });
      qc.invalidateQueries({ queryKey: ['balances'] });
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

  // Group anomalies
  const { duplicates, conflicts, others } = useMemo(() => {
    if (!preview) return { duplicates: [], conflicts: [], others: [] };
    const dups = preview.anomalies.filter((a) => a.type.includes('DUPLICATE'));
    const confs = preview.anomalies.filter((a) => a.type.includes('CONFLICT') || a.type.includes('MISMATCH'));
    const oths = preview.anomalies.filter((a) => !a.type.includes('DUPLICATE') && !a.type.includes('CONFLICT') && !a.type.includes('MISMATCH'));
    return { duplicates: dups, conflicts: confs, others: oths };
  }, [preview]);

  const totalAnomalies = preview?.anomalies.length || 0;
  // A simple heuristic for completion: user interacted with dropdowns. Since we pre-fill, we'll just allow submit anytime.
  const canFinish = true; 

  return (
    <div className="max-w-[1100px] mx-auto animate-fade-in relative z-10 pb-32">
      
      {/* Top Bar matching Intent */}
      <header className="flex items-center justify-between mb-8">
        <div className="font-headline-md text-xl font-semibold text-primary">The Hearth</div>
        <button
          onClick={() => navigate(`/groups/${groupId}`)}
          className="text-on-surface-variant hover:text-secondary transition-colors flex items-center gap-2 font-label-sm"
        >
          <X className="w-5 h-5" />
          Cancel Import
        </button>
      </header>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-2 mb-8">
            <h1 className="font-display-lg text-4xl text-primary">Bring your data home.</h1>
            <p className="font-body-lg text-on-surface-variant max-w-lg mx-auto">Upload a CSV file of your shared expenses to import them into this group.</p>
          </div>

          <div className="bg-surface-container-lowest border border-surface-container-highest rounded-2xl shadow-[0_20px_40px_rgba(45,67,61,0.05)] p-8 relative overflow-hidden">
            <div
              className={`relative z-10 border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                dragging ? 'border-primary bg-primary/5' : 'border-outline hover:border-primary/50'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-5">
                <FileUp className="w-8 h-8 text-primary" strokeWidth={1.5} />
              </div>
              {file ? (
                <div>
                  <p className="font-headline-md text-lg text-primary mb-1">{file.name}</p>
                  <p className="font-body-md text-on-surface-variant mb-5">{(file.size / 1024).toFixed(1)} KB</p>
                  <button
                    onClick={() => setFile(null)}
                    className="font-label-sm text-on-surface-variant hover:text-error transition-colors flex items-center gap-1.5 mx-auto"
                  >
                    <X className="w-4 h-4" /> Remove
                  </button>
                </div>
              ) : (
                <div>
                  <p className="font-headline-md text-lg text-primary mb-2">Drop your file here</p>
                  <p className="font-body-md text-on-surface-variant mb-6">Accepts CSV, XLSX, XLS</p>
                </div>
              )}
              <label className="cursor-pointer inline-block mt-4">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                />
                <span className="inline-flex items-center gap-2 py-3 px-6 rounded-full bg-surface-container-highest text-on-surface-variant hover:bg-surface-variant font-bold font-label-sm transition-colors cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Browse files
                </span>
              </label>
            </div>

            <button
              className="relative z-10 w-full mt-6 py-4 px-6 rounded-full bg-primary text-on-primary font-bold font-label-sm hover:opacity-90 transition-transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              onClick={handleUpload}
              disabled={!file || previewMutation.isPending}
            >
              {previewMutation.isPending ? (
                <><RefreshCw className="w-5 h-5 animate-spin" /> Analysing...</>
              ) : (
                <><Upload className="w-5 h-5" /> Analyse File</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Review anomalies (The Hearth Layout) */}
      {step === 'review' && preview && (
        <div className="max-w-2xl mx-auto space-y-12">
          
          {/* Conversational Header */}
          <div className="text-center space-y-2">
            <h1 className="font-display-lg text-4xl text-primary">Let's double check some things.</h1>
            <p className="font-body-lg text-on-surface-variant max-w-lg mx-auto">
              {user?.name}, we imported your file, but we found a few items that need your attention before we finalize everything.
            </p>
          </div>

          <div className="space-y-8">
            
            {/* Duplicates */}
            {duplicates.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-headline-md text-xl text-primary flex items-center gap-2">
                  <Copy className="w-6 h-6 text-secondary" strokeWidth={1.5} />
                  Duplicates Found
                </h2>
                <p className="text-on-surface-variant font-body-md text-sm">We noticed similar expenses close together in time.</p>
                
                {duplicates.map((anomaly) => (
                  <div key={anomaly.rowIndex} className="bg-surface-container-lowest border border-surface-container-highest rounded-2xl p-6 shadow-[0_20px_40px_rgba(45,67,61,0.05)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all">
                    <div>
                      <div className="font-label-sm text-on-surface-variant mb-1">Row {anomaly.rowIndex}</div>
                      <div className="font-data-mono text-primary text-lg">{String(anomaly.data.description || 'Unknown Expense')}</div>
                      <div className="text-sm text-on-surface-variant mt-1">{anomaly.message}</div>
                    </div>
                    <div className="w-full sm:w-auto">
                      <select
                        className="w-full sm:w-auto bg-surface text-on-surface border border-outline-variant/50 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all font-label-sm"
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
                ))}
              </div>
            )}

            {/* Conflicts */}
            {conflicts.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-headline-md text-xl text-primary flex items-center gap-2">
                  <ShieldAlert className="w-6 h-6 text-error" strokeWidth={1.5} />
                  Conflicts
                </h2>
                <p className="text-on-surface-variant font-body-md text-sm">Data that contradicts itself or doesn't match our rules.</p>
                
                {conflicts.map((anomaly) => (
                  <div key={anomaly.rowIndex} className="bg-surface-container-lowest border border-surface-container-highest rounded-2xl p-6 shadow-[0_20px_40px_rgba(45,67,61,0.05)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all">
                    <div>
                      <div className="font-label-sm text-on-surface-variant mb-1">Row {anomaly.rowIndex}</div>
                      <div className="font-data-mono text-primary text-lg">{String(anomaly.data.description || 'Unknown Expense')}</div>
                      <div className="text-sm text-on-surface-variant mt-1 text-error">{anomaly.message}</div>
                    </div>
                    <div className="w-full sm:w-auto">
                      <select
                        className="w-full sm:w-auto bg-surface text-on-surface border border-outline-variant/50 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all font-label-sm"
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
                ))}
              </div>
            )}

            {/* Anomalies */}
            {others.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-headline-md text-xl text-primary flex items-center gap-2">
                  <InfoIcon className="w-6 h-6 text-secondary-container" strokeWidth={1.5} />
                  Anomalies
                </h2>
                <p className="text-on-surface-variant font-body-md text-sm">Things that seem a bit unusual based on the data format.</p>
                
                {others.map((anomaly) => (
                  <div key={anomaly.rowIndex} className="bg-surface-container-lowest border border-surface-container-highest rounded-2xl p-6 shadow-[0_20px_40px_rgba(45,67,61,0.05)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all">
                    <div>
                      <div className="font-data-mono text-primary text-lg">{String(anomaly.data.description || `Row ${anomaly.rowIndex}`)}</div>
                      <div className="text-sm text-on-surface-variant mt-1">{anomaly.message}</div>
                    </div>
                    <div className="w-full sm:w-auto">
                      <select
                        className="w-full sm:w-auto bg-surface text-on-surface border border-outline-variant/50 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all font-label-sm"
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
                ))}
              </div>
            )}

          </div>

          {/* Sticky Footer Action */}
          <div className="sticky bottom-0 py-6 bg-gradient-to-t from-background via-background to-transparent text-center z-20">
            <button 
              className={`font-label-sm px-8 py-4 rounded-full w-full max-w-sm mx-auto shadow-sm transition-all duration-300 ${
                canFinish 
                  ? 'bg-primary text-on-primary hover:bg-primary/90 active:scale-95 shadow-lg' 
                  : 'bg-surface-container-highest text-on-surface-variant opacity-50 cursor-not-allowed'
              }`}
              onClick={() => setStep('commit')}
              disabled={!canFinish}
            >
              Review & Finish
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Commit / Confirm */}
      {step === 'commit' && preview && (
        <div className="max-w-md mx-auto mt-12 bg-surface-container-lowest border border-surface-container-highest rounded-2xl shadow-[0_20px_40px_rgba(45,67,61,0.05)] p-8 text-center animate-fade-in relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>
          <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center mx-auto mb-6 relative z-10">
            <CheckCircle className="w-10 h-10 text-on-primary-container" />
          </div>
          <h2 className="font-display-lg text-3xl text-primary mb-2 relative z-10">Ready to go.</h2>
          <p className="font-body-md text-on-surface-variant mb-8 relative z-10">
            {preview.totalRows - Object.values(resolutions).filter((r) => r === 'SKIP').length} valid rows will be imported to your group.
          </p>
          
          <div className="flex gap-4 relative z-10">
            {preview.anomalies.length > 0 && (
              <button 
                className="flex-1 py-4 rounded-full border border-outline-variant text-primary font-bold font-label-sm hover:bg-surface-container transition-all" 
                onClick={() => setStep('review')}
              >
                Back to Review
              </button>
            )}
            <button
              className="flex-1 py-4 rounded-full bg-primary text-on-primary font-bold font-label-sm hover:opacity-90 transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-sm"
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
        <div className="max-w-2xl mx-auto mt-8 animate-fade-in space-y-8">
          <div className="text-center space-y-2 mb-8">
            <h1 className="font-display-lg text-4xl text-primary">Import Complete.</h1>
            <p className="font-body-lg text-on-surface-variant max-w-lg mx-auto">Your expenses have been successfully added to the group.</p>
          </div>

          <div className="bg-surface-container-lowest border border-surface-container-highest rounded-2xl shadow-[0_20px_40px_rgba(45,67,61,0.05)] p-8">
            <div className="grid grid-cols-3 gap-4 divide-x divide-outline-variant/30 text-center mb-8">
              <div>
                <p className="font-display-lg text-4xl text-primary">{reportData.importedExpenses}</p>
                <p className="font-label-sm text-on-surface-variant uppercase tracking-wider mt-2 text-[10px]">Expenses</p>
              </div>
              <div>
                <p className="font-display-lg text-4xl text-primary">{reportData.importedSettlements}</p>
                <p className="font-label-sm text-on-surface-variant uppercase tracking-wider mt-2 text-[10px]">Settlements</p>
              </div>
              <div>
                <p className="font-display-lg text-4xl text-secondary">{reportData.skippedRows}</p>
                <p className="font-label-sm text-on-surface-variant uppercase tracking-wider mt-2 text-[10px]">Skipped</p>
              </div>
            </div>

            <button
              className="w-full py-4 rounded-full bg-primary text-on-primary font-bold font-label-sm hover:opacity-90 transition-transform active:scale-95 shadow-sm"
              onClick={() => navigate(`/groups/${groupId}`)}
            >
              View Group
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
