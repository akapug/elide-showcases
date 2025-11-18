#!/usr/bin/env python3
"""
Whisper Transcription Engine
Supports both OpenAI Whisper and Faster-Whisper
"""

import sys
import json
import io
import time
import warnings
warnings.filterwarnings('ignore')

import numpy as np
import soundfile as sf

# Try to import faster-whisper first, fall back to whisper
try:
    from faster_whisper import WhisperModel
    USE_FASTER_WHISPER = True
except ImportError:
    import whisper
    USE_FASTER_WHISPER = False


class WhisperTranscriber:
    def __init__(
        self,
        model_size='base',
        device='cpu',
        compute_type='int8',
        use_faster=True
    ):
        self.model_size = model_size
        self.device = device
        self.compute_type = compute_type
        self.use_faster = use_faster and USE_FASTER_WHISPER

        # Load model
        if self.use_faster:
            self.model = WhisperModel(
                model_size,
                device=device,
                compute_type=compute_type
            )
        else:
            self.model = whisper.load_model(model_size, device=device)

    def transcribe(
        self,
        audio_data,
        language=None,
        task='transcribe',
        enable_timestamps=True,
        enable_word_timestamps=False,
        temperature=0.0,
        compression_ratio_threshold=2.4,
        logprob_threshold=-1.0,
        no_speech_threshold=0.6
    ):
        """
        Transcribe audio data

        Args:
            audio_data: Audio data as numpy array or file path
            language: Language code (e.g., 'en', 'es', 'fr') or None for auto-detect
            task: 'transcribe' or 'translate'
            enable_timestamps: Include segment timestamps
            enable_word_timestamps: Include word-level timestamps
            temperature: Sampling temperature (0 = greedy)
            compression_ratio_threshold: If compression ratio > threshold, treat as failed
            logprob_threshold: If avg logprob < threshold, treat as failed
            no_speech_threshold: If no-speech probability > threshold, skip

        Returns:
            Dictionary with transcription results
        """
        start_time = time.time()

        # Load audio if it's a file path
        if isinstance(audio_data, str):
            audio_data, sample_rate = sf.read(audio_data)
        elif isinstance(audio_data, bytes):
            audio_file = io.BytesIO(audio_data)
            audio_data, sample_rate = sf.read(audio_file)

        # Convert to float32 if needed
        if audio_data.dtype != np.float32:
            audio_data = audio_data.astype(np.float32)

        # Transcribe
        if self.use_faster:
            result = self._transcribe_faster(
                audio_data,
                language=language,
                task=task,
                enable_word_timestamps=enable_word_timestamps,
                temperature=temperature,
                compression_ratio_threshold=compression_ratio_threshold,
                logprob_threshold=logprob_threshold,
                no_speech_threshold=no_speech_threshold
            )
        else:
            result = self._transcribe_original(
                audio_data,
                language=language,
                task=task,
                enable_word_timestamps=enable_word_timestamps,
                temperature=temperature
            )

        processing_time = time.time() - start_time

        # Calculate real-time factor
        audio_duration = len(audio_data) / 16000  # Assuming 16kHz
        rtf = processing_time / audio_duration if audio_duration > 0 else 0

        # Add performance metrics
        result['performance'] = {
            'processingTime': processing_time * 1000,  # ms
            'audioDuration': audio_duration,
            'realTimeFactor': rtf,
            'throughput': audio_duration / processing_time if processing_time > 0 else 0
        }

        return result

    def _transcribe_faster(
        self,
        audio_data,
        language=None,
        task='transcribe',
        enable_word_timestamps=False,
        temperature=0.0,
        compression_ratio_threshold=2.4,
        logprob_threshold=-1.0,
        no_speech_threshold=0.6
    ):
        """Transcribe using faster-whisper"""
        segments, info = self.model.transcribe(
            audio_data,
            language=language,
            task=task,
            word_timestamps=enable_word_timestamps,
            temperature=temperature,
            compression_ratio_threshold=compression_ratio_threshold,
            log_prob_threshold=logprob_threshold,
            no_speech_threshold=no_speech_threshold
        )

        # Convert segments to list
        segments_list = []
        full_text = []

        for i, segment in enumerate(segments):
            segment_dict = {
                'id': i,
                'start': segment.start,
                'end': segment.end,
                'text': segment.text.strip(),
                'confidence': segment.avg_logprob
            }

            # Add word timestamps if available
            if enable_word_timestamps and segment.words:
                segment_dict['words'] = [
                    {
                        'word': word.word,
                        'start': word.start,
                        'end': word.end,
                        'confidence': word.probability
                    }
                    for word in segment.words
                ]

            segments_list.append(segment_dict)
            full_text.append(segment.text.strip())

        return {
            'text': ' '.join(full_text),
            'segments': segments_list,
            'language': info.language,
            'languageProbability': info.language_probability,
            'duration': info.duration
        }

    def _transcribe_original(
        self,
        audio_data,
        language=None,
        task='transcribe',
        enable_word_timestamps=False,
        temperature=0.0
    ):
        """Transcribe using original whisper"""
        result = self.model.transcribe(
            audio_data,
            language=language,
            task=task,
            word_timestamps=enable_word_timestamps,
            temperature=temperature,
            verbose=False
        )

        # Convert segments
        segments_list = []
        for i, segment in enumerate(result['segments']):
            segment_dict = {
                'id': i,
                'start': segment['start'],
                'end': segment['end'],
                'text': segment['text'].strip()
            }

            # Add word timestamps if available
            if enable_word_timestamps and 'words' in segment:
                segment_dict['words'] = [
                    {
                        'word': word['word'],
                        'start': word['start'],
                        'end': word['end'],
                        'confidence': word.get('probability', 1.0)
                    }
                    for word in segment['words']
                ]

            segments_list.append(segment_dict)

        return {
            'text': result['text'],
            'segments': segments_list,
            'language': result.get('language', 'unknown'),
            'languageProbability': 1.0,
            'duration': segments_list[-1]['end'] if segments_list else 0
        }

    def transcribe_streaming(
        self,
        audio_chunk,
        language=None,
        context=None
    ):
        """
        Transcribe a streaming audio chunk

        Args:
            audio_chunk: Audio chunk as numpy array
            language: Language code
            context: Previous transcription context for continuity

        Returns:
            Dictionary with chunk transcription
        """
        # Simple streaming: transcribe each chunk independently
        # In production, you'd want to maintain context between chunks
        result = self.transcribe(
            audio_chunk,
            language=language,
            enable_timestamps=True,
            enable_word_timestamps=False
        )

        return {
            'text': result['text'],
            'isFinal': True,
            'confidence': result['segments'][0].get('confidence', 1.0) if result['segments'] else 1.0
        }


