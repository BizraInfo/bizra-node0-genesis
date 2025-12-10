import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Tag, Typography, Badge } from 'antd';
import { 
  SafetyCertificateOutlined, 
  ThunderboltOutlined, 
  ClockCircleOutlined, 
  HistoryOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

interface ResilienceMetrics {
  incidentCount: number;
  medianRecoverySeconds: number;
  maxRecoverySeconds: number;
  lastIncidentAt: string | null;
  lastRecoverySeconds: number;
  sloWindowSeconds: number;
  totalEvents: number;
}

export const MeshResilienceSLOPanel: React.FC<{ refreshIntervalMs?: number }> = ({ 
  refreshIntervalMs = 5000 
}) => {
  const [metrics, setMetrics] = useState<ResilienceMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/mesh/resilience/summary');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error('Failed to fetch resilience metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, refreshIntervalMs);
    return () => clearInterval(interval);
  }, [refreshIntervalMs]);

  if (!metrics) {
    return (
      <Card loading={loading} title="Mesh Resilience SLO">
        <Text type="secondary">Loading metrics...</Text>
      </Card>
    );
  }

  // SLO Logic
  const isHealthy = metrics.medianRecoverySeconds < 30 && metrics.maxRecoverySeconds < 60;
  const sloStatus = isHealthy ? 'ON TRACK' : 'AT RISK';
  const sloColor = isHealthy ? 'success' : 'warning';

  return (
    <Card 
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SafetyCertificateOutlined style={{ color: '#1890ff' }} />
            <span>Mesh Resilience SLO</span>
          </div>
          <Tag color={sloColor} style={{ margin: 0, fontWeight: 'bold' }}>
            {sloStatus}
          </Tag>
        </div>
      }
      size="small"
      style={{ marginBottom: 16 }}
    >
      <Row gutter={16}>
        <Col span={6}>
          <Statistic 
            title="Total Incidents" 
            value={metrics.incidentCount} 
            prefix={<ThunderboltOutlined />} 
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Last {Math.round(metrics.sloWindowSeconds / 60)} mins
          </Text>
        </Col>
        <Col span={6}>
          <Statistic 
            title="Median Recovery" 
            value={metrics.medianRecoverySeconds} 
            precision={1}
            suffix="s"
            valueStyle={{ color: metrics.medianRecoverySeconds > 30 ? '#faad14' : '#3f8600' }}
            prefix={<ClockCircleOutlined />}
          />
        </Col>
        <Col span={6}>
          <Statistic 
            title="Worst Case" 
            value={metrics.maxRecoverySeconds} 
            precision={1}
            suffix="s"
            valueStyle={{ color: metrics.maxRecoverySeconds > 60 ? '#cf1322' : undefined }}
          />
        </Col>
        <Col span={6}>
          <Statistic 
            title="Last Incident" 
            value={metrics.lastIncidentAt ? dayjs(metrics.lastIncidentAt).fromNow() : 'None'} 
            valueStyle={{ fontSize: 16 }}
            prefix={<HistoryOutlined />}
          />
          {metrics.lastIncidentAt && (
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>
              Recovered in {metrics.lastRecoverySeconds.toFixed(1)}s
            </div>
          )}
        </Col>
      </Row>
    </Card>
  );
};
