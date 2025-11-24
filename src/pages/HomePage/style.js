import { Button } from "antd";
import styled from "styled-components";

export const WrapperImage = styled.img`
    width: auto;
    height: ${props => props.height};
    object-fit: contain;
`;

export const WrapperButton = styled(Button)`    
    background-color: #396C78;
    border: 4px solid #78B5DD;
    width: 400px;
    height: 48px;
    & span {
        font-weight: bold;
    }
`;