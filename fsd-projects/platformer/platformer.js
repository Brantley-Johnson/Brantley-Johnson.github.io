$(function () {
  // initialize canvas and context when able to
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  window.addEventListener("load", loadJson);

  function setup() {
    if (firstTimeSetup) {
      halleImage = document.getElementById("player");
      projectileImage = document.getElementById("projectile");
      cannonImage = document.getElementById("cannon");
      $(document).on("keydown", handleKeyDown);
      $(document).on("keyup", handleKeyUp);
      firstTimeSetup = false;
      //start game
      setInterval(main, 1000 / frameRate);
    }

    // Create walls - do not delete or modify this code
    createPlatform(-50, -50, canvas.width + 100, 50); // top wall
    createPlatform(
      -50,
      canvas.height - 10,
      canvas.width + 100,
      200,
      "rgb(118, 0, 233)",
    ); // bottom wall
    createPlatform(-50, -50, 50, canvas.height + 500); // left wall
    createPlatform(canvas.width, -50, 50, canvas.height + 100); // right wall

    //////////////////////////////////
    // ONLY CHANGE BELOW THIS POINT //
    //////////////////////////////////

    // TODO 1 - Enable the Grid
    // toggleGrid();

    // TODO 2 - Create Platforms
    createPlatform(400, 610, 50, 700, "#111b3f");
    createPlatform(550, 600, 100, 15, "#111b3f");
    createPlatform(650, 525, 50, 50, "#111b3f");
    createPlatform(475, 425, 50, 50, "#111b3f");
    createPlatform(600, 315, 25, 25, "#111b3f");
    createPlatform(500, 100, 10, 200, "#111b3f");
    createPlatform(600, 190, 75, 15, "#111b3f");
    createPlatform(50, 150, 75, 50, "#6381ee");
    createPlatform(900, 350, 100, 50, "#111b3f");
    createPlatform(1300, 690, 100, 50, "#6a88f1");
    createPlatform(300, 200, 400, 20, "#111b3f", 0, 0, 0, 200, 650, 1);
    createBadPlatform(200, 400, 200, 20, "#111b3f");
    createBadPlatform(400, 100, 20, 300, "#111b3f");
    createPlatform(800, 300, 20, -300, "#111b3f");
    createPlatform(100, 150, -200, 50, "#6381ee");
    // TODO 3 - Create Collectables
    createCollectable("steve", 500, 200);
    createCollectable("diamond", 900, 200, 0.5, 0.7);
    createCollectable("max", 1300, 650);

    // TODO 4 - Create Cannons
    createCannon("top", 200, 1000);
    createCannon("left", 175, 999);
    createCannon("left", 650, 1);
createCannon("top", 1100, 500, 20, 10, 1000, 1250, 2)

    //////////////////////////////////
    // ONLY CHANGE ABOVE THIS POINT //
    //////////////////////////////////
  }

  registerSetup(setup);
});
