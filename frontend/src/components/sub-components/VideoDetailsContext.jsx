import React, { createContext, useState, useContext } from 'react';

const VideoDetailsContext = createContext();

export const VideoDetailsProvider = ({ children }) => {
  const [videoDetails, setVideoDetails] = useState(null);

  return (
    <VideoDetailsContext.Provider value={{ videoDetails, setVideoDetails }}>
      {children}
    </VideoDetailsContext.Provider>
  );
};

export const useVideoDetails = () => {
  return useContext(VideoDetailsContext);
};