#!/usr/bin/env python3
"""
Log Parser - Python Component

Advanced log parsing and anomaly detection using Python.
Receives logs from the TypeScript collector and performs:
- Pattern recognition
- Anomaly detection
- Statistical analysis
- Machine learning-based classification
"""

import sys
import json
import re
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple, Optional
from collections import defaultdict, Counter
import math


# ============================================================================
# Data Classes
# ============================================================================

class LogEntry:
    """Represents a parsed log entry"""

    def __init__(self, data: Dict[str, Any]):
        self.timestamp = datetime.fromisoformat(
            data['timestamp'].replace('Z', '+00:00')
        )
        self.level = data['level']
        self.source = data['source']
        self.message = data['message']
        self.metadata = data.get('metadata', {})
        self.raw_message = data.get('rawMessage', '')

    def to_dict(self) -> Dict[str, Any]:
        return {
            'timestamp': self.timestamp.isoformat(),
            'level': self.level,
            'source': self.source,
            'message': self.message,
            'metadata': self.metadata,
            'rawMessage': self.raw_message,
        }


class AnomalyScore:
    """Anomaly detection result"""

    def __init__(self, score: float, reasons: List[str], severity: str):
        self.score = score  # 0.0 to 1.0
        self.reasons = reasons
        self.severity = severity  # low, medium, high, critical

    def to_dict(self) -> Dict[str, Any]:
        return {
            'score': self.score,
            'reasons': self.reasons,
            'severity': self.severity,
        }


# ============================================================================
# Pattern Extractor
# ============================================================================

class PatternExtractor:
    """Extract common patterns from log messages"""

    def __init__(self):
        self.patterns = {
            'ip_address': r'\b(?:\d{1,3}\.){3}\d{1,3}\b',
            'email': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            'url': r'https?://[^\s]+',
            'uuid': r'\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b',
            'timestamp': r'\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}',
            'error_code': r'\b[A-Z]+_\d{3,4}\b',
            'http_status': r'\b[1-5]\d{2}\b',
            'duration': r'\b\d+(?:\.\d+)?(?:ms|s|m|h)\b',
            'memory': r'\b\d+(?:\.\d+)?(?:B|KB|MB|GB)\b',
            'percentage': r'\b\d+(?:\.\d+)?%\b',
        }

        self.compiled_patterns = {
            name: re.compile(pattern, re.IGNORECASE)
            for name, pattern in self.patterns.items()
        }

    def extract(self, message: str) -> Dict[str, List[str]]:
        """Extract all patterns from a message"""
        results = {}

        for name, pattern in self.compiled_patterns.items():
            matches = pattern.findall(message)
            if matches:
                results[name] = matches

        return results

    def extract_template(self, message: str) -> str:
        """
        Extract a template from a message by replacing variable parts
        with placeholders
        """
        template = message

        # Replace patterns with placeholders
        for name, pattern in self.compiled_patterns.items():
            template = pattern.sub(f'<{name}>', template)

        # Replace numbers
        template = re.sub(r'\b\d+\b', '<number>', template)

        return template


# ============================================================================
# Anomaly Detector
# ============================================================================

