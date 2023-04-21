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
  var progressBar = this.add.graphics();
  var progressBox = this.add.graphics();
  progressBox.fillStyle(0x222222, 0.8);
  progressBox.fillRect(240, 270, 320, 50);

  // for (var i = 0; i < 15; i++) {
  //   this.load.image("logo" + i, "assets/girardon.png");
  // }

  var width = this.cameras.main.width;
  var height = this.cameras.main.height;
  var loadingText = this.make.text({
    x: width / 2,
    y: height / 2 - 50,
    text: "Loading...",
    style: {
      font: "20px monospace",
      fill: "#ffffff",
    },
  });
  loadingText.setOrigin(0.5, 0.5);

  var percentText = this.make.text({
    x: width / 2,
    y: height / 2 - 5,
    text: "0%",
    style: {
      font: "18px monospace",
      fill: "#ffffff",
    },
  });
  percentText.setOrigin(0.5, 0.5);

  var assetText = this.make.text({
    x: width / 2,
    y: height / 2 + 50,
    text: "",
    style: {
      font: "18px monospace",
      fill: "#ffffff",
    },
  });
  assetText.setOrigin(0.5, 0.5);

  this.load.image("logo", "assets/girardon.png");
  this.load.image("ship", "assets/spaceship.png"); //carrega a imagem da nave que o jogador ve
  this.load.image("otherPlayer", "assets/spaceship_enemy.png"); //imagem dos outros jogadores
  this.load.image("star", "assets/star_gold.png");

  this.load.on("progress", function (value) {
    console.log(value);
    progressBar.clear();
    progressBar.fillStyle(0xffffff, 1);
    progressBar.fillRect(250, 280, 300 * value, 30);

    percentText.setText(parseInt(value * 100) + "%");
  });

  this.load.on("fileprogress", function (file) {
    console.log(file.src);
    assetText.setText("Loading asset: " + file.key);
  });

  this.load.on("complete", function () {
    progressBar.destroy();
    progressBox.destroy();
    loadingText.destroy();
    percentText.destroy();
    assetText.destroy();
  });
}

function create() {
  this.add.image(400, 300, "logo"); // Logo da tela principal
  var self = this;

  // Cria o socket
  this.socket = io();
  this.otherPlayers = this.physics.add.group();

  // Registra os handlers de eventos
  this.socket.on("currentPlayers", handleCurrentPlayers);
  this.socket.on("newPlayer", handleNewPlayer);
  this.socket.on("disconnected", handlePlayerDisconnect);
  this.socket.on("playerMoved", handlePlayerMovement);
  this.socket.on("scoreUpdate", handleScoreUpdate);
  this.socket.on("starLocation", handleStarLocation);

  // Cria as mensagens de texto para o placar
  this.blueScoreText = this.add.text(16, 16, "", {
    fontSize: "50px",
    fill: "#0000FF",
  });
  this.redScoreText = this.add.text(520, 16, "", {
    fontSize: "50px",
    fill: "#FF0000",
  });

  // Cria o objeto de cursores para lidar com as entradas do teclado
  this.cursors = this.input.keyboard.createCursorKeys();

  function handleCurrentPlayers(players) {
    Object.keys(players).forEach(function (id) {
      if (players[id].playerId === self.socket.id) {
        addPlayer(self, players[id]);
      } else {
        addOtherPlayers(self, players[id]);
      }
    });
  }

  function handleNewPlayer(playerInfo) {
    addOtherPlayers(self, playerInfo);
  }

  function handlePlayerDisconnect(playerId) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerId === otherPlayer.playerId) {
        otherPlayer.destroy();
      }
    });
  }

  function handlePlayerMovement(playerInfo) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerInfo.playerId === otherPlayer.playerId) {
        otherPlayer.setRotation(playerInfo.rotation);
        otherPlayer.setPosition(playerInfo.x, playerInfo.y);
      }
    });
  }

  function handleScoreUpdate(scores) {
    self.blueScoreText.setText("Blue: " + scores.blue);
    self.redScoreText.setText("Red: " + scores.red);
  }

  function handleStarLocation(starLocation) {
    if (self.star) self.star.destroy();
    self.star = self.physics.add.image(starLocation.x, starLocation.y, "star");
    self.physics.add.overlap(
      self.ship,
      self.star,
      function () {
        this.socket.emit("starCollected");
      },
      null,
      self
    );
  }
}

function update() {
  // Verifica se a nave existe
  if (this.ship) {
    handleKeyboardInput(this);
    handlePlayerMovement(this);
  }
}

// Função auxiliar para lidar com a entrada do teclado
function handleKeyboardInput(self) {
  const { cursors } = self;

  // Movimento angular
  if (
    cursors.left.isDown ||
    self.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A).isDown
  ) {
    self.ship.setAngularVelocity(-150);
  } else if (
    cursors.right.isDown ||
    self.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D).isDown
  ) {
    self.ship.setAngularVelocity(150);
  } else {
    self.ship.setAngularVelocity(0);
  }

  // Movimento linear
  if (
    cursors.up.isDown ||
    self.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W).isDown
  ) {
    self.physics.velocityFromRotation(
      self.ship.rotation + 1.5,
      100,
      self.ship.body.acceleration
    );
  } else if (
    cursors.down.isDown ||
    self.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S).isDown
  ) {
    self.physics.velocityFromRotation(
      self.ship.rotation + 1.5,
      -100,
      self.ship.body.acceleration
    );
  } else {
    self.ship.setAcceleration(0);
  }

  // Adiciona a física do mundo para que a nave atravesse as paredes
  self.physics.world.wrap(self.ship, 5);
}

// Função auxiliar para lidar com o movimento do jogador
function handlePlayerMovement(self) {
  const { ship } = self;
  const { x, y, rotation } = ship;

  // Verifica se houve mudanças na posição e rotação da nave
  if (
    ship.oldPosition &&
    (x !== ship.oldPosition.x ||
      y !== ship.oldPosition.y ||
      rotation !== ship.oldPosition.rotation)
  ) {
    // Emite uma mensagem para o servidor informando sobre a atualização da posição e rotação do jogador
    self.socket.emit("playerMovement", { x, y, rotation });
  }

  // Salva a posição anterior da nave
  ship.oldPosition = { x, y, rotation };
}

function addPlayer(self, playerInfo) {
  const { x, y, sprite, origin, displaySize } = getPlayerConfig(
    playerInfo.x,
    playerInfo.y,
    "ship"
  );

  self.ship = self.physics.add
    .image(x, y, sprite)
    .setOrigin(origin.x, origin.y)
    .setDisplaySize(displaySize.x, displaySize.y);

  self.ship.setDrag(100);
  self.ship.setAngularDrag(100);
  self.ship.setMaxVelocity(200);
}

function addOtherPlayers(self, playerInfo) {
  const { x, y, sprite, origin, displaySize } = getPlayerConfig(
    playerInfo.x,
    playerInfo.y,
    "otherPlayer"
  );

  const otherPlayer = self.add
    .sprite(x, y, sprite)
    .setOrigin(origin.x, origin.y)
    .setDisplaySize(displaySize.x, displaySize.y);

  otherPlayer.playerId = playerInfo.playerId;
  self.otherPlayers.add(otherPlayer);
}

function getPlayerConfig(x, y, sprite) {
  return {
    x,
    y,
    sprite,
    origin: {
      x: 0.5,
      y: 0.5,
    },
    displaySize: {
      x: 50,
      y: 50,
    },
  };
}
