var config = {
    type: Phaser.AUTO, //usa webgl se tiver disponivel, se nao, usa canvas
    parent: 'phaser-example',
    width: 800,
    height: 600,
    physics: {
      default: 'arcade',
      arcade: {
        debug: false,
        gravity: { y: 0 }
      }
    },
    scene: {
      preload: preload,
      create: create,
      update: update
    } 
  };
  var game = new Phaser.Game(config);
  function preload() {}

  function create() {
    this.socket = io();
  }
  
  function update() {}