export function createContext(req: any) {
  return {
    user: null,
    apiKey: req.headers['x-api-key'],
    requestId: req.headers['x-request-id'] || generateRequestId(),
    startTime: Date.now(),
  };
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
