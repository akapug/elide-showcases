"""
Musical Style Transfer

Transfer musical style from one piece to another while preserving melodic content.
Transform pieces between genres (Jazz → Classical, EDM → Acoustic, etc.).

Features:
- Genre transformation (jazz, classical, EDM, rock, etc.)
- Timbral mapping and synthesis parameter translation
- Rhythmic adaptation and groove transformation
- Harmonic translation (chord substitution, reharmonization)
- Texture and density adjustment
- Preservation of melodic contour and motivic content
"""

import numpy as np
from typing import List, Dict, Tuple, Optional
from enum import Enum


class MusicStyle(Enum):
    """Musical styles/genres"""
    JAZZ = "jazz"
    CLASSICAL = "classical"
    EDM = "edm"
    ROCK = "rock"
    HIPHOP = "hiphop"
    AMBIENT = "ambient"
    LATIN = "latin"
    BLUES = "blues"
    FOLK = "folk"
    METAL = "metal"


class StyleFeatures:
    """Represents style-specific musical features"""

    def __init__(self, style: MusicStyle):
        self.style = style
        self.harmonic_density = self._get_harmonic_density()
        self.rhythmic_complexity = self._get_rhythmic_complexity()
        self.chord_extensions = self._get_chord_extensions()
        self.syncopation = self._get_syncopation()
        self.swing_amount = self._get_swing_amount()
        self.note_density = self._get_note_density()
        self.dynamics_range = self._get_dynamics_range()

    def _get_harmonic_density(self) -> float:
        """Get typical harmonic density (chords per bar)"""
        densities = {
            MusicStyle.JAZZ: 4.0,
            MusicStyle.CLASSICAL: 2.0,
            MusicStyle.EDM: 1.0,
            MusicStyle.ROCK: 2.0,
            MusicStyle.HIPHOP: 1.0,
            MusicStyle.AMBIENT: 0.5,
            MusicStyle.LATIN: 2.0,
            MusicStyle.BLUES: 1.0,
            MusicStyle.FOLK: 1.0,
            MusicStyle.METAL: 2.0,
        }
        return densities.get(self.style, 2.0)

    def _get_rhythmic_complexity(self) -> float:
        """Get rhythmic complexity (0-1)"""
        complexities = {
            MusicStyle.JAZZ: 0.8,
            MusicStyle.CLASSICAL: 0.6,
            MusicStyle.EDM: 0.5,
            MusicStyle.ROCK: 0.4,
            MusicStyle.HIPHOP: 0.7,
            MusicStyle.AMBIENT: 0.2,
            MusicStyle.LATIN: 0.9,
            MusicStyle.BLUES: 0.5,
            MusicStyle.FOLK: 0.3,
            MusicStyle.METAL: 0.8,
        }
        return complexities.get(self.style, 0.5)

    def _get_chord_extensions(self) -> bool:
        """Whether style uses extended chords"""
        return self.style in [MusicStyle.JAZZ, MusicStyle.CLASSICAL]

    def _get_syncopation(self) -> float:
        """Amount of syncopation (0-1)"""
        syncopations = {
            MusicStyle.JAZZ: 0.8,
            MusicStyle.CLASSICAL: 0.3,
            MusicStyle.EDM: 0.6,
            MusicStyle.ROCK: 0.5,
            MusicStyle.HIPHOP: 0.9,
            MusicStyle.AMBIENT: 0.1,
            MusicStyle.LATIN: 0.8,
            MusicStyle.BLUES: 0.6,
            MusicStyle.FOLK: 0.2,
            MusicStyle.METAL: 0.7,
        }
        return syncopations.get(self.style, 0.5)

    def _get_swing_amount(self) -> float:
        """Amount of swing (0-1)"""
        swings = {
            MusicStyle.JAZZ: 0.67,
            MusicStyle.CLASSICAL: 0.0,
            MusicStyle.EDM: 0.0,
            MusicStyle.ROCK: 0.0,
            MusicStyle.HIPHOP: 0.0,
            MusicStyle.AMBIENT: 0.0,
            MusicStyle.LATIN: 0.0,
            MusicStyle.BLUES: 0.6,
            MusicStyle.FOLK: 0.0,
            MusicStyle.METAL: 0.0,
        }
        return swings.get(self.style, 0.0)

    def _get_note_density(self) -> float:
        """Notes per beat"""
        densities = {
            MusicStyle.JAZZ: 4.0,
            MusicStyle.CLASSICAL: 3.0,
            MusicStyle.EDM: 2.0,
            MusicStyle.ROCK: 2.0,
            MusicStyle.HIPHOP: 3.0,
            MusicStyle.AMBIENT: 0.5,
            MusicStyle.LATIN: 4.0,
            MusicStyle.BLUES: 2.0,
            MusicStyle.FOLK: 1.5,
            MusicStyle.METAL: 4.0,
        }
        return densities.get(self.style, 2.0)

    def _get_dynamics_range(self) -> Tuple[int, int]:
        """Velocity range (min, max)"""
        ranges = {
            MusicStyle.JAZZ: (60, 110),
            MusicStyle.CLASSICAL: (40, 127),
            MusicStyle.EDM: (100, 127),
            MusicStyle.ROCK: (80, 120),
            MusicStyle.HIPHOP: (70, 110),
            MusicStyle.AMBIENT: (40, 80),
            MusicStyle.LATIN: (70, 115),
            MusicStyle.BLUES: (60, 100),
            MusicStyle.FOLK: (50, 90),
            MusicStyle.METAL: (90, 127),
        }
        return ranges.get(self.style, (60, 100))


