// src/api/videoService.js
import axios from 'axios';
import apiClient from './apiClient';

export const uploadVideoUrl = (url) => {
  return apiClient.post('/video_url', { url: url });
};

export const uploadVideoFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);

  return apiClient.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getDetails = (fileName) => {
  return apiClient.post('/details', { filename: `${fileName}` });
};