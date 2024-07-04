import React, { useContext,useState } from 'react';
import { Skeleton, List, Card, Button } from 'antd';
import '../styles/CustomScrollBar.css';
import { VideoDetailsContext } from './sub-components/VideoDetailsContext'; // Import context
import { useVideoDetails } from './sub-components/VideoDetailsContext';
import VideoPlayer from './sub-components/VideoPlayer';
import VideoFrame from './VideoFrame';

const FrameBar = () => {
  const { videoDetails } = useVideoDetails(); // Use context to get video details
  const [selectedUrl, setSelectedUrl] = useState('');
  const handlePlayVideo = (url) => {
    console.log("This is the url ",)
    setSelectedUrl(url);
  };
  console.log("This is the videoDetails in framer:",videoDetails)
  return (
    <div className="flex flex-col gap-5">
            <div className="flex justify-around overflow-x-auto m-3 p-5 bg-transparent space-x-2 border border-gray-300 rounded-lg">
      {!videoDetails ? (
        <>
          <Skeleton.Avatar active size={144} shape="square" />
          <Skeleton.Avatar active size={144} shape="square" />
          <Skeleton.Avatar active size={144} shape="square" />
          <Skeleton.Avatar active size={144} shape="square" />
          <Skeleton.Avatar active size={144} shape="square" />
        </>
      ) : (
          videoDetails.ts.map((frame, index) => (
            <div key={index} className="p-2">
              <img src="/logo_addheeraj.png" alt={`Frame ${frame.seq}`} className="rounded-lg w-36 h-36" />
              <p className="text-white">{frame["short description"]}</p>
              <p className="text-gray-400">Start: {frame.ts_start}s - End: {frame.ts_end}s</p>
              {/* <a href={frame.s3_video_url} target="_blank" rel="noopener noreferrer"> */}
                <button 
                onClick={() => handlePlayVideo(frame.s3_video_url)}
                className="mt-2 w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                  Watch Video
                </button>
              {/* </a> */}
            </div>
          ))
        )}
    </div>  
      {selectedUrl && <VideoFrame url={selectedUrl} />}

    </div>
    
  );
};

export default FrameBar;