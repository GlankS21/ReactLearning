import { useState } from "react"
import {
  WrapperBoard,
  WrapperCell,
  WrapperStar,
  WrapperHomeArea,
  WrapperTokenContainer,
  WrapperToken,
  WrapperCenterTriangle,
  WrapperHorse,
  WrapperHomeHorse,
} from "./BoardGameStyle"

const BOARD_SIZE = 15

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
  52: { row: 13, col: 7 },
  53: { row: 12, col: 7 },
  54: { row: 11, col: 7 },
  55: { row: 10, col: 7 },
  56: { row: 9, col: 7 },
  57: { row: 8, col: 7 },
  58: { row: 7, col: 1 },
  59: { row: 7, col: 2 },
  60: { row: 7, col: 3 },
  61: { row: 7, col: 4 },
  62: { row: 7, col: 5 },
  63: { row: 7, col: 6 },
  64: { row: 1, col: 7 },
  65: { row: 2, col: 7 },
  66: { row: 3, col: 7 },
  67: { row: 4, col: 7 },
  68: { row: 5, col: 7 },
  69: { row: 6, col: 7 },
  70: { row: 7, col: 13 },
  71: { row: 7, col: 12 },
  72: { row: 7, col: 11 },
  73: { row: 7, col: 10 },
  74: { row: 7, col: 9 },
  75: { row: 7, col: 8 },
}

const HOME_RANGES = {
  'yellow': { start: 52, end: 57 },
  'red': { start: 58, end: 63 },
  'green': { start: 64, end: 69 },
  'blue': { start: 70, end: 75 }
}
const canHorseMove = (currentCell, diceRoll) => {
  const homeRange = Object.values(HOME_RANGES).find(range => currentCell >= range.start && currentCell <= range.end)
  
  if (homeRange) {
    const newCell = currentCell + diceRoll
    return newCell <= homeRange.end
  }

  return true
}

const getPositionFromCellNumber = (cellNumber) => {
  if (cellNumber === -1) return null 
  return cellPositions[cellNumber] || null
}

