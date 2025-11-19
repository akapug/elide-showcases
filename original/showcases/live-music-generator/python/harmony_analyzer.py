"""
Harmonic Analysis and Voice Leading

Advanced harmonic analysis, Roman numeral analysis, functional harmony,
and voice leading optimization.

Features:
- Roman numeral analysis
- Functional harmony classification (T, S, D)
- Voice leading optimization
- Chord progression analysis
- Modulation detection
- Secondary dominants and borrowed chords
- Neo-Riemannian transformations
- Schenkerian reduction
"""

from typing import List, Dict, Tuple, Optional, Set
from enum import Enum
import numpy as np


class HarmonicFunction(Enum):
    """Harmonic function types"""
    TONIC = "T"
    SUBDOMINANT = "S"
    DOMINANT = "D"
    PREDOMINANT = "PD"
    PASSING = "P"


class RomanNumeral(Enum):
    """Roman numerals for scale degrees"""
    I = 1
    II = 2
    III = 3
    IV = 4
    V = 5
    VI = 6
    VII = 7


class ChordQuality(Enum):
    """Chord quality types"""
    MAJOR = "maj"
    MINOR = "min"
    DIMINISHED = "dim"
    AUGMENTED = "aug"
    DOMINANT = "7"
    MAJOR_SEVENTH = "maj7"
    MINOR_SEVENTH = "min7"
    HALF_DIMINISHED = "ø7"
    DIMINISHED_SEVENTH = "°7"


