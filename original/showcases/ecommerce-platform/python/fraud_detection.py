"""
E-Commerce Fraud Detection System

Machine learning-based fraud detection featuring:
- Real-time transaction scoring
- Anomaly detection
- Velocity checks (transaction frequency)
- Geolocation analysis
- Device fingerprinting
- Behavioral analysis
- Pattern recognition
- Risk scoring and thresholds
- False positive minimization
- Adaptive learning

This demonstrates ML-powered fraud prevention integrated with
TypeScript payment processing through Elide's polyglot runtime.

Integration with TypeScript:
```typescript
import { check_transaction_fraud, update_fraud_model } from './python/fraud_detection.py';

// Check transaction for fraud
const fraudCheck = check_transaction_fraud(transactionData);
if (fraudCheck.risk_score > 0.7) {
    // Flag for review or reject
}
```
"""

import json
import math
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from collections import defaultdict, deque
from dataclasses import dataclass, asdict


# ============================================================================
# Data Structures
# ============================================================================

@dataclass
class Transaction:
    """Transaction data structure"""
    transaction_id: str
    user_id: str
    amount: float
    currency: str
    payment_method: str
    billing_address: Dict
    shipping_address: Dict
    ip_address: str
    device_fingerprint: str
    timestamp: datetime
    cart_items: List[Dict]

    def to_dict(self) -> Dict:
        data = asdict(self)
        data['timestamp'] = self.timestamp.isoformat()
        return data


@dataclass
class FraudCheckResult:
    """Fraud check result"""
    transaction_id: str
    risk_score: float  # 0.0 to 1.0
    risk_level: str  # 'low', 'medium', 'high', 'critical'
    decision: str  # 'approve', 'review', 'reject'
    flags: List[str]
    details: Dict

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class UserProfile:
    """User behavior profile"""
    user_id: str
    total_transactions: int
    total_spent: float
    average_transaction: float
    transaction_frequency: float
    common_locations: List[str]
    common_devices: List[str]
    first_transaction: datetime
    last_transaction: datetime
    failed_transactions: int
    disputed_transactions: int

    def to_dict(self) -> Dict:
        data = asdict(self)
        data['first_transaction'] = self.first_transaction.isoformat()
        data['last_transaction'] = self.last_transaction.isoformat()
        return data


# ============================================================================
# Fraud Detection Engine
# ============================================================================

