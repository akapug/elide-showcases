#!/usr/bin/env python3
"""
Named Entity Recognition Processor

Uses spaCy for fast, accurate entity extraction
"""

import sys
import json
import time
import os
import spacy

SPACY_MODEL = os.getenv('SPACY_MODEL', 'en_core_web_sm')

# Load spaCy model
nlp = None


def init_model():
    """Initialize spaCy model (lazy loading)"""
    global nlp
    if nlp is None:
        nlp = spacy.load(SPACY_MODEL)


def extract_entities(text: str):
    """Extract named entities from text"""
    init_model()

    start_time = time.time()

    doc = nlp(text)

    entities = []
    entity_types = {}

    for ent in doc.ents:
        entity_data = {
            'text': ent.text,
            'label': ent.label_,
            'start': ent.start_char,
            'end': ent.end_char,
        }
        entities.append(entity_data)

        # Count entity types
        if ent.label_ not in entity_types:
            entity_types[ent.label_] = 0
        entity_types[ent.label_] += 1

    processing_time = (time.time() - start_time) * 1000

    return {
        'entities': entities,
        'entityCount': len(entities),
        'entityTypes': entity_types,
        'performance': {
            'processingTime': processing_time,
            'entitiesPerSecond': len(entities) / (processing_time / 1000) if processing_time > 0 else 0,
        }
    }


def main():
    """Main entry point"""
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())

        text = input_data['text']

        # Extract entities
        result = extract_entities(text)

        # Output result as JSON
        print(json.dumps(result))

    except Exception as e:
        error_result = {
            'error': str(e),
            'type': type(e).__name__,
        }
        print(json.dumps(error_result), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
