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
  blue: 0,
  red: 0,
};

app.use(express.static(__dirname + "/public"));
app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

/*
A função createNewPlayer é responsável por criar um novo jogador para o jogo
Recebe como parâmetro o id do socket do jogador
A partir dos jogadores já conectados, ela conta quantos jogadores já estão em cada time (team)
Atribui a nova conexão para o time com menos jogadores
Retorna um objeto representando o novo jogador com as seguintes propriedades:
rotation: valor inicial zero que representa a rotação do jogador
x: posição horizontal aleatória entre 50 e 750
y: posição vertical aleatória entre 50 e 550
playerId: o id do socket do jogador
team: o time do jogador, definido pela quantidade de jogadores já conectados em cada time
*/
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

// A função io.on é responsável por lidar com todas as conexões de socket que se conectarem ao servidor
io.on("connection", function (socket) {
  // Adiciona um novo jogador ao objeto players com base no id do socket
  players[socket.id] = createNewPlayer(socket.id);

  // Imprime no console a mensagem de que um novo jogador entrou no jogo e em qual time ele está
  console.log(
    players[socket.id].playerId,
    "Entrou no jogo para o time",
    players[socket.id].team
  );

  // Emite para o socket que se conectou os jogadores atualmente conectados
  socket.emit("currentPlayers", players);

  // Emite para o socket que se conectou a localização da estrela
  socket.emit("starLocation", star);

  // Emite para o socket que se conectou a pontuação atual
  socket.emit("scoreUpdate", scores);

  // Emite para todos os outros sockets conectados que um novo jogador entrou no jogo
  socket.broadcast.emit("newPlayer", players[socket.id]);

  // Quando um socket se desconecta, é necessário remover o jogador correspondente do objeto players e emitir para todos os outros sockets que aquele jogador se desconectou
  socket.on("disconnect", function () {
    console.log(players[socket.id].playerId, "saiu do jogo");
    delete players[socket.id];
    io.emit("disconnected", socket.id);
  });

  // Quando um jogador se move, atualiza os dados do jogador no objeto players e emite para todos os outros sockets que aquele jogador se moveu
  socket.on("playerMovement", function (movementData) {
    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    players[socket.id].rotation = movementData.rotation;
    socket.broadcast.emit("playerMoved", players[socket.id]);
  });

  // Quando a estrela é coletada por um jogador, atualiza a posição da estrela e emite para todos os sockets que a posição da estrela mudou e a pontuação atualizada
  socket.on("starCollected", function () {
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
