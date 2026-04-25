import axios from 'axios';
import type { Survey, SurveyCreate, SurveyUpdate, SurveyStats, SubmissionCreate } from '../types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const surveyApi = {
  getSurveys: async (): Promise<Survey[]> => {
    const response = await api.get('/surveys');
    return response.data;
  },

  getSurvey: async (id: string): Promise<Survey> => {
    const response = await api.get(`/surveys/${id}`);
    return response.data;
  },

  createSurvey: async (data: SurveyCreate): Promise<Survey> => {
    const response = await api.post('/surveys', data);
    return response.data;
  },

  updateSurvey: async (id: string, data: SurveyUpdate): Promise<Survey> => {
    const response = await api.put(`/surveys/${id}`, data);
    return response.data;
  },

  deleteSurvey: async (id: string): Promise<void> => {
    await api.delete(`/surveys/${id}`);
  },

  submitSurvey: async (data: SubmissionCreate): Promise<void> => {
    await api.post('/submissions', data);
  },

  getSurveyStats: async (id: string): Promise<SurveyStats> => {
    const response = await api.get(`/surveys/${id}/stats`);
    return response.data;
  },
};

export default api;
