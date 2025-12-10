import React, { useEffect, useState } from 'react';

interface SapeState {
  elevationConfig: {
    dynamicTuning: boolean;
    optimizationLevel: string;
    lastElevation: string;
  };
  circuitBreaker: {
    state: string;
    failureCount: number;
    threshold: number;
  };
  timestamp: string;
}

const SapeVisualizer: React.FC = () => {
  const [state, setState] = useState<SapeState | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // In a real app, this would fetch from /api/sape/state
        // For demo purposes, we'll simulate the fetch if the API isn't reachable
        const response = await fetch('/api/sape/state');
        if (response.ok) {
          const data = await response.json();
          setState(data);
        } else {
            // Fallback simulation for demo
            setState({
                elevationConfig: {
                    dynamicTuning: true,
                    optimizationLevel: "trans-finite",
                    lastElevation: new Date().toISOString()
                },
                circuitBreaker: {
                    state: "CLOSED",
                    failureCount: 0,
                    threshold: 100
                },
                timestamp: new Date().toISOString()
            });
        }
      } catch (e) {
        console.error("Failed to fetch SAPE state", e);
         // Fallback simulation for demo
         setState({
            elevationConfig: {
                dynamicTuning: true,
                optimizationLevel: "trans-finite",
                lastElevation: new Date().toISOString()
            },
            circuitBreaker: {
                state: "CLOSED",
                failureCount: 0,
                threshold: 100
            },
            timestamp: new Date().toISOString()
        });
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!state) return <div>Loading SAPE State...</div>;

  const getStatusColor = (level: string) => {
    switch (level) {
      case 'trans-finite': return '#00ff00'; // Green
      case 'elite': return '#00ccff'; // Blue
      case 'safe': return '#ff9900'; // Orange
      default: return '#cccccc';
    }
  };

  const styles = {
    container: {
      padding: '20px',
      backgroundColor: '#1a1a1a',
      borderRadius: '8px',
      color: '#fff',
      fontFamily: 'monospace',
      border: `1px solid ${getStatusColor(state.elevationConfig.optimizationLevel)}`,
      boxShadow: `0 0 15px ${getStatusColor(state.elevationConfig.optimizationLevel)}40`
    },
    header: {
      fontSize: '1.2em',
      marginBottom: '15px',
      borderBottom: '1px solid #333',
      paddingBottom: '10px',
      display: 'flex',
      justifyContent: 'space-between'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '15px'
    },
    metric: {
      backgroundColor: '#2a2a2a',
      padding: '10px',
      borderRadius: '4px'
    },
    label: {
      fontSize: '0.8em',
      color: '#888',
      marginBottom: '5px'
    },
    value: {
      fontSize: '1.1em',
      fontWeight: 'bold'
    },
    statusBadge: {
      padding: '4px 8px',
      borderRadius: '4px',
      backgroundColor: getStatusColor(state.elevationConfig.optimizationLevel),
      color: '#000',
      fontWeight: 'bold',
      textTransform: 'uppercase' as const
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span>SAPE ELEVATION PROTOCOL</span>
        <span style={styles.statusBadge}>{state.elevationConfig.optimizationLevel}</span>
      </div>
      
      <div style={styles.grid}>
        <div style={styles.metric}>
          <div style={styles.label}>Dynamic Tuning</div>
          <div style={styles.value}>{state.elevationConfig.dynamicTuning ? 'ACTIVE' : 'INACTIVE'}</div>
        </div>
        <div style={styles.metric}>
          <div style={styles.label}>Circuit Breaker</div>
          <div style={styles.value}>{state.circuitBreaker.state}</div>
        </div>
        <div style={styles.metric}>
          <div style={styles.label}>Threshold</div>
          <div style={styles.value}>{state.circuitBreaker.threshold}</div>
        </div>
        <div style={styles.metric}>
          <div style={styles.label}>Last Elevation</div>
          <div style={styles.value}>{new Date(state.elevationConfig.lastElevation).toLocaleTimeString()}</div>
        </div>
      </div>
    </div>
  );
};

export default SapeVisualizer;
