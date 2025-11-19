"""
Music Theory Library

Comprehensive music theory library providing scales, chords, intervals,
harmonic analysis, voice leading, and counterpoint rules.

Features:
- Scale generation (Western, Modal, Jazz, World music)
- Chord construction (triads, 7ths, extended, altered)
- Interval analysis and recognition
- Voice leading optimization
- Harmonic function analysis
- Counterpoint rules (species counterpoint)
- Circle of fifths relationships
- Key detection and modulation analysis
"""

from typing import List, Tuple, Dict, Optional, Set
from enum import Enum
import math


class NoteName(Enum):
    """Musical note names"""
    C = 0
    C_SHARP = 1
    D_FLAT = 1
    D = 2
    D_SHARP = 3
    E_FLAT = 3
    E = 4
    F = 5
    F_SHARP = 6
    G_FLAT = 6
    G = 7
    G_SHARP = 8
    A_FLAT = 8
    A = 9
    A_SHARP = 10
    B_FLAT = 10
    B = 11


class Interval(Enum):
    """Musical intervals in semitones"""
    UNISON = 0
    MINOR_SECOND = 1
    MAJOR_SECOND = 2
    MINOR_THIRD = 3
    MAJOR_THIRD = 4
    PERFECT_FOURTH = 5
    TRITONE = 6
    PERFECT_FIFTH = 7
    MINOR_SIXTH = 8
    MAJOR_SIXTH = 9
    MINOR_SEVENTH = 10
    MAJOR_SEVENTH = 11
    OCTAVE = 12


class Note:
    """Represents a musical note with pitch and octave"""

    def __init__(self, pitch: int, name: Optional[str] = None, octave: int = 4):
        self.pitch = pitch
        self.name = name or self._pitch_to_name(pitch % 12)
        self.octave = octave

    def _pitch_to_name(self, pitch_class: int) -> str:
        """Convert pitch class to note name"""
        names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        return names[pitch_class % 12]

    def transpose(self, semitones: int) -> 'Note':
        """Transpose note by semitones"""
        new_pitch = self.pitch + semitones
        new_octave = new_pitch // 12 - 1
        return Note(new_pitch, octave=new_octave)

    def __repr__(self) -> str:
        return f"{self.name}{self.octave}"

    def __eq__(self, other) -> bool:
        if isinstance(other, Note):
            return self.pitch == other.pitch
        return False

    def __hash__(self) -> int:
        return hash(self.pitch)