def main():
    """Main entry point for CLI usage"""
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': 'Missing command. Use: transcribe, streaming, or info'
        }))
        sys.exit(1)

    command = sys.argv[1]

    # Parse config
    config = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}

    # Initialize transcriber
    transcriber = WhisperTranscriber(
        model_size=config.get('model', 'base'),
        device=config.get('device', 'cpu'),
        compute_type=config.get('computeType', 'int8'),
        use_faster=config.get('useFaster', True)
    )

    if command == 'transcribe':
        # Read audio from stdin
        audio_data = sys.stdin.buffer.read()

        # Transcribe
        try:
            result = transcriber.transcribe(
                audio_data,
                language=config.get('language'),
                enable_timestamps=config.get('enableTimestamps', True),
                enable_word_timestamps=config.get('enableWordTimestamps', False),
                temperature=config.get('temperature', 0.0)
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

    elif command == 'streaming':
        # Read audio chunk from stdin
        audio_data = sys.stdin.buffer.read()

        try:
            result = transcriber.transcribe_streaming(
                audio_data,
                language=config.get('language'),
                context=config.get('context')
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

    elif command == 'info':
        print(json.dumps({
            'success': True,
            'info': {
                'useFasterWhisper': transcriber.use_faster,
                'modelSize': transcriber.model_size,
                'device': transcriber.device,
                'computeType': transcriber.compute_type
            }
        }))


if __name__ == '__main__':
    main()
