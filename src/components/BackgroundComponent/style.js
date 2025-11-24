import styled from "styled-components";
import MainBackground from '../../assets/image/Main-background.png';

export const WrapperBackground = styled.div`
    background-image: url(${MainBackground}); 
    width: 100%;
    height: 100vh;
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center;
    position: relative;
    overflow: hidden;
`;

export const WrapperBackgroundOverlay = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
`;