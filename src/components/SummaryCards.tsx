import React from 'react';
import { Dataset } from '../types/sae';
import { computeModelSummaries } from '../utils/excelParser';
import { MapPin, AlertCircle, Award, ArrowDownRight } from 'lucide-react';

interface SummaryCardsProps {
  dataset: Dataset;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ dataset }) => {
  const { directSummary, modelSummaries } = computeModelSummaries(dataset);

  // Find best model by average RE
  const bestModel = modelSummaries.length > 0
    ? [...modelSummaries].sort((a, b) => b.avgRe - a.avgRe)[0]
    : null;

  // Find model with highest RSE reduction
  const highestReductionModel = modelSummaries.length > 0
    ? [...modelSummaries].sort((a, b) => b.avgRseReduction - a.avgRseReduction)[0]
    : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Domains */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Domain Wilayah</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <MapPin className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
          {dataset.domains.length}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="truncate">{dataset.name}</span>
        </div>
      </div>

      {/* 2. Direct Estimator Status */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Direct Lolos Reliabel (&lt; 25%)</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <AlertCircle className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className={`text-2xl font-bold ${directSummary.reliablePct < 50 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'}`}>
            {directSummary.reliablePct}%
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            (Rata-rata RSE: {directSummary.avgRse}%)
          </span>
        </div>
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Maks RSE: <span className="font-semibold text-rose-500">{directSummary.maxRse}%</span>
        </div>
      </div>

      {/* 3. Best Model by RE */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Model Paling Efisien</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <Award className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400 truncate">
          {bestModel ? bestModel.name : '-'}
        </div>
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Efisiensi Relatif: <span className="font-bold text-slate-800 dark:text-slate-200">{bestModel ? `${bestModel.avgRe}x lipat` : '-'}</span>
        </div>
      </div>

      {/* 4. Average RSE Reduction */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Reduksi Error Maksimal</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400">
            <ArrowDownRight className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {highestReductionModel ? `-${highestReductionModel.avgRseReduction}%` : '-'}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            oleh {highestReductionModel?.name}
          </span>
        </div>
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          RSE turun dari {directSummary.avgRse}% ke {highestReductionModel?.avgRse}%
        </div>
      </div>
    </div>
  );
};
