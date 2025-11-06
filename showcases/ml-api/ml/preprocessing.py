#!/usr/bin/env python3
"""
Text Preprocessing - Advanced NLP Preprocessing

Comprehensive text preprocessing for sentiment analysis:
- Tokenization
- Normalization
- Stemming/Lemmatization
- N-gram extraction
- Feature extraction
- Text augmentation

@module ml/preprocessing
"""

import re
import unicodedata
from typing import List, Dict, Tuple, Set, Optional
from collections import Counter
import json


class Tokenizer:
    """
    Advanced text tokenization
    """

    def __init__(self):
        # Contractions mapping
        self.contractions = {
            "ain't": "am not",
            "aren't": "are not",
            "can't": "cannot",
            "can't've": "cannot have",
            "could've": "could have",
            "couldn't": "could not",
            "didn't": "did not",
            "doesn't": "does not",
            "don't": "do not",
            "hadn't": "had not",
            "hasn't": "has not",
            "haven't": "have not",
            "he'd": "he would",
            "he'll": "he will",
            "he's": "he is",
            "I'd": "I would",
            "I'll": "I will",
            "I'm": "I am",
            "I've": "I have",
            "isn't": "is not",
            "it'd": "it would",
            "it'll": "it will",
            "it's": "it is",
            "let's": "let us",
            "mightn't": "might not",
            "mustn't": "must not",
            "shan't": "shall not",
            "she'd": "she would",
            "she'll": "she will",
            "she's": "she is",
            "shouldn't": "should not",
            "that's": "that is",
            "there's": "there is",
            "they'd": "they would",
            "they'll": "they will",
            "they're": "they are",
            "they've": "they have",
            "wasn't": "was not",
            "we'd": "we would",
            "we'll": "we will",
            "we're": "we are",
            "we've": "we have",
            "weren't": "were not",
            "what'll": "what will",
            "what're": "what are",
            "what's": "what is",
            "what've": "what have",
            "where's": "where is",
            "who'd": "who would",
            "who'll": "who will",
            "who's": "who is",
            "won't": "will not",
            "wouldn't": "would not",
            "you'd": "you would",
            "you'll": "you will",
            "you're": "you are",
            "you've": "you have",
        }

    def tokenize(self, text: str, lowercase: bool = True,
                 expand_contractions: bool = True) -> List[str]:
        """
        Tokenize text into words

        Args:
            text: Input text
            lowercase: Convert to lowercase
            expand_contractions: Expand contractions

        Returns:
            List of tokens
        """
        # Expand contractions
        if expand_contractions:
            text = self._expand_contractions(text)

        # Lowercase
        if lowercase:
            text = text.lower()

        # Split on whitespace and punctuation
        tokens = re.findall(r"\b[\w']+\b", text)

        return tokens

    def _expand_contractions(self, text: str) -> str:
        """
        Expand contractions in text
        """
        pattern = re.compile('({})'.format('|'.join(self.contractions.keys())),
                           flags=re.IGNORECASE|re.DOTALL)

        def replace(match):
            return self.contractions.get(match.group(0).lower())

        return pattern.sub(replace, text)

    def sentence_tokenize(self, text: str) -> List[str]:
        """
        Split text into sentences
        """
        # Simple sentence splitting (in production, use nltk or spacy)
        sentences = re.split(r'[.!?]+', text)
        return [s.strip() for s in sentences if s.strip()]


class TextNormalizer:
    """
    Text normalization utilities
    """

    @staticmethod
    def remove_accents(text: str) -> str:
        """
        Remove accents from text
        """
        nfkd = unicodedata.normalize('NFKD', text)
        return ''.join([c for c in nfkd if not unicodedata.combining(c)])

    @staticmethod
    def remove_punctuation(text: str, keep_apostrophes: bool = True) -> str:
        """
        Remove punctuation from text
        """
        if keep_apostrophes:
            return re.sub(r"[^\w\s']", ' ', text)
        else:
            return re.sub(r'[^\w\s]', ' ', text)

    @staticmethod
    def remove_numbers(text: str) -> str:
        """
        Remove numbers from text
        """
        return re.sub(r'\d+', '', text)

    @staticmethod
    def remove_extra_whitespace(text: str) -> str:
        """
        Remove extra whitespace
        """
        return re.sub(r'\s+', ' ', text).strip()

    @staticmethod
    def normalize_unicode(text: str) -> str:
        """
        Normalize unicode characters
        """
        return unicodedata.normalize('NFKC', text)

    @staticmethod
    def expand_abbreviations(text: str) -> str:
        """
        Expand common abbreviations
        """
        abbreviations = {
            r'\bdr\b': 'doctor',
            r'\bmr\b': 'mister',
            r'\bmrs\b': 'misses',
            r'\bms\b': 'miss',
            r'\bjr\b': 'junior',
            r'\bsr\b': 'senior',
            r'\betc\b': 'et cetera',
            r'\be\.g\b': 'for example',
            r'\bi\.e\b': 'that is',
        }

        for abbr, expansion in abbreviations.items():
            text = re.sub(abbr, expansion, text, flags=re.IGNORECASE)

        return text


