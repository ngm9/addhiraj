import React, { useState,useContext  } from 'react';
import { Input, Button, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { uploadVideoUrl, uploadVideoFile } from '../api/videoService';
import ReactPlayer from 'react-player';
import { VideoProvider }  from './sub-components/VideoContext';
import VideoContext   from './sub-components/VideoContext';
import VideoForm from './sub-components/VideoForm';
import VideoPlayer from './sub-components/VideoPlayer';

const MainVideo = () => {
    const {
      inputVideoUrl,
      setVideoUrl,
      videoFile,
      setVideoFile,
      setLoading,
    } = useContext(VideoContext);
  
    const handleFileChange = (info) => {
      const file = info.file;
      if (file) {
        setVideoFile(file);
        setVideoUrl('');
      }
    };
  
    const handleSubmit = async (event) => {
      event.preventDefault();
      setLoading(true);
  
      try {
        if (inputVideoUrl) {
          setVideoUrl(inputVideoUrl);
          setVideoFile(null);
  
          // Make the API call in the background
          uploadVideoUrl(inputVideoUrl)
          .then((response) => {
            const { title, message: responseMessage } = response.data;
            message.success(`${responseMessage}: ${title}`);
          })
          .catch((error) => {
            console.error(error);
            message.error('Failed to upload video URL');
          });
        } else if (videoFile) {
          const formData = new FormData();
          formData.append('file', videoFile);
  
          // Make the API call in the background
          uploadVideoFile(formData)
            .then(() => message.success('Video file uploaded successfully'))
            .catch((error) => {
              console.error(error);
              message.error('Failed to upload video file');
            });
        } else if (videoFile) {
            const formData = new FormData();
            formData.append('file', videoFile);
    
            // Make the API call
            uploadVideoFile(formData)
              .then((response) => {
                const { title, message: responseMessage } = response.data;
                message.success(`${responseMessage}: ${title}`);
              })
              .catch((error) => {
                console.error(error);
                message.error('Failed to upload video file');
              });
          }
        } catch (error) {
          console.error(error);
          message.error('Failed to upload video');
        } finally {
          setLoading(false);
        }
      };

    return (
      <div className="flex-grow bg-gray-100 p-5 rounded-lg flex flex-col justify-center items-center">
        <VideoForm handleSubmit={handleSubmit} handleFileChange={handleFileChange} />
        {(inputVideoUrl || videoFile) && <VideoPlayer />}
      </div>
    );
  };
  
  export default () => (
    <VideoProvider>
      <MainVideo />
    </VideoProvider>
  );