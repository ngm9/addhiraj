import React, { useContext } from 'react';
import { Skeleton } from 'antd';
import '../styles/CustomScrollBar.css';
import { VideoDetailsContext } from './sub-components/VideoDetailsContext'; // Import context
import { useVideoDetails } from './sub-components/VideoDetailsContext';
import VideoPlayer from './sub-components/VideoPlayer';

const FrameBar = () => {
  const { videoDetails } = useVideoDetails(); // Use context to get video details
  console.log("This is the videoDetails in framer:",videoDetails)
  return (
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
          <div key={index} className="p-2" >
            <a href="">
            <img src="/logo_addheeraj.png" alt={`Frame ${frame.seq}`} className="rounded-lg w-36 h-36" />
            <p className="text-white">{frame["short description"]}</p>
            </a>  
          </div>
        ))
      )}
    </div>
  );
};

export default FrameBar;