const BoardGameComponent = ({gameState, onMoveHorse, diceRoll, canMove,}) => {
  const [selectedHorse, setSelectedHorse] = useState(null)
  const handleHorseClick = async (horse) => {
    if (!canMove) return
    if (horse.cell_number !== -1) if (!canHorseMove(horse.cell_number, diceRoll)) return
   
    setSelectedHorse(horse.horse_id)
    await onMoveHorse(horse.horse_id)
    setSelectedHorse(null)
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
    if (!gameState || !gameState.players) return null
    const horsesByCell = {}
    const allHorses = []
    
    gameState.players.forEach((player) => {
      if (!player.horses) return
      
      player.horses.forEach((horse) => {
        if (horse.cell_number === -1) return
        allHorses.push({ 
          ...horse, 
          playerColor: player.color, 
          isCurrentPlayer: player.is_turn 
        })
        
        const key = `cell-${horse.cell_number}`
        if (!horsesByCell[key]) {
          horsesByCell[key] = []
        }
        horsesByCell[key].push(horse.horse_id)
      })
    })

    const horses = []
    allHorses.forEach((horse) => {
      const pos = getPositionFromCellNumber(horse.cell_number)
      if (!pos) return

      const isCurrentPlayerTurn = horse.isCurrentPlayer
      const isMoveable = canHorseMove(horse.cell_number, diceRoll)
      const isClickable = canMove && isCurrentPlayerTurn && isMoveable
      const isSelected = selectedHorse === horse.horse_id

      let borderColor = "#fff"
      let cursorStyle = "default"
      let opacity = 1
      let pointerEvents = "auto"

      if (isSelected) {
        borderColor = "#FFD700" 
      } else if (isClickable) {
        borderColor = "#FFD700" 
        cursorStyle = "pointer"
      } else if (isCurrentPlayerTurn && !isMoveable) {
        opacity = 0.4
        cursorStyle = "not-allowed"
        pointerEvents = "none"
      } else {
        pointerEvents = "none"
      }

      const screenWidth = window.innerWidth
      let CELL_SIZE
      if (screenWidth > 768) {
        CELL_SIZE = 100/3
      } else {
        CELL_SIZE = 30
      }

      const cellKey = `cell-${horse.cell_number}`
      const horseIndexInCell = horsesByCell[cellKey].indexOf(horse.horse_id)
      const totalHorsesInCell = horsesByCell[cellKey].length
      const horseSize = totalHorsesInCell > 1 ? '15px' : '26px'
      const fontSize = totalHorsesInCell > 1 ? '10px' : '14px'

      let offsetX = 0
      let offsetY = 0

      if (totalHorsesInCell === 1) {
        offsetX = 0
        offsetY = 0
      } else if (totalHorsesInCell === 2) {
        offsetX = horseIndexInCell === 0 ? 0 : 12
        offsetY = horseIndexInCell === 0 ? 0 : 15
      } else if (totalHorsesInCell === 3) {
        const angles = [0, 120, 240]
        const angle = (angles[horseIndexInCell] * Math.PI) / 180
        const radius = 10
        offsetX = 5 + Math.cos(angle) * radius
        offsetY = 8 + Math.sin(angle) * radius
      } else if (totalHorsesInCell === 4) {
        const positions = [
          { x: -6, y: -6 },
          { x: 6, y: -6 },
          { x: -6, y: 6 },
          { x: 6, y: 6 },
        ]
        offsetX = 6 + positions[horseIndexInCell].x
        offsetY = 6 + positions[horseIndexInCell].y
      } else {
        const perRow = 2
        const row = Math.floor(horseIndexInCell / perRow)
        const col = horseIndexInCell % perRow
        offsetX = (col - 0.5) * 8
        offsetY = (row - 0.5) * 8
      }

      horses.push(
        <WrapperHorse
          key={`horse-${horse.horse_id}`}
          onClick={() => isClickable && handleHorseClick(horse)}
          color={horse.playerColor}
          borderColor={borderColor}
          cursor={cursorStyle}
          opacity={opacity}
          pointerEvents={pointerEvents}
          horseSize={horseSize}
          fontSize={fontSize}
          style={{
            left: `${pos.col * CELL_SIZE + offsetX}px`,
            top: `${pos.row * CELL_SIZE + offsetY + 2}px`,
          }}
        >
          🐴
        </WrapperHorse>
      )
    })

    return horses
  }
  const renderHomeArea = (color, playerIdx) => {
    const player = gameState?.players?.find(p => p.color === color)
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
    const canMoveFromHome = canMove && isCurrentPlayer

    return (
      <div>
        <WrapperTokenContainer>
          {horsesInHome.map((horse) => {
            const isSelected = selectedHorse === horse.horse_id
            const borderColor = isSelected ? "#FFD700" : (canMoveFromHome ? "#FFD700" : "#ccc")
            const cursorStyle = canMoveFromHome ? "pointer" : "default"

            return (
              <WrapperHomeHorse
                key={`home-horse-${horse.horse_id}`}
                onClick={() => canMoveFromHome && handleHorseClick(horse)}
                color={color}
                borderColor={borderColor}
                cursor={cursorStyle}
              >
                🐴
              </WrapperHomeHorse>
            )
          })}
          {Array.from({ length: emptySlots }).map((_, idx) => (
            <WrapperToken key={`empty-${idx}`} color={color} />
          ))}
        </WrapperTokenContainer>
      </div>
    )
  }
  
  return (
    <WrapperBoard>
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

      <WrapperCenterTriangle color="red" />
      <WrapperCenterTriangle color="green" />
      <WrapperCenterTriangle color="yellow" />
      <WrapperCenterTriangle color="blue" />

      {renderBoard()}
      {renderHorses()}
    </WrapperBoard>
  )
}

export default BoardGameComponent
