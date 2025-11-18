"""
Advanced Data Deduplication with Fuzzy Matching

Comprehensive deduplication strategies:
- Exact matching
- Fuzzy string matching (Levenshtein distance)
- Phonetic matching (Soundex, Metaphone)
- Token-based matching
- TF-IDF similarity
- Blocking strategies for performance
- Record linkage
- Merge strategies
"""

import re
import math
from typing import Any, Dict, List, Optional, Set, Tuple
from dataclasses import dataclass
from collections import defaultdict


@dataclass
class MatchResult:
    """Result of a match comparison"""
    record1: Dict[str, Any]
    record2: Dict[str, Any]
    similarity: float
    matched_fields: Dict[str, float]
    is_match: bool


@dataclass
class DeduplicationResult:
    """Result of deduplication process"""
    unique_records: List[Dict[str, Any]]
    duplicate_groups: List[List[Dict[str, Any]]]
    total_input: int
    total_unique: int
    total_duplicates: int


class FuzzyMatcher:
    """Fuzzy string matching algorithms"""

    @staticmethod
    def levenshtein_distance(s1: str, s2: str) -> int:
        """Calculate Levenshtein distance between two strings"""
        if len(s1) < len(s2):
            return FuzzyMatcher.levenshtein_distance(s2, s1)

        if len(s2) == 0:
            return len(s1)

        previous_row = range(len(s2) + 1)

        for i, c1 in enumerate(s1):
            current_row = [i + 1]
            for j, c2 in enumerate(s2):
                # Cost of insertions, deletions, or substitutions
                insertions = previous_row[j + 1] + 1
                deletions = current_row[j] + 1
                substitutions = previous_row[j] + (c1 != c2)
                current_row.append(min(insertions, deletions, substitutions))
            previous_row = current_row

        return previous_row[-1]

    @staticmethod
    def levenshtein_similarity(s1: str, s2: str) -> float:
        """Calculate similarity ratio (0-1) based on Levenshtein distance"""
        if not s1 and not s2:
            return 1.0
        if not s1 or not s2:
            return 0.0

        distance = FuzzyMatcher.levenshtein_distance(s1, s2)
        max_len = max(len(s1), len(s2))

        return 1 - (distance / max_len)

    @staticmethod
    def jaro_similarity(s1: str, s2: str) -> float:
        """Calculate Jaro similarity"""
        if s1 == s2:
            return 1.0
        if not s1 or not s2:
            return 0.0

        len1, len2 = len(s1), len(s2)
        match_distance = max(len1, len2) // 2 - 1

        s1_matches = [False] * len1
        s2_matches = [False] * len2
        matches = 0
        transpositions = 0

        # Find matches
        for i in range(len1):
            start = max(0, i - match_distance)
            end = min(i + match_distance + 1, len2)

            for j in range(start, end):
                if s2_matches[j] or s1[i] != s2[j]:
                    continue
                s1_matches[i] = True
                s2_matches[j] = True
                matches += 1
                break

        if matches == 0:
            return 0.0

        # Count transpositions
        k = 0
        for i in range(len1):
            if not s1_matches[i]:
                continue
            while not s2_matches[k]:
                k += 1
            if s1[i] != s2[k]:
                transpositions += 1
            k += 1

        return (matches / len1 + matches / len2 +
                (matches - transpositions / 2) / matches) / 3

    @staticmethod
    def jaro_winkler_similarity(s1: str, s2: str, prefix_scale: float = 0.1) -> float:
        """Calculate Jaro-Winkler similarity"""
        jaro_sim = FuzzyMatcher.jaro_similarity(s1, s2)

        # Find common prefix (up to 4 characters)
        prefix_len = 0
        for i in range(min(len(s1), len(s2), 4)):
            if s1[i] == s2[i]:
                prefix_len += 1
            else:
                break

        return jaro_sim + (prefix_len * prefix_scale * (1 - jaro_sim))

    @staticmethod
    def soundex(s: str) -> str:
        """Generate Soundex code for phonetic matching"""
        if not s:
            return ""

        s = s.upper()

        # Keep first letter
        soundex = s[0]

        # Mapping of letters to digits
        mapping = {
            'B': '1', 'F': '1', 'P': '1', 'V': '1',
            'C': '2', 'G': '2', 'J': '2', 'K': '2', 'Q': '2', 'S': '2', 'X': '2', 'Z': '2',
            'D': '3', 'T': '3',
            'L': '4',
            'M': '5', 'N': '5',
            'R': '6'
        }

        # Convert remaining letters to digits
        prev_code = mapping.get(s[0], '')

        for char in s[1:]:
            code = mapping.get(char, '')

            if code and code != prev_code:
                soundex += code
                prev_code = code
            elif char not in 'AEIOUYHW':
                prev_code = ''

        # Pad with zeros or truncate to length 4
        soundex = (soundex + '000')[:4]

        return soundex

    @staticmethod
    def token_jaccard_similarity(s1: str, s2: str) -> float:
        """Calculate Jaccard similarity of tokens"""
        tokens1 = set(s1.lower().split())
        tokens2 = set(s2.lower().split())

        if not tokens1 and not tokens2:
            return 1.0
        if not tokens1 or not tokens2:
            return 0.0

        intersection = len(tokens1 & tokens2)
        union = len(tokens1 | tokens2)

        return intersection / union if union > 0 else 0.0

    @staticmethod
    def cosine_similarity(v1: List[float], v2: List[float]) -> float:
        """Calculate cosine similarity between vectors"""
        if len(v1) != len(v2):
            raise ValueError("Vectors must have same length")

        dot_product = sum(a * b for a, b in zip(v1, v2))
        magnitude1 = math.sqrt(sum(a * a for a in v1))
        magnitude2 = math.sqrt(sum(b * b for b in v2))

        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0

        return dot_product / (magnitude1 * magnitude2)


