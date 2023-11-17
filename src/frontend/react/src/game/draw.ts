import Player from "./Player";

const draw_field = (
  ctx: CanvasRenderingContext2D,
  windowWidth: number,
  windowHeight: number
) => {
  // Background
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, windowWidth, windowHeight);

  // Middle line
  ctx.beginPath();
  ctx.moveTo(windowWidth / 2, 0);
  ctx.lineTo(windowWidth / 2, windowHeight);
  ctx.strokeStyle = "white";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Middle circle
  ctx.beginPath();
  ctx.arc(windowWidth / 2, windowHeight / 2, windowHeight / 4, 0, 2 * Math.PI);
  ctx.stroke();

  ctx.beginPath();
  ctx.fillStyle = "white";
  ctx.arc(windowWidth / 2, windowHeight / 2, 10, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
};

const draw_player = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  ctx.fillStyle = "white";
  ctx.fillRect(x, y, 20, 150);
};

export const draw = (
  ctx: CanvasRenderingContext2D,
  windowWidth: number,
  windowHeight: number,
  player1: Player,
  player2: Player
) => {
  draw_field(ctx, windowWidth, windowHeight);

  // left player
  draw_player(ctx, player1.x, player1.y);

  // Right player
  draw_player(ctx, player2.x, player2.y);
};