class Stemmer:
    """
    Simple Porter Stemmer implementation

    In production, use nltk.stem.PorterStemmer or similar
    """

    def __init__(self):
        # Simple suffix rules
        self.suffix_rules = [
            ('sses', 'ss'),
            ('ies', 'i'),
            ('ss', 'ss'),
            ('s', ''),
            ('eed', 'ee'),
            ('ed', ''),
            ('ing', ''),
            ('ational', 'ate'),
            ('tional', 'tion'),
            ('enci', 'ence'),
            ('anci', 'ance'),
            ('izer', 'ize'),
            ('ation', 'ate'),
            ('ator', 'ate'),
            ('alism', 'al'),
            ('iveness', 'ive'),
            ('fulness', 'ful'),
            ('ousness', 'ous'),
            ('aliti', 'al'),
            ('iviti', 'ive'),
            ('biliti', 'ble'),
        ]

    def stem(self, word: str) -> str:
        """
        Stem a word
        """
        word = word.lower()

        for suffix, replacement in self.suffix_rules:
            if word.endswith(suffix):
                return word[:-len(suffix)] + replacement

        return word

    def stem_tokens(self, tokens: List[str]) -> List[str]:
        """
        Stem a list of tokens
        """
        return [self.stem(token) for token in tokens]


class NGramExtractor:
    """
    N-gram extraction
    """

    @staticmethod
    def extract_ngrams(tokens: List[str], n: int) -> List[Tuple[str, ...]]:
        """
        Extract n-grams from tokens

        Args:
            tokens: List of tokens
            n: N-gram size

        Returns:
            List of n-grams
        """
        ngrams = []
        for i in range(len(tokens) - n + 1):
            ngrams.append(tuple(tokens[i:i+n]))
        return ngrams

    @staticmethod
    def extract_all_ngrams(tokens: List[str], min_n: int = 1,
                          max_n: int = 3) -> Dict[int, List[Tuple[str, ...]]]:
        """
        Extract all n-grams from min_n to max_n

        Args:
            tokens: List of tokens
            min_n: Minimum n-gram size
            max_n: Maximum n-gram size

        Returns:
            Dictionary mapping n to list of n-grams
        """
        all_ngrams = {}
        for n in range(min_n, max_n + 1):
            all_ngrams[n] = NGramExtractor.extract_ngrams(tokens, n)
        return all_ngrams

    @staticmethod
    def ngram_frequency(ngrams: List[Tuple[str, ...]]) -> Dict[Tuple[str, ...], int]:
        """
        Calculate n-gram frequencies
        """
        return dict(Counter(ngrams))


class StopWordsRemover:
    """
    Stop words removal
    """

    def __init__(self, language: str = 'en'):
        self.language = language
        self.stopwords = self._load_stopwords(language)

    def _load_stopwords(self, language: str) -> Set[str]:
        """
        Load stop words for language
        """
        # English stop words
        if language == 'en':
            return {
                'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an',
                'and', 'any', 'are', 'as', 'at', 'be', 'because', 'been', 'before',
                'being', 'below', 'between', 'both', 'but', 'by', 'can', 'could',
                'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for',
                'from', 'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here',
                'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in',
                'into', 'is', 'it', 'its', 'itself', 'me', 'more', 'most', 'my',
                'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or',
                'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same',
                'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their',
                'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they',
                'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up',
                'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while',
                'who', 'whom', 'why', 'will', 'with', 'you', 'your', 'yours',
                'yourself', 'yourselves',
            }

        # Add other languages as needed
        return set()

    def remove(self, tokens: List[str]) -> List[str]:
        """
        Remove stop words from tokens
        """
        return [token for token in tokens if token.lower() not in self.stopwords]

    def is_stopword(self, word: str) -> bool:
        """
        Check if word is a stop word
        """
        return word.lower() in self.stopwords


class FeatureExtractor:
    """
    Feature extraction for ML models
    """

    @staticmethod
    def extract_length_features(text: str) -> Dict[str, int]:
        """
        Extract length-based features
        """
        tokens = text.split()
        return {
            'char_count': len(text),
            'word_count': len(tokens),
            'sentence_count': len(re.split(r'[.!?]+', text)),
            'avg_word_length': sum(len(w) for w in tokens) / len(tokens) if tokens else 0,
        }

    @staticmethod
    def extract_punctuation_features(text: str) -> Dict[str, int]:
        """
        Extract punctuation features
        """
        return {
            'exclamation_count': text.count('!'),
            'question_count': text.count('?'),
            'period_count': text.count('.'),
            'comma_count': text.count(','),
            'uppercase_count': sum(1 for c in text if c.isupper()),
        }

    @staticmethod
    def extract_sentiment_features(tokens: List[str]) -> Dict[str, float]:
        """
        Extract sentiment-related features
        """
        positive_words = {
            'good', 'great', 'excellent', 'amazing', 'wonderful', 'love', 'best',
            'perfect', 'happy', 'awesome',
        }

        negative_words = {
            'bad', 'terrible', 'horrible', 'awful', 'poor', 'hate', 'worst',
            'disappointed', 'angry', 'sad',
        }

        pos_count = sum(1 for t in tokens if t.lower() in positive_words)
        neg_count = sum(1 for t in tokens if t.lower() in negative_words)

        return {
            'positive_word_count': pos_count,
            'negative_word_count': neg_count,
            'sentiment_ratio': (pos_count - neg_count) / len(tokens) if tokens else 0,
        }

    @staticmethod
    def extract_all_features(text: str) -> Dict[str, any]:
        """
        Extract all features
        """
        tokens = text.split()

        features = {}
        features.update(FeatureExtractor.extract_length_features(text))
        features.update(FeatureExtractor.extract_punctuation_features(text))
        features.update(FeatureExtractor.extract_sentiment_features(tokens))

        return features


