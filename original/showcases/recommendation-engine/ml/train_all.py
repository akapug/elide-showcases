#!/usr/bin/env python3
"""
Train all recommendation models
"""

import argparse
import numpy as np
from collaborative_filtering import CollaborativeFiltering
from matrix_factorization import MatrixFactorization
import pickle
import os
import time

def generate_synthetic_data(n_users=1000, n_items=500, sparsity=0.95):
    """Generate synthetic user-item interaction matrix"""
    print(f"Generating synthetic data: {n_users} users, {n_items} items...")

    user_item_matrix = np.random.rand(n_users, n_items)
    user_item_matrix[user_item_matrix < sparsity] = 0

    # Add some structure (popular items)
    popular_items = np.random.choice(n_items, size=50, replace=False)
    user_item_matrix[:, popular_items] += np.random.rand(n_users, 50) * 0.5

    print(f"Generated matrix with {np.count_nonzero(user_item_matrix)} interactions")
    return user_item_matrix


def train_collaborative_filtering(data, output_dir):
    """Train collaborative filtering models"""
    print("\n=== Training Collaborative Filtering ===")

    for method in ['user_based', 'item_based']:
        print(f"\nTraining {method}...")
        start_time = time.time()

        model = CollaborativeFiltering(method=method)
        model.fit(data)

        training_time = time.time() - start_time
        print(f"Training completed in {training_time:.2f}s")

        # Save model
        model_path = os.path.join(output_dir, f'cf_{method}.pkl')
        with open(model_path, 'wb') as f:
            pickle.dump(model, f)
        print(f"Model saved to {model_path}")


def train_matrix_factorization(data, output_dir):
    """Train matrix factorization models"""
    print("\n=== Training Matrix Factorization ===")

    for method in ['svd', 'nmf', 'als']:
        print(f"\nTraining {method.upper()}...")
        start_time = time.time()

        model = MatrixFactorization(method=method, n_factors=50)
        model.fit(data)

        training_time = time.time() - start_time
        print(f"Training completed in {training_time:.2f}s")

        # Save model
        model_path = os.path.join(output_dir, f'mf_{method}.pkl')
        with open(model_path, 'wb') as f:
            pickle.dump(model, f)
        print(f"Model saved to {model_path}")


def main():
    parser = argparse.ArgumentParser(description='Train recommendation models')
    parser.add_argument('--dataset', default='synthetic', help='Dataset to use')
    parser.add_argument('--size', default='1m', help='Dataset size')
    parser.add_argument('--output', default='./models', help='Output directory')
    parser.add_argument('--n-users', type=int, default=1000, help='Number of users')
    parser.add_argument('--n-items', type=int, default=500, help='Number of items')

    args = parser.parse_args()

    # Create output directory
    os.makedirs(args.output, exist_ok=True)

    # Generate or load data
    if args.dataset == 'synthetic':
        data = generate_synthetic_data(args.n_users, args.n_items)
    else:
        raise ValueError(f"Unknown dataset: {args.dataset}")

    # Train models
    train_collaborative_filtering(data, args.output)
    train_matrix_factorization(data, args.output)

    print("\n✅ All models trained successfully!")
    print(f"📁 Models saved to: {args.output}")


if __name__ == '__main__':
    main()
