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
  this.load.image("ship", "assets/spaceship.png"); //carrega a imagem da nave que o jogador ve
  this.load.image("otherPlayer", "assets/spaceship_enemy.png"); //imagem dos outros jogadores
}

function create() {
  var self = this;
  this.socket = io();
  this.otherPlayers = this.physics.add.group();

  this.socket.on("currentPlayers", function (players) {
    Object.keys(players).forEach(function (id) {
      if (players[id].playerId === self.socket.id) {
        addPlayer(self, players[id]);
      } else {
        addOtherPlayers(self, players[id]);
      }
    });
  });

  this.socket.on("newPlayer", function (playerInfo) {
    addOtherPlayers(self, playerInfo);
  });

  this.socket.on("disconnect", function (playerId) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      console.log("chegouu");
      if (playerId === otherPlayer.playerId) {
        console.log("tentou destruir");
        otherPlayer.destroy();
      }
    });
  });

  this.cursors = this.input.keyboard.createCursorKeys(); //handler do pharser para lidar com as entradas do teclado

  this.socket.on("playerMoved", function (playerInfo) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerInfo.playerId === otherPlayer.playerId) {
        otherPlayer.setRotation(playerInfo.rotation);
        otherPlayer.setPosition(playerInfo.x, playerInfo.y);
      }
    });
  });
}

function update() {
  if (this.ship) {
    //condicoes relacionadas ao teclado
    if (this.cursors.left.isDown) {
      this.ship.setAngularVelocity(-150);
    } else if (this.cursors.right.isDown) {
      this.ship.setAngularVelocity(150);
    } else {
      this.ship.setAngularVelocity(0);
    }

    if (this.cursors.up.isDown) {
      this.physics.velocityFromRotation(
        this.ship.rotation + 1.5,
        100,
        this.ship.body.acceleration
      );
    } else {
      this.ship.setAcceleration(0);
    }
    this.physics.world.wrap(this.ship, 5); //adicionar a fisica do mundo, fazendo com que atravesse as paredes

    var x = this.ship.x;
    var y = this.ship.y;
    var r = this.ship.rotation;
    /* Esse código verifica se a posição e rotação atual do jogador (representado pelo objeto "this.ship") são diferentes
     da sua posição e rotação anterior ("this.ship.oldPosition"). Se houver diferença, ele emite uma mensagem para o servidor 
     (representado pelo objeto "this.socket") informando sobre a atualização da posição e rotação do jogador através do evento 
     "playerMovement" com as novas coordenadas "x" e "y" e a nova rotação "rotation".    
    */
    if (
      this.ship.oldPosition &&
      (x !== this.ship.oldPosition.x ||
        y !== this.ship.oldPosition.y ||
        r !== this.ship.oldPosition.rotation)
    ) {
      this.socket.emit("playerMovement", {
        x: this.ship.x,
        y: this.ship.y,
        rotation: this.ship.rotation,
      });
    }
    // save old position data
    this.ship.oldPosition = {
      x: this.ship.x,
      y: this.ship.y,
      rotation: this.ship.rotation,
    };
  }
}

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

function addOtherPlayers(self, playerInfo) {
  const otherPlayer = self.add
    .sprite(playerInfo.x, playerInfo.y, "otherPlayer")
    .setOrigin(0.5, 0.5)
    .setDisplaySize(53, 40);
  if (playerInfo.team === "blue") {
    otherPlayer.setTint(0x0000ff);
  } else {
    otherPlayer.setTint(0xff0000);
  }
  otherPlayer.playerId = playerInfo.playerId;
  self.otherPlayers.add(otherPlayer);
}
