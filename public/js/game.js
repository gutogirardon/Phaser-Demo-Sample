var config = {
  type: Phaser.AUTO, //usa webgl se tiver disponivel, se nao, usa canvas
  parent: "phaser-example",
  width: 800,
  height: 600,
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
      gravity: { y: 0 },
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};
var game = new Phaser.Game(config);

function preload() {
  this.load.image("ship", "assets/spaceship.png"); //carrega a imagem da nave
}

function create() {
  var self = this;
  this.socket = io();
  this.socket.on("currentPlayers", function (players) {
    Object.keys(players).forEach(function (id) {
      if (players[id].playerId === self.socket.id) {
        addPlayer(self, players[id]);
      }
    });
  });
}

function update() {}

function addPlayer(self, playerInfo) {
  self.ship = self.physics.add //vai usar a fisica arcade da llib
    .image(playerInfo.x, playerInfo.y, "ship") //aqui vai usar a posicao x, y criada pelo servidor
    .setOrigin(0.5, 0.5) //seta a imagem no meio e nao no canto superior esquerdo do objeto
    .setDisplaySize(53, 40); // tamanho da nave
  if (playerInfo.team === "blue") {
    self.ship.setTint(0x0000ff);
  } else {
    self.ship.setTint(0xff0000);
  }
  self.ship.setDrag(100);
  self.ship.setAngularDrag(100);
  self.ship.setMaxVelocity(200);
}
