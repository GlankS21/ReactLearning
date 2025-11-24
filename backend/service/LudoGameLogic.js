const HOME_RANGES = {
  red:   { start: 70, end: 75 },
  blue:  { start: 64, end: 69 },
  yellow:{ start: 58, end: 63 },
  green: { start: 52, end: 57 },
};

const START_CELLS = { red: 39, blue: 26, yellow: 13, green: 0 };
const ENTRY_CELLS = { red: 37, blue: 24, yellow: 11, green: 50 };
const MAIN_TRACK_LENGTH = 52;
const SAFE_CELLS = [0, 8, 13, 21, 26, 34, 39, 47];

class LudoGameLogic {
  static moveHorse(currentCell, color, dice) {
    if (currentCell === -1) {
      return dice === 6 ? START_CELLS[color] : -1;
    }

    const home = HOME_RANGES[color];
    if (currentCell >= home.start && currentCell <= home.end) {
      const newPos = currentCell + dice;
      return newPos > home.end ? currentCell : newPos;
    }

    const entry = ENTRY_CELLS[color];
    const stepsToEntry = (entry - currentCell + MAIN_TRACK_LENGTH) % MAIN_TRACK_LENGTH;

    if (dice > stepsToEntry) {
      const overshoot = dice - stepsToEntry - 1;
      const target = Math.min(home.start + overshoot, home.end);
      return target;
    }

    return (currentCell + dice) % MAIN_TRACK_LENGTH;
  }

  static isFinished(cell, color) {
    return cell === HOME_RANGES[color].end;
  }

  static checkCapture(currentCell, color, horses) {
    if (SAFE_CELLS.includes(currentCell)) return null;
    return horses.find(h => h.cell_id === currentCell && h.color !== color) || null;
  }
}

// Export cả class và mảng SAFE_CELLS
module.exports = 
{ LudoGameLogic, 
  SAFE_CELLS, 
  START_CELLS,
  HOME_RANGES,
  ENTRY_CELLS,
  MAIN_TRACK_LENGTH 
};
