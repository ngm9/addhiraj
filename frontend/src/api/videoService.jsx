// src/api/videoService.js
import apiClient from './apiClient';

export const uploadVideoUrl = (url) => {
  return apiClient.post('/video_url', { url: url });
};

export const uploadVideoFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);

  return apiClient.post('/video_url', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
