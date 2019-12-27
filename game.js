document.addEventListener('contextmenu', event => event.preventDefault());

var data = [];
var flags = [];

var timer = 0;
var playing = false;

const W = 10, H = 10, M = 10;

const CELL_NA = 9;
const CELL_MINE = 10;
const CELL_SAFE = 11;
const CELL_BOMBED = 12;
const CELL_DIED = 13;
const CELL_FLAGGED = 14;
const CELL_WON = 15;

const CELL_EMPTY = 0;

const CS = ['⬜', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '🟦', '🟦', '😅', '💣', '🟦', '🚩', '😎','❎'];

const rand = (n, x) => n + Math.round((x-n)*Math.random());

function generate(iX,iY) {
  data = new Array(H)
    .fill(0)
    .map(_ => new Array(W).fill(CELL_NA));
  
  var mines = [];
  var tries = 0;
  while (mines.length < M) {
    tries++;
    var x = rand(0,9), y = rand(0,9);
    if (
      (
        Math.pow(iX - x, 2) +
        Math.pow(iY - y, 2)
      ) > 1 &&
      mines.every(([mX, mY]) => mX != x && mY != y)) {
      mines.push([x,y]);
    }
  }
  for (var [x,y] of mines) {
    data[y][x] = CELL_MINE;
  }
  safeZeroNbs(iX, iY);
  console.log(`Tried ${tries} times to fill mines...`);
}

const tbdy = document.getElementById('tbdy');
const isbomb = (x,y) =>
      x>=0 && y>=0 &&
      x<W && y<H &&
      (data[y][x] == CELL_MINE ||
       data[y][x] == CELL_BOMBED);
const bombsAround = (x, y) => isbomb(x + 1, y) +
      isbomb(x + 1, y + 1) +
      isbomb(x + 1, y - 1) +
      isbomb(x, y + 1) +
      isbomb(x, y - 1) +
      isbomb(x - 1, y) +
      isbomb(x - 1, y + 1) +
      isbomb(x - 1, y - 1);

function renderCell(x,y,cell) {
  if (cell == CELL_SAFE) {
    let bombs = bombsAround(x,y);
    return CS[bombs];
  }
  
  if (flags.every(([fx, fy]) => !(fx == x && fy == y)))
  return CS[cell]; else
    return CS[CELL_FLAGGED];
}
function won() {
  for (var x=0; x<W; x++)
    for (var y=0; y<H; y++) {
      if (data[y][x] == CELL_NA || data[y][x] == CELL_BOMBED) return false;
    }
  
  first = true;
  playing = false;
  data = data.map(row => row
                  .map(cell => cell == CELL_MINE ? CELL_WON : cell));
  return true;
}
function render() {
  [...tbdy.children]
    .forEach((tr, y) => [...tr.children]
      .forEach((td, x) => {
        td.children[0].textContent = renderCell(
          x,
          y,
          data[y][x]);
      }));
}
var first = true;

function safeZeroNbs(x, y) {
  if (x<0 || y<0 || x>W-1 || y>H-1) return;
  if (data[y][x] != CELL_NA) return;
  
  var bombs = bombsAround(x, y);
  
  data[y][x] = CELL_SAFE;
  
  if (bombs == 0) {
    safeZeroNbs(x - 1, y - 1);
    safeZeroNbs(x - 1, y);
    safeZeroNbs(x - 1, y + 1);
    safeZeroNbs(x, y - 1);
    safeZeroNbs(x, y + 1);
    safeZeroNbs(x + 1, y - 1);
    safeZeroNbs(x + 1, y);
    safeZeroNbs(x + 1, y + 1);
  }
}

function cf(x,y) {
  if (event.button != 0) {
    if (first) return;
    if (data[y][x] == CELL_NA || data[y][x] == CELL_MINE) {
      if (flags.every(([fx, fy]) => !(fx == x && fy == y))) {
        flags.push([x,y]);
      } else {
        flags = flags.filter(([fx, fy]) => !(fx == x && fy == y));
      }
    }
    
    return render();
  }
  
  if (first) {
    generate(x,y);
    flags = [];
    first = false;
    playing = true;
    timer = Date.now();
  } else {
    
    if (!flags.every(([fx, fy]) => !(fx == x && fy == y))) {
      return;
    }
    
    if (data[y][x] == CELL_MINE) {
      first = true;
      playing = false;
      data = data
        .map((row, y) => row
             .map((cell, x) => cell == CELL_MINE
                   ? CELL_BOMBED
                   : (cell == CELL_NA ? CELL_DIED : cell)
                 ));
    } else if (data[y][x] == CELL_NA) {
      var bombs = bombsAround(x, y);
      if (bombs == 0) {
        safeZeroNbs(x, y);
      } else {
        data[y][x] = CELL_SAFE;
      }
      
      won();
    }
  }
  render();
}

const sb = document.getElementById('sb');
setInterval(() => {
  if (playing) {
    var t = Math.round((Date.now() - timer) / 100)/10,
        m = Math.floor(t/60),
        s = Math.round((t % 60) * 10)/10;
    t = (m < 10 ? '0' + m : m) + ' : ' + (s < 10 ? '0' + s : s);
    if (t.indexOf('.') < 0) t += '.0';
    sb.textContent = t;
  }
}, 50);
