

$(function () {
  let timedPlatformVisibilityOpen = false;
  let currentLevel = 1;
  let activeLevelCleanup = null;
  let levelTwoDoors = [];
  let levelExit = null;
  let timedPlatformInterval = null;
  let timedPlatformTimeout = null;
  let gameStarted = false;
  const transparentCollectableImage = document.createElement("canvas");
  transparentCollectableImage.width = 1;
  transparentCollectableImage.height = 1;

  // initialize canvas and context when able to
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  const startScreen = document.getElementById("start-screen");
  let collectableSequence = [];
  let collectableSequenceProgress = 0;
  window.addEventListener("load", loadJson);

  const collisionBase = collision;
  collision = function () {
    const allPlatforms = platforms;
    const codeGate = allPlatforms.find((platform) => platform.isCodeGate);
    const originalCodeGateBounds =
      codeGate && codeGate.width < 0 && !codeGate.isFallThrough
        ? { x: codeGate.x, width: codeGate.width }
        : null;
    if (originalCodeGateBounds) {
      codeGate.x += codeGate.width;
      codeGate.width = Math.abs(codeGate.width);
    }
    platforms = allPlatforms.filter(
      (platform) => !platform.isWindow && !platform.isFallThrough,
    );
    try {
      const collisionResult = collisionBase();
      const bounceBlock = allPlatforms.find(
        (platform) =>
          platform.isBouncy &&
          player.x + hitBoxWidth > platform.x &&
          player.x < platform.x + platform.width &&
          Math.abs(player.y + hitBoxHeight - platform.y) <= 1,
      );

      if (
        currentAnimationType !== animationTypes.frontDeath &&
        player.onGround &&
        bounceBlock
      ) {
        player.speedY = -Math.sqrt(2 * gravity * bounceBlock.bounceHeight);
        player.onGround = false;
        jumpTimer = 19;
        frameIndex = 4;
      }

      return collisionResult;
    } finally {
      if (originalCodeGateBounds) {
        codeGate.x = originalCodeGateBounds.x;
        codeGate.width = originalCodeGateBounds.width;
      }
      platforms = allPlatforms;
    }
  };

  const drawPlatformsBase = drawPlatforms;
  drawPlatforms = function () {
    for (const platform of platforms) {
      if (platform.isPeriodicReveal) {
        platform.color = timedPlatformVisibilityOpen
          ? platform.visibleColor
          : "rgba(0, 0, 0, 0)";
      } else if (platform.isWindow) {
        const color = platform.windowColor;
        const red = Number.parseInt(color.slice(1, 3), 16);
        const green = Number.parseInt(color.slice(3, 5), 16);
        const blue = Number.parseInt(color.slice(5, 7), 16);
        platform.color = `rgba(${red}, ${green}, ${blue}, 0.35)`;
      } else if (platform.visibleFromY !== undefined) {
        const nextY = platform.y + platform.speedY * platform.directionY;
        platform.color =
          nextY >= platform.visibleFromY
            ? platform.visibleColor
            : "rgba(0, 0, 0, 0)";
      }
    }

    drawPlatformsBase();
    const visibleDoors = currentLevel === 2 ? levelTwoDoors : levelExit ? [levelExit] : [];
    for (const door of visibleDoors) {
      ctx.fillStyle = door.color;
      ctx.fillRect(door.x, door.y, door.width, door.height);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 4;
      ctx.strokeRect(door.x, door.y, door.width, door.height);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px serif";
      ctx.textAlign = "center";
      ctx.fillText(door.label, door.x + door.width / 2, door.y + 28);
      ctx.beginPath();
      ctx.arc(
        door.x + door.width - 14,
        door.y + door.height / 2,
        4,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.textAlign = "left";

    const rainbowColors = [
      "#ff3b30",
      "#ff9500",
      "#ffcc00",
      "#34c759",
      "#00c7be",
      "#007aff",
      "#af52de",
    ];
    for (const platform of platforms) {
      if (
        (platform.isPeriodicReveal && !timedPlatformVisibilityOpen) ||
        !platform.isRainbow ||
        (platform.visibleFromY !== undefined &&
          platform.y < platform.visibleFromY)
      ) {
        continue;
      }

      const left = Math.min(platform.x, platform.x + platform.width);
      const top = Math.min(platform.y, platform.y + platform.height);
      const width = Math.abs(platform.width);
      const height = Math.abs(platform.height);
      ctx.save();
      if (platform.isWindow) {
        ctx.globalAlpha = 0.35;
      }
      ctx.beginPath();
      ctx.rect(left, top, width, height);
      ctx.clip();
      ctx.lineWidth = 10;
      let stripeIndex = 0;
      for (let offset = -height; offset < width; offset += 10) {
        ctx.strokeStyle = rainbowColors[stripeIndex % rainbowColors.length];
        ctx.beginPath();
        ctx.moveTo(left + offset, top + height);
        ctx.lineTo(left + offset + height, top);
        ctx.stroke();
        stripeIndex++;
      }
      ctx.restore();
    }

    const pulse = 0.6 + Math.sin(performance.now() / 180) * 0.25;

    for (const platform of platforms) {
      if (
        (platform.isPeriodicReveal && !timedPlatformVisibilityOpen) ||
        (platform.visibleFromY !== undefined &&
          platform.y < platform.visibleFromY)
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

  const drawCollectablesBase = drawCollectables;
  drawCollectables = function () {
    const timedCollectable = collectables.find(
      (collectable) => collectable.isPeriodicReveal,
    );
    if (
      timedPlatformVisibilityOpen ||
      !timedCollectable ||
      timedCollectable.collected
    ) {
      return drawCollectablesBase();
    }

    const collectableImage = timedCollectable.image;
    timedCollectable.image = transparentCollectableImage;
    try {
      return drawCollectablesBase();
    } finally {
      timedCollectable.image = collectableImage;
    }
  };

  const drawCollectableCounterBase = drawCollectableCounter;
  drawCollectableCounter = function () {
    if (currentLevel === 2) {
      return;
    }

    if (collectableSequence.length === 0) {
      return drawCollectableCounterBase();
    }

    const availableCollectables = Math.min(
      collectableSequenceProgress + 1,
      collectableSequence.length,
    );
    const counterText = `Face Counter: ${collectableSequenceProgress}/${availableCollectables}`;
    const boxWidth = 310;
    const boxHeight = 52;
    const boxX = canvas.width / 2 - boxWidth / 2;
    const boxY = 18;

    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    ctx.fillStyle = "black";
    ctx.font = "bold 26px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(counterText, canvas.width / 2, boxY + boxHeight / 2 + 2);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  };

  collectablesCollide = function () {
    const collectable = collectables[0];
    const stage = collectableSequence[collectableSequenceProgress];
    if (!collectable || !stage || collectable.collected) {
      return;
    }

    if (
      collectable.x + collectableWidth <= player.x ||
      collectable.x >= player.x + hitBoxWidth ||
      collectable.y >= player.y + hitBoxHeight ||
      collectable.y + collectableHeight <= player.y
    ) {
      return;
    }

    facePickupMessage = stage.pickupMessage;
    facePickupTimer = 90;
    collectableSequenceProgress++;

    const nextStage = collectableSequence[collectableSequenceProgress];
    if (!nextStage) {
      collectable.collected = true;
      checkForWin();
      return;
    }

    collectable.image.src = collectableList[nextStage.type].image;
    collectable.x = nextStage.x;
    collectable.y = nextStage.y;
    collectable.speedY = 0;
    collectable.gravity = nextStage.gravity;
    collectable.bounce = nextStage.bounce;
    collectable.minX = nextStage.minX;
    collectable.maxX = nextStage.maxX;
    collectable.speed = nextStage.speed;
    collectable.direction = 1;
    collectable.collected = false;
    collectable.alpha = 2;
    collectable.isPeriodicReveal = nextStage.isPeriodicReveal === true;
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
      startScreen.addEventListener("click", (event) => {
        const levelButton = event.target.closest("[data-level]");
        if (!levelButton) {
          return;
        }

        if (levelButton.dataset.level === "2") {
          setupLevelTwo();
        }
        gameStarted = true;
        startScreen.hidden = true;
      });
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
    toggleGrid();

    // TODO 2 - Create Platforms
    const platformColors = ["#111b3f", "#6381ee"];
    const randomPlatformColor = () =>
      platformColors[Math.floor(Math.random() * platformColors.length)];
    const createRandomPlatform = (x, y, width, height, ...movementOptions) => {
      createPlatform(
        x,
        y,
        width,
        height,
        randomPlatformColor(),
        ...movementOptions,
      );
      platforms[platforms.length - 1].isRainbow = Math.random() < 0.07;
    };
    createRandomPlatform(400, 610, 50, 700);
    createRandomPlatform(550, 600, 100, 15);
    createRandomPlatform(650, 525, 50, 50);
    createRandomPlatform(475, 425, 50, 50);
    createRandomPlatform(600, 315, 25, 25);
    createRandomPlatform(500, 100, 10, 200);
    createRandomPlatform(600, 190, 75, 15);
    createPlatform(50, 150, 75, 50, "#6381ee");
    createRandomPlatform(850, 350, 150, 50);
    createRandomPlatform(1300, 690, 100, 50);
    createRandomPlatform(1350, 50, 25, 10, null, null, 1, 50, 650, 3);
    const movingPlatform = platforms[platforms.length - 1];
    movingPlatform.visibleFromY = 601;
    movingPlatform.visibleColor = movingPlatform.color;
    createRandomPlatform(300, 200, 400, 20, 0, 0, 0, 200, 650, 1);
    createPlatform(125, 0, 10, 200, "#6381ee");

    const openingWall = platforms[platforms.length - 1];
    openingWall.isMovingHorizontally = true;
    let codeGate;
    const openingCode = ["up", "up", "left", "right", "left"];
    let openingCodeProgress = 0;
    const handleOpeningCode = (event) => {
      if (event.repeat) {
        return;
      }

      let pressedMove;
      if (event.key === "ArrowUp" || event.key === "w" || event.key === " ") {
        pressedMove = "up";
      } else if (event.key === "ArrowLeft" || event.key === "a") {
        pressedMove = "left";
      } else if (event.key === "ArrowRight" || event.key === "d") {
        pressedMove = "right";
      } else {
        return;
      }

      if (pressedMove === openingCode[openingCodeProgress]) {
        openingCodeProgress++;
      } else {
        openingCodeProgress = pressedMove === openingCode[0] ? 1 : 0;
      }

      if (openingCodeProgress !== openingCode.length) {
        return;
      }

      codeGate.isFallThrough = true;
      document.removeEventListener("keydown", handleOpeningCode);
      const openingInterval = setInterval(() => {
        openingWall.x = Math.max(-50, openingWall.x - 2);
        if (openingWall.x === -50) {
          clearInterval(openingInterval);
        }
      }, 1000 / frameRate);
    };
    document.addEventListener("keydown", handleOpeningCode);
    activeLevelCleanup = () => {
      document.removeEventListener("keydown", handleOpeningCode);
    };
    createBadPlatform(200, 400, 200, 20, "#111b3f");
    createBadPlatform(400, 100, 20, 300, "#111b3f");
    createRandomPlatform(800, 324, 20, -300);
    platforms[platforms.length - 1].isWindow = true;
    platforms[platforms.length - 1].windowColor =
      platforms[platforms.length - 1].color;
    createPlatform(100, 150, -200, 50, "#6381ee");
    codeGate = platforms[platforms.length - 1];
    codeGate.isCodeGate = true;
    createBadPlatform(800, 325, 20, 100, "#111b3f");
    createBadPlatform(800, 75, 20, 75, "#111b3f");
    createPlatform(1000, 675, 100, 10, "#6381ee", 1000, 1100, 1);
    const timedPlatform = platforms[platforms.length - 1];
    timedPlatform.isPeriodicReveal = true;
    timedPlatform.visibleColor = timedPlatform.color;
    timedPlatformInterval = setInterval(() => {
      timedPlatformVisibilityOpen = true;
      timedPlatformTimeout = setTimeout(() => {
        timedPlatformVisibilityOpen = false;
      }, 500);
    }, 7000);

    // TODO 3 - Create Collectables
    const randomCollectableTypes = Object.keys(collectableList).filter(
      (type) => type !== "database",
    );
    for (let index = randomCollectableTypes.length - 1; index > 0; index--) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [randomCollectableTypes[index], randomCollectableTypes[randomIndex]] = [
        randomCollectableTypes[randomIndex],
        randomCollectableTypes[index],
      ];
    }
    collectableSequence = [
      {
        type: randomCollectableTypes[0],
        x: 500,
        y: 200,
        gravity: 0,
        bounce: 1,
        minX: null,
        maxX: null,
        speed: 1,
        pickupMessage: "Mr. Riordan is proud of you for collecting a face",
      },
      {
        type: randomCollectableTypes[1],
        x: 900,
        y: 200,
        gravity: 0.5,
        bounce: 0.7,
        minX: null,
        maxX: null,
        speed: 1,
        pickupMessage: "Oh golly your really good at this",
      },
      {
        type: randomCollectableTypes[2],
        x: 1300,
        y: 650,
        gravity: 0,
        bounce: 1,
        minX: null,
        maxX: null,
        speed: 1,
        pickupMessage: "I get a A+ now you collected this face",
      },
      {
        type: randomCollectableTypes[3],
        x: 1300,
        y: 10,
        gravity: 0,
        bounce: 1,
        minX: null,
        maxX: null,
        speed: 1,
        pickupMessage: "wow how'd you get me?",
      },
      {
        type: randomCollectableTypes[4],
        x: 1030,
        y: 635,
        gravity: 0,
        bounce: 1,
        minX: 1030,
        maxX: 1130,
        speed: 1,
        isPeriodicReveal: true,
        pickupMessage: "... hacker ...",
      },
    ];
    collectableSequenceProgress = 0;
    const firstCollectable = collectableSequence[0];
    createCollectable(
      firstCollectable.type,
      firstCollectable.x,
      firstCollectable.y,
    );

    // TODO 4 - Create Cannons
    createCannon("top", 200, 600);
    createCannon("left", 175, 1);
    cannons[cannons.length - 1].startShootingAfterY = 250;
    cannons[cannons.length - 1].projectileStopX = 400;
    createCannon("top", 1100, 750, 20, 10, 1100, 1250, 2);
    createCannon("left", 650, 1);
  }

  function setupLevelTwo() {
    currentLevel = 2;
    if (activeLevelCleanup) {
      activeLevelCleanup();
      activeLevelCleanup = null;
    }
    if (timedPlatformInterval !== null) {
      clearInterval(timedPlatformInterval);
      timedPlatformInterval = null;
    }
    if (timedPlatformTimeout !== null) {
      clearTimeout(timedPlatformTimeout);
      timedPlatformTimeout = null;
    }

    platforms = [];
    fakePlatforms = [];
    badPlatforms = [];
    cannons = [];
    projectiles = [];
    collectables = [];
    collectableSequenceProgress = 0;
    timedPlatformVisibilityOpen = false;

    player.x = canvas.width / 2 - hitBoxWidth / 2;
    player.y = 100;
    player.speedX = 0;
    player.speedY = 0;
    player.onGround = false;
    player.facingRight = true;
    player.deadAndDeathAnimationDone = false;
    player.winConditionMet = false;
    for (const key in keyPress) {
      keyPress[key] = false;
    }
    facePickupTimer = 0;
    facePickupMessage = "";
    currentAnimationType = animationTypes.run;
    frameIndex = 0;
    winDelayPending = false;

    // Level 2 world boundaries
    shouldDrawGrid = false;
    createPlatform(-50, -50, canvas.width + 100, 50);
    createPlatform(
      -50,
      canvas.height - 10,
      canvas.width + 100,
      200,
      "rgba(0, 0, 0, 0)",
    );
    createPlatform(-50, -50, 50, canvas.height + 500);
    createPlatform(canvas.width, -50, 50, canvas.height + 100);

    collectableSequence = [];
    levelTwoDoors = [
      {
        label: "WIN",
        x: 250,
        y: canvas.height - 110,
        width: 70,
        height: 100,
        color: "#2a9d8f",
        destinationLevel: 3,
      },
      {
        label: "DIE",
        x: 1080,
        y: canvas.height - 110,
        width: 70,
        height: 100,
        color: "#e76f51",
        destinationLevel: 4,
      },
    ];
    levelExit = null;
  }

  function setupDestinationLevel(destinationLevel) {
    currentLevel = destinationLevel;
    levelTwoDoors = [];
    platforms = [];
    fakePlatforms = [];
    badPlatforms = [];
    cannons = [];
    projectiles = [];
    collectables = [];
    collectableSequence = [];
    shouldDrawGrid = false;

    createPlatform(-50, -50, canvas.width + 100, 50);
    createPlatform(
      -50,
      canvas.height - 10,
      canvas.width + 100,
      200,
      "rgba(0, 0, 0, 0)",
    );
    createPlatform(-50, -50, 50, canvas.height + 500);
    createPlatform(canvas.width, -50, 50, canvas.height + 100);

    player.x = 50;
    player.y = canvas.height - 10 - hitBoxHeight;
    player.speedX = 0;
    player.speedY = 0;
    player.onGround = false;
    player.facingRight = true;
    player.deadAndDeathAnimationDone = false;
    player.winConditionMet = false;
    for (const key in keyPress) {
      keyPress[key] = false;
    }
    facePickupTimer = 0;
    facePickupMessage = "";
    currentAnimationType = animationTypes.run;
    frameIndex = 0;
    winDelayPending = false;
    levelExit = {
      label: "FINISH",
      x: canvas.width - 150,
      y: canvas.height - 110,
      width: 70,
      height: 100,
      color: destinationLevel === 3 ? "#2a9d8f" : "#e76f51",
    };
  }

  //////////////////////////////////
  // ONLY CHANGE ABOVE THIS POINT //
  //////////////////////////////////

  const deathOfPlayerBase = deathOfPlayer;
  deathOfPlayer = function () {
    if (currentLevel !== 2) {
      return deathOfPlayerBase();
    }

    ctx.fillStyle = "grey";
    ctx.fillRect(
      canvas.width / 4,
      canvas.height / 6,
      canvas.width / 2,
      canvas.height / 2,
    );
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.font = "800% serif";
    ctx.fillText(
      "You are dead",
      canvas.width / 2,
      canvas.height / 6 + canvas.height / 5,
    );
    ctx.font = "500% serif";
    ctx.fillText(
      "Press any key to retry Level 2",
      canvas.width / 2,
      canvas.height / 6 + canvas.height / 3,
    );
    ctx.textAlign = "left";

    if (keyPress.any) {
      keyPress.any = false;
      setupLevelTwo();
    }
  };

  const checkForWinImmediately = checkForWin;
  let winDelayPending = false;
  checkForWin = function () {
    checkForWinImmediately();
    if (player.winConditionMet && !winDelayPending) {
      player.winConditionMet = false;
      winDelayPending = true;
      setTimeout(() => {
        player.winConditionMet = true;
      }, 2690);
    }
  };

  const mainBase = main;
  main = function () {
    if (!gameStarted) {
      return;
    }

    if (
      collectableSequence.length > 0 &&
      collectableSequenceProgress === collectableSequence.length &&
      player.deadAndDeathAnimationDone
    ) {
      player.winConditionMet = true;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      winGame();
      return;
    }

    const result = mainBase();
    if (currentLevel === 2) {
      const door = levelTwoDoors.find(
        (candidate) =>
          player.x + hitBoxWidth > candidate.x &&
          player.x < candidate.x + candidate.width &&
          player.y + hitBoxHeight > candidate.y &&
          player.y < candidate.y + candidate.height,
      );

      if (door) {
        setupDestinationLevel(door.destinationLevel);
      }
    } else if (
      levelExit &&
      player.x + hitBoxWidth > levelExit.x &&
      player.x < levelExit.x + levelExit.width &&
      player.y + hitBoxHeight > levelExit.y &&
      player.y < levelExit.y + levelExit.height
    ) {
      levelExit = null;
      if (currentLevel === 3) {
        player.winConditionMet = true;
      } else {
        currentAnimationType = animationTypes.frontDeath;
        frameIndex = 0;
      }
    }
    return result;
  };

  winGame = function () {
    ctx.fillStyle = "grey";
    ctx.fillRect(
      canvas.width / 4,
      canvas.height / 6,
      canvas.width / 2,
      canvas.height / 2,
    );
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.font = "bold 48px serif";
    ctx.fillText(
      currentLevel === 1 ? "Level 1 Complete!" : "You Win!",
      canvas.width / 2,
      canvas.height / 6 + canvas.height / 5,
      canvas.width / 2 - 40,
    );
    ctx.font = "bold 28px serif";
    ctx.fillText(
      currentLevel === 1
        ? "Press any key for Level 2"
        : "Press any key to play again",
      canvas.width / 2,
      canvas.height / 6 + canvas.height / 3,
      canvas.width / 2 - 40,
    );
    ctx.textAlign = "left";

    if (keyPress.any) {
      keyPress.any = false;
      if (currentLevel === 1) {
        setupLevelTwo();
      } else {
        window.location.reload();
      }
    }
  };

  registerSetup(setup);
});
