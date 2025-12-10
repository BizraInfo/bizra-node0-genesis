import React, { useState, useEffect } from "react";
import { Card, Row, Col, Select, DatePicker, Space, Spin } from "antd";
import MetricsChart from "../components/MetricsChart";
import { useMetrics } from "../hooks/useMetrics";
import type { TimeSeriesData } from "../types/validation.types";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

const Analytics: React.FC = () => {
  const [interval, setInterval] = useState<"1m" | "5m" | "15m" | "1h" | "1d">(
    "15m",
  );
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(24, "hours"),
    dayjs(),
  ]);

  const { fetchTimeSeriesData } = useMetrics();

  const [validationTrend, setValidationTrend] = useState<TimeSeriesData | null>(
    null,
  );
  const [successRateTrend, setSuccessRateTrend] =
    useState<TimeSeriesData | null>(null);
  const [responseTrend, setResponseTrend] = useState<TimeSeriesData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChartData();
  }, [interval, dateRange]);

  const loadChartData = async () => {
    setLoading(true);
    try {
      const filters = {
        interval,
        startDate: dateRange[0].toISOString(),
        endDate: dateRange[1].toISOString(),
      };

      const [validations, successRate, responseTime] = await Promise.all([
        fetchTimeSeriesData("validations_total", filters),
        fetchTimeSeriesData("success_rate", filters),
        fetchTimeSeriesData("response_time", filters),
      ]);

      setValidationTrend(validations);
      setSuccessRateTrend(successRate);
      setResponseTrend(responseTime);
    } catch (error) {
      console.error("Failed to load chart data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card>
        <Space>
          <span>Interval:</span>
          <Select
            value={interval}
            onChange={setInterval}
            style={{ width: 120 }}
          >
            <Select.Option value="1m">1 minute</Select.Option>
            <Select.Option value="5m">5 minutes</Select.Option>
            <Select.Option value="15m">15 minutes</Select.Option>
            <Select.Option value="1h">1 hour</Select.Option>
            <Select.Option value="1d">1 day</Select.Option>
          </Select>

          <span>Date Range:</span>
          <RangePicker
            showTime
            value={dateRange}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setDateRange([dates[0], dates[1]]);
              }
            }}
          />
        </Space>
      </Card>

      {loading ? (
        <Card>
          <div style={{ textAlign: "center", padding: "50px 0" }}>
            <Spin size="large" />
          </div>
        </Card>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="Validation Trends">
                {validationTrend && (
                  <MetricsChart
                    data={[validationTrend]}
                    type="area"
                    height={300}
                    colors={["#1890ff"]}
                  />
                )}
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="Success Rate">
                {successRateTrend && (
                  <MetricsChart
                    data={[successRateTrend]}
                    type="line"
                    height={300}
                    colors={["#52c41a"]}
                  />
                )}
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Card title="Response Time Trends">
                {responseTrend && (
                  <MetricsChart
                    data={[responseTrend]}
                    type="area"
                    height={350}
                    colors={["#faad14"]}
                  />
                )}
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="Validation Status Distribution">
                <MetricsChart
                  data={[
                    { timestamp: "Success", value: 850, label: "Success" },
                    { timestamp: "Failed", value: 120, label: "Failed" },
                    { timestamp: "Timeout", value: 30, label: "Timeout" },
                  ]}
                  type="pie"
                  height={300}
                  colors={["#52c41a", "#f5222d", "#faad14"]}
                />
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="Validation Types">
                <MetricsChart
                  data={[
                    { timestamp: "Transaction", value: 450 },
                    { timestamp: "Block", value: 320 },
                    { timestamp: "Contract", value: 150 },
                    { timestamp: "Signature", value: 80 },
                  ]}
                  type="bar"
                  height={300}
                  colors={["#1890ff"]}
                />
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Space>
  );
};

export default Analytics;
