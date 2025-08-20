const COLS = 10;
const ROWS = 22; // including 2 hidden rows at top
const VISIBLE_ROWS = 20;
const CELL_SIZE = 30;
const COLORS = [
  null,
  '#E8554B', // red
  '#4678F0', // blue
  '#46BE6E', // green
  '#F5C846', // yellow
  '#A55FD2'  // purple
];

const SHAPES = {
  I: [
    [
      [0,0,0,0],
      [1,1,1,1],
      [0,0,0,0],
      [0,0,0,0]
    ],
    [
      [0,0,1,0],
      [0,0,1,0],
      [0,0,1,0],
      [0,0,1,0]
    ],
    [
      [0,0,0,0],
      [0,0,0,0],
      [1,1,1,1],
      [0,0,0,0]
    ],
    [
      [0,1,0,0],
      [0,1,0,0],
      [0,1,0,0],
      [0,1,0,0]
    ]
  ],
  J: [
    [
      [1,0,0],
      [1,1,1],
      [0,0,0]
    ],
    [
      [0,1,1],
      [0,1,0],
      [0,1,0]
    ],
    [
      [0,0,0],
      [1,1,1],
      [0,0,1]
    ],
    [
      [0,1,0],
      [0,1,0],
      [1,1,0]
    ]
  ],
  L: [
    [
      [0,0,1],
      [1,1,1],
      [0,0,0]
    ],
    [
      [0,1,0],
      [0,1,0],
      [0,1,1]
    ],
    [
      [0,0,0],
      [1,1,1],
      [1,0,0]
    ],
    [
      [1,1,0],
      [0,1,0],
      [0,1,0]
    ]
  ],
  O: [
    [
      [1,1],
      [1,1]
    ]
  ],
  S: [
    [
      [0,1,1],
      [1,1,0],
      [0,0,0]
    ],
    [
      [0,1,0],
      [0,1,1],
      [0,0,1]
    ],
    [
      [0,0,0],
      [0,1,1],
      [1,1,0]
    ],
    [
      [1,0,0],
      [1,1,0],
      [0,1,0]
    ]
  ],
  T: [
    [
      [0,1,0],
      [1,1,1],
      [0,0,0]
    ],
    [
      [0,1,0],
      [0,1,1],
      [0,1,0]
    ],
    [
      [0,0,0],
      [1,1,1],
      [0,1,0]
    ],
    [
      [0,1,0],
      [1,1,0],
      [0,1,0]
    ]
  ],
  Z: [
    [
      [1,1,0],
      [0,1,1],
      [0,0,0]
    ],
    [
      [0,0,1],
      [0,1,1],
      [0,1,0]
    ],
    [
      [0,0,0],
      [1,1,0],
      [0,1,1]
    ],
    [
      [0,1,0],
      [1,1,0],
      [1,0,0]
    ]
  ]
};

const PIECES = ['I','J','L','O','S','T','Z'];

function createMatrix(w, h) {
  const m = [];
  while (h--) {
    m.push(new Array(w).fill(0));
  }
  return m;
}

function rotateMatrix(matrix) {
  const N = matrix.length;
  const result = matrix.map((row, i) => row.map((_, j) => matrix[N - j - 1][i]));
  return result;
}

class Bag {
  constructor() {
    this.shapes = [];
    this.colors = [];
  }
  refillShapes() {
    this.shapes = PIECES.slice();
    for (let i = this.shapes.length - 1; i > 0; --i) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.shapes[i], this.shapes[j]] = [this.shapes[j], this.shapes[i]];
    }
  }
  nextShape() {
    if (this.shapes.length === 0) this.refillShapes();
    return this.shapes.pop();
  }
  nextColor(lastColors) {
    // simple weighted random avoiding 3 consecutive same color
    let color;
    do {
      color = 1 + Math.floor(Math.random() * 5);
    } while (lastColors.length >= 3 && lastColors.slice(-3).every(c => c === color));
    return color;
  }
}

