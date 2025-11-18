#!/usr/bin/env python3
"""
Speaker Diarization Engine
Identifies and segments speakers in audio
"""

import sys
import json
import io
import time
import warnings
warnings.filterwarnings('ignore')

import numpy as np
import soundfile as sf

try:
    from pyannote.audio import Pipeline
    PYANNOTE_AVAILABLE = True
except ImportError:
    PYANNOTE_AVAILABLE = False


class SpeakerDiarizer:
    def __init__(self, hf_token=None, device='cpu'):
        """
        Initialize speaker diarization

        Args:
            hf_token: HuggingFace token for pyannote models
            device: 'cpu' or 'cuda'
        """
        self.device = device
        self.hf_token = hf_token

        if PYANNOTE_AVAILABLE and hf_token:
            try:
                self.pipeline = Pipeline.from_pretrained(
                    "pyannote/speaker-diarization-3.1",
                    use_auth_token=hf_token
                )
                if device == 'cuda':
                    self.pipeline = self.pipeline.to(device)
            except Exception as e:
                print(f"Warning: Could not load pyannote pipeline: {e}", file=sys.stderr)
                self.pipeline = None
        else:
            self.pipeline = None

    def diarize(
        self,
        audio_data,
        min_speakers=1,
        max_speakers=10,
        sample_rate=16000
    ):
        """
        Perform speaker diarization

        Args:
            audio_data: Audio data as numpy array or bytes
            min_speakers: Minimum number of speakers
            max_speakers: Maximum number of speakers
            sample_rate: Audio sample rate

        Returns:
            Dictionary with speaker segments
        """
        start_time = time.time()

        # Load audio if it's bytes
        if isinstance(audio_data, bytes):
            audio_file = io.BytesIO(audio_data)
            audio_data, sample_rate = sf.read(audio_file)

        # Convert to float32 if needed
        if audio_data.dtype != np.float32:
            audio_data = audio_data.astype(np.float32)

        if self.pipeline:
            result = self._diarize_pyannote(
                audio_data,
                sample_rate,
                min_speakers,
                max_speakers
            )
        else:
            # Fallback to simple energy-based segmentation
            result = self._diarize_simple(
                audio_data,
                sample_rate,
                min_speakers,
                max_speakers
            )

        processing_time = time.time() - start_time
        result['processingTime'] = processing_time * 1000  # ms

        return result

    def _diarize_pyannote(
        self,
        audio_data,
        sample_rate,
        min_speakers,
        max_speakers
    ):
        """Use pyannote.audio for diarization"""
        # Save to temp WAV file for pyannote
        import tempfile
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
            sf.write(f.name, audio_data, sample_rate)
            temp_path = f.name

        try:
            # Run diarization
            diarization = self.pipeline(
                temp_path,
                min_speakers=min_speakers,
                max_speakers=max_speakers
            )

            # Extract segments
            segments = []
            speakers = {}

            for turn, _, speaker in diarization.itertracks(yield_label=True):
                segment = {
                    'start': turn.start,
                    'end': turn.end,
                    'speaker': speaker,
                    'duration': turn.end - turn.start
                }
                segments.append(segment)

                # Track speaker stats
                if speaker not in speakers:
                    speakers[speaker] = {
                        'id': speaker,
                        'name': f'Speaker {len(speakers) + 1}',
                        'segments': [],
                        'totalDuration': 0,
                        'speakingTime': 0
                    }

                speakers[speaker]['segments'].append(len(segments) - 1)
                speakers[speaker]['speakingTime'] += segment['duration']

            # Calculate total durations
            total_duration = max(s['end'] for s in segments) if segments else 0
            for speaker_id, speaker_data in speakers.items():
                speaker_data['totalDuration'] = total_duration

            return {
                'segments': segments,
                'speakers': list(speakers.values()),
                'totalSpeakers': len(speakers),
                'duration': total_duration
            }

        finally:
            import os
            os.unlink(temp_path)

    def _diarize_simple(
        self,
        audio_data,
        sample_rate,
        min_speakers,
        max_speakers
    ):
        """
        Simple energy-based speaker segmentation
        This is a fallback when pyannote is not available
        """
        # Calculate energy
        frame_length = int(sample_rate * 0.025)  # 25ms frames
        hop_length = int(sample_rate * 0.010)   # 10ms hop

        # Compute short-time energy
        energy = []
        for i in range(0, len(audio_data) - frame_length, hop_length):
            frame = audio_data[i:i + frame_length]
            energy.append(np.sum(frame ** 2))

        energy = np.array(energy)

        # Simple voice activity detection
        threshold = np.mean(energy) * 0.5
        is_speech = energy > threshold

        # Find speech segments
        segments = []
        in_segment = False
        start_idx = 0

        for i, speech in enumerate(is_speech):
            if speech and not in_segment:
                start_idx = i
                in_segment = True
            elif not speech and in_segment:
                # End of segment
                start_time = start_idx * hop_length / sample_rate
                end_time = i * hop_length / sample_rate
                segments.append({
                    'start': start_time,
                    'end': end_time,
                    'speaker': 'SPEAKER_01',  # Single speaker for simple method
                    'duration': end_time - start_time
                })
                in_segment = False

        # Add final segment if needed
        if in_segment:
            start_time = start_idx * hop_length / sample_rate
            end_time = len(is_speech) * hop_length / sample_rate
            segments.append({
                'start': start_time,
                'end': end_time,
                'speaker': 'SPEAKER_01',
                'duration': end_time - start_time
            })

        # Create speaker info
        speakers = [{
            'id': 'SPEAKER_01',
            'name': 'Speaker 1',
            'segments': list(range(len(segments))),
            'totalDuration': segments[-1]['end'] if segments else 0,
            'speakingTime': sum(s['duration'] for s in segments)
        }] if segments else []

        return {
            'segments': segments,
            'speakers': speakers,
            'totalSpeakers': len(speakers),
            'duration': segments[-1]['end'] if segments else 0
        }

    def align_with_transcription(self, diarization, transcription):
        """
        Align speaker diarization with transcription segments

        Args:
            diarization: Diarization result
            transcription: Transcription segments

        Returns:
            Transcription segments with speaker labels
        """
        aligned_segments = []

        for trans_seg in transcription['segments']:
            trans_start = trans_seg['start']
            trans_end = trans_seg['end']
            trans_mid = (trans_start + trans_end) / 2

            # Find overlapping speaker
            speaker = None
            max_overlap = 0

            for diar_seg in diarization['segments']:
                # Calculate overlap
                overlap_start = max(trans_start, diar_seg['start'])
                overlap_end = min(trans_end, diar_seg['end'])
                overlap = max(0, overlap_end - overlap_start)

                if overlap > max_overlap:
                    max_overlap = overlap
                    speaker = diar_seg['speaker']

            # Add speaker to segment
            aligned_seg = trans_seg.copy()
            aligned_seg['speaker'] = speaker
            aligned_segments.append(aligned_seg)

        return aligned_segments


