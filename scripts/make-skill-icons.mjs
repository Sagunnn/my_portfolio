// Build the 16×16 pixel-art skill icons in assets/img/skills/*.svg.
//
//   npm run icons
//
// Brand icons come from Simple Icons (CC0), squashed onto a 16×16 grid with hard edges.
// Skills without a brand icon (and AWS / Microsoft, which Simple Icons doesn't carry) use the
// hand-drawn pixel maps below. Every icon is a single-colour SVG of 1×1 squares, used as a CSS
// mask so it takes the skill row's accent colour (see .skill-icon in style.css).

import { mkdirSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import * as si from "simple-icons";

const OUT = "assets/img/skills";
const N = 16;

// brand logos that stay recognisable at 16×16 (the rest are hand-drawn below)
const BRANDS = {
  postgresql: "siPostgresql", mongodb: "siMongodb", django: "siDjango", git: "siGit",
  github: "siGithub", pandas: "siPandas", polars: "siPolars", ethereum: "siEthereum", uv: "siUv",
};

// X = filled pixel
const GLYPHS = {
  python: [ // two snakes
    "....XXXXXXX.....", "...X.XXXXXXX....", "...XXXXXXXXX....", ".........XXX....",
    ".XXXXXXXXXXX.XX.", "XXXXXXXXXXXX.XXX", "XXXXXXXXXXX.XXXX", "XXXX.......XXXXX",
    "XXXXX.......XXXX", "XXXX.XXXXXXXXXXX", "XXX.XXXXXXXXXXXX", ".XX.XXXXXXXXXXX.",
    "....XXX.........", "....XXXXXXXXX...", "....XXXXXXX.X...", ".....XXXXXXX....",
  ],
  java: [ // coffee cup
    "......X...X.....", ".....X...X......", "......X...X.....", ".....X...X......",
    "................", "XXXXXXXXXXXX....", "X..........XXX..", "X..........X..X.",
    "X..........X..X.", "X..........XXX..", ".X........X.....", "..XXXXXXXX......",
    "................", "XXXXXXXXXXXXXX..", "................", "................",
  ],
  bash: [ // >_ terminal
    "XXXXXXXXXXXXXXXX", "X..............X", "X..............X", "X.XX...........X",
    "X..XX..........X", "X...XX.........X", "X....XX........X", "X...XX.........X",
    "X..XX..........X", "X.XX...........X", "X..............X", "X......XXXXXX..X",
    "X..............X", "XXXXXXXXXXXXXXXX", "................", "................",
  ],
  mysql: [ // dolphin
    "................", "...........XX...", ".........XXXX...", ".......XXXXXX...",
    ".....XXXXXXXX...", "...XXXXXXXXXXX..", "..XXXXX.XXXXXXX.", ".XXXXXXXXXXXX.XX",
    "XXXXXXXXXXXX....", "XX..XXXXXXXX....", "X.....XXXXXX....", ".......XXXXX....",
    "........XXXXX...", ".........XX.XX..", "........XX...XX.", "................",
  ],
  sqlite: [ // feather
    "..............XX", "............XXXX", "..........XXXXX.", ".........XXXXX..",
    "........XXXX.X..", ".......XXXX.XX..", "......XXXX.XX...", ".....XXXX.XX....",
    "....XXXX.XX.....", "....XXX.XX......", "...XXX.XX.......", "...XX.XX........",
    "..XX.X..........", "..X.............", ".X..............", "X...............",
  ],
  sqlalchemy: [ // flask
    ".....XXXXXX.....", "......X..X......", "......X..X......", "......X..X......",
    "......X..X......", ".....X....X.....", "....X......X....", "...X........X...",
    "..X..........X..", ".XXXXXXXXXXXXXX.", "XXXXXXXXXXXXXXXX", "XXXX.XXXXXX.XXXX",
    "XXXXXXXXX.XXXXXX", "XXXXXXXXXXXXXXXX", ".XXXXXXXXXXXXXX.", "................",
  ],
  scikitlearn: [ // overlapping dots
    "................", "..........XXXX..", ".........XXXXXX.", "....XXX..XXXXXX.",
    "..XXXXXXX.XXXX..", ".XXXXXXXXX......", ".XXXXXXXXX......", "XXXXXXXXXXX.....",
    "XXXXXXXXXXX.....", ".XXXXXXXXX......", ".XXXXXXXXX......", "..XXXXXXX..XX...",
    "....XXX...XXXX..", "..........XXXX..", "...........XX...", "................",
  ],
  sql: [ // database cylinder
    "....XXXXXXXX....", "..XX........XX..", ".X............X.", ".X............X.",
    "..XX........XX..", ".XXXXXXXXXXXXXX.", ".X............X.", ".XX..........XX.",
    ".XXXX......XXXX.", ".X..XXXXXXXX..X.", ".X............X.", ".XX..........XX.",
    ".XXXX......XXXX.", "..XXXXXXXXXXXX..", "....XXXXXXXX....", "................",
  ],
  etl: [ // extract → load
    "................", "................", "XXX.........X...", "XXX.........XX..",
    "XXX.........XXX.", "XXX.XXXXXXXXXXXX", "XXX.XXXXXXXXXXXX", "XXX.........XXX.",
    "XXX.........XX..", "XXX.........X...", "................", "XXXXXXXX..XXXXXX",
    "X......X..X....X", "X......X..X....X", "XXXXXXXX..XXXXXX", "................",
  ],
  modeling: [ // table
    "XXXXXXXXXXXXXXXX", "XXXXXXXXXXXXXXXX", "X....X....X....X", "X....X....X....X",
    "XXXXXXXXXXXXXXXX", "X....X....X....X", "X....X....X....X", "XXXXXXXXXXXXXXXX",
    "X....X....X....X", "X....X....X....X", "XXXXXXXXXXXXXXXX", "X....X....X....X",
    "X....X....X....X", "XXXXXXXXXXXXXXXX", "................", "................",
  ],
  validation: [ // check mark
    "................", "..............XX", ".............XXX", "............XXX.",
    "...........XXX..", "..........XXX...", "XX.......XXX....", "XXX.....XXX.....",
    ".XXX...XXX......", "..XXX.XXX.......", "...XXXXX........", "....XXX.........",
    ".....X..........", "................", "................", "................",
  ],
  cleaning: [ // sparkles
    "......X.........", "......X.........", ".....XXX........", "XXXXXXXXXXX.....",
    ".....XXX........", "......X......X..", "......X......X..", "............XXX.",
    "..X.......XXXXXX", "..X.........XXX.", ".XXX.........X..", "XXXXX........X..",
    ".XXX............", "..X.............", "..X.............", "................",
  ],
  async: [ // lightning bolt
    ".........XXXXX..", "........XXXXX...", ".......XXXXX....", "......XXXXX.....",
    ".....XXXXX......", "....XXXXXXXXXX..", "...XXXXXXXXXX...", "........XXXX....",
    ".......XXXX.....", "......XXXX......", ".....XXXX.......", "....XXX.........",
    "...XXX..........", "..XX............", ".X..............", "................",
  ],
  api: [ // { }
    "...XX......XX...", "..XX........XX..", "..X..........X..", "..X..........X..",
    "..X..........X..", "..X..........X..", ".XX..........XX.", "XX............XX",
    ".XX..........XX.", "..X..........X..", "..X..........X..", "..X..........X..",
    "..X..........X..", "..XX........XX..", "...XX......XX...", "................",
  ],
  lambda: [ // λ, for AWS Lambda
    ".XXXX...........", "..XXXX..........", "....XXX.........", ".....XXX........",
    ".....XXX........", "....XXXXX.......", "....XXXXX.......", "...XXX.XXX......",
    "...XXX.XXX......", "..XXX...XXX.....", "..XXX...XXX.....", ".XXX.....XXX....",
    ".XXX.....XXXX.X.", "XXX.......XXXXX.", "XXX........XXX..", "................",
  ],
  fabric: [ // stacked layers, for Microsoft Fabric
    "......XXXX......", "....XXXXXXXX....", "..XXXXXXXXXXXX..", "XXXXXXXXXXXXXXXX",
    "..XXXXXXXXXXXX..", "X...XXXXXXXX...X", "XXX...XXXX...XXX", "..XXX......XXX..",
    "X...XXX..XXX...X", "XXX...XXXX...XXX", "..XXX......XXX..", "....XXX..XXX....",
    "......XXXX......", "................", "................", "................",
  ],
};

// squares → one SVG path, merging runs of filled pixels on each row
function toSvg(grid) {
  let d = "";
  grid.forEach((row, y) => {
    let x = 0;
    while (x < N) {
      if (row[x] === "X") {
        let end = x;
        while (end < N && row[end] === "X") end++;
        d += `M${x} ${y}h${end - x}v1H${x}z`;
        x = end;
      } else x++;
    }
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${N} ${N}" shape-rendering="crispEdges"><path d="${d}"/></svg>\n`;
}

// render a brand icon at 16px and keep the pixels that are mostly covered
function brandGrid(icon) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${icon.path}"/></svg>`;
  const img = new Resvg(svg, { fitTo: { mode: "width", value: N } }).render();
  const px = img.pixels;
  const grid = [];
  for (let y = 0; y < N; y++) {
    let row = "";
    for (let x = 0; x < N; x++) row += px[(y * N + x) * 4 + 3] >= 110 ? "X" : ".";
    grid.push(row);
  }
  return grid;
}

mkdirSync(OUT, { recursive: true });
for (const [name, key] of Object.entries(BRANDS)) writeFileSync(`${OUT}/${name}.svg`, toSvg(brandGrid(si[key])));
for (const [name, grid] of Object.entries(GLYPHS)) {
  if (grid.length !== N || grid.some((r) => r.length !== N)) throw new Error(`${name}: glyph must be ${N}×${N}`);
  writeFileSync(`${OUT}/${name}.svg`, toSvg(grid));
}
console.log(`wrote ${Object.keys(BRANDS).length + Object.keys(GLYPHS).length} icons to ${OUT}/`);
