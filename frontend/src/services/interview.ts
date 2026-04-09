import type { Interview, InterviewStats } from '../types';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class InterviewService {
  private getUserId(): string {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('User not authenticated');
    return user.id;
  }

  async create(jobTitle: string, company?: string): Promise<Interview> {
    const response = await fetch(`${API_URL}/api/interviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: this.getUserId(), jobTitle, company }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create interview');
    }

    return response.json();
  }

  async getAll(): Promise<Interview[]> {
    const response = await fetch(`${API_URL}/api/interviews?userId=${this.getUserId()}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Failed to get interviews');
    }

    return response.json();
  }

  async getStats(): Promise<InterviewStats> {
    const response = await fetch(`${API_URL}/api/interviews/stats?userId=${this.getUserId()}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Failed to get stats');
    }

    return response.json();
  }

  async getById(id: string): Promise<Interview> {
    const response = await fetch(`${API_URL}/api/interviews/${id}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Failed to get interview');
    }

    return response.json();
  }

  async complete(id: string, score: number, feedback: string): Promise<Interview> {
    const response = await fetch(`${API_URL}/api/interviews/${id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score, feedback }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to complete interview');
    }

    return response.json();
  }
}

export const interviewService = new InterviewService();