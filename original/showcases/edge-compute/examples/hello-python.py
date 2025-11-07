"""
Hello World - Python Example

Simple edge function that returns a greeting.
"""

from datetime import datetime

def handler(event, context):
    """Handle incoming request"""
    print(f"Request received: {event['path']}")

    name = event.get('query', {}).get('name', 'World')

    return {
        'message': f'Hello, {name}!',
        'timestamp': datetime.now().isoformat(),
        'function': context['function_name'],
        'requestId': context['request_id'],
    }