class BlockingStrategy:
    """Blocking strategies to reduce comparison space"""

    @staticmethod
    def standard_blocking(
        records: List[Dict[str, Any]],
        blocking_keys: List[str]
    ) -> Dict[str, List[Dict[str, Any]]]:
        """Standard blocking - group by exact key values"""
        blocks: Dict[str, List[Dict[str, Any]]] = defaultdict(list)

        for record in records:
            # Create blocking key
            key_values = []
            for key in blocking_keys:
                value = record.get(key, '')
                if isinstance(value, str):
                    value = value.strip().lower()
                key_values.append(str(value))

            block_key = '|'.join(key_values)
            blocks[block_key].append(record)

        return dict(blocks)

    @staticmethod
    def phonetic_blocking(
        records: List[Dict[str, Any]],
        blocking_key: str
    ) -> Dict[str, List[Dict[str, Any]]]:
        """Phonetic blocking using Soundex"""
        blocks: Dict[str, List[Dict[str, Any]]] = defaultdict(list)

        for record in records:
            value = str(record.get(blocking_key, ''))
            soundex = FuzzyMatcher.soundex(value)
            blocks[soundex].append(record)

        return dict(blocks)

    @staticmethod
    def sorted_neighborhood(
        records: List[Dict[str, Any]],
        sort_key: str,
        window_size: int = 5
    ) -> List[Tuple[Dict[str, Any], Dict[str, Any]]]:
        """Sorted neighborhood method"""
        # Sort records
        sorted_records = sorted(
            records,
            key=lambda r: str(r.get(sort_key, '')).lower()
        )

        # Generate pairs within window
        pairs = []
        for i in range(len(sorted_records)):
            for j in range(i + 1, min(i + window_size, len(sorted_records))):
                pairs.append((sorted_records[i], sorted_records[j]))

        return pairs