class Piece {
  constructor(shapeKey, color) {
    this.shapeKey = shapeKey;
    this.color = color;
    this.rot = 0;
    this.matrix = SHAPES[shapeKey][0];
    this.x = 3;
    this.y = 0; // top (hidden rows handled in draw)
  }
}

class Game {
  constructor(ctx) {
    this.ctx = ctx;
    this.grid = createMatrix(COLS, ROWS);
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.dropCounter = 0;
    this.dropInterval = 1000;
    this.lastTime = 0;
    this.bag = new Bag();
    this.lastColors = [];
    this.current = null;
    this.next = null;
    this.hold = null;
    this.canHold = true;
    this.spawn();
  }

  spawn() {
    if (!this.next) {
      const shape = this.bag.nextShape();
      const color = this.bag.nextColor(this.lastColors);
      this.next = new Piece(shape, color);
    }
    this.current = this.next;
    this.current.x = 3;
    this.current.y = 0;
    const shape = this.bag.nextShape();
    const color = this.bag.nextColor(this.lastColors);
    this.next = new Piece(shape, color);
    this.lastColors.push(this.current.color);
    if (this.lastColors.length > 5) this.lastColors.shift();
    if (this.collide(this.grid, this.current)) {
      this.grid = createMatrix(COLS, ROWS);
      this.score = 0;
      this.lines = 0;
      this.level = 1;
    }
    this.canHold = true;
  }

  collide(grid, piece) {
    const m = piece.matrix;
    for (let y = 0; y < m.length; ++y) {
      for (let x = 0; x < m[y].length; ++x) {
        if (m[y][x] && (grid[y + piece.y] && grid[y + piece.y][x + piece.x]) !== 0) {
          return true;
        }
      }
    }
    return false;
  }

