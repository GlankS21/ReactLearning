import styled from "styled-components"

export const WrapperBoard = styled.div`
  display: grid;
  grid-template-columns: repeat(15, 1fr);
  grid-template-rows: repeat(15, 1fr);
  width: 500px;
  height: 500px;
  background-color: #fff;
  border: 3px solid #333;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  position: relative;

  @media (max-width: 768px) {
    width: 450px;
    height: 450px;
  }
`

export const WrapperCell = styled.div`
  border: 1px solid ${(props) => (props.cellType === 0 ? "transparent" : "#888")};
  border-left: none;
  border-bottom: none;

  background-color: ${(props) => {
    // Nếu là ô bắt đầu -> ưu tiên màu riêng
    if (props.startColor === "yellow") return "#FFD700"
    if (props.startColor === "blue") return "#1E90FF"
    if (props.startColor === "green") return "#32CD32"
    if (props.startColor === "red") return "#FF4444"

    // Nếu không phải ô bắt đầu -> dùng màu theo cellType
    if (props.cellType === 0) return "transparent"
    if (props.cellType === 1) return "white"
    if (props.cellType === 2) return "#FFD700"
    if (props.cellType === 3) return "#1E90FF"
    if (props.cellType === 4) return "#32CD32"
    if (props.cellType === 5) return "#FF4444"
    if (props.cellType === 6) return "#FFD700"
    if (props.cellType === 7) return "#1E90FF"
    if (props.cellType === 8) return "#32CD32"
    if (props.cellType === 9) return "#FF4444"
    if (props.cellType === 10) return "transparent"
    return "white"
  }};

  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`

export const WrapperStar = styled.div`
  color: white;
  font-size: 20px;
  text-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
  
  @media (max-width: 768px) {
    font-size: 16px;
  }

  @media (max-width: 480px) {
    font-size: 12px;
  }
`

export const WrapperHomeArea = styled.div`
  position: absolute;
  width: 40%;
  height: 40%;
  background-color: ${(props) => {
    if (props.color === "yellow") return "#FFD700"
    if (props.color === "blue") return "#1E90FF"
    if (props.color === "green") return "#32CD32"
    if (props.color === "red") return "#FF4444"
    return "white"
  }};
  border: 1px solid #777;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  
  ${(props) => {
    if (props.position === "top-left") return "top: 0; left: 0;"
    if (props.position === "top-right") return "top: 0; right: 0;"
    if (props.position === "bottom-left") return "bottom: 0; left: 0;"
    if (props.position === "bottom-right") return "bottom: 0; right: 0;"
  }}
`

export const WrapperTokenContainer = styled.div`
  background-color: white;
  border-radius: 10px;
  padding: 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 15px;

  @media (max-width: 768px) {
    padding: 15px;
    gap: 12px;
    border-radius: 10px;
  }

  @media (max-width: 480px) {
    padding: 10px;
    gap: 8px;
    border-radius: 8px;
  }
`

export const WrapperToken = styled.div`
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background-color: ${(props) => {
    if (props.color === "yellow") return "#FFD700"
    if (props.color === "blue") return "#1E90FF"
    if (props.color === "green") return "#32CD32"
    if (props.color === "red") return "#FF4444"
    return "white"
  }};
  border: 2px solid ${(props) => {
    if (props.color === "yellow") return "#DAA520"
    if (props.color === "blue") return "#1873CC"
    if (props.color === "green") return "#228B22"
    if (props.color === "red") return "#CC0000"
    return "#999"
  }};
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background-color: ${(props) => {
      if (props.color === "yellow") return "#DAA520"
      if (props.color === "blue") return "#1873CC"
      if (props.color === "green") return "#228B22"
      if (props.color === "red") return "#CC0000"
      return "#666"
    }};
  }

  @media (max-width: 768px) {
    width: 28px;
    height: 28px;
    border-width: 3px;

    &::after {
      width: 10px;
      height: 10px;
    }
  }

  @media (max-width: 480px) {
    width: 22px;
    height: 22px;
    border-width: 2px;

    &::after {
      width: 8px;
      height: 8px;
    }
  }
`

export const WrapperCenterTriangle = styled.div`
  position: absolute;
  width: 0;
  height: 0;
  z-index: 5;
  
  ${(props) => {
    if (props.color === "yellow") {
      return `
        top: 50%;
        left: 50%;
        transform: translate(-100%, -50%);
        border-top: 50px solid transparent;
        border-bottom: 50px solid transparent;
        border-left: 50px solid #FFD700;
      `
    }
    if (props.color === "blue") {
      return `
        top: 50%;
        left: 40%;
        transform: translate(0%, -100%);
        border-left: 50px solid transparent;
        border-right: 50px solid transparent;
        border-top: 50px solid #1E90FF;
      `
    }
    if (props.color === "green") {
      return `
        top: 50%;
        left: 60%;
        transform: translate(-100%, 0%);
        border-right: 50px solid transparent;
        border-left: 50px solid transparent;
        border-bottom: 50px solid #32CD32;
      `
    }
    if (props.color === "red") {
      return `
        top: 40%;
        left: 50%;
        transform: translate(0%, 0%);
        border-top: 50px solid transparent;
        border-bottom: 50px solid transparent;
        border-right: 50px solid #FF4444;
      `
    }
  }}

  @media (max-width: 768px) {
    ${(props) => {
      if (props.color === "yellow") {
        return `
          border-top: 45px solid transparent;
          border-bottom: 45px solid transparent;
          border-left: 45px solid #FFD700;
        `
      }
      if (props.color === "green") {
        return `
          border-left: 45px solid transparent;
          border-right: 45px solid transparent;
          border-bottom: 45px solid #32CD32;
        `
      }
      if (props.color === "blue") {
        return `
          border-left: 45px solid transparent;
          border-right: 45px solid transparent;
          border-top: 45px solid #1E90FF;
        `
      }
      if (props.color === "red") {
        return `
          border-top: 45px solid transparent;
          border-bottom: 45px solid transparent;
          border-right: 45px solid #FF4444;
        `
      }
    }}
  }
`