import express from "express";
import { Server } from "socket.io";
import http from "http";
import { Chess } from "chess.js";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const app = express();
const port = 4000;

// Create a server and link with express
const server = http.createServer(app);
const io = new Server(server);

const chess = new Chess();
let players = {};
let currentPlayer = "w";

app.set("view engine", "ejs");
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// Render index.ejs file in views folder
app.get("/", (req, res) => {
  res.render("index", { title: "Chess" }); // No need to include the .ejs extension
});

io.on("connection", (socket) => {
  console.log("A user connected");

  // socket.on("Hello", () => {
  //   io.emit("Hello world"); // backend to frontend to all users
  // });

  if (!players.white) {
    players.white = socket.id;
    socket.emit("playerRole", "w"); // backend to frontend to a connected user
  } else if (!players.black) {
    players.black = socket.id;
    socket.emit("playerRole", "b");
  } else {
    socket.emit("spectatorRole");
  }

  // if a user left the game
  socket.on("disconnect", () => {
    console.log("A user disconnected");
    if (socket.id === players.white) {
      delete players.white;
    } else if (socket.id === players.black) {
      delete players.black;
    }
  });

  socket.on("move", (move) => {
    try {
      if (chess.turn() === "w" && socket.id !== players.white) return;
      if (chess.turn() === "b" && socket.id !== players.black) return;

      const result = chess.move(move);

      if (result) {
        currentPlayer = chess.turn();
        io.emit("move", move); // backend to frontend to all users
        io.emit("boardState", chess.fen()); // sends current board state from backend to frontend to all users
      } else {
        console.log("Invalid move: ", move);
        socket.emit("Invalid move: ", move); // sends invalid move from backend to frontend to myself only
      }

      // console.log(result);
      if (result.san.includes("#")) {
        io.emit("Game over: ", result.color);
      }
    } catch (error) {
      console.log(error);
      socket.emit("Invalid move: ", move); // sends invalid move from backend to frontend to myself only
    }
  });

  socket.on("resetGame", () => {
    resetGame();
  });
});

function resetGame() {
  chess.reset();
  currentPlayer = "w";
  io.emit("boardState", chess.fen());
}

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
