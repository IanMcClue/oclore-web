import { v4 as uuidv4 } from 'uuid'

export interface StoredResponse {
  responses: string[];
  timestamp: string;
  status: 'initial' | 'pending' | 'verified' | 'story-generated';
  username: string;
}

export class LocalStorage {
  private static readonly USER_KEY = 'temp_user_id';
  private static readonly RESPONSES_KEY = 'questionnaire_responses';

  static init(): string {
    try {
      let id = localStorage.getItem(this.USER_KEY);
      if (!id) {
        id = uuidv4();
        localStorage.setItem(this.USER_KEY, id);
      }
      return id;
    } catch (error) {
      console.error('LocalStorage error:', error);
      return uuidv4();
    }
  }

  static saveResponses(username: string, responses: string[]): void {
    try {
      const data: StoredResponse = {
        responses,
        username,
        timestamp: new Date().toISOString(),
        status: 'initial'
      };
      localStorage.setItem(this.RESPONSES_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving responses:', error);
    }
  }

  static updateStatus(status: StoredResponse['status']): void {
    try {
      const data = this.getResponses();
      if (data) {
        data.status = status;
        localStorage.setItem(this.RESPONSES_KEY, JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }

  static getResponses(): StoredResponse | null {
    try {
      const data = localStorage.getItem(this.RESPONSES_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting responses:', error);
      return null;
    }
  }

  static clear(): void {
    try {
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(this.RESPONSES_KEY);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
}

export const TempSession = {
  getId: (): string | null => {
    return localStorage.getItem('temp_id') || null;
  },
  
  setId: (id: string) => {
    localStorage.setItem('temp_id', id);
  },
  
  clear: () => {
    localStorage.removeItem('temp_id');
  }
};