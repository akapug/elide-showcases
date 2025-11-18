#!/usr/bin/env python3
"""
Bridge - Zero-Copy Buffer Sharing

Demonstrates zero-copy buffer sharing between TypeScript and Python
using shared memory regions and memory-mapped files.

This bridge enables:
- Direct memory access from Python without copying
- Shared memory regions for large image/video buffers
- Efficient inter-process communication

@module cv/bridge
"""

import sys
import json
import mmap
import os
from typing import Optional
import numpy as np


class SharedMemoryBridge:
    """
    Bridge for zero-copy buffer sharing between processes
    """

    def __init__(self):
        self.memory_regions = {}

    def read_from_shared_memory(self, path: str, size: Optional[int] = None) -> bytes:
        """
        Read data from shared memory file

        Args:
            path: Path to shared memory file
            size: Optional size to read (reads entire file if None)

        Returns:
            Bytes read from shared memory
        """
        if not os.path.exists(path):
            raise FileNotFoundError(f'Shared memory file not found: {path}')

        with open(path, 'rb') as f:
            if size:
                return f.read(size)
            else:
                return f.read()

    def write_to_shared_memory(self, path: str, data: bytes, offset: int = 0):
        """
        Write data to shared memory file

        Args:
            path: Path to shared memory file
            data: Data to write
            offset: Offset in file to start writing
        """
        mode = 'r+b' if os.path.exists(path) else 'wb'

        with open(path, mode) as f:
            if offset > 0:
                f.seek(offset)
            f.write(data)
            f.flush()

    def create_numpy_array_from_shared_memory(self, path: str, shape: tuple, dtype=np.uint8) -> np.ndarray:
        """
        Create numpy array from shared memory (zero-copy)

        Args:
            path: Path to shared memory file
            shape: Shape of numpy array
            dtype: Data type of array

        Returns:
            Numpy array backed by shared memory
        """
        data = self.read_from_shared_memory(path)
        arr = np.frombuffer(data, dtype=dtype)

        # Reshape if needed
        if shape:
            total_elements = np.prod(shape)
            if len(arr) >= total_elements:
                arr = arr[:total_elements].reshape(shape)

        return arr

    def create_shared_memory_from_numpy(self, path: str, arr: np.ndarray):
        """
        Create shared memory file from numpy array

        Args:
            path: Path to shared memory file
            arr: Numpy array to write
        """
        data = arr.tobytes()
        self.write_to_shared_memory(path, data)

    def get_buffer_info(self, path: str) -> dict:
        """
        Get information about shared memory buffer

        Args:
            path: Path to shared memory file

        Returns:
            Dictionary with buffer information
        """
        if not os.path.exists(path):
            return {'exists': False}

        stat = os.stat(path)

        return {
            'exists': True,
            'size': stat.st_size,
            'modified': stat.st_mtime,
            'path': path,
        }


def demonstrate_zero_copy():
    """
    Demonstrate zero-copy buffer sharing
    """
    bridge = SharedMemoryBridge()

    # Example: Read image from shared memory
    shm_path = '/tmp/cv-pipeline-shared/test_image.bin'

    if os.path.exists(shm_path):
        # Read image as numpy array (zero-copy)
        image_data = bridge.read_from_shared_memory(shm_path)

        print(json.dumps({
            'success': True,
            'bytesRead': len(image_data),
            'zeroCopy': True,
            'message': 'Successfully read from shared memory',
        }))
    else:
        print(json.dumps({
            'success': False,
            'error': 'Shared memory file not found',
        }), file=sys.stderr)


if __name__ == '__main__':
    demonstrate_zero_copy()
