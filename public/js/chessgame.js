const socket = io();
const chess = new Chess();

// frontend to backend
// socket.emit("Hello");
// socket.on("Hello world", () => {
//   console.log("Hello world received"); // received from backend
// });

const boardElement = document.querySelector(".chessboard");
let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
  const board = chess.board();
  boardElement.innerHTML = "";

  board.forEach((row, rowindex) => {
    row.forEach((square, squareindex) => {
      const squareElement = document.createElement("div");
      // adding to class to each square i.e (square, dark or light)
      squareElement.classList.add(
        "square",
        (rowindex + squareindex) % 2 === 0 ? "light" : "dark"
      );

      squareElement.dataset.row = rowindex;
      squareElement.dataset.col = squareindex;

      // if a square is not empty then there must be a piece
      if (square) {
        const pieceElement = document.createElement("div");
        // adding to class to each piece i.e (piece, white or black)
        pieceElement.classList.add(
          "piece",
          square.color === "w" ? "white" : "black"
        );
        pieceElement.innerHTML = getPieceUnicode(square);
        pieceElement.draggable = playerRole === square.color;

        pieceElement.addEventListener("dragstart", (e) => {
          // if piece is draggable
          if (pieceElement.draggable) {
            draggedPiece = pieceElement;
            sourceSquare = { row: rowindex, col: squareindex };
            e.dataTransfer.setData("text/plain", "");
          }
        });

        // when no one is dragged assign null
        pieceElement.addEventListener("dragend", (e) => {
          draggedPiece = null;
          sourceSquare = null;
        });
        // a piece is attach to a square
        squareElement.appendChild(pieceElement);
      }

      squareElement.addEventListener("dragover", (e) => {
        e.preventDefault();
      });

      // after dragging and dropping a piece at a particular location
      squareElement.addEventListener("drop", (e) => {
        e.preventDefault();
        if (draggedPiece) {
          // find that particular location
          const targetSource = {
            row: Number(squareElement.dataset.row),
            col: Number(squareElement.dataset.col),
          };
          // move from sourceSquare to targetSource
          handleMove(sourceSquare, targetSource);
        }
      });
      boardElement.appendChild(squareElement);
    });
  });

  // if black's turn is there then flip the board else remove 'flipped' class
  if (playerRole === "b") {
    boardElement.classList.add("flipped");
  } else {
    boardElement.classList.remove("flipped");
  }
};

const handleMove = (source, target) => {
  const move = {
    // code of a is 97
    from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
    to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
    promotion: "q",
  };

  // send this move to backend to all users
  socket.emit("move", move);
};

const getPieceUnicode = (piece) => {
  const unicodePieces = {
    p: "♙",
    r: "♖",
    n: "♘",
    b: "♗",
    q: "♕",
    k: "♔",
    P: "♟",
    R: "♜",
    N: "♞",
    B: "♝",
    Q: "♛",
    K: "♚",
  };
  return unicodePieces[piece.type] || "";
};

socket.on("playerRole", (role) => {
  playerRole = role;
  renderBoard();
});

socket.on("spectatorRole", () => {
  playerRole = null;
  renderBoard();
});

socket.on("boardState", (fen) => {
  chess.load(fen); // fen equation of that chess board
  renderBoard();
});

socket.on("move", (move) => {
  chess.move(move);
  renderBoard();
});

socket.on("Game over: ", (role) => {
  console.log(role === "w" ? "Player white won" : "Player black won");
  setTimeout(() => {
    alert(role === "w" ? "Player white won" : "Player black won");
  }, 300);
  renderBoard();
});

// Emit resetGame event when page is reloaded
window.addEventListener("beforeunload", () => {
  socket.emit("resetGame");
});

renderBoard();
