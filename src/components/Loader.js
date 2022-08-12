import React from 'react';

const Loader = ({ text = '...' }) => (
  <div className="loader overlay">
    {text}
  </div>
);

export default Loader;
