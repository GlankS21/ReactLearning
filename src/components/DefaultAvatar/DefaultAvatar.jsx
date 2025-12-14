const DefaultAvatar = ({ login, size = 40, style: customStyle = {} }) => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', 
    '#DDA0DD', '#98D8C8', '#F39C12', '#9B59B6', '#3498DB',
    '#E74C3C', '#1ABC9C', '#F1C40F', '#8E44AD', '#2ECC71'
  ];
  
  const colorIndex = login ? login.charCodeAt(0) % colors.length : 0;
  const initial = login ? login.charAt(0).toUpperCase() : '?';

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: colors[colorIndex],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 'bold',
        fontSize: size * 0.45,
        border: '2px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        flexShrink: 0,
        ...customStyle,
      }}
    >
      {initial}
    </div>
  );
};

export default DefaultAvatar;