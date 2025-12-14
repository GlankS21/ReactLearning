const RulesModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,}}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: "rgba(255, 255, 255, 0.7)", borderRadius: 20, padding: 30, maxWidth: 600, width: "90%", maxHeight: "80vh", overflowY: "auto", position: "relative",}}
      >
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 15, right: 15, background: "none", border: "none", fontSize: 32, cursor: "pointer", color: "#666", padding: 0, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%",}}
        >
          ×
        </button>
        
        <h2 style={{ marginTop: 0, marginBottom: 25, color: "#02343E", textAlign: "center" }}>
          Правила игры Лудо
        </h2>
        
        <div style={{ padding: 20, border: "2px solid #ddd", borderRadius: 12, color: "#333",}}>
          <h4 style={{ color: "#02343E", marginTop: 0, marginBottom: 10 }}>Цель игры</h4>
          <p style={{ lineHeight: 1.6 }}>
            Привести все 4 свои фишки из дома к финишу раньше других игроков.
          </p>

          <h4 style={{ color: "#02343E", marginTop: 15, marginBottom: 10 }}>Как играть</h4>
          <ul style={{ paddingLeft: 20, lineHeight: 1.6 }}>
            <li>Каждый игрок имеет 4 фишки одного цвета</li>
            <li>Кубик автоматически бросается в начале хода</li>
            <li>Если выпало 6, игрок получает дополнительный бросок</li>
            <li>Фишки движутся по часовой стрелке вокруг игрового поля</li>
          </ul>

          <h4 style={{ color: "#02343E", marginTop: 15, marginBottom: 10 }}>Съедание фишек</h4>
          <p style={{ lineHeight: 1.6 }}>
            Если ваша фишка остановилась на клетке с фишкой соперника, фишка соперника возвращается домой.
          </p>

          <h4 style={{ color: "#02343E", marginTop: 15, marginBottom: 10 }}>Безопасные клетки</h4>
          <p style={{ lineHeight: 1.6 }}>
            Клетки со звёздочкой считаются безопасными — фишки на них нельзя съесть.
          </p>

          <h4 style={{ color: "#02343E", marginTop: 15, marginBottom: 10 }}>Победа</h4>
          <p style={{ lineHeight: 1.6, marginBottom: 0 }}>
            Побеждает тот, кто первым приведёт все 4 фишки к финишу.
          </p>
        </div>

        <button
          onClick={onClose}
          style={{ marginTop: 30, width: "100%", padding: 15, backgroundColor: "#02343E", color: "white", border: "none", borderRadius: 12, fontSize: 18, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",}}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#045566")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#02343E")}
        >
          ЗАКРЫТЬ
        </button>
      </div>
    </div>
  );
};

export default RulesModal;