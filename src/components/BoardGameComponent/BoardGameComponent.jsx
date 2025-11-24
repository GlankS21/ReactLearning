import { useState } from "react"
import {
  WrapperBoard,
  WrapperCell,
  WrapperStar,
  WrapperHomeArea,
  WrapperTokenContainer,
  WrapperToken,
  WrapperCenterTriangle,
} from "./BoardGameStyle"

const BOARD_SIZE = 15
const CELL_SIZE = 100/3

const boardLayout = [
  [2, 2, 2, 2, 2, 2, 1, 1, 1, 3, 3, 3, 3, 3, 3],
  [2, 2, 2, 2, 2, 2, 1, 7, 1, 3, 3, 3, 3, 3, 3],
  [2, 2, 2, 2, 2, 2, 1, 7, 1, 3, 3, 3, 3, 3, 3],
  [2, 2, 2, 2, 2, 2, 1, 7, 1, 3, 3, 3, 3, 3, 3],
  [2, 2, 2, 2, 2, 2, 1, 7, 1, 3, 3, 3, 3, 3, 3],
  [2, 2, 2, 2, 2, 2, 1, 7, 1, 3, 3, 3, 3, 3, 3],
  [1, 1, 1, 1, 1, 1, 10, 10, 10, 1, 1, 1, 1, 1, 1],
  [1, 6, 6, 6, 6, 6, 10, 10, 10, 9, 9, 9, 9, 9, 1],
  [1, 1, 1, 1, 1, 1, 10, 10, 10, 1, 1, 1, 1, 1, 1],
  [4, 4, 4, 4, 4, 4, 1, 8, 1, 5, 5, 5, 5, 5, 5],
  [4, 4, 4, 4, 4, 4, 1, 8, 1, 5, 5, 5, 5, 5, 5],
  [4, 4, 4, 4, 4, 4, 1, 8, 1, 5, 5, 5, 5, 5, 5],
  [4, 4, 4, 4, 4, 4, 1, 8, 1, 5, 5, 5, 5, 5, 5],
  [4, 4, 4, 4, 4, 4, 1, 8, 1, 5, 5, 5, 5, 5, 5],
  [4, 4, 4, 4, 4, 4, 1, 1, 1, 5, 5, 5, 5, 5, 5],
]

const stars = [
  [6, 1],
  [1, 8],
  [6, 12],
  [8, 13],
  [12, 8],
  [13, 6],
  [8, 2],
  [2, 6],
]

const startPositions = new Map([
  ["6-1", "yellow"],
  ["1-8", "blue"],
  ["8-13", "red"],
  ["13-6", "green"],
])

const starSet = new Set(stars.map(([r, c]) => `${r}-${c}`))
const isStar = (row, col) => starSet.has(`${row}-${col}`)

const cellPositions = {
  // Yellow path (top)
  0: { row: 13, col: 6 },
  1: { row: 12, col: 6 },
  2: { row: 11, col: 6 },
  3: { row: 10, col: 6 },
  4: { row: 9, col: 6 },
  5: { row: 8, col: 5 },
  6: { row: 8, col: 4 },
  7: { row: 8, col: 3 },
  8: { row: 8, col: 2 },
  9: { row: 8, col: 1 },
  10: { row: 8, col: 0 },
  11: { row: 7, col: 0 },
  12: { row: 6, col: 0 },
  
  // Red path (right)
  13: { row: 6, col: 1 },
  14: { row: 6, col: 2 },
  15: { row: 6, col: 3 },
  16: { row: 6, col: 4 },
  17: { row: 6, col: 5 },
  18: { row: 5, col: 6 },
  19: { row: 4, col: 6 },
  20: { row: 3, col: 6 },
  21: { row: 2, col: 6 },
  22: { row: 1, col: 6 },
  23: { row: 0, col: 6 },
  24: { row: 0, col: 7 },
  25: { row: 0, col: 8 },
  
  // Green path (bottom)
  26: { row: 1, col: 8 },
  27: { row: 2, col: 8 },
  28: { row: 3, col: 8 },
  29: { row: 4, col: 8 },
  30: { row: 5, col: 8 },
  31: { row: 6, col: 9 },
  32: { row: 6, col: 10 },
  33: { row: 6, col: 11 },
  34: { row: 6, col: 12 },
  35: { row: 6, col: 13 },
  36: { row: 6, col: 14 },
  37: { row: 7, col: 14 },
  38: { row: 8, col: 14 },
  
  // Blue path (left)
  39: { row: 8, col: 13 },
  40: { row: 8, col: 12 },
  41: { row: 8, col: 11 },
  42: { row: 8, col: 10 },
  43: { row: 8, col: 9 },
  44: { row: 9, col: 8 },
  45: { row: 10, col: 8 },
  46: { row: 11, col: 8 },
  47: { row: 12, col: 8 },
  48: { row: 13, col: 8 },
  49: { row: 14, col: 8 },
  50: { row: 14, col: 7 },
  51: { row: 14, col: 6 },
  
  // Home stretch
  52: { row: 13, col: 7 },
  53: { row: 12, col: 7 },
  54: { row: 11, col: 7 },
  55: { row: 10, col: 7 },
  56: { row: 9, col: 7 },
  57: { row: 8, col: 7 }, // Finish

  58: { row: 7, col: 1 },
  59: { row: 7, col: 2 },
  60: { row: 7, col: 3 },
  61: { row: 7, col: 4 },
  62: { row: 7, col: 5 },
  63: { row: 7, col: 6 }, // Finish

  64: { row: 1, col: 7 },
  65: { row: 2, col: 7 },
  66: { row: 3, col: 7 },
  67: { row: 4, col: 7 },
  68: { row: 5, col: 7 },
  69: { row: 6, col: 7 }, // Finish

  70: { row: 7, col: 13 },
  71: { row: 7, col: 12 },
  72: { row: 7, col: 11 },
  73: { row: 7, col: 10 },
  74: { row: 7, col: 9 },
  75: { row: 7, col: 8 }, // Finish
}