class StyleTransfer:
    """Main style transfer engine"""

    def __init__(self):
        self.style_features = {
            style: StyleFeatures(style) for style in MusicStyle
        }

    def transfer(self, source_music: Dict, target_style: MusicStyle,
                preserve_melody: bool = True) -> Dict:
        """Transfer music to target style"""

        # Extract source features
        source_style = self._detect_style(source_music)
        source_features = self.style_features[source_style]
        target_features = self.style_features[target_style]

        # Transfer components
        transferred = {}

        # Transfer melody (preserve or adapt)
        if preserve_melody:
            transferred['melody'] = self._preserve_melody(
                source_music.get('melody', []),
                target_features
            )
        else:
            transferred['melody'] = self._adapt_melody(
                source_music.get('melody', []),
                target_features
            )

        # Transfer harmony
        transferred['chords'] = self._transfer_harmony(
            source_music.get('chords', []),
            source_features,
            target_features
        )

        # Transfer rhythm
        transferred['rhythm'] = self._transfer_rhythm(
            source_music.get('rhythm', []),
            source_features,
            target_features
        )

        # Apply style-specific effects
        transferred = self._apply_style_effects(transferred, target_features)

        return transferred

    def _detect_style(self, music: Dict) -> MusicStyle:
        """Detect the style of input music"""

        # Analyze musical features
        melody = music.get('melody', [])
        chords = music.get('chords', [])
        rhythm = music.get('rhythm', [])

        # Count syncopations
        syncopations = self._count_syncopations(melody)

        # Check for swing
        has_swing = self._detect_swing(rhythm)

        # Check chord complexity
        chord_complexity = self._analyze_chord_complexity(chords)

        # Simple heuristic-based detection
        if has_swing and chord_complexity > 0.7:
            return MusicStyle.JAZZ
        elif chord_complexity > 0.6:
            return MusicStyle.CLASSICAL
        elif syncopations > 0.8:
            return MusicStyle.HIPHOP
        elif len(melody) < 10:
            return MusicStyle.AMBIENT
        else:
            return MusicStyle.ROCK

    def _count_syncopations(self, melody: List[Dict]) -> float:
        """Count syncopations in melody"""

        if not melody:
            return 0.0

        syncopated = 0
        for note in melody:
            # Check if note starts off the beat
            beat_pos = note.get('startTime', 0) % 1.0
            if 0.2 < beat_pos < 0.8:
                syncopated += 1

        return syncopated / len(melody)

    def _detect_swing(self, rhythm: List[Dict]) -> bool:
        """Detect swing feel in rhythm"""

        # Simplified: check for uneven 8th notes
        # In real implementation: analyze timing deviations

        return False  # Placeholder

    def _analyze_chord_complexity(self, chords: List[Dict]) -> float:
        """Analyze chord complexity"""

        if not chords:
            return 0.0

        complex_count = 0
        for chord in chords:
            symbol = chord.get('symbol', '')
            # Check for extensions (9, 11, 13) or alterations
            if any(ext in symbol for ext in ['9', '11', '13', '#', 'b', 'alt']):
                complex_count += 1

        return complex_count / len(chords)

    def _preserve_melody(self, melody: List[Dict],
                        target_features: StyleFeatures) -> List[Dict]:
        """Preserve melody but adjust articulation and dynamics"""

        preserved = []

        for note in melody:
            new_note = note.copy()

            # Adjust dynamics to target style
            min_vel, max_vel = target_features.dynamics_range
            current_vel = note.get('velocity', 80)

            # Map to target range
            normalized = (current_vel - 40) / 87  # Normalize from typical range
            new_vel = int(min_vel + normalized * (max_vel - min_vel))

            new_note['velocity'] = new_vel

            # Adjust articulation
            if target_features.style == MusicStyle.JAZZ:
                new_note['articulation'] = 'swing'
            elif target_features.style == MusicStyle.CLASSICAL:
                new_note['articulation'] = 'legato'
            elif target_features.style == MusicStyle.EDM:
                new_note['articulation'] = 'staccato'

            preserved.append(new_note)

        return preserved

    def _adapt_melody(self, melody: List[Dict],
                     target_features: StyleFeatures) -> List[Dict]:
        """Adapt melody to target style"""

        adapted = self._preserve_melody(melody, target_features)

        # Add style-specific ornamentations
        if target_features.style == MusicStyle.JAZZ:
            adapted = self._add_jazz_ornaments(adapted)
        elif target_features.style == MusicStyle.CLASSICAL:
            adapted = self._add_classical_ornaments(adapted)

        # Adjust note density
        if target_features.note_density > 2.5:
            adapted = self._increase_note_density(adapted)
        elif target_features.note_density < 1.5:
            adapted = self._decrease_note_density(adapted)

        return adapted

    def _add_jazz_ornaments(self, melody: List[Dict]) -> List[Dict]:
        """Add jazz-style ornaments"""

        ornamented = []

        for i, note in enumerate(melody):
            ornamented.append(note)

            # Add chromatic approaches
            if np.random.random() > 0.7 and i < len(melody) - 1:
                next_note = melody[i + 1]
                approach_pitch = next_note['pitch'] - 1

                ornamented.append({
                    'pitch': approach_pitch,
                    'startTime': note['startTime'] + note['duration'] * 0.75,
                    'duration': note['duration'] * 0.25,
                    'velocity': note['velocity'] - 20
                })

        return ornamented

    def _add_classical_ornaments(self, melody: List[Dict]) -> List[Dict]:
        """Add classical-style ornaments"""

        ornamented = []

        for note in melody:
            ornamented.append(note)

            # Add trills or mordents occasionally
            if np.random.random() > 0.85:
                # Add upper neighbor
                ornamented.append({
                    'pitch': note['pitch'] + 1,
                    'startTime': note['startTime'] + 0.05,
                    'duration': 0.05,
                    'velocity': note['velocity'] - 10
                })

        return ornamented

    def _increase_note_density(self, melody: List[Dict]) -> List[Dict]:
        """Increase note density by adding passing tones"""

        dense = []

        for i, note in enumerate(melody):
            dense.append(note)

            if i < len(melody) - 1:
                next_note = melody[i + 1]
                interval = abs(next_note['pitch'] - note['pitch'])

                # Add passing tone for large intervals
                if interval > 2:
                    step = 1 if next_note['pitch'] > note['pitch'] else -1
                    passing = note['pitch'] + step

                    dense.append({
                        'pitch': passing,
                        'startTime': note['startTime'] + note['duration'] * 0.7,
                        'duration': note['duration'] * 0.3,
                        'velocity': note['velocity'] - 15
                    })

        return dense

    def _decrease_note_density(self, melody: List[Dict]) -> List[Dict]:
        """Decrease note density by removing some notes"""

        # Keep only notes on strong beats
        sparse = []

        for note in melody:
            beat_pos = note.get('startTime', 0) % 1.0
            if beat_pos < 0.1:  # On the beat
                sparse.append(note)
            elif np.random.random() > 0.5:  # Keep some off-beat notes
                sparse.append(note)

        return sparse

    def _transfer_harmony(self, chords: List[Dict],
                         source_features: StyleFeatures,
                         target_features: StyleFeatures) -> List[Dict]:
        """Transfer harmony to target style"""

        transferred = []

        for chord in chords:
            new_chord = chord.copy()

            # Simplify or complexify based on target style
            if target_features.chord_extensions and not source_features.chord_extensions:
                # Add extensions
                new_chord['symbol'] = self._add_chord_extension(chord['symbol'])
            elif not target_features.chord_extensions and source_features.chord_extensions:
                # Simplify to triads or 7ths
                new_chord['symbol'] = self._simplify_chord(chord['symbol'])

            # Apply style-specific substitutions
            if target_features.style == MusicStyle.JAZZ:
                new_chord['symbol'] = self._apply_jazz_substitution(new_chord['symbol'])

            transferred.append(new_chord)

        # Adjust harmonic density
        if target_features.harmonic_density > source_features.harmonic_density:
            transferred = self._increase_harmonic_density(transferred)
        elif target_features.harmonic_density < source_features.harmonic_density:
            transferred = self._decrease_harmonic_density(transferred)

        return transferred

    def _add_chord_extension(self, chord_symbol: str) -> str:
        """Add extension to chord"""

        if '7' not in chord_symbol:
            return chord_symbol.replace('maj', 'maj7').replace('min', 'min7')

        # Add 9th
        if '9' not in chord_symbol:
            return chord_symbol.replace('7', '9')

        return chord_symbol

    def _simplify_chord(self, chord_symbol: str) -> str:
        """Simplify chord to basic triad or 7th"""

        # Remove extensions
        for ext in ['13', '11', '9']:
            chord_symbol = chord_symbol.replace(ext, '7')

        return chord_symbol

    def _apply_jazz_substitution(self, chord_symbol: str) -> str:
        """Apply jazz chord substitution"""

        # Tritone substitution for dominant chords
        if chord_symbol.endswith('7') and 'maj' not in chord_symbol:
            if np.random.random() > 0.7:
                # Could transpose by tritone
                pass

        return chord_symbol

    def _increase_harmonic_density(self, chords: List[Dict]) -> List[Dict]:
        """Increase number of chords"""

        dense = []

        for chord in chords:
            dense.append(chord)

            # Add passing chord
            if np.random.random() > 0.5:
                passing = chord.copy()
                passing['startTime'] = chord['startTime'] + chord['duration'] / 2
                passing['duration'] = chord['duration'] / 2
                dense.append(passing)

        return dense

    def _decrease_harmonic_density(self, chords: List[Dict]) -> List[Dict]:
        """Decrease number of chords"""

        # Keep every other chord
        sparse = []

        for i, chord in enumerate(chords):
            if i % 2 == 0:
                new_chord = chord.copy()
                new_chord['duration'] *= 2
                sparse.append(new_chord)

        return sparse

    def _transfer_rhythm(self, rhythm: List[Dict],
                        source_features: StyleFeatures,
                        target_features: StyleFeatures) -> List[Dict]:
        """Transfer rhythm to target style"""

        transferred = []

        for hit in rhythm:
            new_hit = hit.copy()

            # Adjust velocity for dynamics
            min_vel, max_vel = target_features.dynamics_range
            current_vel = hit.get('velocity', 80)
            normalized = (current_vel - 40) / 87

            new_hit['velocity'] = int(min_vel + normalized * (max_vel - min_vel))

            # Apply swing if target style uses it
            if target_features.swing_amount > 0:
                beat_pos = hit.get('startTime', 0) % 1.0
                if 0.4 < beat_pos < 0.6:  # Off-beat 8th notes
                    new_hit['startTime'] += target_features.swing_amount * 0.1

            transferred.append(new_hit)

        return transferred

    def _apply_style_effects(self, music: Dict,
                            target_features: StyleFeatures) -> Dict:
        """Apply style-specific effects"""

        # Add reverb for ambient/classical
        if target_features.style in [MusicStyle.AMBIENT, MusicStyle.CLASSICAL]:
            music['effects'] = {
                'reverb': {'mix': 0.4, 'decay': 2.5}
            }

        # Add distortion for rock/metal
        elif target_features.style in [MusicStyle.ROCK, MusicStyle.METAL]:
            music['effects'] = {
                'distortion': {'amount': 0.6},
                'reverb': {'mix': 0.2, 'decay': 1.0}
            }

        # Clean sound for jazz
        elif target_features.style == MusicStyle.JAZZ:
            music['effects'] = {
                'reverb': {'mix': 0.2, 'decay': 1.5},
                'compression': {'ratio': 3, 'threshold': -15}
            }

        return music

    def interpolate_styles(self, source_music: Dict,
                          style1: MusicStyle,
                          style2: MusicStyle,
                          mix: float = 0.5) -> Dict:
        """Interpolate between two styles"""

        # Transfer to both styles
        music1 = self.transfer(source_music, style1)
        music2 = self.transfer(source_music, style2)

        # Blend results
        blended = {
            'melody': self._blend_melodies(
                music1.get('melody', []),
                music2.get('melody', []),
                mix
            ),
            'chords': self._blend_chords(
                music1.get('chords', []),
                music2.get('chords', []),
                mix
            ),
            'rhythm': self._blend_rhythms(
                music1.get('rhythm', []),
                music2.get('rhythm', []),
                mix
            )
        }

        return blended

    def _blend_melodies(self, melody1: List[Dict], melody2: List[Dict],
                       mix: float) -> List[Dict]:
        """Blend two melodies"""

        # Use melody1 pitches but blend other parameters
        blended = []

        for i in range(min(len(melody1), len(melody2))):
            note = melody1[i].copy()

            # Blend velocity
            vel1 = melody1[i].get('velocity', 80)
            vel2 = melody2[i].get('velocity', 80)
            note['velocity'] = int(vel1 * (1 - mix) + vel2 * mix)

            # Blend duration
            dur1 = melody1[i].get('duration', 0.5)
            dur2 = melody2[i].get('duration', 0.5)
            note['duration'] = dur1 * (1 - mix) + dur2 * mix

            blended.append(note)

        return blended

    def _blend_chords(self, chords1: List[Dict], chords2: List[Dict],
                     mix: float) -> List[Dict]:
        """Blend two chord progressions"""

        # Choose chords probabilistically
        blended = []

        for i in range(min(len(chords1), len(chords2))):
            if np.random.random() < (1 - mix):
                blended.append(chords1[i])
            else:
                blended.append(chords2[i])

        return blended

    def _blend_rhythms(self, rhythm1: List[Dict], rhythm2: List[Dict],
                      mix: float) -> List[Dict]:
        """Blend two rhythms"""

        # Combine hits from both
        blended = []

        for hit1 in rhythm1:
            if np.random.random() < (1 - mix):
                blended.append(hit1)

        for hit2 in rhythm2:
            if np.random.random() < mix:
                blended.append(hit2)

        # Sort by time
        blended.sort(key=lambda x: x.get('startTime', 0))

        return blended