def main():
    """Main entry point for CLI usage"""
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': 'Missing command. Use: diarize or align'
        }))
        sys.exit(1)

    command = sys.argv[1]
    config = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}

    # Initialize diarizer
    diarizer = SpeakerDiarizer(
        hf_token=config.get('hfToken'),
        device=config.get('device', 'cpu')
    )

    if command == 'diarize':
        # Read audio from stdin
        audio_data = sys.stdin.buffer.read()

        try:
            result = diarizer.diarize(
                audio_data,
                min_speakers=config.get('minSpeakers', 1),
                max_speakers=config.get('maxSpeakers', 10)
            )

            print(json.dumps({
                'success': True,
                'result': result
            }))
        except Exception as e:
            print(json.dumps({
                'success': False,
                'error': str(e)
            }))
            sys.exit(1)

    elif command == 'align':
        # Read diarization and transcription from config
        diarization = config.get('diarization')
        transcription = config.get('transcription')

        if not diarization or not transcription:
            print(json.dumps({
                'success': False,
                'error': 'Missing diarization or transcription data'
            }))
            sys.exit(1)

        try:
            aligned = diarizer.align_with_transcription(diarization, transcription)

            print(json.dumps({
                'success': True,
                'result': aligned
            }))
        except Exception as e:
            print(json.dumps({
                'success': False,
                'error': str(e)
            }))
            sys.exit(1)


if __name__ == '__main__':
    main()
