import { Dataset, DomainData } from '../types/sae';

// 35 Kabupaten/Kota di Provinsi Jawa Tengah (Data Simulasi Kemiskinan Berdasarkan Pola Survei BPS)
const rawDomains = [
  { id: '3301', name: 'Kab. Cilacap', n: 120, dirEst: 11.02, dirRse: 28.4, fhEst: 10.95, fhRse: 14.2, spEst: 10.88, spRse: 12.9, hbEst: 10.91, hbRse: 13.5 },
  { id: '3302', name: 'Kab. Banyumas', n: 140, dirEst: 12.84, dirRse: 26.2, fhEst: 12.52, fhRse: 13.8, spEst: 12.45, spRse: 12.1, hbEst: 12.48, hbRse: 12.8 },
  { id: '3303', name: 'Kab. Purbalingga', n: 95, dirEst: 15.30, dirRse: 32.1, fhEst: 14.85, fhRse: 15.6, spEst: 14.72, spRse: 13.9, hbEst: 14.78, hbRse: 14.5 },
  { id: '3304', name: 'Kab. Banjarnegara', n: 85, dirEst: 15.20, dirRse: 34.5, fhEst: 14.92, fhRse: 16.4, spEst: 14.80, spRse: 14.8, hbEst: 14.86, hbRse: 15.2 },
  { id: '3305', name: 'Kab. Kebumen', n: 110, dirEst: 16.34, dirRse: 29.8, fhEst: 15.98, fhRse: 14.9, spEst: 15.85, spRse: 13.5, hbEst: 15.90, hbRse: 14.1 },
  { id: '3306', name: 'Kab. Purworejo', n: 90, dirEst: 11.53, dirRse: 31.2, fhEst: 11.68, fhRse: 15.4, spEst: 11.60, spRse: 13.8, hbEst: 11.64, hbRse: 14.3 },
  { id: '3307', name: 'Kab. Wonosobo', n: 88, dirEst: 16.08, dirRse: 33.6, fhEst: 15.62, fhRse: 16.1, spEst: 15.50, spRse: 14.4, hbEst: 15.55, hbRse: 14.9 },
  { id: '3308', name: 'Kab. Magelang', n: 115, dirEst: 11.09, dirRse: 27.5, fhEst: 11.24, fhRse: 14.1, spEst: 11.18, spRse: 12.7, hbEst: 11.20, hbRse: 13.2 },
  { id: '3309', name: 'Kab. Boyolali', n: 105, dirEst: 9.82, dirRse: 28.9, fhEst: 10.05, fhRse: 14.5, spEst: 10.00, spRse: 13.0, hbEst: 10.02, hbRse: 13.6 },
  { id: '3310', name: 'Kab. Klaten', n: 130, dirEst: 12.04, dirRse: 25.8, fhEst: 12.18, fhRse: 13.5, spEst: 12.12, spRse: 12.2, hbEst: 12.15, hbRse: 12.7 },
  { id: '3311', name: 'Kab. Sukoharjo', n: 125, dirEst: 7.58, dirRse: 29.4, fhEst: 7.82, fhRse: 14.8, spEst: 7.78, spRse: 13.4, hbEst: 7.80, hbRse: 13.9 },
  { id: '3312', name: 'Kab. Wonogiri', n: 100, dirEst: 10.99, dirRse: 30.5, fhEst: 11.15, fhRse: 15.2, spEst: 11.08, spRse: 13.6, hbEst: 11.11, hbRse: 14.2 },
  { id: '3313', name: 'Kab. Karanganyar', n: 110, dirEst: 9.85, dirRse: 28.1, fhEst: 9.98, fhRse: 14.3, spEst: 9.92, spRse: 12.8, hbEst: 9.95, hbRse: 13.4 },
  { id: '3314', name: 'Kab. Sragen', n: 112, dirEst: 12.87, dirRse: 27.2, fhEst: 12.70, fhRse: 14.0, spEst: 12.65, spRse: 12.5, hbEst: 12.68, hbRse: 13.1 },
  { id: '3315', name: 'Kab. Grobogan', n: 135, dirEst: 11.80, dirRse: 26.5, fhEst: 11.95, fhRse: 13.7, spEst: 11.90, spRse: 12.3, hbEst: 11.92, hbRse: 12.9 },
  { id: '3316', name: 'Kab. Blora', n: 92, dirEst: 11.49, dirRse: 32.8, fhEst: 11.75, fhRse: 15.9, spEst: 11.68, spRse: 14.1, hbEst: 11.71, hbRse: 14.7 },
  { id: '3317', name: 'Kab. Rembang', n: 88, dirEst: 14.65, dirRse: 33.2, fhEst: 14.40, fhRse: 16.0, spEst: 14.32, spRse: 14.3, hbEst: 14.35, hbRse: 15.0 },
  { id: '3318', name: 'Kab. Pati', n: 128, dirEst: 9.33, dirRse: 27.9, fhEst: 9.55, fhRse: 14.2, spEst: 9.50, spRse: 12.7, hbEst: 9.52, hbRse: 13.3 },
  { id: '3319', name: 'Kab. Kudus', n: 115, dirEst: 7.41, dirRse: 30.1, fhEst: 7.62, fhRse: 15.0, spEst: 7.58, spRse: 13.5, hbEst: 7.60, hbRse: 14.1 },
  { id: '3320', name: 'Kab. Jepara', n: 120, dirEst: 6.88, dirRse: 31.8, fhEst: 7.15, fhRse: 15.5, spEst: 7.10, spRse: 13.8, hbEst: 7.12, hbRse: 14.4 },
  { id: '3321', name: 'Kab. Demak', n: 118, dirEst: 12.01, dirRse: 28.5, fhEst: 12.15, fhRse: 14.4, spEst: 12.08, spRse: 12.9, hbEst: 12.11, hbRse: 13.5 },
  { id: '3322', name: 'Kab. Semarang', n: 122, dirEst: 7.24, dirRse: 29.7, fhEst: 7.45, fhRse: 14.7, spEst: 7.40, spRse: 13.2, hbEst: 7.42, hbRse: 13.8 },
  { id: '3323', name: 'Kab. Temanggung', n: 96, dirEst: 9.33, dirRse: 32.4, fhEst: 9.52, fhRse: 15.7, spEst: 9.46, spRse: 14.0, hbEst: 9.49, hbRse: 14.6 },
  { id: '3324', name: 'Kab. Kendal', n: 114, dirEst: 9.48, dirRse: 28.2, fhEst: 9.65, fhRse: 14.3, spEst: 9.60, spRse: 12.8, hbEst: 9.62, hbRse: 13.4 },
  { id: '3325', name: 'Kab. Batang', n: 98, dirEst: 8.98, dirRse: 31.0, fhEst: 9.18, fhRse: 15.3, spEst: 9.12, spRse: 13.7, hbEst: 9.15, hbRse: 14.2 },
  { id: '3326', name: 'Kab. Pekalongan', n: 116, dirEst: 9.67, dirRse: 28.7, fhEst: 9.82, fhRse: 14.5, spEst: 9.76, spRse: 13.0, hbEst: 9.79, hbRse: 13.6 },
  { id: '3327', name: 'Kab. Pemalang', n: 124, dirEst: 15.03, dirRse: 26.8, fhEst: 14.82, fhRse: 13.9, spEst: 14.75, spRse: 12.4, hbEst: 14.78, hbRse: 13.0 },
  { id: '3328', name: 'Kab. Tegal', n: 132, dirEst: 7.90, dirRse: 29.1, fhEst: 8.12, fhRse: 14.6, spEst: 8.06, spRse: 13.1, hbEst: 8.09, hbRse: 13.7 },
  { id: '3329', name: 'Kab. Brebes', n: 150, dirEst: 15.78, dirRse: 24.8, fhEst: 15.55, fhRse: 13.1, spEst: 15.48, spRse: 11.7, hbEst: 15.51, hbRse: 12.2 },
  { id: '3371', name: 'Kota Magelang', n: 60, dirEst: 6.11, dirRse: 36.8, fhEst: 6.48, fhRse: 17.2, spEst: 6.40, spRse: 15.3, hbEst: 6.44, hbRse: 16.0 },
  { id: '3372', name: 'Kota Surakarta', n: 90, dirEst: 8.44, dirRse: 29.9, fhEst: 8.62, fhRse: 14.9, spEst: 8.55, spRse: 13.3, hbEst: 8.58, hbRse: 13.9 },
  { id: '3373', name: 'Kota Salatiga', n: 55, dirEst: 4.66, dirRse: 38.2, fhEst: 5.12, fhRse: 17.8, spEst: 5.05, spRse: 15.8, hbEst: 5.08, hbRse: 16.5 },
  { id: '3374', name: 'Kota Semarang', n: 160, dirEst: 4.25, dirRse: 23.5, fhEst: 4.41, fhRse: 12.4, spEst: 4.38, spRse: 11.2, hbEst: 4.40, hbRse: 11.6 },
  { id: '3375', name: 'Kota Pekalongan', n: 70, dirEst: 6.79, dirRse: 35.1, fhEst: 7.12, fhRse: 16.8, spEst: 7.05, spRse: 15.0, hbEst: 7.08, hbRse: 15.6 },
  { id: '3376', name: 'Kota Tegal', n: 65, dirEst: 7.68, dirRse: 34.2, fhEst: 7.95, fhRse: 16.5, spEst: 7.88, spRse: 14.7, hbEst: 7.91, hbRse: 15.3 },
];