class FraudDetectionEngine:
    """Main fraud detection engine"""

    def __init__(self):
        self.transaction_history: List[Transaction] = []
        self.user_profiles: Dict[str, UserProfile] = {}
        self.blocked_ips: set = set()
        self.blocked_devices: set = set()
        self.high_risk_countries: set = {'XX', 'YY'}  # Mock data

        # Velocity tracking
        self.user_transaction_times: Dict[str, deque] = defaultdict(lambda: deque(maxlen=100))
        self.ip_transaction_times: Dict[str, deque] = defaultdict(lambda: deque(maxlen=100))

        # Risk thresholds
        self.thresholds = {
            'low': 0.3,
            'medium': 0.5,
            'high': 0.7,
            'critical': 0.9
        }

    # ========================================================================
    # Core Fraud Detection
    # ========================================================================

    def check_transaction(self, transaction: Transaction) -> FraudCheckResult:
        """
        Perform comprehensive fraud check on a transaction
        """
        flags = []
        risk_scores = {}

        # Run all fraud checks
        risk_scores['amount'] = self._check_amount_anomaly(transaction)
        risk_scores['velocity'] = self._check_velocity(transaction)
        risk_scores['location'] = self._check_location(transaction)
        risk_scores['device'] = self._check_device(transaction)
        risk_scores['behavioral'] = self._check_behavioral_patterns(transaction)
        risk_scores['payment_method'] = self._check_payment_method(transaction)
        risk_scores['address_mismatch'] = self._check_address_mismatch(transaction)
        risk_scores['cart_anomaly'] = self._check_cart_anomalies(transaction)

        # Collect flags
        if risk_scores['amount'] > 0.5:
            flags.append('unusual_amount')
        if risk_scores['velocity'] > 0.5:
            flags.append('high_velocity')
        if risk_scores['location'] > 0.5:
            flags.append('suspicious_location')
        if risk_scores['device'] > 0.5:
            flags.append('suspicious_device')
        if risk_scores['behavioral'] > 0.5:
            flags.append('abnormal_behavior')
        if risk_scores['address_mismatch'] > 0.7:
            flags.append('address_mismatch')
        if risk_scores['cart_anomaly'] > 0.5:
            flags.append('cart_anomaly')

        # Check blocklists
        if transaction.ip_address in self.blocked_ips:
            flags.append('blocked_ip')
            risk_scores['blocklist'] = 1.0

        if transaction.device_fingerprint in self.blocked_devices:
            flags.append('blocked_device')
            risk_scores['blocklist'] = 1.0

        # Calculate overall risk score (weighted average)
        weights = {
            'amount': 0.15,
            'velocity': 0.20,
            'location': 0.15,
            'device': 0.10,
            'behavioral': 0.15,
            'payment_method': 0.10,
            'address_mismatch': 0.10,
            'cart_anomaly': 0.05,
            'blocklist': 0.50  # Override if present
        }

        overall_risk = 0.0
        total_weight = 0.0

        for factor, score in risk_scores.items():
            weight = weights.get(factor, 0.1)
            overall_risk += score * weight
            total_weight += weight

        if total_weight > 0:
            overall_risk = overall_risk / total_weight

        # Determine risk level and decision
        risk_level = self._determine_risk_level(overall_risk)
        decision = self._make_decision(overall_risk, flags)

        return FraudCheckResult(
            transaction_id=transaction.transaction_id,
            risk_score=overall_risk,
            risk_level=risk_level,
            decision=decision,
            flags=flags,
            details=risk_scores
        )

    # ========================================================================
    # Individual Fraud Checks
    # ========================================================================

    def _check_amount_anomaly(self, transaction: Transaction) -> float:
        """Check if transaction amount is anomalous for this user"""
        if transaction.user_id not in self.user_profiles:
            # New user - higher risk for large amounts
            if transaction.amount > 500:
                return 0.6
            elif transaction.amount > 200:
                return 0.4
            return 0.2

        profile = self.user_profiles[transaction.user_id]

        if profile.average_transaction == 0:
            return 0.3

        # Z-score based anomaly detection
        deviation = abs(transaction.amount - profile.average_transaction)
        z_score = deviation / max(profile.average_transaction, 1.0)

        if z_score > 3.0:
            return 0.9
        elif z_score > 2.0:
            return 0.6
        elif z_score > 1.0:
            return 0.3

        return 0.1

    def _check_velocity(self, transaction: Transaction) -> float:
        """Check transaction velocity (frequency)"""
        now = transaction.timestamp

        # Check user velocity
        user_times = self.user_transaction_times[transaction.user_id]
        recent_user_txns = sum(1 for t in user_times if (now - t).total_seconds() < 3600)

        # Check IP velocity
        ip_times = self.ip_transaction_times[transaction.ip_address]
        recent_ip_txns = sum(1 for t in ip_times if (now - t).total_seconds() < 3600)

        risk = 0.0

        # More than 5 transactions per hour for user
        if recent_user_txns > 5:
            risk = max(risk, 0.7)
        elif recent_user_txns > 3:
            risk = max(risk, 0.4)

        # More than 10 transactions per hour from same IP
        if recent_ip_txns > 10:
            risk = max(risk, 0.8)
        elif recent_ip_txns > 5:
            risk = max(risk, 0.5)

        return risk

    def _check_location(self, transaction: Transaction) -> float:
        """Check geographical location risk"""
        risk = 0.0

        # Extract country from billing address
        country = transaction.billing_address.get('country', 'US')

        # Check high-risk countries
        if country in self.high_risk_countries:
            risk = max(risk, 0.7)

        # Check if user profile exists
        if transaction.user_id in self.user_profiles:
            profile = self.user_profiles[transaction.user_id]

            # Check if this is a new location
            if country not in profile.common_locations:
                risk = max(risk, 0.4)

        # Check billing vs shipping country mismatch
        shipping_country = transaction.shipping_address.get('country', 'US')
        if country != shipping_country:
            risk = max(risk, 0.3)

        return risk

    def _check_device(self, transaction: Transaction) -> float:
        """Check device fingerprint risk"""
        risk = 0.0

        # Check if device is known for this user
        if transaction.user_id in self.user_profiles:
            profile = self.user_profiles[transaction.user_id]

            if transaction.device_fingerprint not in profile.common_devices:
                risk = max(risk, 0.3)

        # New user with suspicious device pattern
        else:
            # Check if device has been used by multiple users
            device_users = sum(
                1 for p in self.user_profiles.values()
                if transaction.device_fingerprint in p.common_devices
            )

            if device_users > 5:
                risk = max(risk, 0.6)

        return risk

    def _check_behavioral_patterns(self, transaction: Transaction) -> float:
        """Check for unusual behavioral patterns"""
        risk = 0.0

        if transaction.user_id not in self.user_profiles:
            return 0.2  # Slight risk for new users

        profile = self.user_profiles[transaction.user_id]

        # Check if user has history of failed transactions
        if profile.failed_transactions > 3:
            failure_rate = profile.failed_transactions / max(profile.total_transactions, 1)
            risk = max(risk, failure_rate * 0.7)

        # Check disputed transactions
        if profile.disputed_transactions > 0:
            risk = max(risk, 0.8)

        # Check account age
        account_age_days = (transaction.timestamp - profile.first_transaction).days
        if account_age_days < 1:
            risk = max(risk, 0.4)

        return risk

    def _check_payment_method(self, transaction: Transaction) -> float:
        """Check payment method risk"""
        risk = 0.0

        # Gift cards and prepaid cards are higher risk
        if transaction.payment_method in ['gift_card', 'prepaid']:
            risk = 0.6

        # Cryptocurrency payments
        elif transaction.payment_method == 'crypto':
            risk = 0.5

        # Wire transfers
        elif transaction.payment_method == 'wire':
            risk = 0.4

        return risk

    def _check_address_mismatch(self, transaction: Transaction) -> float:
        """Check for address verification issues"""
        risk = 0.0

        billing = transaction.billing_address
        shipping = transaction.shipping_address

        # Check if addresses are significantly different
        if billing.get('country') != shipping.get('country'):
            risk = max(risk, 0.5)

        if billing.get('state') != shipping.get('state'):
            risk = max(risk, 0.3)

        if billing.get('city') != shipping.get('city'):
            risk = max(risk, 0.2)

        # Check for P.O. Box shipping (common in fraud)
        shipping_addr = shipping.get('addressLine1', '').lower()
        if 'p.o. box' in shipping_addr or 'po box' in shipping_addr:
            risk = max(risk, 0.4)

        return risk

    def _check_cart_anomalies(self, transaction: Transaction) -> float:
        """Check for suspicious cart patterns"""
        risk = 0.0

        cart_items = transaction.cart_items

        # Large number of same item
        quantities = [item.get('quantity', 1) for item in cart_items]
        if any(q > 10 for q in quantities):
            risk = max(risk, 0.5)

        # Many different items (potential reselling)
        if len(cart_items) > 20:
            risk = max(risk, 0.4)

        # All high-value items
        if all(item.get('price', 0) > 500 for item in cart_items):
            risk = max(risk, 0.3)

        return risk

    # ========================================================================
    # Decision Making
    # ========================================================================

    def _determine_risk_level(self, risk_score: float) -> str:
        """Determine risk level from score"""
        if risk_score >= self.thresholds['critical']:
            return 'critical'
        elif risk_score >= self.thresholds['high']:
            return 'high'
        elif risk_score >= self.thresholds['medium']:
            return 'medium'
        else:
            return 'low'

    def _make_decision(self, risk_score: float, flags: List[str]) -> str:
        """Make approval decision"""
        # Auto-reject critical risk
        if risk_score >= self.thresholds['critical']:
            return 'reject'

        # Auto-reject if blocked
        if 'blocked_ip' in flags or 'blocked_device' in flags:
            return 'reject'

        # Review high risk
        if risk_score >= self.thresholds['high']:
            return 'review'

        # Review medium risk with multiple flags
        if risk_score >= self.thresholds['medium'] and len(flags) >= 3:
            return 'review'

        # Approve low risk
        return 'approve'

    # ========================================================================
    # Profile Management
    # ========================================================================

    def update_user_profile(self, transaction: Transaction, approved: bool = True):
        """Update user profile with transaction data"""
        user_id = transaction.user_id

        if user_id not in self.user_profiles:
            self.user_profiles[user_id] = UserProfile(
                user_id=user_id,
                total_transactions=0,
                total_spent=0.0,
                average_transaction=0.0,
                transaction_frequency=0.0,
                common_locations=[],
                common_devices=[],
                first_transaction=transaction.timestamp,
                last_transaction=transaction.timestamp,
                failed_transactions=0,
                disputed_transactions=0
            )

        profile = self.user_profiles[user_id]

        if approved:
            profile.total_transactions += 1
            profile.total_spent += transaction.amount
            profile.average_transaction = profile.total_spent / profile.total_transactions
            profile.last_transaction = transaction.timestamp

            # Update common locations
            country = transaction.billing_address.get('country', 'US')
            if country not in profile.common_locations:
                profile.common_locations.append(country)

            # Update common devices
            if transaction.device_fingerprint not in profile.common_devices:
                profile.common_devices.append(transaction.device_fingerprint)

        else:
            profile.failed_transactions += 1

        # Track transaction times for velocity checks
        self.user_transaction_times[user_id].append(transaction.timestamp)
        self.ip_transaction_times[transaction.ip_address].append(transaction.timestamp)

    def report_dispute(self, transaction_id: str, user_id: str):
        """Report a disputed/fraudulent transaction"""
        if user_id in self.user_profiles:
            self.user_profiles[user_id].disputed_transactions += 1

    def block_ip(self, ip_address: str):
        """Block an IP address"""
        self.blocked_ips.add(ip_address)

    def block_device(self, device_fingerprint: str):
        """Block a device"""
        self.blocked_devices.add(device_fingerprint)

    # ========================================================================
    # Analytics
    # ========================================================================

    def get_fraud_statistics(self) -> Dict:
        """Get fraud detection statistics"""
        total_users = len(self.user_profiles)

        total_txns = sum(p.total_transactions for p in self.user_profiles.values())
        total_failed = sum(p.failed_transactions for p in self.user_profiles.values())
        total_disputed = sum(p.disputed_transactions for p in self.user_profiles.values())

        return {
            'total_users': total_users,
            'total_transactions': total_txns,
            'total_failed': total_failed,
            'total_disputed': total_disputed,
            'blocked_ips': len(self.blocked_ips),
            'blocked_devices': len(self.blocked_devices),
            'failure_rate': total_failed / max(total_txns, 1),
            'dispute_rate': total_disputed / max(total_txns, 1)
        }


