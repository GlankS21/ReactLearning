import styled from "styled-components"

export const WrapperContainer = styled.div`
  width: 90%;
  min-height: 100vh;
  position: relative;
`

export const WrapperTitle = styled.h1`
  color: white;
  font-size: 36px;
  font-weight: bold;
  letter-spacing: 2px;
  margin-bottom: 40px;
  text-align: center;

  @media (max-width: 768px) {
    font-size: 28px;
    margin-bottom: 30px;
  }

  @media (max-width: 480px) {
    font-size: 24px;
    margin-bottom: 20px;
  }
`

export const WrapperCreateButton = styled.button`
  position: absolute;
  top: 30px;
  right: 80px;
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);

  &:hover {
    box-shadow: 0 6px 16px rgba(76, 175, 80, 0.5);
  }

  @media (max-width: 768px) {
    top: 30px;
    right: 20px;
    padding: 10px 20px;
    font-size: 14px;
  }

  @media (max-width: 480px) {
    top: 70px;
    right: 15px;
    padding: 8px 16px;
    font-size: 13px;
  }
`

export const WrapperRoomsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 30px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: 15px;
  }
`

export const WrapperRoomCard = styled.div`
  background: linear-gradient(135deg, #117f86 0%, #26c6da 100%);
  border-radius: 20px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  position: relative;

  @media (max-width: 768px) {
    padding: 15px;
    gap: 15px;
  }

  @media (max-width: 480px) {
    padding: 12px;
  }
`

export const WrapperRoomHeader = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 5px;

  @media (max-width: 480px) {
    font-size: 12px;
  }
`

export const WrapperRoomTime = styled.div`
  background-color: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  backdrop-filter: blur(5px);

  @media (max-width: 480px) {
    padding: 3px 10px;
    font-size: 11px;
  }
`

export const WrapperPlayersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  width: 100%;
  max-width: 200px;

  @media (max-width: 768px) {
    gap: 15px;
    max-width: 180px;
  }

  @media (max-width: 480px) {
    gap: 12px;
    max-width: 160px;
  }
`

export const WrapperPlayerSlot = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 80px;

  > div:first-child {
    width: 80px;
    height: 80px;
    background-color: ${(props) => (props.isEmpty ? "#C9A961" : "transparent")};
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border: 3px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  @media (max-width: 768px) {
    width: 70px;
    gap: 6px;

    > div:first-child {
      width: 70px;
      height: 70px;
      border: 2px solid rgba(255, 255, 255, 0.3);
    }
  }

  @media (max-width: 480px) {
    width: 60px;
    gap: 5px;

    > div:first-child {
      width: 60px;
      height: 60px;
    }
  }
`

export const WrapperPlayerAvatar = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`

export const WrapperPlayerName = styled.div`
  color: white;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);

  @media (max-width: 768px) {
    font-size: 11px;
    max-width: 70px;
  }

  @media (max-width: 480px) {
    font-size: 10px;
    max-width: 60px;
  }
`

export const WrapperRoomButton = styled.button`
  background-color: #8b7355;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 30px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: capitalize;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);

  &:hover {
    background-color: #6f5a43;
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.3);
  }

  @media (max-width: 768px) {
    padding: 8px 25px;
    font-size: 13px;
  }

  @media (max-width: 480px) {
    padding: 7px 20px;
    font-size: 12px;
  }
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

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
`

export const ModalContent = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 20px;
  padding: 40px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.1);

  @media (max-width: 768px) {
    padding: 30px;
    max-width: 400px;
  }

  @media (max-width: 480px) {
    padding: 25px;
  }
`

export const ModalCloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  background: transparent;
  border: none;
  color: white;
  font-size: 32px;
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`

export const ModalTitle = styled.h2`
  color: white;
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 30px;
  text-align: center;

  @media (max-width: 768px) {
    font-size: 24px;
    margin-bottom: 25px;
  }

  @media (max-width: 480px) {
    font-size: 20px;
    margin-bottom: 20px;
  }
`

export const ModalInput = styled.input`
  width: 100%;
  padding: 15px 20px;
  font-size: 16px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  margin-bottom: 20px;
  transition: all 0.3s ease;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  &:focus {
    outline: none;
    border-color: #26c6da;
    background-color: rgba(255, 255, 255, 0.15);
  }

  @media (max-width: 768px) {
    padding: 12px 16px;
    font-size: 15px;
    margin-bottom: 16px;
  }

  @media (max-width: 480px) {
    padding: 10px 14px;
    font-size: 14px;
    margin-bottom: 14px;
  }
`

export const ModalFormGroup = styled.div`
  margin-bottom: 20px;
  width: 100%;

  @media (max-width: 768px) {
    margin-bottom: 16px;
  }

  @media (max-width: 480px) {
    margin-bottom: 14px;
  }
`

export const ModalLabel = styled.label`
  display: block;
  color: white;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  text-align: left;

  @media (max-width: 768px) {
    font-size: 13px;
    margin-bottom: 6px;
  }

  @media (max-width: 480px) {
    font-size: 12px;
  }
`

export const ModalSelect = styled.select`
  width: 100%;
  padding: 15px 20px;
  font-size: 16px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 15px center;
  background-size: 20px;
  padding-right: 45px;

  option {
    background-color: #1a1a2e;
    color: white;
    padding: 10px;
  }

  &:focus {
    outline: none;
    border-color: #26c6da;
    background-color: rgba(255, 255, 255, 0.15);
  }

  &:hover {
    border-color: rgba(255, 255, 255, 0.3);
  }

  @media (max-width: 768px) {
    padding: 12px 16px;
    padding-right: 40px;
    font-size: 15px;
    background-size: 18px;
    background-position: right 12px center;
  }

  @media (max-width: 480px) {
    padding: 10px 14px;
    padding-right: 38px;
    font-size: 14px;
    background-size: 16px;
    background-position: right 10px center;
  }
`

export const ModalButtonGroup = styled.div`
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 30px;

  @media (max-width: 768px) {
    margin-top: 25px;
  }

  @media (max-width: 480px) {
    gap: 10px;
    margin-top: 20px;
  }
`

export const ModalButton = styled.button`
  padding: 12px 30px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;

  background-color: ${(props) => (props.variant === "create" ? "#4caf50" : "#c00023ff")};
  color: white;

  &:hover {
    box-shadow: 0 6px 16px
      ${(props) => (props.variant === "create" ? "rgba(76, 175, 80, 0.4)" : "rgba(124, 0, 0, 0.4)")};
    background-color: ${(props) => (props.variant === "create" ? "#45a049" : "#5a6268")};
  }

  @media (max-width: 768px) {
    padding: 10px 25px;
    font-size: 15px;
    min-width: 100px;
  }

  @media (max-width: 480px) {
    padding: 8px 20px;
    font-size: 14px;
    min-width: 90px;
  }
`
