"""
Advanced Blockchain Analytics Module

Provides comprehensive analytics capabilities for blockchain data including:
- Address clustering and classification
- Network analysis and community detection
- Statistical analysis and pattern detection
- Time-series forecasting
- Anomaly detection
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Optional, Any
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor
import networkx as nx
from sklearn.cluster import DBSCAN, KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from scipy import stats
from scipy.signal import find_peaks
import warnings
warnings.filterwarnings('ignore')


class BlockchainAnalytics:
    """Main analytics class for blockchain data analysis"""

    def __init__(self, config_file: str = 'config.json'):
        """Initialize analytics with database configuration"""
        self.config = self._load_config(config_file)
        self.conn = self._connect_db()
        self.scaler = StandardScaler()

    def _load_config(self, config_file: str) -> Dict:
        """Load configuration from file"""
        import json
        try:
            with open(config_file, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            # Default configuration
            return {
                'database': {
                    'host': 'localhost',
                    'port': 5432,
                    'database': 'blockchain_indexer',
                    'user': 'indexer',
                    'password': 'password'
                }
            }

    def _connect_db(self) -> psycopg2.extensions.connection:
        """Establish database connection"""
        db_config = self.config.get('database', {})
        return psycopg2.connect(
            host=db_config.get('host', 'localhost'),
            port=db_config.get('port', 5432),
            database=db_config.get('database', 'blockchain_indexer'),
            user=db_config.get('user', 'indexer'),
            password=db_config.get('password'),
            cursor_factory=RealDictCursor
        )

    def cluster_addresses(
        self,
        min_cluster_size: int = 10,
        similarity_threshold: float = 0.8,
        features: Optional[List[str]] = None
    ) -> pd.DataFrame:
        """
        Cluster addresses based on transaction patterns

        Args:
            min_cluster_size: Minimum addresses per cluster
            similarity_threshold: Similarity threshold for clustering
            features: Features to use for clustering

        Returns:
            DataFrame with address clusters and metadata
        """
        if features is None:
            features = [
                'transaction_count',
                'total_sent',
                'total_received',
                'avg_transaction_value',
                'unique_counterparties',
                'time_spread_hours'
            ]

        # Fetch address features
        query = """
            SELECT
                a.address,
                a.transaction_count,
                COALESCE(a.total_sent, 0) as total_sent,
                COALESCE(a.total_received, 0) as total_received,
                CASE
                    WHEN a.transaction_count > 0
                    THEN (COALESCE(a.total_sent, 0) + COALESCE(a.total_received, 0)) / a.transaction_count
                    ELSE 0
                END as avg_transaction_value,
                COUNT(DISTINCT
                    CASE WHEN t.from_address = a.address THEN t.to_address
                         ELSE t.from_address
                    END
                ) as unique_counterparties,
                EXTRACT(EPOCH FROM (MAX(b.timestamp) - MIN(b.timestamp))) / 3600 as time_spread_hours
            FROM addresses a
            LEFT JOIN transactions t ON (t.from_address = a.address OR t.to_address = a.address)
            LEFT JOIN blocks b ON t.block_number = b.number
            WHERE a.transaction_count >= 5
            GROUP BY a.address, a.transaction_count, a.total_sent, a.total_received
            LIMIT 100000
        """

        df = pd.read_sql(query, self.conn)

        # Prepare features matrix
        X = df[features].fillna(0).values

        # Normalize features
        X_scaled = self.scaler.fit_transform(X)

        # Apply DBSCAN clustering
        eps = 1 - similarity_threshold
        clustering = DBSCAN(eps=eps, min_samples=min_cluster_size).fit(X_scaled)

        df['cluster_id'] = clustering.labels_

        # Calculate cluster statistics
        cluster_stats = df.groupby('cluster_id').agg({
            'address': 'count',
            'transaction_count': ['mean', 'median', 'std'],
            'total_sent': ['mean', 'sum'],
            'total_received': ['mean', 'sum']
        }).round(2)

        # Add cluster characteristics
        df['cluster_size'] = df.groupby('cluster_id')['address'].transform('count')
        df['is_outlier'] = df['cluster_id'] == -1

        return df

    def detect_wash_trading(
        self,
        token_address: str,
        time_window: str = '7d',
        min_confidence: float = 0.85
    ) -> pd.DataFrame:
        """
        Detect potential wash trading activity

        Args:
            token_address: Token contract address
            time_window: Time window for analysis
            min_confidence: Minimum confidence threshold

        Returns:
            DataFrame with suspected wash trading patterns
        """
        # Convert time window to timedelta
        window_map = {
            '1h': timedelta(hours=1),
            '24h': timedelta(hours=24),
            '7d': timedelta(days=7),
            '30d': timedelta(days=30)
        }
        td = window_map.get(time_window, timedelta(days=7))
        cutoff_time = datetime.now() - td

        # Fetch token transfers
        query = """
            SELECT
                tt.from_address,
                tt.to_address,
                tt.value,
                tt.transaction_hash,
                tt.block_number,
                b.timestamp
            FROM token_transfers tt
            JOIN blocks b ON tt.block_number = b.number
            WHERE tt.token_address = %s
            AND b.timestamp >= %s
            AND tt.from_address != tt.to_address
        """

        df = pd.read_sql(query, self.conn, params=(token_address.lower(), cutoff_time))

        if df.empty:
            return pd.DataFrame()

        wash_trades = []

        # Group by address pairs
        for (addr1, addr2), group in df.groupby(['from_address', 'to_address']):
            reverse_transfers = df[
                (df['from_address'] == addr2) &
                (df['to_address'] == addr1)
            ]

            if len(reverse_transfers) > 0:
                # Calculate suspicion score
                forward_count = len(group)
                reverse_count = len(reverse_transfers)

                # Check for round-trip transactions
                forward_values = group['value'].astype(float)
                reverse_values = reverse_transfers['value'].astype(float)

                # Similar transaction values
                value_similarity = 0
                if forward_values.std() > 0 and reverse_values.std() > 0:
                    value_similarity = 1 - min(
                        abs(forward_values.mean() - reverse_values.mean()) /
                        max(forward_values.mean(), reverse_values.mean()),
                        1.0
                    )

                # Temporal proximity
                time_diff = []
                for _, fwd in group.iterrows():
                    for _, rev in reverse_transfers.iterrows():
                        diff = abs((fwd['timestamp'] - rev['timestamp']).total_seconds())
                        if diff < 3600:  # Within 1 hour
                            time_diff.append(diff)

                temporal_score = len(time_diff) / max(forward_count, reverse_count)

                # Balance check (similar amounts traded back and forth)
                total_forward = forward_values.sum()
                total_reverse = reverse_values.sum()
                balance_ratio = min(total_forward, total_reverse) / max(total_forward, total_reverse)

                # Calculate confidence
                confidence = (
                    0.3 * value_similarity +
                    0.3 * temporal_score +
                    0.4 * balance_ratio
                )

                if confidence >= min_confidence:
                    wash_trades.append({
                        'address_1': addr1,
                        'address_2': addr2,
                        'forward_count': forward_count,
                        'reverse_count': reverse_count,
                        'total_value_forward': float(total_forward),
                        'total_value_reverse': float(total_reverse),
                        'confidence': confidence,
                        'value_similarity': value_similarity,
                        'temporal_proximity': temporal_score,
                        'balance_ratio': balance_ratio
                    })

        return pd.DataFrame(wash_trades).sort_values('confidence', ascending=False)

    def find_influential_addresses(
        self,
        algorithm: str = 'pagerank',
        top_n: int = 100,
        min_transactions: int = 10
    ) -> pd.DataFrame:
        """
        Find most influential addresses using network analysis

        Args:
            algorithm: 'pagerank', 'betweenness', 'closeness', or 'eigenvector'
            top_n: Number of top addresses to return
            min_transactions: Minimum transaction count filter

        Returns:
            DataFrame with influential addresses and scores
        """
        # Build transaction graph
        query = """
            SELECT
                t.from_address as source,
                t.to_address as target,
                COUNT(*) as weight,
                SUM(CAST(t.value AS NUMERIC)) as total_value
            FROM transactions t
            WHERE t.to_address IS NOT NULL
            GROUP BY t.from_address, t.to_address
            HAVING COUNT(*) >= %s
            LIMIT 1000000
        """

        df = pd.read_sql(query, self.conn, params=(min_transactions,))

        # Create NetworkX graph
        G = nx.DiGraph()

        for _, row in df.iterrows():
            G.add_edge(
                row['source'],
                row['target'],
                weight=row['weight'],
                value=float(row['total_value'])
            )

        # Calculate centrality based on algorithm
        if algorithm == 'pagerank':
            scores = nx.pagerank(G, weight='weight')
        elif algorithm == 'betweenness':
            scores = nx.betweenness_centrality(G, weight='weight')
        elif algorithm == 'closeness':
            scores = nx.closeness_centrality(G, distance='weight')
        elif algorithm == 'eigenvector':
            scores = nx.eigenvector_centrality(G, weight='weight', max_iter=100)
        else:
            raise ValueError(f"Unknown algorithm: {algorithm}")

        # Convert to DataFrame
        result = pd.DataFrame([
            {'address': addr, 'score': score}
            for addr, score in scores.items()
        ]).sort_values('score', ascending=False).head(top_n)

        # Enrich with additional data
        addresses = result['address'].tolist()
        enrichment_query = """
            SELECT
                address,
                transaction_count,
                total_sent,
                total_received,
                is_contract,
                labels
            FROM addresses
            WHERE address = ANY(%s)
        """

        enrichment = pd.read_sql(enrichment_query, self.conn, params=(addresses,))
        result = result.merge(enrichment, on='address', how='left')

        return result

    def predict_gas_prices(
        self,
        horizon: str = '1h',
        confidence_interval: float = 0.95
    ) -> Dict[str, Any]:
        """
        Predict future gas prices using time-series analysis

        Args:
            horizon: Prediction horizon ('15m', '1h', '6h', '24h')
            confidence_interval: Confidence interval for predictions

        Returns:
            Dictionary with predictions and confidence bounds
        """
        from statsmodels.tsa.holtwinters import ExponentialSmoothing
        from statsmodels.tsa.arima.model import ARIMA

        # Fetch historical gas prices
        query = """
            SELECT
                timestamp,
                CAST(standard AS NUMERIC) as gas_price
            FROM gas_price_stats
            WHERE timestamp >= NOW() - INTERVAL '7 days'
            ORDER BY timestamp
        """

        df = pd.read_sql(query, self.conn)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.set_index('timestamp')

        # Resample to hourly
        df_hourly = df.resample('H').mean().fillna(method='ffill')

        # Determine forecast steps
        horizon_map = {
            '15m': 0.25,
            '30m': 0.5,
            '1h': 1,
            '6h': 6,
            '24h': 24
        }
        hours = horizon_map.get(horizon, 1)

        # Fit exponential smoothing model
        model = ExponentialSmoothing(
            df_hourly['gas_price'],
            seasonal_periods=24,
            trend='add',
            seasonal='add'
        ).fit()

        # Generate forecast
        forecast = model.forecast(steps=int(hours))

        # Calculate prediction intervals using residuals
        residuals = df_hourly['gas_price'] - model.fittedvalues
        std_residuals = residuals.std()

        z_score = stats.norm.ppf((1 + confidence_interval) / 2)
        margin = z_score * std_residuals

        return {
            'predictions': forecast.tolist(),
            'lower_bound': (forecast - margin).tolist(),
            'upper_bound': (forecast + margin).tolist(),
            'confidence_interval': confidence_interval,
            'horizon': horizon,
            'model': 'exponential_smoothing'
        }

    def analyze_transaction_patterns(
        self,
        address: str,
        lookback_days: int = 30
    ) -> Dict[str, Any]:
        """
        Analyze transaction patterns for an address

        Args:
            address: Address to analyze
            lookback_days: Number of days to analyze

        Returns:
            Dictionary with pattern analysis results
        """
        cutoff = datetime.now() - timedelta(days=lookback_days)

        query = """
            SELECT
                t.transaction_hash,
                t.from_address,
                t.to_address,
                CAST(t.value AS NUMERIC) as value,
                CAST(t.gas_price AS NUMERIC) as gas_price,
                b.timestamp,
                EXTRACT(HOUR FROM b.timestamp) as hour_of_day,
                EXTRACT(DOW FROM b.timestamp) as day_of_week
            FROM transactions t
            JOIN blocks b ON t.block_number = b.number
            WHERE (t.from_address = %s OR t.to_address = %s)
            AND b.timestamp >= %s
            ORDER BY b.timestamp
        """

        df = pd.read_sql(query, self.conn, params=(address.lower(), address.lower(), cutoff))

        if df.empty:
            return {'error': 'No transactions found'}

        # Calculate various patterns
        df['is_sender'] = df['from_address'] == address.lower()

        # Temporal patterns
        hourly_dist = df.groupby('hour_of_day').size()
        daily_dist = df.groupby('day_of_week').size()

        # Value patterns
        value_stats = df['value'].describe()

        # Detect peaks in transaction frequency
        hourly_counts = df.set_index('timestamp').resample('H').size()
        peaks, properties = find_peaks(hourly_counts.values, height=hourly_counts.mean())

        # Regularity analysis
        time_diffs = df['timestamp'].diff().dt.total_seconds()
        regularity_score = 1 / (1 + time_diffs.std() / time_diffs.mean()) if time_diffs.mean() > 0 else 0

        return {
            'total_transactions': len(df),
            'as_sender': df['is_sender'].sum(),
            'as_receiver': (~df['is_sender']).sum(),
            'value_statistics': {
                'mean': float(value_stats['mean']),
                'median': float(value_stats['50%']),
                'std': float(value_stats['std']),
                'min': float(value_stats['min']),
                'max': float(value_stats['max'])
            },
            'temporal_patterns': {
                'most_active_hour': int(hourly_dist.idxmax()),
                'most_active_day': int(daily_dist.idxmax()),
                'hourly_distribution': hourly_dist.to_dict(),
                'daily_distribution': daily_dist.to_dict()
            },
            'activity_peaks': len(peaks),
            'regularity_score': float(regularity_score),
            'unique_counterparties': df['to_address'].nunique() + df['from_address'].nunique() - 1
        }

    def detect_anomalies(
        self,
        metric: str = 'transaction_volume',
        time_window: str = '24h',
        sensitivity: float = 2.5
    ) -> pd.DataFrame:
        """
        Detect anomalies in blockchain metrics

        Args:
            metric: Metric to analyze
            time_window: Aggregation window
            sensitivity: Anomaly sensitivity (standard deviations)

        Returns:
            DataFrame with detected anomalies
        """
        # Map metric to query
        metric_queries = {
            'transaction_volume': """
                SELECT
                    time_bucket('1 hour', timestamp) as time,
                    COUNT(*) as value
                FROM block_metrics
                WHERE timestamp >= NOW() - INTERVAL '30 days'
                GROUP BY time
                ORDER BY time
            """,
            'gas_price': """
                SELECT
                    timestamp as time,
                    CAST(standard AS NUMERIC) as value
                FROM gas_price_stats
                WHERE timestamp >= NOW() - INTERVAL '30 days'
                ORDER BY time
            """,
            'active_addresses': """
                SELECT
                    timestamp as time,
                    active_addresses as value
                FROM network_stats
                WHERE timestamp >= NOW() - INTERVAL '30 days'
                ORDER BY time
            """
        }

        query = metric_queries.get(metric)
        if not query:
            raise ValueError(f"Unknown metric: {metric}")

        df = pd.read_sql(query, self.conn)
        df['time'] = pd.to_datetime(df['time'])

        # Use Isolation Forest for anomaly detection
        X = df[['value']].values

        clf = IsolationForest(contamination=0.05, random_state=42)
        df['anomaly'] = clf.fit_predict(X)
        df['anomaly_score'] = clf.score_samples(X)

        # Also use statistical method
        mean = df['value'].mean()
        std = df['value'].std()
        df['z_score'] = (df['value'] - mean) / std
        df['is_statistical_anomaly'] = abs(df['z_score']) > sensitivity

        # Combine both methods
        df['is_anomaly'] = (df['anomaly'] == -1) | df['is_statistical_anomaly']

        anomalies = df[df['is_anomaly']].copy()
        anomalies['deviation'] = ((anomalies['value'] - mean) / mean * 100).round(2)

        return anomalies[['time', 'value', 'z_score', 'anomaly_score', 'deviation']]

    def calculate_network_metrics(self) -> Dict[str, float]:
        """
        Calculate overall network health metrics

        Returns:
            Dictionary with network metrics
        """
        queries = {
            'total_addresses': "SELECT COUNT(DISTINCT address) FROM addresses",
            'total_transactions': "SELECT COUNT(*) FROM transactions",
            'total_contracts': "SELECT COUNT(*) FROM addresses WHERE is_contract = true",
            'avg_block_time': """
                SELECT AVG(timestamp - LAG(timestamp) OVER (ORDER BY number))
                FROM blocks
                WHERE number >= (SELECT MAX(number) - 1000 FROM blocks)
            """,
            'avg_gas_price': """
                SELECT AVG(CAST(standard AS NUMERIC))
                FROM gas_price_stats
                WHERE timestamp >= NOW() - INTERVAL '1 hour'
            """,
            'current_tps': """
                SELECT AVG(transaction_count::float /
                    EXTRACT(EPOCH FROM (timestamp - LAG(timestamp) OVER (ORDER BY number))))
                FROM blocks
                WHERE number >= (SELECT MAX(number) - 100 FROM blocks)
            """
        }

        metrics = {}
        cursor = self.conn.cursor()

        for metric_name, query in queries.items():
            cursor.execute(query)
            result = cursor.fetchone()
            value = result[0] if result and result[0] is not None else 0

            if isinstance(value, timedelta):
                value = value.total_seconds()

            metrics[metric_name] = float(value)

        cursor.close()
        return metrics

    def generate_report(
        self,
        report_type: str = 'daily',
        output_format: str = 'dict'
    ) -> Any:
        """
        Generate comprehensive analytics report

        Args:
            report_type: 'hourly', 'daily', or 'weekly'
            output_format: 'dict', 'json', or 'html'

        Returns:
            Report in specified format
        """
        report = {
            'generated_at': datetime.now().isoformat(),
            'report_type': report_type,
            'network_metrics': self.calculate_network_metrics(),
            'top_addresses': self.find_influential_addresses(top_n=20).to_dict('records'),
        }

        # Add anomalies
        try:
            anomalies = self.detect_anomalies()
            report['recent_anomalies'] = len(anomalies)
        except Exception as e:
            report['recent_anomalies'] = f"Error: {str(e)}"

        if output_format == 'json':
            import json
            return json.dumps(report, indent=2, default=str)
        elif output_format == 'html':
            return self._generate_html_report(report)
        else:
            return report

    def _generate_html_report(self, report: Dict) -> str:
        """Generate HTML report"""
        html = f"""
        <html>
        <head><title>Blockchain Analytics Report</title></head>
        <body>
            <h1>Blockchain Analytics Report</h1>
            <p>Generated: {report['generated_at']}</p>

            <h2>Network Metrics</h2>
            <table border="1">
        """

        for key, value in report['network_metrics'].items():
            html += f"<tr><td>{key}</td><td>{value:.2f}</td></tr>"

        html += """
            </table>

            <h2>Top Influential Addresses</h2>
            <table border="1">
                <tr><th>Address</th><th>Score</th><th>Transactions</th></tr>
        """

        for addr in report['top_addresses'][:10]:
            html += f"""
                <tr>
                    <td>{addr.get('address', 'N/A')}</td>
                    <td>{addr.get('score', 0):.6f}</td>
                    <td>{addr.get('transaction_count', 0)}</td>
                </tr>
            """

        html += """
            </table>
        </body>
        </html>
        """

        return html

    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()


if __name__ == "__main__":
    # Example usage
    analytics = BlockchainAnalytics()

    print("Calculating network metrics...")
    metrics = analytics.calculate_network_metrics()
    print(f"Network Metrics: {metrics}")

    print("\nFinding influential addresses...")
    influential = analytics.find_influential_addresses(top_n=10)
    print(influential)

    analytics.close()
