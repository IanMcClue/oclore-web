interface StoredResponses {
  responses: string[];
  timestamp: string;
}

export function saveTemporaryResponses(responses: string[]) {
  const data: StoredResponses = {
    responses,
    timestamp: new Date().toISOString()
  };
  localStorage.setItem('userResponses', JSON.stringify(data));
}

export function getTemporaryResponses(): StoredResponses | null {
  const data = localStorage.getItem('userResponses');
  return data ? JSON.parse(data) : null;
} 