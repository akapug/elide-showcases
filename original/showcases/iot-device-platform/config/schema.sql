-- IoT Device Management Platform - PostgreSQL Schema
--
-- Database schema for device metadata, rules, and alerts

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Devices table
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'inactive', 'maintenance')),
    metadata JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    location JSONB,
    firmware JSONB,
    credentials JSONB NOT NULL,
    statistics JSONB DEFAULT '{"messagesReceived": 0, "messagesSent": 0, "lastSeen": null, "uptime": 0}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for devices
CREATE INDEX IF NOT EXISTS idx_devices_type ON devices(type);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_tags ON devices USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_devices_created_at ON devices(created_at);
CREATE INDEX IF NOT EXISTS idx_devices_metadata ON devices USING GIN(metadata);

-- Device groups
CREATE TABLE IF NOT EXISTS device_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    device_filter JSONB DEFAULT '{}',
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_groups_name ON device_groups(name);

-- Rules table
CREATE TABLE IF NOT EXISTS rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    condition TEXT NOT NULL,
    device_filter JSONB DEFAULT '{}',
    actions JSONB NOT NULL,
    enabled BOOLEAN DEFAULT true,
    cooldown INTEGER DEFAULT 300,
    severity VARCHAR(50) DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rules_enabled ON rules(enabled);
CREATE INDEX IF NOT EXISTS idx_rules_severity ON rules(severity);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES rules(id) ON DELETE CASCADE,
    rule_name VARCHAR(255) NOT NULL,
    device_id VARCHAR(255) NOT NULL,
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    message TEXT NOT NULL,
    context JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
    created_at TIMESTAMP DEFAULT NOW(),
    acknowledged_at TIMESTAMP,
    resolved_at TIMESTAMP,
    acknowledged_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_alerts_rule_id ON alerts(rule_id);
CREATE INDEX IF NOT EXISTS idx_alerts_device_id ON alerts(device_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);

-- Anomalies table
CREATE TABLE IF NOT EXISTS anomalies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    score FLOAT NOT NULL,
    metrics TEXT,
    detected_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anomalies_device_id ON anomalies(device_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_timestamp ON anomalies(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_anomalies_score ON anomalies(score DESC);

-- Batch operations table
CREATE TABLE IF NOT EXISTS batch_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation VARCHAR(100) NOT NULL,
    filter JSONB NOT NULL,
    params JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    progress JSONB DEFAULT '{"total": 0, "completed": 0, "failed": 0}',
    results JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_batch_operations_status ON batch_operations(status);
CREATE INDEX IF NOT EXISTS idx_batch_operations_created_at ON batch_operations(created_at DESC);

-- Firmware versions table
CREATE TABLE IF NOT EXISTS firmware_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version VARCHAR(50) UNIQUE NOT NULL,
    device_type VARCHAR(100) NOT NULL,
    file_url TEXT NOT NULL,
    checksum VARCHAR(64) NOT NULL,
    size_bytes BIGINT NOT NULL,
    release_notes TEXT,
    is_stable BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_firmware_device_type ON firmware_versions(device_type);
CREATE INDEX IF NOT EXISTS idx_firmware_version ON firmware_versions(version);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL,
    actor VARCHAR(255),
    changes JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_log(created_at DESC);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_device_groups_updated_at BEFORE UPDATE ON device_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rules_updated_at BEFORE UPDATE ON rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing
INSERT INTO rules (name, description, condition, actions, severity) VALUES
    ('High Temperature Alert', 'Alert when temperature exceeds 30C', 'return metrics.temperature > 30',
     '[{"type": "log", "config": {}}]', 'warning'),
    ('Critical Temperature', 'Critical alert for extreme temperature', 'return metrics.temperature > 50',
     '[{"type": "webhook", "config": {"url": "https://alerts.example.com"}}]', 'critical'),
    ('Low Battery', 'Alert when battery is below 20%', 'return metrics.battery < 20',
     '[{"type": "email", "config": {"to": "admin@example.com"}}]', 'warning')
ON CONFLICT (name) DO NOTHING;

-- Views for common queries
CREATE OR REPLACE VIEW active_devices AS
SELECT device_id, type, status, statistics->>'lastSeen' as last_seen
FROM devices
WHERE status = 'online'
ORDER BY device_id;

CREATE OR REPLACE VIEW critical_alerts AS
SELECT a.id, a.device_id, a.rule_name, a.message, a.created_at
FROM alerts a
WHERE a.severity = 'critical' AND a.status = 'active'
ORDER BY a.created_at DESC;

CREATE OR REPLACE VIEW device_health AS
SELECT
    device_id,
    type,
    status,
    (statistics->>'messagesReceived')::int as messages_received,
    (statistics->>'lastSeen')::timestamp as last_seen,
    CASE
        WHEN (statistics->>'lastSeen')::timestamp < NOW() - INTERVAL '5 minutes' THEN 'unhealthy'
        WHEN (statistics->>'lastSeen')::timestamp < NOW() - INTERVAL '1 minute' THEN 'warning'
        ELSE 'healthy'
    END as health_status
FROM devices
WHERE status = 'online';

-- Functions for analytics
CREATE OR REPLACE FUNCTION get_device_stats()
RETURNS TABLE (
    total_devices BIGINT,
    online_devices BIGINT,
    offline_devices BIGINT,
    device_types_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_devices,
        COUNT(*) FILTER (WHERE status = 'online') as online_devices,
        COUNT(*) FILTER (WHERE status = 'offline') as offline_devices,
        COUNT(DISTINCT type) as device_types_count
    FROM devices;
END;
$$ LANGUAGE plpgsql;

COMMENT ON DATABASE iot_platform IS 'IoT Device Management Platform';