class AnomalyDetector:
    """Detect anomalies in log data"""

    def __init__(self):
        self.baseline_stats = defaultdict(lambda: {
            'count': 0,
            'error_rate': 0.0,
            'avg_interval': 0.0,
            'message_templates': Counter(),
        })
        self.window_size = timedelta(minutes=5)
        self.history: List[LogEntry] = []

    def update_baseline(self, entries: List[LogEntry]) -> None:
        """Update baseline statistics from historical data"""
        for entry in entries:
            source = entry.source
            stats = self.baseline_stats[source]

            stats['count'] += 1

            if entry.level in ['ERROR', 'FATAL']:
                stats['error_rate'] = (
                    stats['error_rate'] * (stats['count'] - 1) + 1
                ) / stats['count']

            # Track message templates
            template = self._extract_template(entry.message)
            stats['message_templates'][template] += 1

        # Store history for time-series analysis
        self.history.extend(entries)
        self._trim_history()

    def detect_anomalies(self, entry: LogEntry) -> AnomalyScore:
        """Detect if a log entry is anomalous"""
        reasons = []
        score = 0.0

        # Check 1: Error rate spike
        if entry.level in ['ERROR', 'FATAL']:
            source_stats = self.baseline_stats[entry.source]
            if source_stats['count'] > 0:
                expected_error_rate = source_stats['error_rate']
                if expected_error_rate < 0.1:  # Less than 10% normally
                    reasons.append(f'Error from low-error source (baseline: {expected_error_rate:.1%})')
                    score += 0.3

        # Check 2: New message template
        template = self._extract_template(entry.message)
        source_stats = self.baseline_stats[entry.source]
        if template not in source_stats['message_templates']:
            reasons.append('New message template')
            score += 0.2

        # Check 3: Rare message template
        elif source_stats['message_templates'][template] < 5:
            reasons.append('Rare message template')
            score += 0.1

        # Check 4: Keyword detection
        critical_keywords = [
            'crash', 'panic', 'fatal', 'deadlock', 'timeout',
            'out of memory', 'segmentation fault', 'stack overflow',
            'connection refused', 'unable to connect', 'failed to start',
        ]

        for keyword in critical_keywords:
            if keyword in entry.message.lower():
                reasons.append(f'Critical keyword: {keyword}')
                score += 0.4
                break

        # Check 5: Rapid succession
        recent_same_source = [
            e for e in self.history[-100:]
            if e.source == entry.source and
               (entry.timestamp - e.timestamp) < timedelta(seconds=1)
        ]

        if len(recent_same_source) > 10:
            reasons.append(f'Rapid log burst ({len(recent_same_source)} logs/sec)')
            score += 0.3

        # Check 6: Error cascades
        recent_errors = [
            e for e in self.history[-50:]
            if e.level in ['ERROR', 'FATAL'] and
               (entry.timestamp - e.timestamp) < timedelta(seconds=5)
        ]

        if len(recent_errors) > 5:
            reasons.append(f'Error cascade ({len(recent_errors)} errors in 5s)')
            score += 0.5

        # Normalize score
        score = min(score, 1.0)

        # Determine severity
        if score >= 0.8:
            severity = 'critical'
        elif score >= 0.5:
            severity = 'high'
        elif score >= 0.3:
            severity = 'medium'
        else:
            severity = 'low'

        return AnomalyScore(score, reasons, severity)

    def _extract_template(self, message: str) -> str:
        """Extract a message template"""
        # Simple template extraction: replace numbers and UUIDs
        template = re.sub(r'\b\d+\b', '<N>', message)
        template = re.sub(
            r'\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b',
            '<UUID>',
            template,
            flags=re.IGNORECASE
        )
        template = re.sub(r'\b(?:\d{1,3}\.){3}\d{1,3}\b', '<IP>', template)
        return template

    def _trim_history(self) -> None:
        """Keep only recent history"""
        if len(self.history) > 10000:
            self.history = self.history[-5000:]


# ============================================================================
# Statistical Analyzer
# ============================================================================

class StatisticalAnalyzer:
    """Perform statistical analysis on logs"""

    def __init__(self):
        pass

    def analyze_batch(self, entries: List[LogEntry]) -> Dict[str, Any]:
        """Analyze a batch of log entries"""
        if not entries:
            return {}

        # Basic counts
        total = len(entries)
        level_counts = Counter(e.level for e in entries)
        source_counts = Counter(e.source for e in entries)

        # Time analysis
        timestamps = [e.timestamp for e in entries]
        time_span = max(timestamps) - min(timestamps)
        rate = total / max(time_span.total_seconds(), 1)

        # Error analysis
        errors = [e for e in entries if e.level in ['ERROR', 'FATAL']]
        error_rate = len(errors) / total if total > 0 else 0

        # Message length statistics
        message_lengths = [len(e.message) for e in entries]
        avg_length = sum(message_lengths) / len(message_lengths)
        max_length = max(message_lengths)
        min_length = min(message_lengths)

        # Pattern extraction
        extractor = PatternExtractor()
        all_patterns = defaultdict(list)

        for entry in entries:
            patterns = extractor.extract(entry.message)
            for name, matches in patterns.items():
                all_patterns[name].extend(matches)

        return {
            'total_entries': total,
            'time_span_seconds': time_span.total_seconds(),
            'rate_per_second': round(rate, 2),
            'level_distribution': dict(level_counts),
            'source_distribution': dict(source_counts),
            'error_rate': round(error_rate, 4),
            'error_count': len(errors),
            'message_length': {
                'avg': round(avg_length, 2),
                'min': min_length,
                'max': max_length,
            },
            'patterns_found': {
                name: len(set(values))
                for name, values in all_patterns.items()
            },
        }

    def calculate_entropy(self, entries: List[LogEntry]) -> float:
        """Calculate Shannon entropy of log messages"""
        if not entries:
            return 0.0

        # Get message templates
        templates = [self._get_template(e.message) for e in entries]
        template_counts = Counter(templates)
        total = len(templates)

        # Calculate entropy
        entropy = 0.0
        for count in template_counts.values():
            probability = count / total
            entropy -= probability * math.log2(probability)

        return entropy

    def _get_template(self, message: str) -> str:
        """Simple template extraction"""
        return re.sub(r'\b\d+\b', '<N>', message)


