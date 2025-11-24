"use client"
import {
  WrapperContainer,
  WrapperAvatar,
  WrapperContent,
  WrapperLudoIcon,
  WrapperButtonsSection,
  WrapperGameButton,
  WrapperButtonImage,
  WrapperButtonText,
} from "./style"
import BackgroundComponent from "../../components/BackgroundComponent/BackgroundComponent"
import ludo from "../../assets/image/Ludohome_img.png"
import avatar from "../../assets/image/avatar.png"
import game_style from "../../assets/image/Ludohome_style_game.png"
import { useNavigate } from "react-router-dom"

const LudoHome = () => {
  const navigate = useNavigate()

  const handleGameModeClick = (players) => {
    console.log(`Selected ${players} players mode`)
    navigate(`/waiting?players=${players}`)
  }

  return (
    <BackgroundComponent opacity={0.95}>
      <WrapperContainer>
        <WrapperAvatar
          src={avatar}
          alt="User Avatar"
          onClick={() => (window.location.href = "/setting")}
          style={{ cursor: "pointer" }}
          onError={(e) => {
            e.currentTarget.style.display = "none"
            if (e.currentTarget.parentElement) {
              e.currentTarget.parentElement.innerHTML =
                '<span style="color: white; font-weight: 600; font-size: 18px;">U</span>'
            }
          }}
        />

        <WrapperContent>
          <WrapperLudoIcon src={ludo || "/placeholder.svg"} alt="ludo icon"></WrapperLudoIcon>

          <WrapperButtonsSection>
            <WrapperGameButton onClick={() => handleGameModeClick(2)}>
              <WrapperButtonImage src={game_style} alt="2 Players" />
              <WrapperButtonText>2 PLAYERS</WrapperButtonText>
            </WrapperGameButton>

            <WrapperGameButton onClick={() => handleGameModeClick(4)}>
              <WrapperButtonImage src={game_style} alt="4 Players" />
              <WrapperButtonText>4 PLAYERS</WrapperButtonText>
            </WrapperGameButton>
          </WrapperButtonsSection>
        </WrapperContent>
      </WrapperContainer>
    </BackgroundComponent>
  )
}

export default LudoHome