class Scale:
    """Represents a musical scale"""

    # Scale patterns (intervals in semitones from root)
    PATTERNS = {
        # Major scales
        'major': [0, 2, 4, 5, 7, 9, 11],
        'ionian': [0, 2, 4, 5, 7, 9, 11],

        # Minor scales
        'minor': [0, 2, 3, 5, 7, 8, 10],
        'natural_minor': [0, 2, 3, 5, 7, 8, 10],
        'aeolian': [0, 2, 3, 5, 7, 8, 10],
        'harmonic_minor': [0, 2, 3, 5, 7, 8, 11],
        'melodic_minor': [0, 2, 3, 5, 7, 9, 11],

        # Modal scales
        'dorian': [0, 2, 3, 5, 7, 9, 10],
        'phrygian': [0, 1, 3, 5, 7, 8, 10],
        'lydian': [0, 2, 4, 6, 7, 9, 11],
        'mixolydian': [0, 2, 4, 5, 7, 9, 10],
        'locrian': [0, 1, 3, 5, 6, 8, 10],

        # Pentatonic scales
        'pentatonic_major': [0, 2, 4, 7, 9],
        'pentatonic_minor': [0, 3, 5, 7, 10],

        # Blues scales
        'blues': [0, 3, 5, 6, 7, 10],
        'blues_major': [0, 2, 3, 4, 7, 9],

        # Jazz scales
        'bebop_dominant': [0, 2, 4, 5, 7, 9, 10, 11],
        'bebop_major': [0, 2, 4, 5, 7, 8, 9, 11],
        'altered': [0, 1, 3, 4, 6, 8, 10],
        'diminished': [0, 2, 3, 5, 6, 8, 9, 11],
        'whole_tone': [0, 2, 4, 6, 8, 10],

        # Exotic scales
        'hungarian_minor': [0, 2, 3, 6, 7, 8, 11],
        'gypsy': [0, 1, 4, 5, 7, 8, 11],
        'arabic': [0, 1, 4, 5, 7, 8, 11],
        'japanese': [0, 1, 5, 7, 8],
        'hirajoshi': [0, 2, 3, 7, 8],
        'in_sen': [0, 1, 5, 7, 10],
        'iwato': [0, 1, 5, 6, 10],
        'pelog': [0, 1, 3, 7, 8],
        'persian': [0, 1, 4, 5, 6, 8, 11],
        'enigmatic': [0, 1, 4, 6, 8, 10, 11],
    }

    def __init__(self, root: str, scale_type: str = 'major'):
        self.root = root
        self.scale_type = scale_type
        self.pattern = self.PATTERNS.get(scale_type, self.PATTERNS['major'])

    def get_notes(self, octave: int = 4) -> List[Note]:
        """Get all notes in the scale"""
        root_pitch = self._note_name_to_pitch(self.root, octave)
        return [Note(root_pitch + interval, octave=octave) for interval in self.pattern]

    def get_degree(self, degree: int, octave: int = 4) -> Note:
        """Get scale degree (1-indexed)"""
        notes = self.get_notes(octave)
        return notes[(degree - 1) % len(notes)]

    def contains(self, note: Note) -> bool:
        """Check if note is in scale"""
        pitch_class = note.pitch % 12
        root_pitch = self._note_name_to_pitch(self.root, 0)

        for interval in self.pattern:
            if (root_pitch + interval) % 12 == pitch_class:
                return True
        return False

    def _note_name_to_pitch(self, name: str, octave: int) -> int:
        """Convert note name and octave to MIDI pitch"""
        note_map = {
            'C': 0, 'C#': 1, 'Db': 1,
            'D': 2, 'D#': 3, 'Eb': 3,
            'E': 4,
            'F': 5, 'F#': 6, 'Gb': 6,
            'G': 7, 'G#': 8, 'Ab': 8,
            'A': 9, 'A#': 10, 'Bb': 10,
            'B': 11
        }

        return (octave + 1) * 12 + note_map.get(name, 0)

    @classmethod
    def get_available_scales(cls) -> List[str]:
        """Get list of available scale types"""
        return list(cls.PATTERNS.keys())


