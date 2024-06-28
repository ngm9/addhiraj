import React, { useContext } from 'react';
import ReactPlayer from 'react-player';
import VideoContext from './VideoContext';

const VideoPlayer = () => {
  const { videoUrl, videoFile } = useContext(VideoContext);

  return (
    <div className="w-full h-full flex justify-center items-center">
      {videoFile ? (
        <ReactPlayer
          className="rounded-lg"
          url={URL.createObjectURL(videoFile)}
          controls
          playing
          width="100%"
          height="100%"
        />
      ) : (
        <ReactPlayer
          className="rounded-lg"
          url={videoUrl}
          controls
          playing
          width="100%"
          height="100%"
        />
      )}
    </div>
  );
};

export default VideoPlayer;
