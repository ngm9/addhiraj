import React from 'react';

const FrameBar = () => {
  return (
    <div className="flex justify-around p-5 bg-white-400 rounded-lg">
      <div className="p-2"><img src="https://via.placeholder.com/100" alt="Frame 1" className="rounded-lg" /></div>
      <div className="p-2"><img src="https://via.placeholder.com/100" alt="Frame 2" className="rounded-lg" /></div>
      <div className="p-2"><img src="https://via.placeholder.com/100" alt="Frame 3" className="rounded-lg" /></div>
      <div className="p-2"><img src="https://via.placeholder.com/100" alt="Frame 4" className="rounded-lg" /></div>
      <div className="p-2"><img src="https://via.placeholder.com/100" alt="Frame 5" className="rounded-lg" /></div>
    </div>
  );
};

export default FrameBar;
