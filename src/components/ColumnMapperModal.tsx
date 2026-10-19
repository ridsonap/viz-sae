import React, { useState } from 'react';
import { ParseResult, buildDatasetFromConfig, parseSheetData } from '../utils/excelParser';
import { ColumnMappingConfig, Dataset } from '../types/sae';
import { X, Check, Plus, Trash2, HelpCircle } from 'lucide-react';

interface ColumnMapperModalProps {
  parseResult: ParseResult;
  onConfirm: (dataset: Dataset) => void;
  onCancel: () => void;
}

export const ColumnMapperModal: React.FC<ColumnMapperModalProps> = ({
  parseResult,
  onConfirm,
  onCancel,
}) => {
  const [selectedSheet, setSelectedSheet] = useState<string>(parseResult.defaultSheet);
  const [currentRows, setCurrentRows] = useState<Record<string, any>[]>(parseResult.rawRows);
  const [currentHeaders, setCurrentHeaders] = useState<string[]>(parseResult.headers);
  const [config, setConfig] = useState<ColumnMappingConfig>(parseResult.suggestedMapping);
  const [datasetTitle, setDatasetTitle] = useState<string>(
    parseResult.workbook.SheetNames[0] || 'Hasil SAE'
  );

  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName);
    const ws = parseResult.workbook.Sheets[sheetName];
    if (ws) {
      const parsed = parseSheetData(ws);
      setCurrentRows(parsed.rawRows);
      setCurrentHeaders(parsed.headers);
      setConfig(parsed.suggestedMapping);
      setDatasetTitle(sheetName);
    }
  };

  const handleAddModel = () => {
    setConfig((prev) => ({
      ...prev,
      modelCols: [
        ...prev.modelCols,
        {
          modelName: `Model_${prev.modelCols.length + 1}`,
          estCol: currentHeaders[0] || '',
          rseCol: '',
        },
      ],
    }));
  };

  const handleRemoveModel = (idx: number) => {
    setConfig((prev) => ({
      ...prev,
      modelCols: prev.modelCols.filter((_, i) => i !== idx),
    }));
  };

  const handleUpdateModel = (idx: number, field: string, val: string) => {
    setConfig((prev) => {
      const updated = [...prev.modelCols];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...prev, modelCols: updated };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.directEstCol) {
      alert('Mohon pilih kolom Penduga Langsung (Direct Estimate)!');
      return;
    }
    const built = buildDatasetFromConfig(datasetTitle, currentRows, config);
    onConfirm(built);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <button
          onClick={onCancel}
          className="absolute right-5 top-5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Pemetaan Kolom File Excel (Column Mapping)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sistem telah mendeteksi kolom secara otomatis. Anda dapat menyesuaikan pemetaan kolom jika diperlukan.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Sheet Selector */}
          {parseResult.sheetNames.length > 1 && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 dark:border-indigo-900/50 dark:bg-indigo-950/30">
              <label className="block font-semibold text-indigo-900 dark:text-indigo-300 mb-1">
                Pilih Lembar Kerja (Sheet):
              </label>
              <select
                value={selectedSheet}
                onChange={(e) => handleSheetChange(e.target.value)}
                className="w-full rounded-lg border border-indigo-200 bg-white p-2 font-medium text-slate-800 dark:border-indigo-800 dark:bg-slate-800 dark:text-slate-100"
              >
                {parseResult.sheetNames.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Dataset Title */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nama / Judul Dataset:
            </label>
            <input
              type="text"
              value={datasetTitle}
              onChange={(e) => setDatasetTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-200 p-2 text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Identification Section */}
          <div className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2.5">
              1. Identitas Wilayah & Sampel
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Kolom ID / Kode:</label>
                <select
                  value={config.domainIdCol}
                  onChange={(e) => setConfig({ ...config, domainIdCol: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {currentHeaders.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Kolom Nama Wilayah:</label>
                <select
                  value={config.domainNameCol}
                  onChange={(e) => setConfig({ ...config, domainNameCol: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {currentHeaders.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Jumlah Sampel (n) (Opsional):</label>
                <select
                  value={config.sampleSizeCol || ''}
                  onChange={(e) => setConfig({ ...config, sampleSizeCol: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="">-- Tidak Ada --</option>
                  {currentHeaders.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Direct Estimator Section */}
          <div className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2.5">
              2. Penduga Langsung (Direct Estimator)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  Nilai Estimasi Langsung (Wajib):
                </label>
                <select
                  value={config.directEstCol}
                  onChange={(e) => setConfig({ ...config, directEstCol: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2 font-medium text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-400"
                  required
                >
                  <option value="">-- Pilih Kolom --</option>
                  {currentHeaders.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  RSE Direct (%) atau SE / MSE:
                </label>
                <select
                  value={config.directRseCol || config.directSeCol || ''}
                  onChange={(e) => setConfig({ ...config, directRseCol: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="">-- Pilih Kolom Error --</option>
                  {currentHeaders.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SAE Models Section */}
          <div className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                3. Model SAE Alternatif (Komparasi)
              </h3>
              <button
                type="button"
                onClick={handleAddModel}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                <Plus className="h-3.5 w-3.5" /> Tambah Model
              </button>
            </div>

            {config.modelCols.length === 0 ? (
              <div className="p-4 text-center text-slate-400">
                Belum ada model yang dipilih. Klik "Tambah Model" di atas.
              </div>
            ) : (
              <div className="space-y-3">
                {config.modelCols.map((m, idx) => (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 dark:border-slate-800 dark:bg-slate-800/60"
                  >
                    <div className="w-32">
                      <label className="text-[10px] text-slate-400">Nama Model:</label>
                      <input
                        type="text"
                        value={m.modelName}
                        onChange={(e) => handleUpdateModel(idx, 'modelName', e.target.value)}
                        className="w-full rounded border border-slate-200 px-2 py-1 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div className="flex-1 min-w-[120px]">
                      <label className="text-[10px] text-slate-400">Kolom Nilai Estimasi:</label>
                      <select
                        value={m.estCol}
                        onChange={(e) => handleUpdateModel(idx, 'estCol', e.target.value)}
                        className="w-full rounded border border-slate-200 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      >
                        {currentHeaders.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1 min-w-[120px]">
                      <label className="text-[10px] text-slate-400">Kolom RSE / SE:</label>
                      <select
                        value={m.rseCol || ''}
                        onChange={(e) => handleUpdateModel(idx, 'rseCol', e.target.value)}
                        className="w-full rounded border border-slate-200 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      >
                        <option value="">-- Pilih --</option>
                        {currentHeaders.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveModel(idx)}
                      className="mt-3.5 p-1 text-slate-400 hover:text-rose-500"
                      title="Hapus Model"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-700 transition"
            >
              <Check className="h-4 w-4" />
              <span>Terapkan & Tampilkan Grafik</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
