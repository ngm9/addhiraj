// src/store/TTSContext.js
import React, { createContext, useContext, useState } from 'react';
import { useSpeechSynthesis } from 'react-speech-kit';

const TTSContext = createContext();

export const TTSProvider = ({ children }) => {
  const { speak, cancel, speaking, supported, voices } = useSpeechSynthesis();
  const [isMuted, setIsMuted] = useState(false);

  const speakText = (text, lang = 'en-US') => {
    if (!isMuted) {
      const voice = voices.find(voice => voice.lang === lang);
      speak({ text, voice });
    }
  };

  const toggleMute = () => {
    setIsMuted((prevState) => !prevState);
    if (!isMuted && speaking) {
      cancel();
    }
  };

  return (
    <TTSContext.Provider value={{ speakText, toggleMute, isMuted, cancel, speaking, supported }}>
      {children}
    </TTSContext.Provider>
  );
};

export const useTTS = () => useContext(TTSContext);
