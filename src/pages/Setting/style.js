import styled from "styled-components"

export const WrapperSettingsContent = styled.div`
  border-radius: 20px;
  padding: 30px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
`

export const WrapperSettingsSection = styled.div`
  margin-bottom: 30px;

  h3 {
    font-size: 20px;
    color: white;
    margin-bottom: 15px;
  }
`

export const WrapperRulesAccordion = styled.div`
  border: 2px solid #ddd;
  border-radius: 12px;
  overflow: hidden;
`
export const WrapperRulesContent = styled.div`
  padding: 20px;

  h4 {
    color: #eee;
    margin-top: 15px;
    margin-bottom: 10px;
    font-size: 18px;

    &:first-child {
      margin-top: 0;
    }
  }

  p {
    margin: 0 0 15px 0;
    line-height: 1.6;
    color: #eee;
  }

  ul {
    margin: 0 0 15px 0;
    padding-left: 20px;

    li {
      margin-bottom: 8px;
      line-height: 1.6;
      color: #eee;  
    }
  }
`

export const WrapperLogoutButton = styled.button`
  width: 100%;
  padding: 15px;
  background: #02343E;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #045566;
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

  &:active {
    transform: translateX(-2px);
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