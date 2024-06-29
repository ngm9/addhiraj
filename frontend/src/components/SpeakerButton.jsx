// src/components/SpeakerButton.js
import React from 'react';
import { useTTS } from '../store/TTSContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVolumeMute, faVolumeUp } from '@fortawesome/free-solid-svg-icons';

const SpeakerButton = () => {
  const { isMuted, toggleMute } = useTTS();

  return (
    <button
      onClick={toggleMute}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: 'white',
        borderRadius: '50%',
        width: '50px',
        height: '50px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      <FontAwesomeIcon icon={isMuted ? faVolumeMute : faVolumeUp} size="2x" />
    </button>
  );
};

export default SpeakerButton;