# Example usage
if __name__ == '__main__':
    transfer = StyleTransfer()

    # Example source music
    source = {
        'melody': [
            {'pitch': 60, 'startTime': 0.0, 'duration': 0.5, 'velocity': 80},
            {'pitch': 62, 'startTime': 0.5, 'duration': 0.5, 'velocity': 85},
            {'pitch': 64, 'startTime': 1.0, 'duration': 0.5, 'velocity': 90},
        ],
        'chords': [
            {'symbol': 'Cmaj', 'startTime': 0.0, 'duration': 2.0},
            {'symbol': 'Dm', 'startTime': 2.0, 'duration': 2.0},
        ],
        'rhythm': [
            {'instrument': 'kick', 'startTime': 0.0, 'velocity': 100},
            {'instrument': 'snare', 'startTime': 1.0, 'velocity': 95},
        ]
    }

    # Transfer to jazz
    jazz_version = transfer.transfer(source, MusicStyle.JAZZ)
    print(f"Transferred to jazz: {len(jazz_version['melody'])} melody notes")

    # Transfer to EDM
    edm_version = transfer.transfer(source, MusicStyle.EDM)
    print(f"Transferred to EDM: {len(edm_version['melody'])} melody notes")

    # Interpolate between jazz and classical
    hybrid = transfer.interpolate_styles(source, MusicStyle.JAZZ, MusicStyle.CLASSICAL, 0.5)
    print(f"Created hybrid style: {len(hybrid['melody'])} melody notes")