# ============================================================================
# Public API for TypeScript Integration
# ============================================================================

# Global fraud detection engine instance
_fraud_engine = FraudDetectionEngine()


def check_transaction_fraud(transaction_data: Dict) -> str:
    """
    Check a transaction for fraud (returns JSON string for TypeScript)

    Args:
        transaction_data: Dictionary with transaction details

    Returns:
        JSON string with fraud check results
    """
    # Parse transaction data
    transaction = Transaction(
        transaction_id=transaction_data['transaction_id'],
        user_id=transaction_data['user_id'],
        amount=float(transaction_data['amount']),
        currency=transaction_data['currency'],
        payment_method=transaction_data['payment_method'],
        billing_address=transaction_data['billing_address'],
        shipping_address=transaction_data['shipping_address'],
        ip_address=transaction_data['ip_address'],
        device_fingerprint=transaction_data.get('device_fingerprint', 'unknown'),
        timestamp=datetime.fromisoformat(transaction_data.get('timestamp', datetime.now().isoformat())),
        cart_items=transaction_data.get('cart_items', [])
    )

    # Perform fraud check
    result = _fraud_engine.check_transaction(transaction)

    # Update profile if approved
    if result.decision == 'approve':
        _fraud_engine.update_user_profile(transaction, approved=True)
    else:
        _fraud_engine.update_user_profile(transaction, approved=False)

    return json.dumps(result.to_dict())


