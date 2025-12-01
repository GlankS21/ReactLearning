"use client"
import { useState } from "react"
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
  const [showRules, setShowRules] = useState(false)

  const handleGameModeClick = (players) => {
    console.log(`Selected ${players} players mode`)
    navigate(`/waiting?players=${players}`)
  }

  return (
    <BackgroundComponent opacity={0.95}>
      <button
        onClick={() => setShowRules(true)}
        style={{
          position: "fixed",
          right: 20,
          top: 20,
          width: 50,
          height: 50,
          borderRadius: "50%",
          backgroundColor: "#FFD700",
          border: "none",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          fontWeight: "bold",
          cursor: "pointer",
          zIndex: 100,
        }}
      >? </button>
      
      {showRules && (
        <div
          onClick={() => setShowRules(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              borderRadius: 20,
              padding: 30,
              maxWidth: 600,
              width: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
              position: "relative",
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowRules(false)}
              style={{
                position: "absolute",
                top: 15,
                right: 15,
                background: "none",
                border: "none",
                fontSize: 32,
                cursor: "pointer",
                color: "#666",
                padding: 0,
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
              }}
            >
              ×
            </button>

            {/* Title */}
            <h2 style={{ marginTop: 0, marginBottom: 25, color: "#333", textAlign: "center" }}>
              Правила игры Лудо
            </h2>
            <div
              style={{
                padding: 20,
                border: "2px solid #ddd",
                borderRadius: 12,
                color: "#333",
              }}
            >
              <h4 style={{ color: "#4CAF50", marginTop: 0, marginBottom: 10 }}>
                Цель игры
              </h4>
              <p style={{ lineHeight: 1.6 }}>
                Привести все 4 свои фишки из дома к финишу раньше других игроков.
              </p>

              <h4 style={{ color: "#4CAF50", marginTop: 15, marginBottom: 10 }}>
                Как играть
              </h4>
              <ul style={{ paddingLeft: 20, lineHeight: 1.6 }}>
                <li>Каждый игрок имеет 4 фишки одного цвета</li>
                <li>Игрок бросает кубик, чтобы передвигать фишки</li>
                <li>Если выпало 6, игрок получает дополнительный бросок</li>
                <li>Фишки движутся по часовой стрелке вокруг игрового поля</li>
              </ul>

              <h4 style={{ color: "#4CAF50", marginTop: 15, marginBottom: 10 }}>
                Съедание фишек
              </h4>
              <p style={{ lineHeight: 1.6 }}>
                Если ваша фишка остановилась на клетке с фишкой соперника, фишка соперника
                возвращается домой.
              </p>

              <h4 style={{ color: "#4CAF50", marginTop: 15, marginBottom: 10 }}>
                Безопасные клетки
              </h4>
              <p style={{ lineHeight: 1.6 }}>
                Клетки со звёздочкой считаются безопасными — фишки на них нельзя съесть.
              </p>

              <h4 style={{ color: "#4CAF50", marginTop: 15, marginBottom: 10 }}>
                Победа
              </h4>
              <p style={{ lineHeight: 1.6, marginBottom: 0 }}>
                Побеждает тот, кто первым приведёт все 4 фишки к финишу.
              </p>
            </div>

            {/* Close Button at Bottom */}
            <button
              onClick={() => setShowRules(false)}
              style={{
                marginTop: 30,
                width: "100%",
                padding: 15,
                backgroundColor: "#02343E",
                color: "white",
                border: "none",
                borderRadius: 12,
                fontSize: 18,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#045566")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#02343E")}
            >
              ЗАКРЫТЬ
            </button>
          </div>
        </div>
      )}

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