class Chord:
    """Represents a musical chord"""

    # Chord formulas (intervals from root)
    FORMULAS = {
        # Triads
        'major': [0, 4, 7],
        'minor': [0, 3, 7],
        'diminished': [0, 3, 6],
        'augmented': [0, 4, 8],
        'sus2': [0, 2, 7],
        'sus4': [0, 5, 7],

        # Seventh chords
        'maj7': [0, 4, 7, 11],
        'min7': [0, 3, 7, 10],
        '7': [0, 4, 7, 10],
        'dim7': [0, 3, 6, 9],
        'half_dim7': [0, 3, 6, 10],
        'min_maj7': [0, 3, 7, 11],
        'aug7': [0, 4, 8, 10],

        # Extended chords
        'maj9': [0, 4, 7, 11, 14],
        'min9': [0, 3, 7, 10, 14],
        '9': [0, 4, 7, 10, 14],
        '7#9': [0, 4, 7, 10, 15],
        '7b9': [0, 4, 7, 10, 13],
        'maj11': [0, 4, 7, 11, 14, 17],
        'min11': [0, 3, 7, 10, 14, 17],
        '11': [0, 4, 7, 10, 14, 17],
        'maj13': [0, 4, 7, 11, 14, 17, 21],
        'min13': [0, 3, 7, 10, 14, 17, 21],
        '13': [0, 4, 7, 10, 14, 17, 21],

        # Altered chords
        '7#5': [0, 4, 8, 10],
        '7b5': [0, 4, 6, 10],
        'alt': [0, 4, 6, 10, 13],

        # Add chords
        'add9': [0, 4, 7, 14],
        'm_add9': [0, 3, 7, 14],
        '6': [0, 4, 7, 9],
        'min6': [0, 3, 7, 9],
        '6/9': [0, 4, 7, 9, 14],
    }

    def __init__(self, root: str, chord_type: str = 'major', octave: int = 4):
        self.root = root
        self.chord_type = chord_type
        self.octave = octave
        self.formula = self.FORMULAS.get(chord_type, self.FORMULAS['major'])

    def get_notes(self) -> List[Note]:
        """Get all notes in the chord"""
        root_pitch = self._note_name_to_pitch(self.root, self.octave)
        return [Note(root_pitch + interval) for interval in self.formula]

    def voice(self, voicing: str = 'close', lowest_octave: int = 3) -> List[Note]:
        """Apply voicing to chord"""
        notes = self.get_notes()

        if voicing == 'close':
            return self._close_voicing(notes, lowest_octave)
        elif voicing == 'open':
            return self._open_voicing(notes, lowest_octave)
        elif voicing == 'drop2':
            return self._drop2_voicing(notes, lowest_octave)
        elif voicing == 'drop3':
            return self._drop3_voicing(notes, lowest_octave)
        else:
            return notes

    def _close_voicing(self, notes: List[Note], lowest_octave: int) -> List[Note]:
        """Close voicing (all notes within an octave)"""
        voiced = []
        for i, note in enumerate(notes):
            octave = lowest_octave + (i // 7)
            pitch = self._note_name_to_pitch(note.name, octave)
            voiced.append(Note(pitch))
        return voiced

    def _open_voicing(self, notes: List[Note], lowest_octave: int) -> List[Note]:
        """Open voicing (spread across octaves)"""
        voiced = []
        for i, note in enumerate(notes):
            octave = lowest_octave + (i // 3)
            pitch = self._note_name_to_pitch(note.name, octave)
            voiced.append(Note(pitch))
        return voiced

    def _drop2_voicing(self, notes: List[Note], lowest_octave: int) -> List[Note]:
        """Drop 2 voicing (second from top dropped an octave)"""
        voiced = self._close_voicing(notes, lowest_octave)
        if len(voiced) >= 2:
            voiced[-2] = voiced[-2].transpose(-12)
        return voiced

    def _drop3_voicing(self, notes: List[Note], lowest_octave: int) -> List[Note]:
        """Drop 3 voicing (third from top dropped an octave)"""
        voiced = self._close_voicing(notes, lowest_octave)
        if len(voiced) >= 3:
            voiced[-3] = voiced[-3].transpose(-12)
        return voiced

    def _note_name_to_pitch(self, name: str, octave: int) -> int:
        """Convert note name and octave to MIDI pitch"""
        note_map = {
            'C': 0, 'C#': 1, 'Db': 1,
            'D': 2, 'D#': 3, 'Eb': 3,
            'E': 4,
            'F': 5, 'F#': 6, 'Gb': 6,
            'G': 7, 'G#': 8, 'Ab': 8,
            'A': 9, 'A#': 10, 'Bb': 10,
            'B': 11
        }

        return (octave + 1) * 12 + note_map.get(name, 0)

    def get_function(self) -> str:
        """Get harmonic function of chord"""
        if 'maj' in self.chord_type or self.chord_type == 'major':
            return 'tonic'
        elif 'dim' in self.chord_type:
            return 'dominant'
        elif '7' in self.chord_type:
            return 'dominant'
        else:
            return 'subdominant'


class MusicTheory:
    """Main music theory class"""

    def __init__(self):
        self.circle_of_fifths = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#', 'F']

    def get_scale(self, root: str, scale_type: str = 'major') -> Scale:
        """Get a scale"""
        return Scale(root, scale_type)

    def build_chord(self, root: str, chord_type: str = 'major', octave: int = 4) -> Chord:
        """Build a chord"""
        return Chord(root, chord_type, octave)

    def generate_progression(self,
                           key: str,
                           mode: str = 'major',
                           style: str = 'pop',
                           num_chords: int = 4) -> List[Chord]:
        """Generate a chord progression"""

        scale = Scale(key, mode)

        # Common progressions by style
        progressions = {
            'pop': [1, 5, 6, 4],
            'jazz': [1, 6, 2, 5],
            'rock': [1, 4, 5, 1],
            'blues': [1, 1, 4, 4, 1, 1, 5, 4, 1, 1],
            'classical': [1, 4, 5, 1],
        }

        pattern = progressions.get(style, [1, 4, 5, 1])

        chords = []
        for i in range(num_chords):
            degree = pattern[i % len(pattern)]
            root_note = scale.get_degree(degree)

            # Determine chord quality based on mode and degree
            chord_type = self._get_chord_quality(mode, degree)

            chord = Chord(root_note.name, chord_type)
            chords.append(chord)

        return chords

    def _get_chord_quality(self, mode: str, degree: int) -> str:
        """Determine chord quality for scale degree"""

        major_qualities = {
            1: 'maj7', 2: 'min7', 3: 'min7',
            4: 'maj7', 5: '7', 6: 'min7', 7: 'half_dim7'
        }

        minor_qualities = {
            1: 'min7', 2: 'half_dim7', 3: 'maj7',
            4: 'min7', 5: 'min7', 6: 'maj7', 7: '7'
        }

        if mode == 'major':
            return major_qualities.get(degree, 'maj7')
        elif mode == 'minor':
            return minor_qualities.get(degree, 'min7')
        else:
            return 'maj7'

    def analyze_harmony(self, notes: List[Note]) -> Dict:
        """Analyze harmony of a set of notes"""

        if not notes:
            return {'key': None, 'scale': None, 'chords': []}

        # Extract pitch classes
        pitch_classes = set(note.pitch % 12 for note in notes)

        # Try to detect key
        key = self._detect_key(pitch_classes)

        # Try to identify chords
        chords = self._identify_chords(notes)

        return {
            'key': key,
            'pitch_classes': list(pitch_classes),
            'chords': chords,
            'num_notes': len(notes)
        }

    def _detect_key(self, pitch_classes: Set[int]) -> Optional[str]:
        """Detect key from pitch classes"""

        # Try all major and minor keys
        for root in range(12):
            # Check major
            major_scale = Scale.PATTERNS['major']
            major_pcs = set((root + i) % 12 for i in major_scale)

            if pitch_classes.issubset(major_pcs):
                note_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
                return f"{note_names[root]} major"

            # Check minor
            minor_scale = Scale.PATTERNS['minor']
            minor_pcs = set((root + i) % 12 for i in minor_scale)

            if pitch_classes.issubset(minor_pcs):
                note_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
                return f"{note_names[root]} minor"

        return None

    def _identify_chords(self, notes: List[Note]) -> List[str]:
        """Identify chords from notes"""

        # Group notes that are close in time
        # Simplified: assume all notes form one chord

        pitch_classes = sorted(set(note.pitch % 12 for note in notes))

        # Try to match against known chord formulas
        for chord_name, formula in Chord.FORMULAS.items():
            # Transpose formula to start at each pitch class
            for root in pitch_classes:
                transposed = [(root + i) % 12 for i in formula]
                if set(transposed) == set(pitch_classes):
                    note_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
                    return [f"{note_names[root]}{chord_name}"]

        return []

    def voice_lead(self, chord1: Chord, chord2: Chord) -> Tuple[List[Note], List[Note]]:
        """Find optimal voice leading between two chords"""

        notes1 = chord1.get_notes()
        notes2 = chord2.get_notes()

        # Find closest voicing
        best_voicing = notes2
        best_distance = float('inf')

        # Try different octave transpositions
        for octave_shift in range(-2, 3):
            transposed = [note.transpose(octave_shift * 12) for note in notes2]
            distance = self._voice_distance(notes1, transposed)

            if distance < best_distance:
                best_distance = distance
                best_voicing = transposed

        return notes1, best_voicing

    def _voice_distance(self, notes1: List[Note], notes2: List[Note]) -> float:
        """Calculate voice leading distance"""

        min_len = min(len(notes1), len(notes2))
        total_distance = 0

        for i in range(min_len):
            total_distance += abs(notes1[i].pitch - notes2[i].pitch)

        return total_distance

    def check_counterpoint_rules(self, voice1: List[Note], voice2: List[Note]) -> Dict:
        """Check species counterpoint rules"""

        violations = []

        for i in range(min(len(voice1), len(voice2)) - 1):
            # Get intervals
            interval = abs(voice1[i].pitch - voice2[i].pitch) % 12
            next_interval = abs(voice1[i+1].pitch - voice2[i+1].pitch) % 12

            # Check for parallel fifths
            if interval == 7 and next_interval == 7:
                violations.append(f"Parallel fifths at position {i}")

            # Check for parallel octaves
            if interval == 0 and next_interval == 0:
                violations.append(f"Parallel octaves at position {i}")

            # Check for voice crossing
            if voice1[i].pitch < voice2[i].pitch and voice1[i+1].pitch > voice2[i+1].pitch:
                violations.append(f"Voice crossing at position {i}")

            # Check for large leaps
            leap1 = abs(voice1[i+1].pitch - voice1[i].pitch)
            leap2 = abs(voice2[i+1].pitch - voice2[i].pitch)

            if leap1 > 12:
                violations.append(f"Large leap in voice 1 at position {i}")
            if leap2 > 12:
                violations.append(f"Large leap in voice 2 at position {i}")

        return {
            'valid': len(violations) == 0,
            'violations': violations
        }

    def get_interval(self, note1: Note, note2: Note) -> Tuple[str, int]:
        """Get interval between two notes"""

        semitones = abs(note2.pitch - note1.pitch) % 12

        interval_names = {
            0: 'Perfect Unison',
            1: 'Minor Second',
            2: 'Major Second',
            3: 'Minor Third',
            4: 'Major Third',
            5: 'Perfect Fourth',
            6: 'Tritone',
            7: 'Perfect Fifth',
            8: 'Minor Sixth',
            9: 'Major Sixth',
            10: 'Minor Seventh',
            11: 'Major Seventh',
        }

        return interval_names.get(semitones, 'Unknown'), semitones

    def transpose_progression(self, chords: List[Chord], semitones: int) -> List[Chord]:
        """Transpose a chord progression"""

        transposed = []

        for chord in chords:
            root_pitch = self._note_name_to_pitch(chord.root, 0)
            new_pitch = (root_pitch + semitones) % 12

            note_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
            new_root = note_names[new_pitch]

            transposed.append(Chord(new_root, chord.chord_type, chord.octave))

        return transposed

    def _note_name_to_pitch(self, name: str, octave: int) -> int:
        """Convert note name and octave to MIDI pitch"""
        note_map = {
            'C': 0, 'C#': 1, 'Db': 1,
            'D': 2, 'D#': 3, 'Eb': 3,
            'E': 4,
            'F': 5, 'F#': 6, 'Gb': 6,
            'G': 7, 'G#': 8, 'Ab': 8,
            'A': 9, 'A#': 10, 'Bb': 10,
            'B': 11
        }

        return (octave + 1) * 12 + note_map.get(name, 0)

    def get_circle_of_fifths_position(self, key: str) -> int:
        """Get position in circle of fifths"""
        try:
            return self.circle_of_fifths.index(key)
        except ValueError:
            return -1

    def find_related_keys(self, key: str) -> Dict[str, str]:
        """Find related keys"""

        position = self.get_circle_of_fifths_position(key)

        if position == -1:
            return {}

        num_keys = len(self.circle_of_fifths)

        return {
            'dominant': self.circle_of_fifths[(position + 1) % num_keys],
            'subdominant': self.circle_of_fifths[(position - 1) % num_keys],
            'relative_minor': self.circle_of_fifths[(position + 9) % num_keys],
            'parallel_minor': key,  # Simplified
        }


# Example usage
if __name__ == '__main__':
    theory = MusicTheory()

    # Create a scale
    c_major = theory.get_scale('C', 'major')
    print(f"C Major scale: {[str(note) for note in c_major.get_notes()]}")

    # Build a chord
    c_maj7 = theory.build_chord('C', 'maj7')
    print(f"Cmaj7 chord: {[str(note) for note in c_maj7.get_notes()]}")

    # Generate a progression
    progression = theory.generate_progression('C', 'major', 'jazz', 4)
    print(f"Jazz progression in C: {[f'{c.root}{c.chord_type}' for c in progression]}")

    # Analyze harmony
    notes = c_maj7.get_notes()
    analysis = theory.analyze_harmony(notes)
    print(f"Harmony analysis: {analysis}")
