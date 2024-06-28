import React from 'react';

const Button = ({ text, className }) => {
  return (
    <button className={`bg-red-400 text-white p-2 rounded-md ${className}`}>
      {text}
    </button>
  );
};

export default Button;
