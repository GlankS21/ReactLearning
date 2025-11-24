import React from 'react'
import * as style from './style';

const BackgroundComponent = ({ opacity = 0.8, children }) => {
  return (
    <style.WrapperBackground>
      <style.WrapperBackgroundOverlay style={{ backgroundColor: `rgba(5, 76, 92, ${opacity})` }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          {children}
        </div>
      </style.WrapperBackgroundOverlay>
    </style.WrapperBackground>
  );
};

export default BackgroundComponent