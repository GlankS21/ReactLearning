"use client"
import { useNavigate } from "react-router-dom"
import BackgroundComponent from "../../components/BackgroundComponent/BackgroundComponent"
import { useState } from "react"
import {
  WrapperSettingsContent,
  WrapperSettingsHeader,
  WrapperCloseButton,
  WrapperSettingsSection,
  WrapperAvatarGrid,
  WrapperAvatarOption,
  WrapperRulesAccordion,
  WrapperRulesTitle,
  WrapperRulesContent,
  WrapperLogoutButton,
} from "./style"
import { WrapperBackButton } from "./style"

const Setting = ({ onClose }) => {
  const [selectedAvatar, setSelectedAvatar] = useState("👤")
  const [isRulesOpen, setIsRulesOpen] = useState(false)
  const navigate = useNavigate()
  const handleBack = () => {
    navigate("/ludohome")
  }
  const avatars = ["👤", "😀", "😎", "🤓", "🥳", "🤠", "👨", "👩", "🧑", "👦", "👧", "🧒"]

//   const handleLogout = () => {
//     if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
//       console.log("Đăng xuất thành công")
//     }
//   }

  return (
    <BackgroundComponent opacity={0.8}>
    <WrapperBackButton onClick={handleBack}>←</WrapperBackButton>
    <WrapperSettingsContent>
      <WrapperSettingsHeader>
        <h2>Настройки</h2>
        {onClose && <WrapperCloseButton onClick={onClose}>×</WrapperCloseButton>}
      </WrapperSettingsHeader>

      <WrapperSettingsSection>
        <h3>Avatar</h3>
        <WrapperAvatarGrid>
          {avatars.map((avatar) => (
            <WrapperAvatarOption
              key={avatar}
              isSelected={selectedAvatar === avatar}
              onClick={() => setSelectedAvatar(avatar)}
            >
              {avatar}
            </WrapperAvatarOption>
          ))}
        </WrapperAvatarGrid>
      </WrapperSettingsSection>

      <WrapperSettingsSection>
        <h3>Правила игры Лудо</h3>
        <WrapperRulesAccordion>
            <WrapperRulesTitle onClick={() => setIsRulesOpen(!isRulesOpen)}>
            <span>Посмотреть правила</span>
            <span>{isRulesOpen ? "▲" : "▼"}</span>
            </WrapperRulesTitle>
            {isRulesOpen && (
            <WrapperRulesContent>
                <h4>Цель игры</h4>
                <p>Привести все 4 свои фишки из дома к финишу раньше других игроков.</p>

                <h4>Как играть</h4>
                <ul>
                <li>Каждый игрок имеет 4 фишки одного цвета</li>
                <li>Игрок бросает кубик, чтобы передвигать фишки</li>
                <li>Чтобы вывести фишку из дома, нужно выбросить 6</li>
                <li>Если выпало 6, игрок получает дополнительный бросок</li>
                <li>Фишки движутся по часовой стрелке вокруг игрового поля</li>
                </ul>

                <h4>Съедание фишек</h4>
                <p>Если ваша фишка остановилась на клетке с фишкой соперника, фишка соперника возвращается домой.</p>

                <h4>Безопасные клетки</h4>
                <p>Клетки со звёздочкой считаются безопасными — фишки на них нельзя съесть.</p>

                <h4>Победа</h4>
                <p>Побеждает тот, кто первым приведёт все 4 фишки к финишу.</p>
            </WrapperRulesContent>
            )}
        </WrapperRulesAccordion>

      </WrapperSettingsSection>

      <WrapperSettingsSection>
        <WrapperLogoutButton onClick={() => (window.location.href = "/signin")}>Logout</WrapperLogoutButton>
      </WrapperSettingsSection>
    </WrapperSettingsContent>
    </BackgroundComponent>
   
  )
}

export default Setting
