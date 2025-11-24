import styled from "styled-components"

export const WrapperContainer = styled.div`
  position: relative;
  width: 100%;
  height: 90vh;
  display: flex;
  flex-direction: column;
`

export const WrapperAvatar = styled.img`
  position: absolute;
  z-index: 999;
  left: 60px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 1px solid white;
  object-fit: cover;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

  @media (max-width: 768px) {
    width: 45px;
    height: 45px;
    left: 15px;
  }
  
  @media (max-width: 480px) {
    width: 40px;
    height: 40px;
    left: 10px;
  }
`

export const WrapperContent = styled.div`
  position: relative;
`

export const WrapperLudoIcon = styled.img`
  height: 95vh;
  width: auto;
  display: block;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: 768px) {
    width: 80vw;
    height: auto;
  }
  
  @media (max-width: 480px) {
    width: 90vw;
  }
`

export const WrapperButtonsSection = styled.div`
  position: absolute;
  top: 18vh;
  right: 30vh;
  display: flex;
  flex-direction: column;
  gap: 50px;
  
  @media (max-width: 768px) {
    position: static;
    margin: 20px auto 0;
    text-align: center;
    max-width: 400px;
    gap: 30px;
  }
  
  @media (max-width: 480px) {
    gap: 20px;
    max-width: 320px;
  }
`

export const WrapperGameButton = styled.button`
  background: linear-gradient(135deg, #4DD0E1 0%, #26C6DA 100%);
  border: none;
  border-radius: 20px;
  padding: 20px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  min-width: 280px;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.3);
    background: linear-gradient(135deg, #26C6DA 0%, #00BCD4 100%);
  }
  
  &:active {
    transform: translateY(-1px);
  }
  
  @media (max-width: 768px) {
    width: 100%;
    padding: 18px 35px;
    min-width: auto;
  }
  
  @media (max-width: 480px) {
    padding: 15px 30px;
  }
`

export const WrapperButtonImage = styled.img`
  width: 150px;
  height: auto;
  
  @media (max-width: 768px) {
    width: 130px;
  }
  
  @media (max-width: 480px) {
    width: 110px;
  }
`

export const WrapperButtonText = styled.span`
  color: white;
  font-size: 20px;
  font-weight: bold;
  letter-spacing: 1px;
  
  @media (max-width: 768px) {
    font-size: 18px;
  }
  
  @media (max-width: 480px) {
    font-size: 16px;
  }
`