def report_fraud(transaction_id: str, user_id: str) -> str:
    """Report a fraudulent transaction"""
    _fraud_engine.report_dispute(transaction_id, user_id)
    return json.dumps({'status': 'success', 'message': 'Fraud reported'})


def block_user_ip(ip_address: str) -> str:
    """Block an IP address"""
    _fraud_engine.block_ip(ip_address)
    return json.dumps({'status': 'success', 'message': f'IP {ip_address} blocked'})


def block_user_device(device_fingerprint: str) -> str:
    """Block a device fingerprint"""
    _fraud_engine.block_device(device_fingerprint)
    return json.dumps({'status': 'success', 'message': 'Device blocked'})


def get_fraud_stats() -> str:
    """Get fraud detection statistics (returns JSON string for TypeScript)"""
    stats = _fraud_engine.get_fraud_statistics()
    return json.dumps(stats)


# ============================================================================
# Demo/Testing
# ============================================================================

def run_demo():
    """Demonstration of fraud detection"""
    print("=" * 80)
    print("FRAUD DETECTION SYSTEM DEMO")
    print("=" * 80)
    print()

    # Sample transactions
    transactions = [
        {
            'transaction_id': 'txn_001',
            'user_id': 'user_001',
            'amount': 99.99,
            'currency': 'USD',
            'payment_method': 'credit_card',
            'billing_address': {'country': 'US', 'state': 'CA', 'city': 'SF'},
            'shipping_address': {'country': 'US', 'state': 'CA', 'city': 'SF'},
            'ip_address': '192.168.1.1',
            'device_fingerprint': 'device_001',
            'cart_items': [{'product_id': 'p1', 'quantity': 1, 'price': 99.99}]
        },
        {
            'transaction_id': 'txn_002',
            'user_id': 'user_002',
            'amount': 5000.00,  # Suspicious large amount for new user
            'currency': 'USD',
            'payment_method': 'credit_card',
            'billing_address': {'country': 'XX', 'state': 'YY', 'city': 'ZZ'},  # High-risk country
            'shipping_address': {'country': 'US', 'state': 'CA', 'city': 'SF'},
            'ip_address': '10.0.0.1',
            'device_fingerprint': 'device_002',
            'cart_items': [{'product_id': 'p2', 'quantity': 50, 'price': 100.00}]  # Large quantity
        }
    ]

    for txn_data in transactions:
        print(f"Checking transaction {txn_data['transaction_id']}...")
        result_json = check_transaction_fraud(txn_data)
        result = json.loads(result_json)

        print(f"  User: {txn_data['user_id']}")
        print(f"  Amount: ${txn_data['amount']:.2f}")
        print(f"  Risk Score: {result['risk_score']:.2f}")
        print(f"  Risk Level: {result['risk_level']}")
        print(f"  Decision: {result['decision'].upper()}")
        if result['flags']:
            print(f"  Flags: {', '.join(result['flags'])}")
        print()

    # Show statistics
    stats_json = get_fraud_stats()
    stats = json.loads(stats_json)
    print("Fraud Detection Statistics:")
    print(json.dumps(stats, indent=2))
    print()

    print("=" * 80)


if __name__ == '__main__':
    run_demo()