class TextAugmenter:
    """
    Text augmentation for training data
    """

    def __init__(self):
        # Synonym dictionary (simplified)
        self.synonyms = {
            'good': ['great', 'excellent', 'nice', 'wonderful'],
            'bad': ['terrible', 'awful', 'poor', 'horrible'],
            'love': ['adore', 'enjoy', 'like'],
            'hate': ['dislike', 'despise', 'detest'],
        }

    def synonym_replacement(self, text: str, n: int = 1) -> str:
        """
        Replace n words with synonyms
        """
        tokens = text.split()
        replacements = 0

        for i, token in enumerate(tokens):
            if replacements >= n:
                break

            token_lower = token.lower()
            if token_lower in self.synonyms:
                synonyms = self.synonyms[token_lower]
                if synonyms:
                    import random
                    tokens[i] = random.choice(synonyms)
                    replacements += 1

        return ' '.join(tokens)

    def random_deletion(self, text: str, p: float = 0.1) -> str:
        """
        Randomly delete words with probability p
        """
        import random
        tokens = text.split()

        if len(tokens) == 1:
            return text

        new_tokens = [t for t in tokens if random.random() > p]

        if not new_tokens:
            return random.choice(tokens)

        return ' '.join(new_tokens)

    def random_swap(self, text: str, n: int = 1) -> str:
        """
        Randomly swap n pairs of words
        """
        import random
        tokens = text.split()

        if len(tokens) < 2:
            return text

        for _ in range(n):
            idx1 = random.randint(0, len(tokens) - 1)
            idx2 = random.randint(0, len(tokens) - 1)
            tokens[idx1], tokens[idx2] = tokens[idx2], tokens[idx1]

        return ' '.join(tokens)


class TextPreprocessor:
    """
    Complete text preprocessing pipeline
    """

    def __init__(self, language: str = 'en'):
        self.tokenizer = Tokenizer()
        self.normalizer = TextNormalizer()
        self.stemmer = Stemmer()
        self.stopwords_remover = StopWordsRemover(language)
        self.feature_extractor = FeatureExtractor()
        self.ngram_extractor = NGramExtractor()

    def preprocess(self, text: str, options: Optional[Dict] = None) -> Dict:
        """
        Preprocess text with various options

        Args:
            text: Input text
            options: Preprocessing options

        Returns:
            Dictionary with preprocessed data
        """
        if options is None:
            options = {}

        result = {
            'original_text': text,
        }

        # Clean text
        text = self.normalizer.remove_extra_whitespace(text)
        text = self.normalizer.normalize_unicode(text)

        # Tokenize
        tokens = self.tokenizer.tokenize(
            text,
            lowercase=options.get('lowercase', True),
            expand_contractions=options.get('expand_contractions', True)
        )
        result['tokens'] = tokens

        # Remove punctuation
        if options.get('remove_punctuation', False):
            text = self.normalizer.remove_punctuation(text)

        # Remove numbers
        if options.get('remove_numbers', False):
            text = self.normalizer.remove_numbers(text)

        # Remove stop words
        if options.get('remove_stopwords', False):
            tokens = self.stopwords_remover.remove(tokens)
            result['tokens_no_stopwords'] = tokens

        # Stemming
        if options.get('stem', False):
            stemmed = self.stemmer.stem_tokens(tokens)
            result['stemmed_tokens'] = stemmed

        # Extract n-grams
        if options.get('extract_ngrams', False):
            ngrams = self.ngram_extractor.extract_all_ngrams(tokens, 1, 3)
            result['ngrams'] = {str(k): [' '.join(ng) for ng in v]
                              for k, v in ngrams.items()}

        # Extract features
        if options.get('extract_features', False):
            features = self.feature_extractor.extract_all_features(text)
            result['features'] = features

        # Processed text
        result['processed_text'] = ' '.join(tokens)

        return result


def main():
    """
    Test preprocessing
    """
    text = "This is an AMAZING product! I absolutely love it. Wouldn't recommend anything else."

    preprocessor = TextPreprocessor()
    result = preprocessor.preprocess(text, {
        'lowercase': True,
        'expand_contractions': True,
        'remove_stopwords': True,
        'stem': True,
        'extract_ngrams': True,
        'extract_features': True,
    })

    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