  merge(grid, piece) {
    piece.matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          grid[y + piece.y][x + piece.x] = piece.color;
        }
      });
    });
  }

  sweepLines() {
    let lineCount = 0;
    outer: for (let y = ROWS - 1; y >= 0; --y) {
      for (let x = 0; x < COLS; ++x) {
        if (this.grid[y][x] === 0) {
          continue outer;
        }
      }
      const row = this.grid.splice(y, 1)[0].fill(0);
      this.grid.unshift(row);
      ++lineCount;
      ++y; // stay on same y after shift
    }
    return lineCount;
  }

  applyGravity() {
    for (let x = 0; x < COLS; ++x) {
      let stack = [];
      for (let y = ROWS - 1; y >= 0; --y) {
        if (this.grid[y][x]) stack.push(this.grid[y][x]);
      }
      for (let y = ROWS - 1; y >= 0; --y) {
        this.grid[y][x] = stack[ROWS - 1 - y] || 0;
      }
    }
  }

  findColorGroups() {
    const visited = Array.from({length: ROWS}, () => Array(COLS).fill(false));
    const groups = [];
    for (let y = 0; y < ROWS; ++y) {
      for (let x = 0; x < COLS; ++x) {
        const color = this.grid[y][x];
        if (!color || visited[y][x]) continue;
        const cells = [];
        const q = [[x,y]];
        visited[y][x] = true;
        while (q.length) {
          const [cx,cy] = q.pop();
          cells.push([cx,cy]);
          const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
          for (const [dx,dy] of dirs) {
            const nx = cx + dx, ny = cy + dy;
            if (nx>=0 && nx<COLS && ny>=0 && ny<ROWS && !visited[ny][nx] && this.grid[ny][nx] === color) {
              visited[ny][nx] = true;
              q.push([nx,ny]);
            }
          }
        }
        if (cells.length >= 4) groups.push({color,cells});
      }
    }
    return groups;
  }

  handleGroups() {
    let totalScore = 0;
    let chain = 0;
    while (true) {
      const groups = this.findColorGroups();
      if (groups.length === 0) break;
      chain++;
      let groupScore = 0;
      groups.forEach(g => {
        groupScore += 30 * g.cells.length;
        g.cells.forEach(([x,y]) => this.grid[y][x] = 0);
      });
      this.applyGravity();
      totalScore += groupScore * (1 + 0.5 * (chain - 1));
    }
    return {score: totalScore, chains: chain};
  }

  lockPiece() {
    this.merge(this.grid, this.current);
    let cycleScore = 0;
    const lines = this.sweepLines();
    if (lines) {
      const lineScores = [0,100,300,500,800];
      cycleScore += lineScores[lines];
      this.lines += lines;
    }
    this.applyGravity();
    const {score: groupScore, chains} = this.handleGroups();
    if (lines && groupScore) {
      cycleScore = (cycleScore + groupScore) * 1.5;
    } else {
      cycleScore += groupScore;
    }
    if (chains > 1 && groupScore) {
      // extra chain bonus already included in handleGroups for n>1, so nothing here
    }
    cycleScore = Math.round(cycleScore * (1 + this.level * 0.05));
    this.score += cycleScore;
    document.getElementById('score').textContent = this.score;
    this.spawn();
  }

  holdPiece() {
    if (!this.canHold) return;
    if (this.hold) {
      const temp = this.hold;
      this.hold = this.current;
      this.current = temp;
      this.current.x = 3;
      this.current.y = 0;
    } else {
      this.hold = this.current;
      this.spawn();
    }
    this.canHold = false;
  }

  hardDrop() {
    let drop = 0;
    while (!this.collide(this.grid, this.current)) {
      this.current.y++;
      drop++;
    }
    this.current.y--;
    this.score += drop * 2;
    this.lockPiece();
    document.getElementById('score').textContent = this.score;
  }

  softDrop() {
    if (!this.collide(this.grid, this.current)) {
      this.current.y++;
      this.dropCounter = 0;
      this.score += 1;
    }
  }

  move(offset) {
    this.current.x += offset;
    if (this.collide(this.grid, this.current)) {
      this.current.x -= offset;
    }
  }

  rotate(dir) {
    const prev = this.current.rot;
    this.current.rot = (this.current.rot + dir + 4) % 4;
    const shape = SHAPES[this.current.shapeKey][this.current.rot];
    const oldMatrix = this.current.matrix;
    this.current.matrix = shape;
    const kicks = [0,1,-1,2,-2];
    for (const k of kicks) {
      this.current.x += k;
      if (!this.collide(this.grid, this.current)) {
        return;
      }
      this.current.x -= k;
    }
    this.current.rot = prev;
    this.current.matrix = oldMatrix;
  }

  update(time = 0) {
    const delta = time - this.lastTime;
    this.lastTime = time;
    this.dropCounter += delta;
    if (this.dropCounter > this.dropInterval) {
      this.current.y++;
      if (this.collide(this.grid, this.current)) {
        this.current.y--;
        this.lockPiece();
      }
      this.dropCounter = 0;
    }
    this.draw();
    requestAnimationFrame(t => this.update(t));
  }

  draw() {
    this.ctx.clearRect(0,0,COLS*CELL_SIZE,VISIBLE_ROWS*CELL_SIZE);
    this.drawMatrix(this.grid, {x:0, y:0});
    this.drawMatrix(this.current.matrix, {x:this.current.x, y:this.current.y}, this.current.color);
  }

  drawMatrix(matrix, offset, colorOverride) {
    matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        const color = colorOverride || value;
        if (color) {
          this.ctx.fillStyle = COLORS[color];
          const drawY = (y - (ROWS - VISIBLE_ROWS)) * CELL_SIZE;
          if (drawY >= 0) {
            this.ctx.fillRect((x + offset.x) * CELL_SIZE, drawY, CELL_SIZE, CELL_SIZE);
          }
        }
      });
    });
  }
}

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.scale(1,1);

const game = new Game(ctx);
game.update();

document.addEventListener('keydown', e => {
  if (e.code === 'ArrowLeft') {
    game.move(-1);
  } else if (e.code === 'ArrowRight') {
    game.move(1);
  } else if (e.code === 'ArrowDown') {
    game.softDrop();
  } else if (e.code === 'ArrowUp') {
    game.rotate(1);
  } else if (e.code === 'Space') {
    game.hardDrop();
  } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
    game.holdPiece();
  }
});