class Deduplicator:
    """Main deduplication engine"""

    def __init__(
        self,
        match_fields: List[str],
        match_threshold: float = 0.8,
        fuzzy_methods: Optional[Dict[str, str]] = None,
        blocking_keys: Optional[List[str]] = None
    ):
        self.match_fields = match_fields
        self.match_threshold = match_threshold
        self.fuzzy_methods = fuzzy_methods or {}
        self.blocking_keys = blocking_keys
        self.matcher = FuzzyMatcher()

    def deduplicate(self, records: List[Dict[str, Any]]) -> DeduplicationResult:
        """
        Deduplicate records

        Args:
            records: List of records to deduplicate

        Returns:
            DeduplicationResult with unique records and duplicate groups
        """
        print(f"Deduplicating {len(records)} records...")

        # Apply blocking if configured
        if self.blocking_keys:
            blocks = BlockingStrategy.standard_blocking(records, self.blocking_keys)
            print(f"Created {len(blocks)} blocks")
        else:
            blocks = {"all": records}

        # Find matches within each block
        all_matches: List[Tuple[int, int, float]] = []
        record_to_idx = {id(r): i for i, r in enumerate(records)}

        for block_key, block_records in blocks.items():
            matches = self._find_matches_in_block(block_records)

            # Convert to global indices
            for r1, r2, similarity in matches:
                idx1 = record_to_idx[id(r1)]
                idx2 = record_to_idx[id(r2)]
                all_matches.append((idx1, idx2, similarity))

        print(f"Found {len(all_matches)} potential matches")

        # Build duplicate groups using union-find
        duplicate_groups = self._build_duplicate_groups(records, all_matches)

        # Create result
        unique_records = []
        seen_indices = set()

        for group in duplicate_groups:
            # Merge records in group
            merged = self._merge_records(group)
            unique_records.append(merged)
            seen_indices.update(records.index(r) for r in group)

        # Add non-duplicate records
        for i, record in enumerate(records):
            if i not in seen_indices:
                unique_records.append(record)

        result = DeduplicationResult(
            unique_records=unique_records,
            duplicate_groups=duplicate_groups,
            total_input=len(records),
            total_unique=len(unique_records),
            total_duplicates=len(records) - len(unique_records)
        )

        print(f"Deduplication complete: {result.total_unique} unique records, "
              f"{result.total_duplicates} duplicates removed")

        return result

    def _find_matches_in_block(
        self,
        records: List[Dict[str, Any]]
    ) -> List[Tuple[Dict[str, Any], Dict[str, Any], float]]:
        """Find matching records within a block"""
        matches = []

        for i in range(len(records)):
            for j in range(i + 1, len(records)):
                match_result = self._compare_records(records[i], records[j])

                if match_result.is_match:
                    matches.append((records[i], records[j], match_result.similarity))

        return matches

    def _compare_records(self, record1: Dict[str, Any], record2: Dict[str, Any]) -> MatchResult:
        """Compare two records for similarity"""
        field_similarities: Dict[str, float] = {}
        total_similarity = 0.0

        for field in self.match_fields:
            value1 = str(record1.get(field, ''))
            value2 = str(record2.get(field, ''))

            # Get matching method for field
            method = self.fuzzy_methods.get(field, 'levenshtein')

            if method == 'exact':
                similarity = 1.0 if value1 == value2 else 0.0
            elif method == 'levenshtein':
                similarity = self.matcher.levenshtein_similarity(value1, value2)
            elif method == 'jaro_winkler':
                similarity = self.matcher.jaro_winkler_similarity(value1, value2)
            elif method == 'token_jaccard':
                similarity = self.matcher.token_jaccard_similarity(value1, value2)
            elif method == 'soundex':
                soundex1 = self.matcher.soundex(value1)
                soundex2 = self.matcher.soundex(value2)
                similarity = 1.0 if soundex1 == soundex2 else 0.0
            else:
                similarity = self.matcher.levenshtein_similarity(value1, value2)

            field_similarities[field] = similarity
            total_similarity += similarity

        # Average similarity across all fields
        avg_similarity = total_similarity / len(self.match_fields)

        return MatchResult(
            record1=record1,
            record2=record2,
            similarity=avg_similarity,
            matched_fields=field_similarities,
            is_match=avg_similarity >= self.match_threshold
        )

    def _build_duplicate_groups(
        self,
        records: List[Dict[str, Any]],
        matches: List[Tuple[int, int, float]]
    ) -> List[List[Dict[str, Any]]]:
        """Build groups of duplicate records using union-find"""
        # Initialize union-find
        parent = list(range(len(records)))

        def find(x: int) -> int:
            if parent[x] != x:
                parent[x] = find(parent[x])
            return parent[x]

        def union(x: int, y: int) -> None:
            px, py = find(x), find(y)
            if px != py:
                parent[px] = py

        # Union matched records
        for idx1, idx2, _ in matches:
            union(idx1, idx2)

        # Build groups
        groups: Dict[int, List[Dict[str, Any]]] = defaultdict(list)
        for i, record in enumerate(records):
            root = find(i)
            groups[root].append(record)

        # Filter to only groups with duplicates
        duplicate_groups = [group for group in groups.values() if len(group) > 1]

        return duplicate_groups

    def _merge_records(self, records: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Merge duplicate records into single record"""
        if not records:
            return {}

        # Start with first record
        merged = records[0].copy()

        # Merge fields from other records
        for record in records[1:]:
            for key, value in record.items():
                # If field is missing or empty in merged, use value from this record
                if key not in merged or not merged[key]:
                    merged[key] = value
                # For numeric fields, take maximum
                elif isinstance(value, (int, float)) and isinstance(merged[key], (int, float)):
                    merged[key] = max(merged[key], value)
                # For strings, take longer value
                elif isinstance(value, str) and isinstance(merged[key], str):
                    if len(value) > len(merged[key]):
                        merged[key] = value

        # Add metadata about merge
        merged['_duplicate_count'] = len(records)
        merged['_merged_from'] = [r.get('id', i) for i, r in enumerate(records)]

        return merged


class RecordLinkage:
    """Link records across different datasets"""

    def __init__(self, deduplicator: Deduplicator):
        self.deduplicator = deduplicator

    def link_datasets(
        self,
        dataset1: List[Dict[str, Any]],
        dataset2: List[Dict[str, Any]]
    ) -> List[Tuple[Dict[str, Any], Dict[str, Any], float]]:
        """
        Link records between two datasets

        Returns list of (record1, record2, similarity) tuples
        """
        print(f"Linking {len(dataset1)} records with {len(dataset2)} records...")

        links = []

        for record1 in dataset1:
            best_match = None
            best_similarity = 0.0

            for record2 in dataset2:
                match_result = self.deduplicator._compare_records(record1, record2)

                if match_result.similarity > best_similarity:
                    best_similarity = match_result.similarity
                    best_match = record2

            if best_match and best_similarity >= self.deduplicator.match_threshold:
                links.append((record1, best_match, best_similarity))

        print(f"Found {len(links)} links")

        return links


# Example usage
if __name__ == "__main__":
    # Sample data with duplicates
    records = [
        {"id": 1, "name": "John Smith", "email": "john.smith@example.com", "phone": "555-1234"},
        {"id": 2, "name": "Jon Smith", "email": "jon.smith@example.com", "phone": "555-1234"},  # Duplicate
        {"id": 3, "name": "Jane Doe", "email": "jane.doe@example.com", "phone": "555-5678"},
        {"id": 4, "name": "John Smyth", "email": "j.smith@example.com", "phone": "555-1234"},  # Duplicate
        {"id": 5, "name": "Bob Johnson", "email": "bob.j@example.com", "phone": "555-9999"},
        {"id": 6, "name": "Jane Doe", "email": "jane.doe@example.com", "phone": "555-5678"},  # Duplicate
    ]

    # Configure deduplicator
    deduplicator = Deduplicator(
        match_fields=["name", "email"],
        match_threshold=0.85,
        fuzzy_methods={
            "name": "jaro_winkler",
            "email": "levenshtein"
        },
        blocking_keys=["phone"]  # Block by phone number
    )

    # Run deduplication
    result = deduplicator.deduplicate(records)

    print("\n=== Deduplication Results ===")
    print(f"Input records: {result.total_input}")
    print(f"Unique records: {result.total_unique}")
    print(f"Duplicates removed: {result.total_duplicates}")

    print("\n=== Duplicate Groups ===")
    for i, group in enumerate(result.duplicate_groups, 1):
        print(f"\nGroup {i}:")
        for record in group:
            print(f"  ID {record['id']}: {record['name']} - {record['email']}")

    print("\n=== Unique Records ===")
    for record in result.unique_records:
        dup_count = record.get('_duplicate_count', 1)
        print(f"ID {record['id']}: {record['name']} (merged from {dup_count} records)")
