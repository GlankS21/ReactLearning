import React from 'react'
import BackgroundComponent from '../../components/BackgroundComponent/BackgroundComponent';
import ludo from '../../assets/image/LUDO 2.png';
import ludoLogo from '../../assets/image/LUDO (1) 1.png';
import { WrapperImage } from '../HomePage/style';

const NotFoundPage = () => {
  return (
    <BackgroundComponent opacity={0.8}>
      <WrapperImage height='200px' src={ludo} alt=""/>
      <WrapperImage height='300px' src={ludoLogo} alt=""/>
    </BackgroundComponent>
  )
}

export default NotFoundPage