export function getDemoDataset(): Dataset {
  const domains: DomainData[] = rawDomains.map((item) => {
    // Calculate SE, MSE, CI for Direct
    const dirSe = (item.dirRse * item.dirEst) / 100;
    const dirMse = dirSe * dirSe;
    const dirCiLower = Math.max(0, item.dirEst - 1.96 * dirSe);
    const dirCiUpper = item.dirEst + 1.96 * dirSe;

    // Helper for Model calculations
    const calcModel = (est: number, rse: number) => {
      const se = (rse * est) / 100;
      const mse = se * se;
      const re = dirMse / mse;
      const shrinkage = est - item.dirEst;
      const rseReduction = ((item.dirRse - rse) / item.dirRse) * 100;
      return {
        estimate: Number(est.toFixed(3)),
        se: Number(se.toFixed(4)),
        rse: Number(rse.toFixed(2)),
        mse: Number(mse.toFixed(5)),
        ciLower: Number(Math.max(0, est - 1.96 * se).toFixed(3)),
        ciUpper: Number((est + 1.96 * se).toFixed(3)),
        re: Number(re.toFixed(3)),
        shrinkage: Number(shrinkage.toFixed(3)),
        rseReduction: Number(rseReduction.toFixed(2)),
      };
    };

    return {
      domainId: item.id,
      domainName: item.name,
      sampleSize: item.n,
      direct: {
        estimate: Number(item.dirEst.toFixed(3)),
        se: Number(dirSe.toFixed(4)),
        rse: Number(item.dirRse.toFixed(2)),
        mse: Number(dirMse.toFixed(5)),
        ciLower: Number(dirCiLower.toFixed(3)),
        ciUpper: Number(dirCiUpper.toFixed(3)),
      },
      models: {
        'Fay-Herriot': calcModel(item.fhEst, item.fhRse),
        'Spatial SAE': calcModel(item.spEst, item.spRse),
        'Hierarchical Bayes': calcModel(item.hbEst, item.hbRse),
      },
    };
  });

  return {
    name: 'Kemiskinan Kabupaten/Kota Jawa Tengah (Simulasi SAE BPS)',
    domains,
    modelNames: ['Fay-Herriot', 'Spatial SAE', 'Hierarchical Bayes'],
    threshold: 25,
  };
}
