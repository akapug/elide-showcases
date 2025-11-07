/**
 * Dashboard Component
 * Main dashboard displaying statistics and quick actions
 */

import React, { useState, useEffect } from 'react';
import { api } from '../api';

interface DashboardStats {
  totalUsers: number;
  serverStatus: string;
  lastUpdated: string;
}

interface DashboardProps {
  userCount: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ userCount }) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: userCount,
    serverStatus: 'Unknown',
    lastUpdated: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(false);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const health = await api.healthCheck();
      setStats((prev) => ({
        ...prev,
        serverStatus: health.status,
        lastUpdated: health.timestamp,
      }));
    } catch (error) {
      setStats((prev) => ({
        ...prev,
        serverStatus: 'Error',
        lastUpdated: new Date().toISOString(),
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setStats((prev) => ({ ...prev, totalUsers: userCount }));
  }, [userCount]);

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'ok':
        return '#4caf50';
      case 'error':
        return '#f44336';
      default:
        return '#ff9800';
    }
  };

  return (
    <div style={styles.dashboard}>
      <h2 style={styles.title}>Dashboard</h2>
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>👥</div>
          <div style={styles.statContent}>
            <div style={styles.statValue}>{stats.totalUsers}</div>
            <div style={styles.statLabel}>Total Users</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>🖥️</div>
          <div style={styles.statContent}>
            <div
              style={{
                ...styles.statValue,
                color: getStatusColor(stats.serverStatus),
              }}
            >
              {stats.serverStatus}
            </div>
            <div style={styles.statLabel}>Server Status</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>🕐</div>
          <div style={styles.statContent}>
            <div style={styles.statValue}>
              {new Date(stats.lastUpdated).toLocaleTimeString()}
            </div>
            <div style={styles.statLabel}>Last Updated</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>⚡</div>
          <div style={styles.statContent}>
            <div style={styles.statValue}>Elide</div>
            <div style={styles.statLabel}>Powered By</div>
          </div>
        </div>
      </div>

      <div style={styles.infoSection}>
        <h3 style={styles.infoTitle}>About This Template</h3>
        <p style={styles.infoText}>
          This is a full-stack application demonstrating modern web development on
          Elide. It features:
        </p>
        <ul style={styles.featureList}>
          <li>React + TypeScript frontend with Vite</li>
          <li>RESTful API backend with TypeScript</li>
          <li>CRUD operations for user management</li>
          <li>JWT authentication (ready to implement)</li>
          <li>Form validation with real-time feedback</li>
          <li>Responsive UI with modern design</li>
        </ul>
        <button
          onClick={checkHealth}
          disabled={loading}
          style={{
            ...styles.refreshButton,
            ...(loading ? styles.buttonDisabled : {}),
          }}
        >
          {loading ? 'Checking...' : 'Refresh Health Check'}
        </button>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  dashboard: {
    width: '100%',
  },
  title: {
    color: 'white',
    fontSize: '28px',
    fontWeight: '600',
    marginBottom: '24px',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  statIcon: {
    fontSize: '32px',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '13px',
    color: '#666',
  },
  infoSection: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  infoTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '12px',
  },
  infoText: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '12px',
    lineHeight: '1.6',
  },
  featureList: {
    marginLeft: '20px',
    marginBottom: '16px',
    color: '#555',
    fontSize: '14px',
    lineHeight: '1.8',
  },
  refreshButton: {
    padding: '10px 20px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
};
