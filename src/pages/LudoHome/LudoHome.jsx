"use client"
import { useState } from "react"
import {
  WrapperContainer,
  WrapperContent,
  WrapperLudoIcon,
  WrapperButtonsSection,
  WrapperGameButton,
  WrapperButtonImage,
  WrapperButtonText,
} from "./style"
import BackgroundComponent from "../../components/BackgroundComponent/BackgroundComponent"
import ludo from "../../assets/image/Ludohome_img.png"
import game_style from "../../assets/image/Ludohome_style_game.png"
import { useNavigate } from "react-router-dom"
import DefaultAvatar from "../../components/DefaultAvatar/DefaultAvatar"
import RulesModal from "../../components/RulesModal/RulesModal";
import RulesButton from "../../components/RulesButton/RulesButton";

const LudoHome = () => {
  const navigate = useNavigate()
  const [showRules, setShowRules] = useState(false)
  const login = localStorage.getItem("login")

  const handleGameModeClick = (players) => {
    console.log(`Selected ${players} players mode`)
    navigate(`/waiting?players=${players}`)
  }

  return (
    <BackgroundComponent opacity={0.95}>
      <button
        onClick={() => setShowRules(true)}
        style={{ position: "fixed", right: 20, top: 20, width: 52, height: 52, borderRadius: "50%", backgroundColor: "#FFD700", border: "none", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: "bold", cursor: "pointer", zIndex: 100,}}
      >?</button>
      <div
        onClick={() => navigate("/setting")}
        style={{ position: "fixed", left: 20, top: 20, cursor: "pointer", zIndex: 100, display: "flex", alignItems: "center", gap: 10,}}
      >
        <DefaultAvatar login={login} size={50} />
      </div>
      
      <RulesButton onClick={() => setShowRules(true)} />
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />

      <WrapperContainer>
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