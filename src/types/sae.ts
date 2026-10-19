export interface MetricValues {
  estimate: number;
  se?: number;
  rse: number;       // in percentage (e.g., 18.5 for 18.5%)
  mse?: number;
  ciLower?: number;  // 95% CI Lower
  ciUpper?: number;  // 95% CI Upper
}

export interface ModelMetricValues extends MetricValues {
  re?: number;             // Relative Efficiency: MSE_dir / MSE_model
  shrinkage?: number;      // Estimate - Direct_Estimate
  rseReduction?: number;   // ((RSE_dir - RSE_model) / RSE_dir) * 100
}

export interface DomainData {
  domainId: string;
  domainName: string;
  sampleSize?: number;
  direct: MetricValues;
  models: Record<string, ModelMetricValues>;
}

export interface ModelSummary {
  name: string;
  color: string;
  avgEstimate: number;
  avgRse: number;
  medianRse: number;
  maxRse: number;
  minRse: number;
  reliablePct: number;    // % with RSE < 25%
  avgRe: number;          // Average Relative Efficiency
  avgRseReduction: number; // Average % reduction in RSE compared to Direct
}

export interface Dataset {
  name: string;
  domains: DomainData[];
  modelNames: string[];
  threshold: number;      // Default 25% (BPS standard)
}

export interface RawColumnOption {
  header: string;
  sampleValues: (string | number)[];
}

export interface ColumnMappingConfig {
  domainIdCol: string;
  domainNameCol: string;
  directEstCol: string;
  directRseCol?: string;
  directSeCol?: string;
  directMseCol?: string;
  sampleSizeCol?: string;
  modelCols: {
    modelName: string;
    estCol: string;
    rseCol?: string;
    seCol?: string;
    mseCol?: string;
  }[];
}

export type ChartColorPalette = 'vibrant' | 'academic' | 'emerald' | 'colorblind';
