// src/App.js
import React, {useContext,useEffect, useState} from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MainVideo from './components/Video';
import { increaseFontSize,decreaseFontSize,getFontSize } from './utils/fontsize';
import FrameBar from './components/frames';
import ChatWindow from './components/ChatWindow';
import ThemeToggle from './components/ThemeChange/ThemeToggle';
import { ThemeProvider } from './components/ThemeChange/ThemeContext';
import ThemeContext from './components/ThemeChange/ThemeContext';
import Button from './components/button';
import { FloatButton } from 'antd';
import {
  PlusOutlined,
  MinusOutlined
} from '@ant-design/icons';
import './index.css';
import { TTSProvider } from './store/TTSContext';
import FocusManager from './KeyBoardNavigation';
import SpeakerButton from './components/SpeakerButton';
import { VideoDetailsProvider } from './components/sub-components/VideoDetailsContext';
// import ProjectsDashboard from './components/ProjectDashboard';
// import CreateProject from './components/CreateProject';
// import ChatInterface from './components/ChatInterface';

function App() {
  const { isHighContrast } = useContext(ThemeContext);
  const [count,setCount] = useState(getFontSize());
  useEffect(() => {
    if (isHighContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }, [isHighContrast]);

  const handleIncreaseFontSize = () =>{
    increaseFontSize();
    setCount(getFontSize());
  }
  const handleDecreaseFontSize = () => {
    decreaseFontSize();
    setCount(getFontSize());
  }


  return (
    <TTSProvider>
      <FocusManager>
    <div className={`flex flex-col ${isHighContrast ? 'bg-black text-white' : 'bg-gray-800 text-white'}`}>
    <header className="flex items-center justify-between p-5 bg-gray-900">
    <div className="flex items-center">
      <img src="/logo_nobg.png" alt="Addhiraj Logo" className="h-8 w-8 mr-2" />
      <h1 className="normal-text ">Addhiraj</h1>
    </div>
    <div className='hidden md:flex flex-row gap-5'>
      <div className='rounded-2xl bg-slate-400 hover:bg-slate-600 flex items-center p-1 cursor-pointer' onClick={handleIncreaseFontSize}>
          <PlusOutlined/>
      </div>
      <div className='text-neutral-50	'>
        {count}
      </div>
      <div className='rounded-2xl bg-slate-400 hover:bg-slate-600 flex items-center p-1 cursor-pointer' onClick={handleDecreaseFontSize}>
          <MinusOutlined/>
      </div>
    </div>
      <ThemeToggle />
    </header>
    <div className="flex flex-grow p-5">
      <div className="flex flex-col w-full lg:w-3/4">
        <MainVideo />
        {/* <FrameBar /> */}
      </div>
      <div className="hidden lg:block lg:w-1/4 ml-5">
        <ChatWindow />
        <SpeakerButton />
      </div>
    </div>
    
  </div>
  </FocusManager>
  </TTSProvider>
  );
}

export default () => (
  <ThemeProvider>
    <VideoDetailsProvider>
      <App />
    </VideoDetailsProvider>
  </ThemeProvider>
);
