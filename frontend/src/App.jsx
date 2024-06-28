// src/App.js
import React, {useContext,useEffect} from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MainVideo from './components/Video';
import FrameBar from './components/frames';
import ChatWindow from './components/ChatWindow';
import ThemeToggle from './components/ThemeChange/ThemeToggle';
import { ThemeProvider } from './components/ThemeChange/ThemeContext';
import ThemeContext from './components/ThemeChange/ThemeContext';
import Button from './components/button';
import './index.css';

// import ProjectsDashboard from './components/ProjectDashboard';
// import CreateProject from './components/CreateProject';
// import ChatInterface from './components/ChatInterface';

function App() {
  const { isHighContrast } = useContext(ThemeContext);
  useEffect(() => {
    if (isHighContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }, [isHighContrast]);

  return (
    <div className={`flex flex-col h-screen ${isHighContrast ? 'bg-black text-white' : 'bg-gray-800 text-white'}`}>
    <header className="flex items-center justify-between p-5 bg-gray-900">
      <h1 className="text-xl">Addhiraj</h1>
      <ThemeToggle />
    </header>
    <div className="flex flex-grow p-5">
      <div className="flex flex-col w-full lg:w-3/4">
        <MainVideo />
        <FrameBar />
      </div>
      <div className="hidden lg:block lg:w-1/4 ml-5">
        <ChatWindow />
      </div>
    </div>
    <div className="p-5">
      <Button className="bg-white-400 p-2 mx-auto rounded-md" text="Button" />
    </div>
  </div>
  );
}

export default () => (
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
