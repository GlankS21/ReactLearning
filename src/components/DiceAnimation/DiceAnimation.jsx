import { useState, useEffect, useRef } from "react";

const DiceAnimation = ({ number, isRolling, onAnimationEnd }) => {
  const [displayNumber, setDisplayNumber] = useState(number);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef(null);
  const hasCalledEndRef = useRef(false);

  const getRotation = (num) => {
    const rotations = {
      1: 'rotateX(0deg) rotateY(0deg)',
      2: 'rotateX(0deg) rotateY(-90deg)',
      3: 'rotateX(0deg) rotateY(-180deg)',
      4: 'rotateX(0deg) rotateY(90deg)',
      5: 'rotateX(-90deg) rotateY(0deg)',
      6: 'rotateX(90deg) rotateY(0deg)',
    };
    return rotations[num] || rotations[1];
  };

  useEffect(() => {
    if (isRolling) {
      // Reset flag khi bắt đầu roll mới
      hasCalledEndRef.current = false;
      setIsAnimating(true);

      const rollCount = 10;
      let currentRoll = 0;
      const rollInterval = 80;

      const animate = () => {
        currentRoll++;
        
        if (currentRoll < rollCount) {
          const randomNum = Math.floor(Math.random() * 6) + 1;
          setDisplayNumber(randomNum);
          animationRef.current = setTimeout(animate, rollInterval);
        } else {
          // Dừng ở số cuối cùng
          setDisplayNumber(number);
          setIsAnimating(false);
          
          // Gọi onAnimationEnd chỉ 1 lần
          if (onAnimationEnd && !hasCalledEndRef.current) {
            hasCalledEndRef.current = true;
            console.log('[DiceAnimation] Animation ended, calling onAnimationEnd');
            onAnimationEnd();
          }
        }
      };

      animationRef.current = setTimeout(animate, rollInterval);

      return () => {
        if (animationRef.current) {
          clearTimeout(animationRef.current);
        }
      };
    } else {
      setDisplayNumber(number);
    }
  }, [isRolling, number, onAnimationEnd]);

  const renderDots = (num) => {
    const dotStyle = {
      width: '5px',
      height: '5px',
      backgroundColor: '#333',
      borderRadius: '50%',
      position: 'absolute',
    };

    const positions = {
      1: [{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }],
      2: [
        { top: '25%', left: '25%' },
        { bottom: '25%', right: '25%' }
      ],
      3: [
        { top: '25%', left: '25%' },
        { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
        { bottom: '25%', right: '25%' }
      ],
      4: [
        { top: '25%', left: '25%' },
        { top: '25%', right: '25%' },
        { bottom: '25%', left: '25%' },
        { bottom: '25%', right: '25%' }
      ],
      5: [
        { top: '25%', left: '25%' },
        { top: '25%', right: '25%' },
        { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
        { bottom: '25%', left: '25%' },
        { bottom: '25%', right: '25%' }
      ],
      6: [
        { top: '25%', left: '25%' },
        { top: '25%', right: '25%' },
        { top: '50%', left: '25%', transform: 'translateY(-50%)' },
        { top: '50%', right: '25%', transform: 'translateY(-50%)' },
        { bottom: '25%', left: '25%' },
        { bottom: '25%', right: '25%' }
      ],
    };

    return (positions[num] || positions[1]).map((pos, i) => (
      <div key={i} style={{ ...dotStyle, ...pos }} />
    ));
  };

  const diceStyle = {
    width: '40px',
    height: '40px',
    perspective: '1000px',
    cursor: 'default',
  };

  const cubeStyle = {
    width: '100%',
    height: '100%',
    position: 'relative',
    transformStyle: 'preserve-3d',
    transform: isAnimating 
      ? `rotateX(${Math.random() * 360}deg) rotateY(${Math.random() * 360}deg)` 
      : getRotation(displayNumber),
    transition: isAnimating ? 'transform 0.08s linear' : 'transform 0.3s ease-out',
  };

  const faceBaseStyle = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f1f1f1',
    border: '2px solid #333',
    borderRadius: '4px',
  };

  const faces = [
    { num: 1, transform: 'rotateY(0deg) translateZ(20px)' },
    { num: 2, transform: 'rotateY(90deg) translateZ(20px)' },
    { num: 3, transform: 'rotateY(180deg) translateZ(20px)' },
    { num: 4, transform: 'rotateY(-90deg) translateZ(20px)' },
    { num: 5, transform: 'rotateX(90deg) translateZ(20px)' },
    { num: 6, transform: 'rotateX(-90deg) translateZ(20px)' },
  ];

  return (
    <div style={diceStyle}>
      <div style={cubeStyle}>
        {faces.map(face => (
          <div
            key={face.num}
            style={{
              ...faceBaseStyle,
              transform: face.transform,
            }}
          >
            {renderDots(face.num)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DiceAnimation;