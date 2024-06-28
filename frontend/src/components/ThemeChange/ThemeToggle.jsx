import React, { useContext } from 'react';
import { Switch } from 'antd';
import ThemeContext from './ThemeContext';

const ThemeToggle = () => {
  const { isHighContrast, toggleTheme } = useContext(ThemeContext);

  return (
    <div style={{ marginBottom: '1rem' }}>
      <Switch checked={isHighContrast} onChange={toggleTheme} />
      <span style={{ marginLeft: '0.5rem' }}>High Contrast</span>
    </div>
  );
};

export default ThemeToggle;
