"""NLP Processing - Python spaCy Component"""
from typing import List, Dict, Any

class NLPEngine:
    def tokenize(self, text: str) -> List[str]:
        return text.split()

    def extract_entities(self, text: str) -> List[Dict[str, str]]:
        return [
            {"text": "OpenAI", "type": "ORG", "start": 0, "end": 6},
            {"text": "New York", "type": "GPE", "start": 20, "end": 28}
        ]

    def sentiment_analysis(self, text: str) -> Dict[str, Any]:
        positive_words = ["good", "great", "excellent", "amazing"]
        negative_words = ["bad", "terrible", "awful", "horrible"]

        words = text.lower().split()
        pos_count = sum(1 for w in words if w in positive_words)
        neg_count = sum(1 for w in words if w in negative_words)

        if pos_count > neg_count:
            return {"sentiment": "positive", "score": 0.8}
        elif neg_count > pos_count:
            return {"sentiment": "negative", "score": 0.8}
        return {"sentiment": "neutral", "score": 0.5}

nlp = NLPEngine()
