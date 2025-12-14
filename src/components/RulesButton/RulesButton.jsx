const RulesButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{ position: "fixed", right: 20, top: 20, width: 50, height: 50, borderRadius: "50%", backgroundColor: "#FFD700", border: "none", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: "bold", cursor: "pointer", zIndex: 100,}}
    >
      ?
    </button>
  );
};

export default RulesButton;