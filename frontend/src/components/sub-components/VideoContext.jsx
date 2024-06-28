import React, { createContext, useState } from 'react';

const VideoContext = createContext();

export const VideoProvider = ({ children }) => {
  const [inputVideoUrl, setInputVideoUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [loading, setLoading] = useState(false);

  return (
    <VideoContext.Provider
      value={{
        inputVideoUrl,
        setInputVideoUrl,
        videoUrl,
        setVideoUrl,
        videoFile,
        setVideoFile,
        loading,
        setLoading,
      }}
    >
      {children}
    </VideoContext.Provider>
  );
};

export default VideoContext;
