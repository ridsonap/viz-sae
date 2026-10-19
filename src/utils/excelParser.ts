import * as XLSX from 'xlsx';
import { Dataset, DomainData, ColumnMappingConfig, ModelSummary } from '../types/sae';

// Helper to normalize column names for fuzzy detection
function normalize(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export interface ParseResult {
  sheetNames: string[];
  workbook: XLSX.WorkBook;
  defaultSheet: string;
  rawRows: Record<string, any>[];
  headers: string[];
  suggestedMapping: ColumnMappingConfig;
}

export function parseExcelWorkbook(data: ArrayBuffer): ParseResult {
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetNames = workbook.SheetNames;
  const defaultSheet = sheetNames[0];
  const worksheet = workbook.Sheets[defaultSheet];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  const headers = rawRows.length > 0 ? Object.keys(rawRows[0]) : [];

  const suggestedMapping = suggestColumnMapping(headers);

  return {
    sheetNames,
    workbook,
    defaultSheet,
    rawRows,
    headers,
    suggestedMapping,
  };
}

export function parseSheetData(worksheet: XLSX.WorkSheet): { rawRows: Record<string, any>[]; headers: string[]; suggestedMapping: ColumnMappingConfig } {
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  const headers = rawRows.length > 0 ? Object.keys(rawRows[0]) : [];
  return {
    rawRows,
    headers,
    suggestedMapping: suggestColumnMapping(headers),
  };
}

export function suggestColumnMapping(headers: string[]): ColumnMappingConfig {
  let domainIdCol = '';
  let domainNameCol = '';
  let directEstCol = '';
  let directRseCol = '';
  let directSeCol = '';
  let directMseCol = '';
  let sampleSizeCol = '';

  const assigned = new Set<string>();

  // 1. Detect Domain ID
  const idKeywords = ['id', 'kode', 'code', 'bpscode', 'kdprov', 'kdkab', 'domainid', 'areaid'];
  for (const h of headers) {
    const n = normalize(h);
    if (idKeywords.some(k => n === k || n.endsWith(k))) {
      domainIdCol = h;
      assigned.add(h);
      break;
    }
  }

  // 2. Detect Domain Name
  const nameKeywords = ['name', 'nama', 'kabupaten', 'kecamatan', 'provinsi', 'kabkota', 'wilayah', 'domain', 'area'];
  for (const h of headers) {
    if (assigned.has(h)) continue;
    const n = normalize(h);
    if (nameKeywords.some(k => n === k || n.includes(k))) {
      domainNameCol = h;
      assigned.add(h);
      break;
    }
  }
  if (!domainIdCol && domainNameCol) domainIdCol = domainNameCol;
  if (!domainNameCol && domainIdCol) domainNameCol = domainIdCol;

  // 3. Detect Sample Size
  const nKeywords = ['samplesize', 'samplesize', 'n', 'sample', 'sampel'];
  for (const h of headers) {
    if (assigned.has(h)) continue;
    const n = normalize(h);
    if (nKeywords.some(k => n === k)) {
      sampleSizeCol = h;
      assigned.add(h);
      break;
    }
  }

  // 4. Detect Direct Estimate & Direct Errors
  const dirEstKeywords = ['direct', 'directest', 'ydir', 'estdir', 'directestimate', 'estimasilangsung', 'ht'];
  for (const h of headers) {
    if (assigned.has(h)) continue;
    const n = normalize(h);
    if (dirEstKeywords.some(k => n === k || n.includes('direct') && !n.includes('rse') && !n.includes('se') && !n.includes('mse') && !n.includes('var'))) {
      directEstCol = h;
      assigned.add(h);
      break;
    }
  }

  // Direct RSE
  for (const h of headers) {
    if (assigned.has(h)) continue;
    const n = normalize(h);
    if ((n.includes('direct') || n.includes('dir')) && (n.includes('rse') || n.includes('cv'))) {
      directRseCol = h;
      assigned.add(h);
      break;
    }
  }

  // Direct SE
  for (const h of headers) {
    if (assigned.has(h)) continue;
    const n = normalize(h);
    if ((n.includes('direct') || n.includes('dir')) && (n.includes('se') || n.includes('std')) && !n.includes('rse') && !n.includes('mse')) {
      directSeCol = h;
      assigned.add(h);
      break;
    }
  }

  // Direct MSE / Var
  for (const h of headers) {
    if (assigned.has(h)) continue;
    const n = normalize(h);
    if ((n.includes('direct') || n.includes('dir')) && (n.includes('mse') || n.includes('var') || n.includes('vardir'))) {
      directMseCol = h;
      assigned.add(h);
      break;
    }
  }

  // 5. Detect Models
  // Look for columns ending with est, estimate, rse, se, mse
  const modelCols: { modelName: string; estCol: string; rseCol?: string; seCol?: string; mseCol?: string }[] = [];
  const modelCandidateMap = new Map<string, { estCol?: string; rseCol?: string; seCol?: string; mseCol?: string }>();

  headers.forEach(h => {
    if (assigned.has(h)) return;
    const n = normalize(h);

    // Identify model prefix
    let prefix = '';
    let metricType = '';

    if (n.endsWith('est') || n.endsWith('estimate') || n.endsWith('pred') || n.endsWith('hat')) {
      prefix = h.replace(/[-_]?(est|estimate|pred|hat)$/i, '').trim();
      metricType = 'est';
    } else if (n.endsWith('rse') || n.endsWith('cv')) {
      prefix = h.replace(/[-_]?(rse|cv)$/i, '').trim();
      metricType = 'rse';
    } else if (n.endsWith('se') || n.endsWith('stderr')) {
      prefix = h.replace(/[-_]?(se|stderr)$/i, '').trim();
      metricType = 'se';
    } else if (n.endsWith('mse') || n.endsWith('var')) {
      prefix = h.replace(/[-_]?(mse|var)$/i, '').trim();
      metricType = 'mse';
    }

    if (prefix && prefix.toLowerCase() !== 'direct' && prefix.toLowerCase() !== 'dir') {
      const existing = modelCandidateMap.get(prefix) || {};
      if (metricType === 'est') existing.estCol = h;
      if (metricType === 'rse') existing.rseCol = h;
      if (metricType === 'se') existing.seCol = h;
      if (metricType === 'mse') existing.mseCol = h;
      modelCandidateMap.set(prefix, existing);
    }
  });

  modelCandidateMap.forEach((val, modelName) => {
    if (val.estCol) {
      modelCols.push({
        modelName: modelName || 'Model',
        estCol: val.estCol,
        rseCol: val.rseCol,
        seCol: val.seCol,
        mseCol: val.mseCol,
      });
    }
  });

  return {
    domainIdCol: domainIdCol || headers[0] || '',
    domainNameCol: domainNameCol || headers[1] || headers[0] || '',
    directEstCol: directEstCol || '',
    directRseCol,
    directSeCol,
    directMseCol,
    sampleSizeCol,
    modelCols,
  };
}

export function buildDatasetFromConfig(
  datasetName: string,
  rows: Record<string, any>[],
  config: ColumnMappingConfig,
  threshold: number = 25
): Dataset {
  const domains: DomainData[] = [];
  const modelNames = config.modelCols.map(m => m.modelName);

  rows.forEach((row, idx) => {
    const domainId = String(row[config.domainIdCol] ?? `domain_${idx + 1}`).trim();
    const domainName = String(row[config.domainNameCol] ?? domainId).trim();
    if (!domainId && !domainName) return;

    const sampleSize = config.sampleSizeCol ? Number(row[config.sampleSizeCol]) : undefined;

    // Direct metrics
    const dirEst = Number(row[config.directEstCol]) || 0;
    let dirRse = config.directRseCol ? Number(row[config.directRseCol]) : undefined;
    let dirSe = config.directSeCol ? Number(row[config.directSeCol]) : undefined;
    let dirMse = config.directMseCol ? Number(row[config.directMseCol]) : undefined;

    // Auto-calculate missing direct metrics
    if (dirRse === undefined && dirSe !== undefined && dirEst !== 0) {
      dirRse = Math.abs((dirSe / dirEst) * 100);
    }
    if (dirSe === undefined && dirRse !== undefined && dirEst !== 0) {
      dirSe = (dirRse * dirEst) / 100;
    }
    if (dirMse === undefined && dirSe !== undefined) {
      dirMse = dirSe * dirSe;
    } else if (dirSe === undefined && dirMse !== undefined) {
      dirSe = Math.sqrt(Math.max(0, dirMse));
      if (dirRse === undefined && dirEst !== 0) {
        dirRse = Math.abs((dirSe / dirEst) * 100);
      }
    }

    const safeDirRse = dirRse ?? 0;
    const safeDirSe = dirSe ?? 0;
    const safeDirMse = dirMse ?? safeDirSe * safeDirSe;

    const direct = {
      estimate: Number(dirEst.toFixed(4)),
      se: Number(safeDirSe.toFixed(4)),
      rse: Number(safeDirRse.toFixed(2)),
      mse: Number(safeDirMse.toFixed(5)),
      ciLower: Number(Math.max(0, dirEst - 1.96 * safeDirSe).toFixed(3)),
      ciUpper: Number((dirEst + 1.96 * safeDirSe).toFixed(3)),
    };

    // Calculate each Model metrics
    const models: Record<string, any> = {};

    config.modelCols.forEach(m => {
      const est = Number(row[m.estCol]) || 0;
      let rse = m.rseCol ? Number(row[m.rseCol]) : undefined;
      let se = m.seCol ? Number(row[m.seCol]) : undefined;
      let mse = m.mseCol ? Number(row[m.mseCol]) : undefined;

      if (rse === undefined && se !== undefined && est !== 0) {
        rse = Math.abs((se / est) * 100);
      }
      if (se === undefined && rse !== undefined && est !== 0) {
        se = (rse * est) / 100;
      }
      if (mse === undefined && se !== undefined) {
        mse = se * se;
      } else if (se === undefined && mse !== undefined) {
        se = Math.sqrt(Math.max(0, mse));
        if (rse === undefined && est !== 0) {
          rse = Math.abs((se / est) * 100);
        }
      }

      const safeRse = rse ?? 0;
      const safeSe = se ?? 0;
      const safeMse = mse ?? safeSe * safeSe;

      const re = safeMse > 0 && safeDirMse > 0 ? safeDirMse / safeMse : 1.0;
      const shrinkage = est - dirEst;
      const rseReduction = safeDirRse > 0 ? ((safeDirRse - safeRse) / safeDirRse) * 100 : 0;

      models[m.modelName] = {
        estimate: Number(est.toFixed(4)),
        se: Number(safeSe.toFixed(4)),
        rse: Number(safeRse.toFixed(2)),
        mse: Number(safeMse.toFixed(5)),
        ciLower: Number(Math.max(0, est - 1.96 * safeSe).toFixed(3)),
        ciUpper: Number((est + 1.96 * safeSe).toFixed(3)),
        re: Number(re.toFixed(3)),
        shrinkage: Number(shrinkage.toFixed(3)),
        rseReduction: Number(rseReduction.toFixed(2)),
      };
    });

    domains.push({
      domainId,
      domainName,
      sampleSize,
      direct,
      models,
    });
  });

  return {
    name: datasetName,
    domains,
    modelNames,
    threshold,
  };
}

export function computeModelSummaries(dataset: Dataset): { directSummary: ModelSummary; modelSummaries: ModelSummary[] } {
  const n = dataset.domains.length;
  if (n === 0) {
    const empty: ModelSummary = {
      name: '',
      color: '#6366f1',
      avgEstimate: 0,
      avgRse: 0,
      medianRse: 0,
      maxRse: 0,
      minRse: 0,
      reliablePct: 0,
      avgRe: 1,
      avgRseReduction: 0,
    };
    return { directSummary: empty, modelSummaries: [] };
  }

  // Direct Summary
  const dirEsts = dataset.domains.map(d => d.direct.estimate);
  const dirRses = dataset.domains.map(d => d.direct.rse).sort((a, b) => a - b);
  const dirAvgEst = dirEsts.reduce((a, b) => a + b, 0) / n;
  const dirAvgRse = dirRses.reduce((a, b) => a + b, 0) / n;
  const dirMedRse = dirRses[Math.floor(n / 2)];
  const dirReliableCount = dirRses.filter(r => r < dataset.threshold).length;

  const directSummary: ModelSummary = {
    name: 'Direct Estimator',
    color: '#94a3b8',
    avgEstimate: Number(dirAvgEst.toFixed(2)),
    avgRse: Number(dirAvgRse.toFixed(2)),
    medianRse: Number(dirMedRse.toFixed(2)),
    minRse: Number(dirRses[0].toFixed(2)),
    maxRse: Number(dirRses[n - 1].toFixed(2)),
    reliablePct: Number(((dirReliableCount / n) * 100).toFixed(1)),
    avgRe: 1.0,
    avgRseReduction: 0,
  };

  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6'];

  const modelSummaries: ModelSummary[] = dataset.modelNames.map((mName, i) => {
    const mEsts = dataset.domains.map(d => d.models[mName]?.estimate ?? 0);
    const mRses = dataset.domains.map(d => d.models[mName]?.rse ?? 0).sort((a, b) => a - b);
    const mRes = dataset.domains.map(d => d.models[mName]?.re ?? 1);
    const mReductions = dataset.domains.map(d => d.models[mName]?.rseReduction ?? 0);

    const avgEst = mEsts.reduce((a, b) => a + b, 0) / n;
    const avgRse = mRses.reduce((a, b) => a + b, 0) / n;
    const medRse = mRses[Math.floor(n / 2)];
    const reliableCount = mRses.filter(r => r < dataset.threshold).length;
    const avgRe = mRes.reduce((a, b) => a + b, 0) / n;
    const avgRseRed = mReductions.reduce((a, b) => a + b, 0) / n;

    return {
      name: mName,
      color: colors[i % colors.length],
      avgEstimate: Number(avgEst.toFixed(2)),
      avgRse: Number(avgRse.toFixed(2)),
      medianRse: Number(medRse.toFixed(2)),
      minRse: Number(mRses[0].toFixed(2)),
      maxRse: Number(mRses[n - 1].toFixed(2)),
      reliablePct: Number(((reliableCount / n) * 100).toFixed(1)),
      avgRe: Number(avgRe.toFixed(2)),
      avgRseReduction: Number(avgRseRed.toFixed(1)),
    };
  });

  return { directSummary, modelSummaries };
}

// Generate Excel Template for download
export function generateExcelTemplate(): void {
  const wb = XLSX.utils.book_new();

  const data = [
    {
      Domain_ID: '3301',
      Domain_Name: 'Kab. Cilacap',
      Sample_Size: 120,
      Direct_Est: 11.02,
      Direct_RSE: 28.4,
      FH_Est: 10.95,
      FH_RSE: 14.2,
      Spatial_Est: 10.88,
      Spatial_RSE: 12.9,
    },
    {
      Domain_ID: '3302',
      Domain_Name: 'Kab. Banyumas',
      Sample_Size: 140,
      Direct_Est: 12.84,
      Direct_RSE: 26.2,
      FH_Est: 12.52,
      FH_RSE: 13.8,
      Spatial_Est: 12.45,
      Spatial_RSE: 12.1,
    },
    {
      Domain_ID: '3303',
      Domain_Name: 'Kab. Purbalingga',
      Sample_Size: 95,
      Direct_Est: 15.30,
      Direct_RSE: 32.1,
      FH_Est: 14.85,
      FH_RSE: 15.6,
      Spatial_Est: 14.72,
      Spatial_RSE: 13.9,
    },
  ];

  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Hasil_SAE');
  XLSX.writeFile(wb, 'template_hasil_sae.xlsx');
}

// Export processed dataset to Excel
export function exportDatasetToExcel(dataset: Dataset): void {
  const wb = XLSX.utils.book_new();

  const rows = dataset.domains.map(d => {
    const row: Record<string, any> = {
      'Domain ID': d.domainId,
      'Domain Name': d.domainName,
      'Sample Size': d.sampleSize ?? '',
      'Direct Estimate': d.direct.estimate,
      'Direct SE': d.direct.se,
      'Direct RSE (%)': d.direct.rse,
      'Direct MSE': d.direct.mse,
      'Direct 95% CI Lower': d.direct.ciLower,
      'Direct 95% CI Upper': d.direct.ciUpper,
    };

    dataset.modelNames.forEach(m => {
      const modelData = d.models[m];
      if (modelData) {
        row[`${m} Estimate`] = modelData.estimate;
        row[`${m} SE`] = modelData.se;
        row[`${m} RSE (%)`] = modelData.rse;
        row[`${m} MSE`] = modelData.mse;
        row[`${m} RE (Relative Efficiency)`] = modelData.re;
        row[`${m} Shrinkage`] = modelData.shrinkage;
        row[`${m} RSE Reduction (%)`] = modelData.rseReduction;
      }
    });

    return row;
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'SAE_Comparison');
  XLSX.writeFile(wb, `SAE_Comparison_${dataset.name.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
}
