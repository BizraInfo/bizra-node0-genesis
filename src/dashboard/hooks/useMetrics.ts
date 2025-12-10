import { useState, useEffect, useCallback } from "react";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import apiService from "../services/api.service";
import type {
  ValidationMetrics,
  DashboardStats,
  APIMetric,
  TimeSeriesData,
  ChartDataPoint,
} from "../types/validation.types";

interface MetricsFilters {
  startDate?: string;
  endDate?: string;
  interval?: "1m" | "5m" | "15m" | "1h" | "1d";
  nodeId?: string;
}

export const useMetrics = (filters?: MetricsFilters) => {
  // Fetch validation metrics
  const {
    data: validationMetrics,
    isLoading: isLoadingValidation,
    error: validationError,
    refetch: refetchValidation,
  } = useQuery<ValidationMetrics>({
    queryKey: ["validationMetrics", filters],
    queryFn: async () => {
      const params = new URLSearchParams(filters as any);
      return apiService.get<ValidationMetrics>(
        `/metrics/validation?${params.toString()}`,
      );
    },
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // Fetch dashboard stats
  const {
    data: dashboardStats,
    isLoading: isLoadingDashboard,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useQuery<DashboardStats>({
    queryKey: ["dashboardStats", filters],
    queryFn: async () => {
      return apiService.get<DashboardStats>("/metrics/dashboard");
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Fetch API metrics
  const {
    data: apiMetrics,
    isLoading: isLoadingAPI,
    error: apiError,
    refetch: refetchAPI,
  } = useQuery<APIMetric[]>({
    queryKey: ["apiMetrics", filters],
    queryFn: async () => {
      const params = new URLSearchParams(filters as any);
      return apiService.get<APIMetric[]>(`/metrics/api?${params.toString()}`);
    },
    refetchInterval: 15000, // Refetch every 15 seconds
  });

  // Fetch time series data
  const fetchTimeSeriesData = useCallback(
    async (
      metric: string,
      filters?: MetricsFilters,
    ): Promise<TimeSeriesData> => {
      const params = new URLSearchParams({ metric, ...(filters as any) });
      return apiService.get<TimeSeriesData>(
        `/metrics/timeseries?${params.toString()}`,
      );
    },
    [],
  );

  // Calculate derived metrics
  const calculateSuccessRate = useCallback(
    (metrics: ValidationMetrics | undefined) => {
      if (!metrics) return 0;
      const total = metrics.totalValidations;
      if (total === 0) return 0;
      return (metrics.successRate * 100).toFixed(2);
    },
    [],
  );

  const calculateFailureRate = useCallback(
    (metrics: ValidationMetrics | undefined) => {
      if (!metrics) return 0;
      return (metrics.failureRate * 100).toFixed(2);
    },
    [],
  );

  const formatMetricValue = useCallback((value: number, unit: string = "") => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M${unit}`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(2)}K${unit}`;
    }
    return `${value.toFixed(2)}${unit}`;
  }, []);

  const isLoading = isLoadingValidation || isLoadingDashboard || isLoadingAPI;
  const error = validationError || dashboardError || apiError;

  return {
    validationMetrics,
    dashboardStats,
    apiMetrics,
    isLoading,
    error,
    refetchValidation,
    refetchDashboard,
    refetchAPI,
    fetchTimeSeriesData,
    calculateSuccessRate,
    calculateFailureRate,
    formatMetricValue,
  };
};

export default useMetrics;
