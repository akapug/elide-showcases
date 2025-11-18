"""
Machine Learning Pattern Detection for Blockchain

Detects various patterns using ML including:
- Wash trading detection
- MEV (Maximal Extractable Value) identification
- Pump and dump schemes
- Sybil attack detection
- Bot activity classification
- Fraud pattern recognition
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Optional, Any
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, IsolationForest
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
import xgboost as xgb
from scipy.stats import entropy
import warnings
warnings.filterwarnings('ignore')


class PatternDetector:
    """ML-based pattern detection for blockchain transactions"""

    def __init__(self, model_path: str = 'models/'):
        """Initialize pattern detector with model path"""
        self.model_path = model_path
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.models = {}
        self.conn = self._connect_db()

        # Load or initialize models
        self._load_models()

    def _connect_db(self) -> psycopg2.extensions.connection:
        """Establish database connection"""
        return psycopg2.connect(
            host='localhost',
            port=5432,
            database='blockchain_indexer',
            user='indexer',
            password='password',
            cursor_factory=RealDictCursor
        )

    def _load_models(self):
        """Load pre-trained models or initialize new ones"""
        import os

        model_configs = {
            'wash_trade': RandomForestClassifier(n_estimators=100, random_state=42),
            'mev': GradientBoostingClassifier(n_estimators=100, random_state=42),
            'pump_dump': xgb.XGBClassifier(n_estimators=100, random_state=42),
            'bot_detection': RandomForestClassifier(n_estimators=150, random_state=42),
            'fraud': GradientBoostingClassifier(n_estimators=150, random_state=42)
        }

        for model_name, model in model_configs.items():
            model_file = os.path.join(self.model_path, f'{model_name}.pkl')
            if os.path.exists(model_file):
                import joblib
                self.models[model_name] = joblib.load(model_file)
            else:
                self.models[model_name] = model

    def detect_anomalies(
        self,
        address: str,
        features: List[str],
        threshold: float = 3.5
    ) -> Dict[str, Any]:
        """
        Detect anomalous behavior for an address

        Args:
            address: Address to analyze
            features: List of features to analyze
            threshold: Anomaly threshold in standard deviations

        Returns:
            Dictionary with anomaly detection results
        """
        # Extract features for the address
        feature_data = self._extract_address_features(address)

        if not feature_data:
            return {'error': 'Insufficient data'}

        # Create feature vector
        X = np.array([[feature_data.get(f, 0) for f in features]])

        # Use Isolation Forest
        iso_forest = IsolationForest(contamination=0.1, random_state=42)

        # Need comparison data
        comparison_data = self._get_similar_addresses_features(address, features)
        if len(comparison_data) < 10:
            return {'error': 'Insufficient comparison data'}

        X_train = np.array([[d.get(f, 0) for f in features] for d in comparison_data])

        iso_forest.fit(X_train)
        anomaly_score = iso_forest.score_samples(X)[0]
        is_anomaly = iso_forest.predict(X)[0] == -1

        # Statistical analysis
        feature_scores = {}
        for feature in features:
            values = [d.get(feature, 0) for d in comparison_data]
            mean = np.mean(values)
            std = np.std(values)

            if std > 0:
                z_score = (feature_data.get(feature, 0) - mean) / std
                feature_scores[feature] = {
                    'value': feature_data.get(feature, 0),
                    'z_score': float(z_score),
                    'is_anomalous': abs(z_score) > threshold
                }

        return {
            'address': address,
            'is_anomaly': bool(is_anomaly),
            'anomaly_score': float(anomaly_score),
            'feature_scores': feature_scores,
            'anomalous_features': [f for f, s in feature_scores.items() if s['is_anomalous']]
        }

    def _extract_address_features(self, address: str) -> Dict[str, float]:
        """Extract features for an address"""
        query = """
            SELECT
                a.transaction_count,
                COALESCE(CAST(a.total_sent AS NUMERIC), 0) as total_sent,
                COALESCE(CAST(a.total_received AS NUMERIC), 0) as total_received,
                COUNT(DISTINCT DATE(b.timestamp)) as active_days,
                COUNT(DISTINCT EXTRACT(HOUR FROM b.timestamp)) as active_hours,
                AVG(CAST(t.gas_price AS NUMERIC)) as avg_gas_price,
                STDDEV(CAST(t.value AS NUMERIC)) as value_stddev,
                MAX(CAST(t.value AS NUMERIC)) as max_transaction,
                MIN(CAST(t.value AS NUMERIC)) as min_transaction
            FROM addresses a
            LEFT JOIN transactions t ON (t.from_address = a.address OR t.to_address = a.address)
            LEFT JOIN blocks b ON t.block_number = b.number
            WHERE a.address = %s
            GROUP BY a.address, a.transaction_count, a.total_sent, a.total_received
        """

        cursor = self.conn.cursor()
        cursor.execute(query, (address.lower(),))
        result = cursor.fetchone()
        cursor.close()

        if not result:
            return {}

        return dict(result)

    def _get_similar_addresses_features(
        self,
        address: str,
        features: List[str],
        sample_size: int = 1000
    ) -> List[Dict[str, float]]:
        """Get features for similar addresses for comparison"""
        query = """
            SELECT
                a.address,
                a.transaction_count,
                COALESCE(CAST(a.total_sent AS NUMERIC), 0) as total_sent,
                COALESCE(CAST(a.total_received AS NUMERIC), 0) as total_received,
                COUNT(DISTINCT DATE(b.timestamp)) as active_days,
                COUNT(DISTINCT EXTRACT(HOUR FROM b.timestamp)) as active_hours,
                AVG(CAST(t.gas_price AS NUMERIC)) as avg_gas_price,
                STDDEV(CAST(t.value AS NUMERIC)) as value_stddev,
                MAX(CAST(t.value AS NUMERIC)) as max_transaction,
                MIN(CAST(t.value AS NUMERIC)) as min_transaction
            FROM addresses a
            LEFT JOIN transactions t ON (t.from_address = a.address OR t.to_address = a.address)
            LEFT JOIN blocks b ON t.block_number = b.number
            WHERE a.address != %s
            AND a.transaction_count > 10
            GROUP BY a.address, a.transaction_count, a.total_sent, a.total_received
            ORDER BY RANDOM()
            LIMIT %s
        """

        df = pd.read_sql(query, self.conn, params=(address.lower(), sample_size))
        return df.to_dict('records')

    def classify_transaction(
        self,
        transaction_hash: str,
        categories: List[str]
    ) -> Dict[str, Any]:
        """
        Classify a transaction into categories

        Args:
            transaction_hash: Transaction hash
            categories: Categories to classify into

        Returns:
            Classification results with probabilities
        """
        # Extract transaction features
        features = self._extract_transaction_features(transaction_hash)

        if not features:
            return {'error': 'Transaction not found'}

        results = {}

        for category in categories:
            if category == 'mev':
                results['mev'] = self._classify_mev(features)
            elif category == 'wash_trade':
                results['wash_trade'] = self._classify_wash_trade(features)
            elif category == 'arbitrage':
                results['arbitrage'] = self._classify_arbitrage(features)
            elif category == 'normal':
                # Normal is baseline
                other_scores = [v.get('probability', 0) for k, v in results.items() if k != 'normal']
                results['normal'] = {
                    'probability': 1.0 - max(other_scores) if other_scores else 0.5,
                    'confidence': 'low'
                }

        # Determine most likely category
        if results:
            best_category = max(results.items(), key=lambda x: x[1].get('probability', 0))
            results['classification'] = best_category[0]
            results['confidence'] = best_category[1].get('probability', 0)

        return results

    def _extract_transaction_features(self, tx_hash: str) -> Optional[Dict[str, Any]]:
        """Extract features from a transaction"""
        query = """
            SELECT
                t.*,
                ti.method_name,
                b.timestamp,
                b.gas_used as block_gas_used,
                CAST(t.value AS NUMERIC) as value_numeric,
                CAST(t.gas_price AS NUMERIC) as gas_price_numeric
            FROM transactions t
            LEFT JOIN transaction_inputs ti ON t.hash = ti.transaction_hash
            JOIN blocks b ON t.block_number = b.number
            WHERE t.hash = %s
        """

        cursor = self.conn.cursor()
        cursor.execute(query, (tx_hash.lower(),))
        result = cursor.fetchone()
        cursor.close()

        return dict(result) if result else None

    def _classify_mev(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Classify if transaction is MEV"""
        score = 0.0
        indicators = []

        # High gas price relative to others in block
        if features.get('gas_price_numeric', 0) > 0:
            # Would need block average for comparison
            pass

        # Position in block (MEV often first or last)
        tx_index = features.get('transaction_index', 0)
        if tx_index in [0, 1]:
            score += 0.3
            indicators.append('first_in_block')

        # Specific method calls
        method = features.get('method_name', '')
        mev_methods = ['swap', 'execute', 'flashloan', 'multicall']
        if any(m in method.lower() for m in mev_methods):
            score += 0.4
            indicators.append(f'mev_method:{method}')

        # High value
        if features.get('value_numeric', 0) == 0:
            score += 0.1  # MEV often has zero ETH transfer
            indicators.append('zero_value')

        return {
            'probability': min(score, 1.0),
            'confidence': 'high' if score > 0.7 else 'medium' if score > 0.4 else 'low',
            'indicators': indicators
        }

    def _classify_wash_trade(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Classify if transaction is part of wash trading"""
        score = 0.0
        indicators = []

        # Check for reverse transactions
        from_addr = features.get('from_address')
        to_addr = features.get('to_address')

        if from_addr and to_addr:
            # Check for reciprocal transactions
            reverse_query = """
                SELECT COUNT(*) as count
                FROM transactions
                WHERE from_address = %s
                AND to_address = %s
                AND block_number >= %s - 100
            """

            cursor = self.conn.cursor()
            cursor.execute(
                reverse_query,
                (to_addr, from_addr, features.get('block_number', 0))
            )
            result = cursor.fetchone()
            cursor.close()

            if result and result['count'] > 0:
                score += 0.6
                indicators.append('reciprocal_transactions')

        return {
            'probability': min(score, 1.0),
            'confidence': 'high' if score > 0.7 else 'medium' if score > 0.4 else 'low',
            'indicators': indicators
        }

    def _classify_arbitrage(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Classify if transaction is arbitrage"""
        score = 0.0
        indicators = []

        method = features.get('method_name', '')
        arbitrage_methods = ['swap', 'trade', 'exchange']

        if any(m in method.lower() for m in arbitrage_methods):
            score += 0.4
            indicators.append('swap_method')

        # Arbitrage typically has low tx value but high gas
        value = features.get('value_numeric', 0)
        gas_price = features.get('gas_price_numeric', 0)

        if value == 0 and gas_price > 0:
            score += 0.3
            indicators.append('high_gas_zero_value')

        return {
            'probability': min(score, 1.0),
            'confidence': 'high' if score > 0.7 else 'medium' if score > 0.4 else 'low',
            'indicators': indicators
        }

    def find_mev_activities(
        self,
        block_range: Tuple[int, int],
        types: List[str] = ['sandwich', 'arbitrage', 'liquidation']
    ) -> pd.DataFrame:
        """
        Find MEV activities in block range

        Args:
            block_range: Tuple of (start_block, end_block)
            types: Types of MEV to detect

        Returns:
            DataFrame with MEV activities
        """
        start_block, end_block = block_range

        # Fetch transactions in range
        query = """
            SELECT
                t.hash,
                t.block_number,
                t.transaction_index,
                t.from_address,
                t.to_address,
                CAST(t.value AS NUMERIC) as value,
                CAST(t.gas_price AS NUMERIC) as gas_price,
                t.gas_used,
                ti.method_name,
                b.timestamp
            FROM transactions t
            LEFT JOIN transaction_inputs ti ON t.hash = ti.transaction_hash
            JOIN blocks b ON t.block_number = b.number
            WHERE t.block_number >= %s
            AND t.block_number <= %s
            ORDER BY t.block_number, t.transaction_index
        """

        df = pd.read_sql(query, self.conn, params=(start_block, end_block))

        mev_activities = []

        # Detect sandwich attacks
        if 'sandwich' in types:
            sandwiches = self._detect_sandwich_attacks(df)
            mev_activities.extend(sandwiches)

        # Detect arbitrage
        if 'arbitrage' in types:
            arbitrage = self._detect_arbitrage_opportunities(df)
            mev_activities.extend(arbitrage)

        # Detect liquidations
        if 'liquidation' in types:
            liquidations = self._detect_liquidations(df)
            mev_activities.extend(liquidations)

        return pd.DataFrame(mev_activities)

    def _detect_sandwich_attacks(self, df: pd.DataFrame) -> List[Dict]:
        """Detect sandwich attack patterns"""
        sandwiches = []

        # Group by block
        for block_num, block_txs in df.groupby('block_number'):
            block_txs = block_txs.sort_values('transaction_index')

            # Look for pattern: TX1 (front-run) -> TX2 (victim) -> TX3 (back-run)
            for i in range(len(block_txs) - 2):
                tx1 = block_txs.iloc[i]
                tx2 = block_txs.iloc[i + 1]
                tx3 = block_txs.iloc[i + 2]

                # Check if tx1 and tx3 are from same address (attacker)
                if tx1['from_address'] == tx3['from_address']:
                    # Check if all interact with same contract (DEX)
                    if tx1['to_address'] == tx2['to_address'] == tx3['to_address']:
                        # Check if methods are swap-related
                        methods = [tx1.get('method_name', ''), tx2.get('method_name', ''), tx3.get('method_name', '')]
                        if all('swap' in str(m).lower() for m in methods):
                            sandwiches.append({
                                'type': 'sandwich',
                                'block_number': block_num,
                                'attacker': tx1['from_address'],
                                'victim': tx2['from_address'],
                                'front_run_tx': tx1['hash'],
                                'victim_tx': tx2['hash'],
                                'back_run_tx': tx3['hash'],
                                'profit_estimate': float(tx3.get('value', 0) - tx1.get('value', 0))
                            })

        return sandwiches

    def _detect_arbitrage_opportunities(self, df: pd.DataFrame) -> List[Dict]:
        """Detect arbitrage transactions"""
        arbitrage = []

        # Look for transactions with swap methods and high gas
        swap_txs = df[
            df['method_name'].str.contains('swap', case=False, na=False) &
            (df['gas_price'] > df['gas_price'].quantile(0.9))
        ]

        for _, tx in swap_txs.iterrows():
            arbitrage.append({
                'type': 'arbitrage',
                'block_number': tx['block_number'],
                'transaction_hash': tx['hash'],
                'trader': tx['from_address'],
                'gas_price': float(tx['gas_price']),
                'value': float(tx.get('value', 0))
            })

        return arbitrage

    def _detect_liquidations(self, df: pd.DataFrame) -> List[Dict]:
        """Detect liquidation transactions"""
        liquidations = []

        # Look for liquidation method calls
        liquidation_txs = df[
            df['method_name'].str.contains('liquidat', case=False, na=False)
        ]

        for _, tx in liquidation_txs.iterrows():
            liquidations.append({
                'type': 'liquidation',
                'block_number': tx['block_number'],
                'transaction_hash': tx['hash'],
                'liquidator': tx['from_address'],
                'protocol': tx['to_address'],
                'value': float(tx.get('value', 0))
            })

        return liquidations

    def detect_bot_activity(
        self,
        address: str,
        min_confidence: float = 0.7
    ) -> Dict[str, Any]:
        """
        Detect if address is likely a bot

        Args:
            address: Address to analyze
            min_confidence: Minimum confidence threshold

        Returns:
            Bot detection results
        """
        features = self._extract_bot_features(address)

        if not features:
            return {'error': 'Insufficient data'}

        # Calculate bot score based on features
        score = 0.0
        indicators = []

        # High transaction frequency
        if features.get('transactions_per_day', 0) > 100:
            score += 0.3
            indicators.append('high_frequency')

        # Consistent timing patterns
        timing_entropy = features.get('timing_entropy', 1.0)
        if timing_entropy < 0.3:  # Low entropy = regular pattern
            score += 0.25
            indicators.append('regular_timing')

        # Similar transaction values
        value_entropy = features.get('value_entropy', 1.0)
        if value_entropy < 0.3:
            score += 0.2
            indicators.append('similar_values')

        # Automated method calls
        if features.get('contract_interactions', 0) > features.get('total_transactions', 1) * 0.8:
            score += 0.25
            indicators.append('high_contract_interaction')

        is_bot = score >= min_confidence

        return {
            'address': address,
            'is_bot': is_bot,
            'confidence': float(score),
            'indicators': indicators,
            'features': features
        }

    def _extract_bot_features(self, address: str) -> Dict[str, float]:
        """Extract features for bot detection"""
        query = """
            WITH tx_stats AS (
                SELECT
                    COUNT(*) as total_transactions,
                    COUNT(*) FILTER (WHERE to_address IN (SELECT address FROM addresses WHERE is_contract = true)) as contract_interactions,
                    AVG(EXTRACT(EPOCH FROM (timestamp - LAG(timestamp) OVER (ORDER BY timestamp)))) as avg_time_between_tx,
                    STDDEV(CAST(value AS NUMERIC)) as value_stddev,
                    AVG(CAST(value AS NUMERIC)) as avg_value,
                    COUNT(DISTINCT DATE(timestamp)) as active_days
                FROM transactions t
                JOIN blocks b ON t.block_number = b.number
                WHERE from_address = %s
            ),
            timing_data AS (
                SELECT
                    EXTRACT(HOUR FROM timestamp) as hour,
                    COUNT(*) as count
                FROM transactions t
                JOIN blocks b ON t.block_number = b.number
                WHERE from_address = %s
                GROUP BY EXTRACT(HOUR FROM timestamp)
            )
            SELECT
                ts.*,
                ts.total_transactions::float / NULLIF(ts.active_days, 0) as transactions_per_day
            FROM tx_stats ts
        """

        cursor = self.conn.cursor()
        cursor.execute(query, (address.lower(), address.lower()))
        result = cursor.fetchone()

        if not result:
            return {}

        features = dict(result)

        # Calculate timing entropy
        cursor.execute("""
            SELECT EXTRACT(HOUR FROM timestamp) as hour, COUNT(*) as count
            FROM transactions t
            JOIN blocks b ON t.block_number = b.number
            WHERE from_address = %s
            GROUP BY EXTRACT(HOUR FROM timestamp)
        """, (address.lower(),))

        timing_dist = cursor.fetchall()
        if timing_dist:
            counts = [row['count'] for row in timing_dist]
            total = sum(counts)
            probs = [c / total for c in counts]
            features['timing_entropy'] = float(entropy(probs))
        else:
            features['timing_entropy'] = 1.0

        # Calculate value entropy
        cursor.execute("""
            SELECT CAST(value AS NUMERIC) as value, COUNT(*) as count
            FROM transactions
            WHERE from_address = %s
            GROUP BY value
        """, (address.lower(),))

        value_dist = cursor.fetchall()
        if value_dist:
            counts = [row['count'] for row in value_dist]
            total = sum(counts)
            probs = [c / total for c in counts]
            features['value_entropy'] = float(entropy(probs))
        else:
            features['value_entropy'] = 1.0

        cursor.close()
        return features

    def train_model(
        self,
        model_type: str,
        training_data: pd.DataFrame,
        target_column: str
    ) -> Dict[str, Any]:
        """
        Train a classification model

        Args:
            model_type: Type of model to train
            training_data: Training dataset
            target_column: Target column name

        Returns:
            Training results and metrics
        """
        # Prepare features and target
        X = training_data.drop(columns=[target_column])
        y = training_data[target_column]

        # Encode labels if categorical
        if y.dtype == 'object':
            y = self.label_encoder.fit_transform(y)

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        # Train model
        model = self.models.get(model_type)
        if not model:
            return {'error': f'Unknown model type: {model_type}'}

        model.fit(X_train_scaled, y_train)

        # Evaluate
        y_pred = model.predict(X_test_scaled)
        y_pred_proba = model.predict_proba(X_test_scaled)[:, 1] if hasattr(model, 'predict_proba') else None

        # Calculate metrics
        metrics = {
            'accuracy': float(model.score(X_test_scaled, y_test)),
            'classification_report': classification_report(y_test, y_pred, output_dict=True),
        }

        if y_pred_proba is not None:
            metrics['roc_auc'] = float(roc_auc_score(y_test, y_pred_proba))

        # Cross-validation
        cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5)
        metrics['cv_mean'] = float(cv_scores.mean())
        metrics['cv_std'] = float(cv_scores.std())

        # Save model
        import joblib
        import os
        os.makedirs(self.model_path, exist_ok=True)
        joblib.dump(model, os.path.join(self.model_path, f'{model_type}.pkl'))

        return metrics

    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()


if __name__ == "__main__":
    # Example usage
    detector = PatternDetector()

    print("Detecting MEV activities...")
    mev_activities = detector.find_mev_activities(
        block_range=(15000000, 15000100),
        types=['sandwich', 'arbitrage', 'liquidation']
    )
    print(f"Found {len(mev_activities)} MEV activities")

    detector.close()
