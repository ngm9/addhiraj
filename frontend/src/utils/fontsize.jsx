export const getFontSize = () => {
    return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--global-font-size'));
  };
  
  export const setFontSize = (size) => {
    document.documentElement.style.setProperty('--global-font-size', `${size}px`);
  };
  
  export const increaseFontSize = () => {
    const currentSize = getFontSize();
    setFontSize(currentSize + 1);
  };
  
  export const decreaseFontSize = () => {
    const currentSize = getFontSize();
    if (currentSize > 10) {
      setFontSize(currentSize - 1);
    }
  };