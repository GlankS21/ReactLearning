import { Button, Input } from "antd"
import styled from "styled-components"

export const WrapperInputFeild = styled(Input)`
  gap: 10px;
  height: 50px;
  border-radius: 10px;
  
  @media (max-width: 768px) {
    height: 45px;
    font-size: 14px;
  }
  
  @media (max-width: 480px) {
    height: 40px;
    font-size: 13px;
  }
`

export const WrapperPasswordFeild = styled(Input.Password)`
  gap: 10px;
  height: 50px;
  border-radius: 10px;
  
  @media (max-width: 768px) {
    height: 45px;
    font-size: 14px;
  }
  
  @media (max-width: 480px) {
    height: 40px;
    font-size: 13px;
  }
`

export const WrapperButtonFeild = styled(Button)`
  width: 100%;
  height: 40px;
  border-radius: 30px;
  text-transform: uppercase;
  background-color: #02343E;
  
  &:hover {
    background-color: #045566 !important;
  }
  
  @media (max-width: 768px) {
    height: 38px;
    font-size: 14px;
  }
  
  @media (max-width: 480px) {
    height: 36px;
    font-size: 12px;
  }
`
