$(function () {
  // initialize canvas and context when able to
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  window.addEventListener("load", loadJson);

  const drawPlatformsBase = drawPlatforms;
  drawPlatforms = function () {
    for (const platform of platforms) {
      if (platform.visibleFromY !== undefined) {
        const nextY = platform.y + platform.speedY * platform.directionY;
        platform.color =
          nextY >= platform.visibleFromY
            ? platform.visibleColor
            : "rgba(0, 0, 0, 0)";
      }
    }

    drawPlatformsBase();
    const pulse = 0.6 + Math.sin(performance.now() / 180) * 0.25;

    for (const platform of platforms) {
      if (
        platform.visibleFromY !== undefined &&
        platform.y < platform.visibleFromY
      ) {
        continue;
      }

      const movesHorizontally =
        platform.isMovingHorizontally ||
        (platform.minX !== null &&
          platform.maxX !== null &&
          platform.speedX !== 0);
      const movesVertically =
        platform.minY !== null &&
        platform.maxY !== null &&
        platform.speedY !== 0;

      if (!movesHorizontally && !movesVertically) {
        continue;
      }

      ctx.save();
      if (movesHorizontally || movesVertically) {
        ctx.globalAlpha = pulse;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#ffd43b";
        ctx.shadowBlur = 12;
        ctx.strokeRect(
          platform.x - 2,
          platform.y - 2,
          platform.width + 4,
          platform.height + 4,
        );
      }
      ctx.restore();
    }
  };

  const drawBadPlatformsBase = drawBadPlatforms;
  drawBadPlatforms = function () {
    drawBadPlatformsBase();
    ctx.save();
    ctx.strokeStyle = "#ffd43b";
    ctx.lineWidth = 6;

    for (const platform of badPlatforms) {
      const { x, y, width, height } = platform;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, width, height);
      ctx.clip();

      for (let offset = -height; offset < width; offset += 18) {
        ctx.beginPath();
        ctx.moveTo(x + offset, y + height);
        ctx.lineTo(x + offset + height, y);
        ctx.stroke();
      }

      ctx.restore();
    }

    ctx.restore();
  };

  const drawCannonsBase = drawCannons;
  drawCannons = function () {
    for (const cannon of cannons) {
      if (
        cannon.startShootingAfterY !== undefined &&
        player.y <= cannon.startShootingAfterY
      ) {
        cannon.projectileCountdown = 0;
      }
    }
    drawCannonsBase();
  };

  const createProjectileBase = createProjectile;
  createProjectile = function (wallLocation, x, y, width, height) {
    const projectileCount = projectiles.length;
    createProjectileBase(wallLocation, x, y, width, height);
    const firingCannon = cannons.find(
      (cannon) =>
        cannon.projectileStopX !== undefined &&
        cannon.location === wallLocation &&
        cannon.x === x &&
        cannon.y === y,
    );
    if (firingCannon && projectiles.length > projectileCount) {
      projectiles[projectiles.length - 1].stopAtX =
        firingCannon.projectileStopX;
    }
  };

  const drawProjectilesBase = drawProjectiles;
  drawProjectiles = function () {
    drawProjectilesBase();
    for (let i = projectiles.length - 1; i >= 0; i--) {
      if (
        projectiles[i].stopAtX !== undefined &&
        projectiles[i].x >= projectiles[i].stopAtX
      ) {
        projectiles.splice(i, 1);
      }
    }
  };

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
    createPlatform(850, 350, 150, 50, "#111b3f");
    createPlatform(1300, 690, 100, 50, "#6a88f1");
    createPlatform(1350, 50, 25, 10, "#111b3f", null, null, 1, 50, 650, 3);
    const movingPlatform = platforms[platforms.length - 1];
    movingPlatform.visibleFromY = 601;
    movingPlatform.visibleColor = movingPlatform.color;
    createPlatform(300, 200, 400, 20, "#111b3f", 0, 0, 0, 200, 650, 1);
    createPlatform(125, 0, 10, 200, "#111b3f");

    const openingWall = platforms[platforms.length - 1];
    openingWall.isMovingHorizontally = true;
    setTimeout(() => {
      const openingInterval = setInterval(() => {
        openingWall.x = Math.max(-50, openingWall.x - 2);
        if (openingWall.x === -50) {
          clearInterval(openingInterval);
        }
      }, 1000 / frameRate);
    }, 2500);
    createBadPlatform(200, 400, 200, 20, "#111b3f");
    createBadPlatform(400, 100, 20, 300, "#111b3f");
    createPlatform(800, 324, 20, -300, "rgba(17, 27, 63, 0.35)");
    createPlatform(100, 150, -200, 50, "#6381ee");
    createBadPlatform(800, 325, 20, 100, "#111b3f");
    createBadPlatform(800, 75, 20, 75, "#111b3f");
    // TODO 3 - Create Collectables
    createCollectable("steve", 500, 200);
    createCollectable("diamond", 900, 200, 0.5, 0.7);
    createCollectable("max", 1300, 650);
    const randomCollectableTypes = Object.keys(collectableList);
    const randomCollectableType =
      randomCollectableTypes[
        Math.floor(Math.random() * randomCollectableTypes.length)
      ];
    createCollectable(randomCollectableType, 1300, 10);
    collectables[collectables.length - 1].pickupMessage =
      "wow how'd you get me?";

    // TODO 4 - Create Cannons
    createCannon("top", 200, 600);
    createCannon("left", 175, 1);
    cannons[cannons.length - 1].startShootingAfterY = 250;
    cannons[cannons.length - 1].projectileStopX = 400;
    createCannon("top", 1100, 750, 20, 10, 1100, 1250, 2);
    createCannon("left", 650, 1);
  }

  //////////////////////////////////
  // ONLY CHANGE ABOVE THIS POINT //
  //////////////////////////////////

  const checkForWinImmediately = checkForWin;
  let winDelayPending = false;
  checkForWin = function () {
    checkForWinImmediately();
    if (player.winConditionMet && !winDelayPending) {
      player.winConditionMet = false;
      winDelayPending = true;
      setTimeout(() => {
        player.winConditionMet = true;
      }, 4690);
    }
  };

  registerSetup(setup);
});
