import React, { useState } from 'react';
import ReactPlayer from 'react-player';

const VideoFrame = ({ url }) => {
  const [playing, setPlaying] = useState(false);
    console.log("INside this component",url)
  const handlePlay = () => {
    setPlaying(true);
  };

  return (
    <div className="flex flex-col w-full items-center p-4 border border-gray-300 rounded-lg h-100 shadow-lg max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Video Player</h2>
      {url && (
        <div className="w-full">
          <ReactPlayer url={url} playing={playing} controls width="100%" />
          <button
            onClick={handlePlay}
            className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Play Video
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoFrame;
