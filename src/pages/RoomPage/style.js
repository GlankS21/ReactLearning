import styled from "styled-components"

export const WrapperContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  min-height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
`

export const WrapperBackButton = styled.button`
  position: absolute;
  top: 30px;
  left: 80px;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 10px;
  padding: 10px 20px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);

  &:hover {
    background-color: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.6);
  }

  @media (max-width: 768px) {
    top: 30px;
    left: 20px;
    padding: 8px 16px;
    font-size: 14px;
  }

  @media (max-width: 480px) {
    top: 20px;
    left: 15px;
    padding: 6px 12px;
    font-size: 13px;
  }
`

export const WrapperTitle = styled.h1`
  color: #fff;
  font-size: 42px;
  font-weight: 700;
  text-transform: uppercase;
  margin: 30px 0 40px;
  letter-spacing: 3px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);

  @media (max-width: 768px) {
    font-size: 32px;
    margin: 20px 0 30px;
  }

  @media (max-width: 480px) {
    font-size: 24px;
    margin: 15px 0 20px;
  }
`

export const WrapperRoomDetails = styled.div`
  display: flex;
  gap: 40px;
  margin-bottom: 50px;
  color: #D4C0C0;
  font-size: 18px;
  font-weight: 600;

  @media (max-width: 768px) {
    gap: 20px;
    font-size: 16px;
  }

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 10px;
    font-size: 14px;
  }
`

export const WrapperPlayersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 30px;
  margin-bottom: 60px;
  width: 100%;
  max-width: 800px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    max-width: 500px;
  }

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
    max-width: 100%;
  }
`

export const WrapperPlayerSlot = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`

export const WrapperPlayerAvatar = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin-bottom: 12px;
  border: 3px solid #fff;
  object-fit: cover;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);

  @media (max-width: 768px) {
    width: 80px;
    height: 80px;
    margin-bottom: 10px;
  }

  @media (max-width: 480px) {
    width: 60px;
    height: 60px;
    margin-bottom: 8px;
  }
`

export const WrapperPlayerName = styled.span`
  color: #f1f1f1;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  word-break: break-word;
  max-width: 100%;

  @media (max-width: 768px) {
    font-size: 12px;
  }

  @media (max-width: 480px) {
    font-size: 11px;
  }
`

export const WrapperButtonGroup = styled.div`
  display: flex;
  gap: 20px;
  margin-top: 40px;

  @media (max-width: 768px) {
    gap: 15px;
    flex-direction: column;
    width: 100%;
    max-width: 400px;
  }

  @media (max-width: 480px) {
    gap: 10px;
    flex-direction: column;
    width: 100%;
  }
`

export const WrapperStartButton = styled.button`
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  border: none;
  color: #fff;
  padding: 16px 40px;
  font-size: 16px;
  font-weight: 700;
  text-transform: uppercase;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);
  letter-spacing: 2px;

  &:hover {
    box-shadow: 0 8px 25px rgba(76, 175, 80, 0.6);
    background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
  }

  &:disabled {
    background: #999;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }

  @media (max-width: 768px) {
    padding: 14px 30px;
    font-size: 14px;
    width: 100%;
  }

  @media (max-width: 480px) {
    padding: 12px 20px;
    font-size: 13px;
    width: 100%;
  }
`

export const WrapperLeaveButton = styled.button`
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
  border: none;
  color: #fff;
  padding: 16px 40px;
  font-size: 16px;
  font-weight: 700;
  text-transform: uppercase;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
  letter-spacing: 2px;

  &:hover {
    box-shadow: 0 8px 25px rgba(255, 107, 107, 0.6);
    background: linear-gradient(135deg, #ee5a52 0%, #e63946 100%);
  }

  @media (max-width: 768px) {
    padding: 14px 30px;
    font-size: 14px;
    width: 100%;
  }

  @media (max-width: 480px) {
    padding: 12px 20px;
    font-size: 13px;
    width: 100%;
  }
`