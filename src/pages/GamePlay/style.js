import styled from "styled-components"

export const WrapperContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100%;
  padding: 20px;
  position: relative;
`

export const WrapperMenuButton = styled.button`
  position: absolute;
  top: 50px;
  left: 50px;
  background-color: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 8px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.6);
  }

  @media (max-width: 768px) {
    padding: 10px 12px;
  }
`

export const WrapperBoardContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`

export const WrapperPlayerSection = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  gap: 15px;
  z-index: 20;

  ${(props) => {
    if (props.position === "top-left") return "top: 0; left: -150px;"
    if (props.position === "top-right") return "top: 0; right: -150px;"
    if (props.position === "bottom-left") return "bottom: 0; left: -150px;"
    if (props.position === "bottom-right") return "bottom: 0; right: -150px;"
  }}
  
  @media (max-width: 768px) {
    gap: 10px;
    ${(props) => {
      if (props.position === "top-left") return "top: -60px; left: 0px;"
      if (props.position === "top-right") return "top: -60px; right: 0px;"
      if (props.position === "bottom-left") return "bottom: -60px; left: 0px;"
      if (props.position === "bottom-right") return "bottom: -60px; right: 0px;"
    }}
  }
`

export const WrapperPlayerAvatar = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 8px;
  border: 3px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  object-fit: cover;

  @media (max-width: 1024px) {
    width: 50px;
    height: 50px;
  }

  @media (max-width: 768px) {
    width: 45px;
    height: 45px;
    border-width: 2px;
  }

  @media (max-width: 480px) {
    width: 40px;
    height: 40px;
  }
`

export const WrapperDiceIcon = styled.div`
  width: 40px;
  height: 40px;
  background-color: white;
  border: 2px solid #333;
  border-radius: 6px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;

  @media (max-width: 1024px) {
    width: 36px;
    height: 36px;
  }

  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
  }

  @media (max-width: 480px) {
    width: 28px;
    height: 28px;
  }
`

export const WrapperTimerCircle = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: conic-gradient(
    #4CAF50 0%,
    #4CAF50 ${(props) => props.percentage}%,
    rgba(255, 255, 255, 0.3) ${(props) => props.percentage}%,
    rgba(255, 255, 255, 0.3) 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  position: absolute;
  \
  ${(props) => {
    if (props.position === "left") {
      return `
        left: -65px;
        top: 50%;
        transform: translateY(-50%);
      `
    }
    if (props.position === "right") {
      return `
        right: -65px;
        top: 50%;
        transform: translateY(-50%);
      `
    }
  }}
  
  &::before {
    content: '';
    position: absolute;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background-color: white;
  }

  @media (max-width: 1024px) {
    width: 45px;
    height: 45px;
    
    ${(props) => {
      if (props.position === "left") return "left: -60px;"
      if (props.position === "right") return "right: -60px;"
    }}
    
    &::before {
      width: 34px;
      height: 34px;
    }
  }

  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
    position: relative;
    left: auto;
    right: auto;
    top: auto;
    transform: none;
    
    &::before {
      width: 30px;
      height: 30px;
    }
  }

  @media (max-width: 480px) {
    width: 36px;
    height: 36px;
    
    &::before {
      width: 27px;
      height: 27px;
    }
  }
`

export const WrapperTimerText = styled.div`
  position: relative;
  z-index: 1;
  font-size: 12px;
  font-weight: bold;
  color: #333;

  @media (max-width: 768px) {
    font-size: 11px;
  }

  @media (max-width: 480px) {
    font-size: 10px;
  }
`

export const WrapperExitMenu = styled.div`
  position: absolute;
  top: 110px;
  left: 50px;
  padding: 10px 20px;
  background-color: #02343E;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  z-index: 100;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;

  &:hover {
    background-color: #045566;
  }
`

export const WrapperMenuIcon = styled.div`
  width: 20px;
  height: 2px;
  background-color: white;
  margin: 4px 0;
`

export const WrapperDiceDot = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #333;
  position: absolute;

  &.top-left {
    top: 8px;
    left: 8px;
  }

  &.top-right {
    top: 8px;
    right: 8px;
  }

  &.bottom-left {
    bottom: 8px;
    left: 8px;
  }

  &.bottom-right {
    bottom: 8px;
    right: 8px;
  }
`