class HarmonyAnalyzer:
    """Main harmony analyzer class"""

    def __init__(self):
        self.function_map = self._build_function_map()

    def _build_function_map(self) -> Dict[int, HarmonicFunction]:
        """Build map of scale degrees to harmonic functions"""

        return {
            1: HarmonicFunction.TONIC,
            2: HarmonicFunction.SUBDOMINANT,
            3: HarmonicFunction.TONIC,
            4: HarmonicFunction.SUBDOMINANT,
            5: HarmonicFunction.DOMINANT,
            6: HarmonicFunction.TONIC,
            7: HarmonicFunction.DOMINANT,
        }

    def analyze_progression(self, chords: List[Dict], key: str = 'C') -> Dict:
        """Analyze a chord progression"""

        analysis = {
            'key': key,
            'chords': [],
            'cadences': [],
            'modulations': [],
            'borrowed_chords': [],
            'secondary_dominants': []
        }

        # Analyze each chord
        for i, chord in enumerate(chords):
            chord_analysis = self._analyze_chord(chord, key)
            analysis['chords'].append(chord_analysis)

            # Check for secondary dominants
            if self._is_secondary_dominant(chord, chords, i):
                analysis['secondary_dominants'].append({
                    'position': i,
                    'chord': chord,
                    'target': chords[i + 1] if i + 1 < len(chords) else None
                })

        # Detect cadences
        analysis['cadences'] = self._detect_cadences(analysis['chords'])

        # Detect modulations
        analysis['modulations'] = self._detect_modulations(chords, key)

        # Detect borrowed chords
        analysis['borrowed_chords'] = self._detect_borrowed_chords(chords, key)

        return analysis

    def _analyze_chord(self, chord: Dict, key: str) -> Dict:
        """Analyze a single chord"""

        symbol = chord.get('symbol', '')
        root = self._extract_root(symbol)
        quality = self._extract_quality(symbol)

        # Calculate scale degree
        degree = self._calculate_degree(root, key)

        # Get Roman numeral
        roman = self._get_roman_numeral(degree, quality)

        # Get harmonic function
        function = self.function_map.get(degree, HarmonicFunction.PASSING)

        return {
            'symbol': symbol,
            'root': root,
            'quality': quality,
            'degree': degree,
            'roman': roman,
            'function': function.value
        }

    def _extract_root(self, symbol: str) -> str:
        """Extract root note from chord symbol"""

        if not symbol:
            return 'C'

        # Handle sharps and flats
        if len(symbol) > 1 and symbol[1] in ['#', 'b']:
            return symbol[:2]
        else:
            return symbol[0]

    def _extract_quality(self, symbol: str) -> str:
        """Extract chord quality from symbol"""

        if 'maj7' in symbol:
            return 'maj7'
        elif 'min7' in symbol or 'm7' in symbol:
            return 'min7'
        elif 'dim7' in symbol or '°7' in symbol:
            return 'dim7'
        elif 'ø7' in symbol or 'm7b5' in symbol:
            return 'ø7'
        elif '7' in symbol:
            return '7'
        elif 'maj' in symbol or symbol[0].isupper():
            return 'maj'
        elif 'min' in symbol or 'm' in symbol:
            return 'min'
        elif 'dim' in symbol:
            return 'dim'
        elif 'aug' in symbol or '+' in symbol:
            return 'aug'
        else:
            return 'maj'

    def _calculate_degree(self, root: str, key: str) -> int:
        """Calculate scale degree of root in key"""

        note_map = {
            'C': 0, 'C#': 1, 'Db': 1,
            'D': 2, 'D#': 3, 'Eb': 3,
            'E': 4,
            'F': 5, 'F#': 6, 'Gb': 6,
            'G': 7, 'G#': 8, 'Ab': 8,
            'A': 9, 'A#': 10, 'Bb': 10,
            'B': 11
        }

        root_val = note_map.get(root, 0)
        key_val = note_map.get(key, 0)

        # Calculate distance in semitones
        distance = (root_val - key_val) % 12

        # Map to scale degree (major scale)
        degree_map = {0: 1, 2: 2, 4: 3, 5: 4, 7: 5, 9: 6, 11: 7}

        return degree_map.get(distance, 1)

    def _get_roman_numeral(self, degree: int, quality: str) -> str:
        """Get Roman numeral notation"""

        numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']
        roman = numerals[degree - 1]

        # Modify based on quality
        if quality in ['min', 'min7']:
            roman = roman.lower()
        elif quality in ['dim', 'dim7', 'ø7']:
            roman = roman.lower() + '°'
        elif quality == 'aug':
            roman = roman + '+'

        # Add quality suffix
        if '7' in quality:
            if quality == 'maj7':
                roman += 'M7'
            elif quality == 'ø7':
                roman += 'ø7'
            elif quality == 'dim7':
                roman += '°7'
            else:
                roman += '7'

        return roman

    def _detect_cadences(self, analyzed_chords: List[Dict]) -> List[Dict]:
        """Detect cadences in progression"""

        cadences = []

        for i in range(len(analyzed_chords) - 1):
            current = analyzed_chords[i]
            next_chord = analyzed_chords[i + 1]

            cadence_type = None

            # Authentic cadence (V-I or V7-I)
            if (current['degree'] == 5 and next_chord['degree'] == 1):
                if current['function'] == 'D' and next_chord['function'] == 'T':
                    cadence_type = 'authentic'

            # Plagal cadence (IV-I)
            elif (current['degree'] == 4 and next_chord['degree'] == 1):
                cadence_type = 'plagal'

            # Half cadence (any-V)
            elif next_chord['degree'] == 5:
                cadence_type = 'half'

            # Deceptive cadence (V-vi)
            elif (current['degree'] == 5 and next_chord['degree'] == 6):
                cadence_type = 'deceptive'

            if cadence_type:
                cadences.append({
                    'type': cadence_type,
                    'position': i,
                    'chords': [current['roman'], next_chord['roman']]
                })

        return cadences

    def _detect_modulations(self, chords: List[Dict], key: str) -> List[Dict]:
        """Detect key modulations"""

        modulations = []

        # Simplified modulation detection
        # Look for pivot chords and new tonal centers

        for i in range(len(chords) - 3):
            # Check if next 3 chords establish new key
            window = chords[i:i+3]

            # Analyze in different keys
            for new_key in ['C', 'G', 'D', 'F', 'Bb', 'A', 'E']:
                if new_key == key:
                    continue

                # Check if window fits new key better
                fit_score = self._calculate_key_fit(window, new_key)

                if fit_score > 0.8:
                    modulations.append({
                        'position': i,
                        'from_key': key,
                        'to_key': new_key,
                        'pivot_chord': chords[i],
                        'confidence': fit_score
                    })

        return modulations

    def _calculate_key_fit(self, chords: List[Dict], key: str) -> float:
        """Calculate how well chords fit a key"""

        # Simplified: count how many chords are diatonic
        diatonic_count = 0

        for chord in chords:
            if self._is_diatonic(chord, key):
                diatonic_count += 1

        return diatonic_count / len(chords)

    def _is_diatonic(self, chord: Dict, key: str) -> bool:
        """Check if chord is diatonic to key"""

        # Simplified: check if chord root is in major scale
        note_map = {
            'C': 0, 'C#': 1, 'Db': 1,
            'D': 2, 'D#': 3, 'Eb': 3,
            'E': 4,
            'F': 5, 'F#': 6, 'Gb': 6,
            'G': 7, 'G#': 8, 'Ab': 8,
            'A': 9, 'A#': 10, 'Bb': 10,
            'B': 11
        }

        root = self._extract_root(chord.get('symbol', ''))
        root_val = note_map.get(root, 0)
        key_val = note_map.get(key, 0)

        distance = (root_val - key_val) % 12

        # Major scale intervals
        diatonic_intervals = [0, 2, 4, 5, 7, 9, 11]

        return distance in diatonic_intervals

    def _is_secondary_dominant(self, chord: Dict, chords: List[Dict], index: int) -> bool:
        """Check if chord is a secondary dominant"""

        quality = self._extract_quality(chord.get('symbol', ''))

        # Must be dominant quality
        if quality != '7':
            return False

        # Must resolve to next chord
        if index >= len(chords) - 1:
            return False

        next_chord = chords[index + 1]

        # Check if it resolves a fifth down
        root = self._extract_root(chord.get('symbol', ''))
        next_root = self._extract_root(next_chord.get('symbol', ''))

        return self._is_fifth_relation(root, next_root)

    def _is_fifth_relation(self, root1: str, root2: str) -> bool:
        """Check if roots are a fifth apart"""

        note_map = {
            'C': 0, 'C#': 1, 'Db': 1,
            'D': 2, 'D#': 3, 'Eb': 3,
            'E': 4,
            'F': 5, 'F#': 6, 'Gb': 6,
            'G': 7, 'G#': 8, 'Ab': 8,
            'A': 9, 'A#': 10, 'Bb': 10,
            'B': 11
        }

        val1 = note_map.get(root1, 0)
        val2 = note_map.get(root2, 0)

        interval = (val1 - val2) % 12

        return interval == 7  # Perfect fifth down

    def _detect_borrowed_chords(self, chords: List[Dict], key: str) -> List[Dict]:
        """Detect borrowed chords (modal interchange)"""

        borrowed = []

        for i, chord in enumerate(chords):
            if not self._is_diatonic(chord, key):
                # Check if it's from parallel minor/major
                if self._is_from_parallel_mode(chord, key):
                    borrowed.append({
                        'position': i,
                        'chord': chord,
                        'source': 'parallel_mode'
                    })

        return borrowed

    def _is_from_parallel_mode(self, chord: Dict, key: str) -> bool:
        """Check if chord is from parallel mode"""

        # Simplified check
        # Common borrowed chords: bVI, bVII, iv (in major)

        root = self._extract_root(chord.get('symbol', ''))
        quality = self._extract_quality(chord.get('symbol', ''))

        # Check for flat scale degrees (borrowed from minor)
        note_map = {
            'C': 0, 'C#': 1, 'Db': 1,
            'D': 2, 'D#': 3, 'Eb': 3,
            'E': 4,
            'F': 5, 'F#': 6, 'Gb': 6,
            'G': 7, 'G#': 8, 'Ab': 8,
            'A': 9, 'A#': 10, 'Bb': 10,
            'B': 11
        }

        root_val = note_map.get(root, 0)
        key_val = note_map.get(key, 0)

        distance = (root_val - key_val) % 12

        # bVI, bVII, iv are common borrowed chords
        borrowed_intervals = [8, 10]  # bVI, bVII

        return distance in borrowed_intervals

    def voice_lead(self, chord1: List[int], chord2: List[int]) -> Tuple[List[int], List[int]]:
        """Find optimal voice leading between chords"""

        # Try all permutations of chord2 and find closest
        best_chord2 = chord2
        best_distance = float('inf')

        # Try different octave positions
        for octave_shift in range(-2, 3):
            shifted = [note + octave_shift * 12 for note in chord2]

            # Try all permutations
            import itertools
            for perm in itertools.permutations(shifted):
                distance = sum(abs(a - b) for a, b in zip(chord1, perm))

                if distance < best_distance:
                    best_distance = distance
                    best_chord2 = list(perm)

        return chord1, best_chord2

    def check_voice_leading_rules(self, chord1: List[int], chord2: List[int]) -> Dict:
        """Check classical voice leading rules"""

        violations = []

        # Check for parallel fifths and octaves
        for i in range(len(chord1) - 1):
            for j in range(i + 1, len(chord1)):
                interval1 = abs(chord1[i] - chord1[j]) % 12
                interval2 = abs(chord2[i] - chord2[j]) % 12

                # Parallel fifths
                if interval1 == 7 and interval2 == 7:
                    violations.append(f"Parallel fifths between voices {i} and {j}")

                # Parallel octaves
                if interval1 == 0 and interval2 == 0:
                    violations.append(f"Parallel octaves between voices {i} and {j}")

        # Check for voice crossing
        for i in range(len(chord1) - 1):
            if chord1[i] < chord1[i+1] and chord2[i] > chord2[i+1]:
                violations.append(f"Voice crossing at voice {i}")

        # Check for large leaps
        for i in range(len(chord1)):
            leap = abs(chord2[i] - chord1[i])
            if leap > 12:  # Octave
                violations.append(f"Large leap in voice {i}: {leap} semitones")

        return {
            'valid': len(violations) == 0,
            'violations': violations,
            'voice_leading_distance': sum(abs(a - b) for a, b in zip(chord1, chord2))
        }

    def neo_riemannian_transform(self, chord: List[int], transform: str) -> List[int]:
        """Apply Neo-Riemannian transformation"""

        # PLR transformations
        # P (Parallel): Toggle major/minor
        # L (Leading-tone): Move by semitone
        # R (Relative): Relative major/minor

        if transform == 'P':
            # Parallel: change third
            return [chord[0], chord[1] + 1 if chord[1] < chord[0] + 4 else chord[1] - 1, chord[2]]

        elif transform == 'L':
            # Leading-tone exchange
            return [chord[0], chord[1], chord[2] + 1]

        elif transform == 'R':
            # Relative
            return [chord[0] + 3, chord[1], chord[2]]

        return chord

    def reduce_to_schenker(self, melody: List[int]) -> List[int]:
        """Schenkerian reduction (simplified)"""

        # Keep structural tones (remove passing and neighbor tones)
        # Simplified: keep notes on strong beats

        reduced = []

        for i, note in enumerate(melody):
            if i % 4 == 0:  # Strong beats
                reduced.append(note)

        return reduced

    def analyze_tension(self, chord: Dict) -> float:
        """Analyze harmonic tension (0-1)"""

        quality = self._extract_quality(chord.get('symbol', ''))

        tension_map = {
            'maj': 0.0,
            'min': 0.2,
            'maj7': 0.3,
            'min7': 0.4,
            '7': 0.6,
            'ø7': 0.8,
            'dim7': 0.9,
            'aug': 0.7
        }

        return tension_map.get(quality, 0.5)

    def suggest_reharmonization(self, chord: Dict, style: str = 'jazz') -> List[str]:
        """Suggest alternative chords (reharmonization)"""

        suggestions = []
        root = self._extract_root(chord.get('symbol', ''))

        if style == 'jazz':
            # Jazz substitutions
            suggestions.extend([
                f"{root}maj7",
                f"{root}9",
                f"{root}13",
                f"{root}6/9"
            ])

            # Tritone substitution
            tritone_root = self._transpose_note(root, 6)
            suggestions.append(f"{tritone_root}7")

        elif style == 'classical':
            # Classical substitutions
            suggestions.extend([
                f"{root}",
                f"{root}6",
                f"{root}7"
            ])

        return suggestions

    def _transpose_note(self, note: str, semitones: int) -> str:
        """Transpose note by semitones"""

        note_map = {
            'C': 0, 'C#': 1, 'Db': 1,
            'D': 2, 'D#': 3, 'Eb': 3,
            'E': 4,
            'F': 5, 'F#': 6, 'Gb': 6,
            'G': 7, 'G#': 8, 'Ab': 8,
            'A': 9, 'A#': 10, 'Bb': 10,
            'B': 11
        }

        reverse_map = {v: k for k, v in note_map.items() if '#' in k or 'b' not in k}

        val = note_map.get(note, 0)
        new_val = (val + semitones) % 12

        return reverse_map.get(new_val, 'C')


# Example usage
if __name__ == '__main__':
    analyzer = HarmonyAnalyzer()

    # Example progression
    progression = [
        {'symbol': 'Cmaj7'},
        {'symbol': 'Am7'},
        {'symbol': 'Dm7'},
        {'symbol': 'G7'},
        {'symbol': 'Cmaj7'},
    ]

    # Analyze
    analysis = analyzer.analyze_progression(progression, 'C')
    print(f"Key: {analysis['key']}")
    print("Chords:")
    for chord in analysis['chords']:
        print(f"  {chord['symbol']}: {chord['roman']} ({chord['function']})")

    print(f"\nCadences: {analysis['cadences']}")

    # Voice leading
    chord1 = [60, 64, 67, 71]  # Cmaj7
    chord2 = [62, 65, 69, 72]  # Dm7

    led1, led2 = analyzer.voice_lead(chord1, chord2)
    print(f"\nVoice leading: {led1} -> {led2}")

    # Check rules
    rules = analyzer.check_voice_leading_rules(led1, led2)
    print(f"Voice leading valid: {rules['valid']}")
    print(f"Distance: {rules['voice_leading_distance']}")
