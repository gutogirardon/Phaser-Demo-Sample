var express = require("express");
var app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);
var players = {};
var star = {
  x: Math.floor(Math.random() * 700) + 50,
  y: Math.floor(Math.random() * 500) + 50,
};
var scores = {
  blue: 5000,
  red: 5000,
};

app.use(express.static(__dirname + "/public"));
app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

function createNewPlayer(socketId) {
  const teamRed = Object.values(players).filter(
    (player) => player.team === "red"
  ).length;
  const teamBlue = Object.values(players).filter(
    (player) => player.team === "blue"
  ).length;
  const team = teamRed <= teamBlue ? "red" : "blue";

  return {
    rotation: 0,
    x: Math.floor(Math.random() * 700) + 50,
    y: Math.floor(Math.random() * 500) + 50,
    playerId: socketId,
    team,
  };
}

io.on("connection", function (socket) {
  console.log("a user connected");

  players[socket.id] = createNewPlayer(socket.id);

  console.log(
    players[socket.id].playerId,
    "Entrou no jogo para o time",
    players[socket.id].team
  );

  socket.emit("currentPlayers", players);
  // send the star object to the new player
  console.log("aqui")
  socket.emit("starLocation", star);
  // send the current scores
  socket.emit("scoreUpdate", scores);
  socket.broadcast.emit("newPlayer", players[socket.id]);

  socket.on("disconnect", function () {
    //aqui usa o protocolo do socket
    console.log(players[socket.id].playerId, "saiu do jogo");
    delete players[socket.id];
    io.emit("disconnected", socket.id); //a emissao pode ser qualquer string
  });

  // when a player moves, update the player data
  socket.on("playerMovement", function (movementData) {
    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    players[socket.id].rotation = movementData.rotation;
    // emit a message to all players about the player that moved
    socket.broadcast.emit("playerMoved", players[socket.id]);
  });

  socket.on("starCollected", function () {
    console.log("tentou mandar star");
    if (players[socket.id].team === "red") {
      scores.red += 10;
    } else {
      scores.blue += 10;
    }
    star.x = Math.floor(Math.random() * 700) + 50;
    star.y = Math.floor(Math.random() * 500) + 50;
    io.emit("starLocation", star);
    io.emit("scoreUpdate", scores);
  });
});

server.listen(8081, function () {
  console.log(`Listening on ${server.address().port}`);
});
