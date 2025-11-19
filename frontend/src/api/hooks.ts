import { useQuery } from '@tanstack/react-query';

import { apiClient } from './client';

export interface DashboardOverview {
  stats: {
    registeredMetrics: { total: number; sensitive: number };
    activeVersions: { total: number; releasedThisWeek: number };
    yesterdayJobs: { total: number; failed: number };
    recentUploads: { total: number; processing: number };
  };
  taskSummary: { title: string; description: string };
  uploads: Array<{ batchId: string; source: string; filename: string; status: string }>;
}

export interface MetricVersion {
  id: number;
  metric_id: number;
  version: string;
  status: string;
  formula_sql?: string | null;
  formula_dsl?: Record<string, unknown> | null;
  grain?: string[] | null;
  data_sources?: string[] | null;
  notes?: string | null;
  effective_from?: string | null;
  effective_to?: string | null;
  created_at: string;
  calibers?: VersionCaliber[];
}

export interface MetricItem {
  id: number;
  code: string;
  name: string;
  type: string;
  unit?: string | null;
  subject_area?: string | null;
  owner?: string | null;
  sensitivity: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
  versions: MetricVersion[];
}

export interface MetricSummary {
  total_metrics: number;
  sensitive_metrics: number;
  active_versions: number;
  draft_versions: number;
}

export interface CaliberItem {
  id: number;
  code: string;
  name: string;
  category: string;
  expr_dsl?: Record<string, unknown> | null;
  expr_sql?: string | null;
  value_format?: string | null;
  unit_override?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface VersionCaliber {
  id: number;
  metric_version_id: number;
  caliber_id: number;
  status: string;
  order_index: number;
  override_expr_sql?: string | null;
  override_expr_dsl?: Record<string, unknown> | null;
  override_data_sources?: string[] | null;
  notes?: string | null;
  created_at: string;
  caliber?: CaliberItem | null;
}

export interface CompanyItem {
  company_id: number;
  company_code?: string | null;
  company_name?: string | null;
  level?: number | null;
  parent_company_id?: number | null;
  is_active?: boolean | null;
}

export interface ProductItem {
  product_id: number;
  product_code?: string | null;
  product_name?: string | null;
  product_type?: string | null;
}

export interface ChannelItem {
  channel_id: number;
  channel_code?: string | null;
  channel_name?: string | null;
  channel_type?: string | null;
}

export interface ComboItem {
  combo_id: number;
  company_id?: number | null;
  core_company_id?: number | null;
  product_id?: number | null;
  channel_id?: number | null;
  company_name?: string | null;
  core_company_name?: string | null;
  product_name?: string | null;
  channel_name?: string | null;
}
export function useDashboardOverview() {
  return useQuery<DashboardOverview>({
    queryKey: ['dashboard-overview'],
    queryFn: async () => {
      const { data } = await apiClient.get<DashboardOverview>('/dashboard/overview');
      return data;
    },
  });
}

export function useMetricSummary() {
  return useQuery<MetricSummary>({
    queryKey: ['metric-summary'],
    queryFn: async () => {
      const { data } = await apiClient.get<MetricSummary>('/metrics/summary');
      return data;
    },
  });
}

export interface MetricListFilters {
  keyword?: string;
  subject_area?: string;
  sensitivity?: string;
}

export function useMetricList(filters: MetricListFilters = {}) {
  return useQuery<MetricItem[]>({
    queryKey: ['metric-list', filters],
    queryFn: async () => {
      const { data } = await apiClient.get<MetricItem[]>('/metrics', { params: filters });
      return data;
    },
  });
}

export function useMetricDetail(metricId?: number, enabled = true) {
  return useQuery<MetricItem>({
    queryKey: ['metric-detail', metricId],
    enabled: Boolean(metricId) && enabled,
    queryFn: async () => {
      const { data } = await apiClient.get<MetricItem>(`/metrics/${metricId}`);
      return data;
    },
  });
}

export function useMetricVersions(metricId: number, enabled = true) {
  return useQuery<MetricVersion[]>({
    queryKey: ['metric-versions', metricId],
    enabled,
    queryFn: async () => {
      const { data } = await apiClient.get<MetricVersion[]>(`/metrics/${metricId}/versions`);
      return data;
    },
  });
}

export function useCalibers() {
  return useQuery<CaliberItem[]>({
    queryKey: ['calibers'],
    queryFn: async () => {
      const { data } = await apiClient.get<CaliberItem[]>('/calibers');
      return data;
    },
  });
}

export function useVersionCalibers(metricId: number, versionId: number, enabled = true) {
  return useQuery<VersionCaliber[]>({
    queryKey: ['version-calibers', metricId, versionId],
    enabled,
    queryFn: async () => {
      const { data } = await apiClient.get<VersionCaliber[]>(
        `/metrics/${metricId}/versions/${versionId}/calibers`,
      );
      return data;
    },
  });
}

export function useDimensionCompanies(keyword?: string) {
  return useQuery<CompanyItem[]>({
    queryKey: ['dimension-companies', keyword],
    queryFn: async () => {
      const { data } = await apiClient.get<CompanyItem[]>('/dimensions/companies', { params: { keyword } });
      return data;
    },
  });
}

export function useDimensionProducts(keyword?: string) {
  return useQuery<ProductItem[]>({
    queryKey: ['dimension-products', keyword],
    queryFn: async () => {
      const { data } = await apiClient.get<ProductItem[]>('/dimensions/products', { params: { keyword } });
      return data;
    },
  });
}

export function useDimensionChannels(keyword?: string) {
  return useQuery<ChannelItem[]>({
    queryKey: ['dimension-channels', keyword],
    queryFn: async () => {
      const { data } = await apiClient.get<ChannelItem[]>('/dimensions/channels', { params: { keyword } });
      return data;
    },
  });
}

export function useDimensionCombos(keyword?: string) {
  return useQuery<ComboItem[]>({
    queryKey: ['dimension-combos', keyword],
    queryFn: async () => {
      const { data } = await apiClient.get<ComboItem[]>('/dimensions/combos', { params: { keyword } });
      return data;
    },
  });
}
