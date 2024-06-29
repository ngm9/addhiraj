// src/FocusManager.js
import React, { useRef } from 'react';
import { HotKeys } from 'react-hotkeys';
import { useTTS } from './store/TTSContext';

const keyMap = {
  FOCUS_NEXT: 'j',
  FOCUS_PREV: 'k',
  LOG_CONTENT: 'l',
  NEXT_ELEMENT: 'right',
  PREV_ELEMENT: 'left'
};

const FocusManager = ({ children }) => {
  const { speakText } = useTTS(); // Use the TTS hook
  const focusIndexRef = useRef(-1);

  const getFocusableElements = () => {
    return Array.from(document.querySelectorAll('div, h1, iframe, button, input, textarea'));
  };

  const findInnermostElement = (element) => {
    let innermostElement = element;
    while (innermostElement.children.length > 0) {
      innermostElement = innermostElement.children[0];
    }
    return innermostElement;
  };

  const announceFocusedElement = (element) => {
    const innermostElement = findInnermostElement(element);
    const content = innermostElement.innerText || innermostElement.textContent || innermostElement.value || 'No content';
    const tag = innermostElement.tagName.toLowerCase();
    window.speechSynthesis.cancel(); // Cancel any ongoing speech
    speakText(`Focused on ${tag}. Content: ${content}`);
  };

  const focusElement = (index, elements) => {
    if (index >= 0 && index < elements.length) {
      const element = elements[index];
      element.focus();
      element.style.outline = '5px solid red';
      announceFocusedElement(element);
    }
  };

  const clearFocus = (elements) => {
    if (focusIndexRef.current >= 0 && focusIndexRef.current < elements.length) {
      const element = elements[focusIndexRef.current];
      element.style.outline = 'none';
    }
  };

  const handlers = {
    FOCUS_NEXT: () => {
      const elements = getFocusableElements();
      clearFocus(elements);
      focusIndexRef.current = (focusIndexRef.current + 1) % elements.length;
      focusElement(focusIndexRef.current, elements);
    },
    FOCUS_PREV: () => {
      const elements = getFocusableElements();
      clearFocus(elements);
      focusIndexRef.current = (focusIndexRef.current - 1 + elements.length) % elements.length;
      focusElement(focusIndexRef.current, elements);
    },
    LOG_CONTENT: () => {
      const elements = getFocusableElements();
      if (focusIndexRef.current >= 0 && focusIndexRef.current < elements.length) {
        const element = elements[focusIndexRef.current];
        console.log('Focused Element Content:', element.innerText || element.textContent || element.value);
      }
    },
    NEXT_ELEMENT: () => {
      const elements = getFocusableElements();
      clearFocus(elements);
      focusIndexRef.current = (focusIndexRef.current + 1) % elements.length;
      focusElement(focusIndexRef.current, elements);
    },
    PREV_ELEMENT: () => {
      const elements = getFocusableElements();
      clearFocus(elements);
      focusIndexRef.current = (focusIndexRef.current - 1 + elements.length) % elements.length;
      focusElement(focusIndexRef.current, elements);
    }
  };

  return (
    <HotKeys keyMap={keyMap} handlers={handlers}>
      {children}
    </HotKeys>
  );
};

export default FocusManager;
