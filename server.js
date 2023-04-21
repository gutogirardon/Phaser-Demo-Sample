var express = require("express");
var app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);
var players = {};

app.use(express.static(__dirname + "/public"));
app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

function createNewPlayer(socketId) {
  const teamRed = Object.values(players).filter(player => player.team === 'red').length;
  const teamBlue = Object.values(players).filter(player => player.team === 'blue').length;
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

  console.log(players[socket.id].playerId, " Entrou no jogo para o time ", players[socket.id].team);

  socket.emit("currentPlayers", players);
  socket.broadcast.emit("newPlayer", players[socket.id]);

  socket.on("disconnect", function () {
    console.log(players[socket.id].playerId, "saiu do jogo");
    delete players[socket.id];
    io.emit("disconnected", socket.id);
  });
});

server.listen(8081, function () {
  console.log(`Listening on ${server.address().port}`);
});