# ============================================================================
# Log Analyzer
# ============================================================================

class LogAnalyzer:
    """Main log analysis coordinator"""

    def __init__(self):
        self.pattern_extractor = PatternExtractor()
        self.anomaly_detector = AnomalyDetector()
        self.statistical_analyzer = StatisticalAnalyzer()

    def analyze(self, entries: List[LogEntry]) -> Dict[str, Any]:
        """Perform comprehensive analysis on log entries"""
        print(f"[LogAnalyzer] Analyzing {len(entries)} log entries", file=sys.stderr)

        # Update baseline
        self.anomaly_detector.update_baseline(entries)

        # Detect anomalies
        anomalies = []
        for entry in entries:
            anomaly = self.anomaly_detector.detect_anomalies(entry)
            if anomaly.score > 0.3:  # Only report significant anomalies
                anomalies.append({
                    'entry': entry.to_dict(),
                    'anomaly': anomaly.to_dict(),
                })

        # Statistical analysis
        stats = self.statistical_analyzer.analyze_batch(entries)

        # Calculate entropy
        entropy = self.statistical_analyzer.calculate_entropy(entries)

        # Pattern analysis
        pattern_summary = self._analyze_patterns(entries)

        # Source analysis
        source_analysis = self._analyze_sources(entries)

        return {
            'summary': {
                'total_entries': len(entries),
                'anomalies_detected': len(anomalies),
                'entropy': round(entropy, 4),
                'health_score': self._calculate_health_score(entries, anomalies),
            },
            'statistics': stats,
            'anomalies': anomalies[:50],  # Limit output
            'patterns': pattern_summary,
            'sources': source_analysis,
        }

    def _analyze_patterns(self, entries: List[LogEntry]) -> Dict[str, Any]:
        """Analyze patterns across all entries"""
        all_patterns = defaultdict(Counter)

        for entry in entries:
            patterns = self.pattern_extractor.extract(entry.message)
            for name, matches in patterns.items():
                for match in matches:
                    all_patterns[name][match] += 1

        return {
            name: {
                'total': sum(counter.values()),
                'unique': len(counter),
                'top_5': counter.most_common(5),
            }
            for name, counter in all_patterns.items()
        }

    def _analyze_sources(self, entries: List[LogEntry]) -> Dict[str, Any]:
        """Analyze logs by source"""
        source_data = defaultdict(lambda: {
            'count': 0,
            'levels': Counter(),
            'error_count': 0,
        })

        for entry in entries:
            data = source_data[entry.source]
            data['count'] += 1
            data['levels'][entry.level] += 1
            if entry.level in ['ERROR', 'FATAL']:
                data['error_count'] += 1

        return {
            source: {
                'count': data['count'],
                'levels': dict(data['levels']),
                'error_count': data['error_count'],
                'error_rate': round(data['error_count'] / data['count'], 4)
                             if data['count'] > 0 else 0,
            }
            for source, data in source_data.items()
        }

    def _calculate_health_score(
        self, entries: List[LogEntry], anomalies: List[Dict[str, Any]]
    ) -> float:
        """Calculate overall health score (0-100)"""
        if not entries:
            return 100.0

        # Start with perfect score
        score = 100.0

        # Deduct for errors
        error_count = sum(1 for e in entries if e.level in ['ERROR', 'FATAL'])
        error_rate = error_count / len(entries)
        score -= error_rate * 30  # Up to 30 points for errors

        # Deduct for anomalies
        anomaly_rate = len(anomalies) / len(entries)
        score -= anomaly_rate * 40  # Up to 40 points for anomalies

        # Deduct for fatals
        fatal_count = sum(1 for e in entries if e.level == 'FATAL')
        score -= fatal_count * 5  # 5 points per fatal

        return max(0.0, round(score, 2))


# ============================================================================
# Main Entry Point
# ============================================================================

def main():
    """Main entry point for Python log parser"""
    try:
        # Read logs from stdin (sent by TypeScript collector)
        input_data = sys.stdin.read()

        if not input_data:
            print(json.dumps({'error': 'No input data'}))
            return

        # Parse JSON input
        raw_entries = json.loads(input_data)

        # Convert to LogEntry objects
        entries = [LogEntry(data) for data in raw_entries]

        # Analyze logs
        analyzer = LogAnalyzer()
        results = analyzer.analyze(entries)

        # Output results as JSON
        print(json.dumps(results, indent=2))

    except json.JSONDecodeError as e:
        print(json.dumps({'error': f'Invalid JSON: {str(e)}'}), file=sys.stderr)
        sys.exit(1)

    except Exception as e:
        print(json.dumps({'error': f'Analysis failed: {str(e)}'}), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