const getPositionFromCellNumber = (cellNumber) => {
  if (cellNumber === -1) return null 
  return cellPositions[cellNumber] || null
}

const BoardGameComponent = ({
  gameState,
  onMoveHorse,
  diceRoll,
  isMyTurn,
  myLogin,
  canMove,
}) => {
  const [selectedHorse, setSelectedHorse] = useState(null)

  const handleHorseClick = async (horse, playerIdx) => {
    if (!canMove) {
      console.warn('❌ Cannot move: canMove=false', {
        canMove,
        diceRoll,
        hasGameState: !!gameState
      });
      return
    }

    if (horse.cell_number === -1) {
      console.warn('❌ Cannot move: Horse in home', {
        cellNumber: horse.cell_number,
        diceRoll,
        needRoll6: diceRoll !== 6
      });
      return
    }

    console.log(`✅ Moving horse ${horse.horse_id} from cell ${horse.cell_number}`)
    setSelectedHorse(horse.horse_id)

    const success = await onMoveHorse(horse.horse_id)
    console.log('🐴 Move result:', success)
    setSelectedHorse(null)
  }

  const handleHomeHorseClick = async (horse, playerIdx) => {
    // Bỏ yêu cầu roll = 6, roll bao nhiêu cũng được move từ nhà
    if (!canMove) {
      console.warn('Cannot move: canMove=false');
      return
    }

    console.log(`🐴 Moving horse ${horse.horse_id} from home`)
    setSelectedHorse(horse.horse_id)

    const success = await onMoveHorse(horse.horse_id)
    if (success) {
      setSelectedHorse(null)
    } else {
      setSelectedHorse(null)
    }
  }

  const renderBoard = () => {
    const cells = []

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const rowData = boardLayout[row] || []
        const cellType = typeof rowData[col] === "number" ? rowData[col] : 0
        const key = `${row}-${col}`
        const hasStar = isStar(row, col)
        const startColor = startPositions.get(key) || null

        cells.push(
          <WrapperCell
            key={key}
            data-row={row}
            data-col={col}
            cellType={cellType}
            hasStar={hasStar}
            startColor={startColor}
          >
            {hasStar && <WrapperStar>☆</WrapperStar>}
          </WrapperCell>
        )
      }
    }

    return cells
  }

  const renderHorses = () => {
    if (!gameState || !gameState.players) {
      console.warn('⚠️ No gameState or players in renderHorses')
      return null
    }
    
    console.log('🎯 renderHorses called:', {
      playersCount: gameState.players.length,
      canMove,
      diceRoll,
      current_turn_login: gameState.current_turn_player_login
    });
    
    const horses = []

    gameState.players.forEach((player, playerIdx) => {
      if (!player.horses) {
        console.warn(`⚠️ Player ${playerIdx} (${player.login}) has no horses array`)
        return
      }

      player.horses.forEach((horse) => {
        // Bỏ qua ngựa trong nhà
        if (horse.cell_number === -1) return

        const pos = getPositionFromCellNumber(horse.cell_number)
        const isCurrentPlayerTurn = player.is_turn
        const isClickable = canMove && isCurrentPlayerTurn
        const isSelected = selectedHorse === horse.horse_id

        if (!pos) {
          console.warn(`⚠️ Invalid position for horse ${horse.horse_id} at cell ${horse.cell_number}`)
          return
        }

        console.log(`🐴 Rendering horse:`, {
          horseId: horse.horse_id,
          playerLogin: player.login,
          cellNumber: horse.cell_number,
          isCurrentPlayerTurn,
          isClickable,
          canMove,
          diceRoll
        });

        horses.push(
          <div
            key={`horse-${horse.horse_id}`}
            onClick={() => handleHorseClick(horse, playerIdx)}
            style={{
              position: "absolute",
              left: `${pos.col * CELL_SIZE}px`,
              top: `${pos.row * CELL_SIZE}px`,
              width: "26px",
              height: "26px",
              borderRadius: "50%",
              backgroundColor: player.color,
              border: isSelected
                ? "3px solid #FFD700"
                : isClickable
                ? "2px solid #FFD700"
                : "2px solid #fff",
              cursor: isClickable ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
              transform: isSelected 
                ? "scale(1.3)" 
                : isClickable 
                ? "scale(1.15)" 
                : "scale(1)",
              transition: "all 0.2s",
              zIndex: 10,
              pointerEvents: "auto"
            }}
            title={`${player.login}'s horse - Cell ${horse.cell_number}${isClickable ? ' (Click to move)' : ' (Not your turn)'}`}
          >
            🐴
          </div>
        )
      })
    })

    console.log(`✅ Total horses rendered: ${horses.length}`)
    return horses
  }

  const renderHomeArea = (color, playerIdx) => {
    const player = gameState?.players?.[playerIdx]
    if (!player) {
      return (
        <WrapperTokenContainer>
          <WrapperToken color={color} />
          <WrapperToken color={color} />
          <WrapperToken color={color} />
          <WrapperToken color={color} />
        </WrapperTokenContainer>
      )
    }

    const horsesInHome = player.horses?.filter(h => h.cell_number === -1) || []
    const emptySlots = 4 - horsesInHome.length
    const isCurrentPlayer = player.is_turn
    const canMoveFromHome = canMove && isCurrentPlayer && diceRoll === 6

    return (
      <div>
        <WrapperTokenContainer>
          {horsesInHome.map((horse) => (
            <div
              key={`home-horse-${horse.horse_id}`}
              onClick={() => handleHomeHorseClick(horse, playerIdx)}
              style={{
                height: "36px",
                width: "36px",
                borderRadius: "50%",
                backgroundColor: color,
                border: canMoveFromHome 
                  ? "2px solid gold" 
                  : "2px solid " + color,
                cursor: canMoveFromHome ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                transition: "all 0.2s",
                opacity: canMoveFromHome ? 1 : 0.7,
                transform: selectedHorse === horse.horse_id ? "scale(1.15)" : "scale(1)",
              }}
              title={`${player.login}'s horse - Home${canMoveFromHome ? ' (Tap to move)' : ''}`}
            >
              🐴
            </div>
          ))}
          {Array.from({ length: emptySlots }).map((_, idx) => (
            <WrapperToken key={`empty-${idx}`} color={color} />
          ))}
        </WrapperTokenContainer>
      </div>
    )
  }

  return (
    <WrapperBoard style={{ position: "relative" }}>
      {/* Home Areas */}
      <WrapperHomeArea color="green" position="bottom-left">
        {renderHomeArea("green", 0)}
      </WrapperHomeArea>
      <WrapperHomeArea color="yellow" position="top-left">
        {renderHomeArea("yellow", 1)}
      </WrapperHomeArea>
      <WrapperHomeArea color="blue" position="top-right">
        {renderHomeArea("blue", 2)}
      </WrapperHomeArea>
      <WrapperHomeArea color="red" position="bottom-right">
        {renderHomeArea("red", 3)}
      </WrapperHomeArea>

      {/* Center Triangles */}
      <WrapperCenterTriangle color="red" />
      <WrapperCenterTriangle color="green" />
      <WrapperCenterTriangle color="yellow" />
      <WrapperCenterTriangle color="blue" />

      {/* Board Grid */}
      {renderBoard()}

      {/* Horses on board */}
      {renderHorses()}
    </WrapperBoard>
  )
}

export default BoardGameComponent