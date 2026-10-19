import React, { useState, useMemo } from 'react';
import { Dataset } from '../../types/sae';
import { Search, Download, FileSpreadsheet, ArrowUpDown } from 'lucide-react';
import { exportDatasetToExcel } from '../../utils/excelParser';

interface DataTableTabProps {
  dataset: Dataset;
}

export const DataTableTab: React.FC<DataTableTabProps> = ({ dataset }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRse, setFilterRse] = useState<'all' | 'unreliable_direct' | 'all_reliable'>('all');
  const [sortField, setSortField] = useState<string>('domainId');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const filteredAndSorted = useMemo(() => {
    let list = dataset.domains.filter((d) => {
      const matchSearch =
        d.domainName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.domainId.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (filterRse === 'unreliable_direct') {
        return d.direct.rse >= dataset.threshold;
      }
      if (filterRse === 'all_reliable') {
        const allModelsReliable = dataset.modelNames.every(
          (m) => (d.models[m]?.rse ?? 100) < dataset.threshold
        );
        return allModelsReliable;
      }
      return true;
    });

    list.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      if (sortField === 'domainId') {
        valA = a.domainId;
        valB = b.domainId;
      } else if (sortField === 'domainName') {
        valA = a.domainName;
        valB = b.domainName;
      } else if (sortField === 'sampleSize') {
        valA = a.sampleSize ?? 0;
        valB = b.sampleSize ?? 0;
      } else if (sortField === 'direct_est') {
        valA = a.direct.estimate;
        valB = b.direct.estimate;
      } else if (sortField === 'direct_rse') {
        valA = a.direct.rse;
        valB = b.direct.rse;
      } else if (sortField.startsWith('est_')) {
        const m = sortField.replace('est_', '');
        valA = a.models[m]?.estimate ?? 0;
        valB = b.models[m]?.estimate ?? 0;
      } else if (sortField.startsWith('rse_')) {
        const m = sortField.replace('rse_', '');
        valA = a.models[m]?.rse ?? 0;
        valB = b.models[m]?.rse ?? 0;
      } else if (sortField.startsWith('re_')) {
        const m = sortField.replace('re_', '');
        valA = a.models[m]?.re ?? 1;
        valB = b.models[m]?.re ?? 1;
      }

      if (typeof valA === 'string') {
        return sortAsc
          ? valA.localeCompare(valB, undefined, { numeric: true })
          : valB.localeCompare(valA, undefined, { numeric: true });
      }
      return sortAsc ? valA - valB : valB - valA;
    });

    return list;
  }, [dataset, searchTerm, filterRse, sortField, sortAsc]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getRseBadge = (rse: number) => {
    if (rse < 25) {
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
          {rse}%
        </span>
      );
    }
    if (rse <= 50) {
      return (
        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
          {rse}%
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
        {rse}%
      </span>
    );
  };

  // CSV Export helper
  const handleExportCsv = () => {
    const headers = [
      'Domain_ID',
      'Domain_Name',
      'Sample_Size',
      'Direct_Estimate',
      'Direct_SE',
      'Direct_RSE',
      'Direct_MSE',
      ...dataset.modelNames.flatMap((m) => [
        `${m}_Estimate`,
        `${m}_SE`,
        `${m}_RSE`,
        `${m}_MSE`,
        `${m}_RE`,
        `${m}_Shrinkage`,
      ]),
    ];

    const rows = filteredAndSorted.map((d) => [
      d.domainId,
      `"${d.domainName}"`,
      d.sampleSize ?? '',
      d.direct.estimate,
      d.direct.se ?? '',
      d.direct.rse,
      d.direct.mse ?? '',
      ...dataset.modelNames.flatMap((m) => {
        const item = d.models[m];
        return [
          item?.estimate ?? '',
          item?.se ?? '',
          item?.rse ?? '',
          item?.mse ?? '',
          item?.re ?? '',
          item?.shrinkage ?? '',
        ];
      }),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SAE_Data_${dataset.name.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari wilayah atau kode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-60 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          {/* RSE Filter */}
          <select
            value={filterRse}
            onChange={(e) => setFilterRse(e.target.value as any)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">Semua Domain ({dataset.domains.length})</option>
            <option value="unreliable_direct">Hanya RSE Direct ≥ 25% (Kurang Reliabel)</option>
            <option value="all_reliable">Semua Model SAE Reliabel (&lt; 25%)</option>
          </select>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportDatasetToExcel(dataset)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/70 text-slate-600 border-b border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700">
            <tr>
              <th
                onClick={() => handleSort('domainId')}
                className="py-3 px-4 font-semibold cursor-pointer hover:text-indigo-600"
              >
                <div className="flex items-center gap-1">
                  <span>ID</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('domainName')}
                className="py-3 px-4 font-semibold cursor-pointer hover:text-indigo-600"
              >
                <div className="flex items-center gap-1">
                  <span>Nama Domain</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('sampleSize')}
                className="py-3 px-3 font-semibold text-right cursor-pointer hover:text-indigo-600"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Sampel (n)</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>

              {/* Direct Group */}
              <th
                onClick={() => handleSort('direct_est')}
                className="py-3 px-3 font-semibold text-right cursor-pointer hover:text-indigo-600 border-l border-slate-200 dark:border-slate-700"
              >
                Direct Est
              </th>
              <th
                onClick={() => handleSort('direct_rse')}
                className="py-3 px-3 font-semibold text-center cursor-pointer hover:text-indigo-600"
              >
                Direct RSE
              </th>

              {/* Each Model Columns */}
              {dataset.modelNames.map((m) => (
                <React.Fragment key={m}>
                  <th
                    onClick={() => handleSort(`est_${m}`)}
                    className="py-3 px-3 font-semibold text-right cursor-pointer hover:text-indigo-600 border-l border-slate-200 dark:border-slate-700"
                  >
                    {m} Est
                  </th>
                  <th
                    onClick={() => handleSort(`rse_${m}`)}
                    className="py-3 px-3 font-semibold text-center cursor-pointer hover:text-indigo-600"
                  >
                    {m} RSE
                  </th>
                  <th
                    onClick={() => handleSort(`re_${m}`)}
                    className="py-3 px-3 font-semibold text-right cursor-pointer hover:text-indigo-600"
                  >
                    RE
                  </th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 dark:divide-slate-800 dark:text-slate-300">
            {filteredAndSorted.map((d) => (
              <tr key={d.domainId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                <td className="py-2.5 px-4 font-mono font-medium text-slate-500 dark:text-slate-400">{d.domainId}</td>
                <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-slate-100">{d.domainName}</td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-500">{d.sampleSize ?? '-'}</td>

                {/* Direct */}
                <td className="py-2.5 px-3 text-right font-medium text-slate-800 dark:text-slate-200 border-l border-slate-100 dark:border-slate-800">
                  {d.direct.estimate}
                </td>
                <td className="py-2.5 px-3 text-center">{getRseBadge(d.direct.rse)}</td>

                {/* Models */}
                {dataset.modelNames.map((m) => {
                  const mData = d.models[m];
                  return (
                    <React.Fragment key={m}>
                      <td className="py-2.5 px-3 text-right font-medium text-indigo-600 dark:text-indigo-400 border-l border-slate-100 dark:border-slate-800">
                        {mData?.estimate ?? '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center">{mData ? getRseBadge(mData.rse) : '-'}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                        {mData?.re ? `${mData.re}x` : '-'}
                      </td>
                    </React.Fragment>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/50">
        <div>
          Menampilkan <span className="font-semibold text-slate-700 dark:text-slate-200">{filteredAndSorted.length}</span> dari {dataset.domains.length} total wilayah
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> &lt;25% (Reliabel)
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> 25-50% (Perlu Kehati-hatian)
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-rose-500" /> &gt;50% (Kurang Presisi)
          </span>
        </div>
      </div>
    </div>
  );
};
