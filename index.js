// ******************** Canvas ********************
const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.height = 300;
canvas.width = 400;

// ******************** Const/Let/El ********************
// Utils
const friction = 0.99;
const projectilesSize = 4;
let timePast, timeSinceMove;
const enemiesInitMoveTimer = 1; // time before enemies move used in init
let enemiesMoveTimer = enemiesInitMoveTimer; // value use while playing
// Player
const playerProjectilesVelocity = 6;
const playerWidth = 20;
const playerHeight = 20;
let playerColor = '#2BD8B2';
let playerX = canvas.width / 2 - playerWidth / 2;
const playerY = canvas.height - playerHeight;
let playerMoveLeft = false;
let playerMoveRight = false;
let playerShoot = false;
let lives = 3;
// Enemies
const enemiesProjectilesVelocity = 3;
const enemiesRows = 5;
const enemiesPerRow = 10;
const enemyWidth = 16;
const enemyHeight = 16;
const enemyColor = 'white';
const spacing = enemyWidth / 2; // Space beetween enemies
const spaceLeft = canvas.width - (((enemyWidth + spacing) * enemiesPerRow)); // Space left on the sides
let enemiesMoveRight = true;
let enemiesMoveLeft = false;
let whichEnemyCanShot = 1;
// Score
const scoreEl = document.querySelector('.score');
let score = 0;
const highScoreEl = document.querySelector('.high-score');
let highScore = 0;
const livesEl = document.querySelector('.lives');
const menuScoreEl = document.querySelector('.menu_score');
const menuHightScoreEl = document.querySelector('.menu_high-score');
// Menu
const menuEl = document.querySelector('.menu');
const startBtnEl = document.querySelector('.menu_button');
const gameOverEl = document.querySelector('.menu_game-over');
const menuScoresEl = document.querySelector('.menu_scores');
// Array
let playerProjectiles, enemies, particles, enemiesProjectiles;
// Frames
let stop = false;
let frameCount = 0;
let fps, fpsInterval, startTime, now, then, elapsed;

// ******************** Objects ********************
class Player {
  constructor(x, y, width, height, color) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
  };

  draw() {
    c.beginPath();
    c.rect(this.x, this.y, this.width, this.height);
    c.strokeStyle = this.color;
    c.stroke();
    c.fillStyle = this.color;
    c.fill();
    c.closePath();
  }

  update() {
    this.draw();
    if (playerMoveLeft && this.x >= 0) {
      this.x -= 1;
    };
    if (playerMoveRight && this.x <= canvas.width - this.width) {
      this.x += 1;
    };
    if (playerShoot && playerProjectiles.length === 0) {
      playerProjectiles.push(new Projectile(this.x + this.width / 2, this.y - 5, projectilesSize, 'white', playerProjectilesVelocity, 'playerSource'));
    };
  }
};

class Projectile {
  constructor(x, y, radius, color, velocity, source) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
    this.source = source;
  };
  draw() {
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    c.fillStyle = this.color;
    c.fill();
    c.closePath();
  };
  update() {
    this.draw();
    if (this.source === 'playerSource') {
      this.y = this.y - this.velocity;
    };
    if (this.source === 'enemiesSource') {
      this.y = this.y + this.velocity;
    };
  };
};

class Enemy {
  constructor(x, y, width, height, color, row, pos) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.row = row;
    this.pos = pos;
  };
  draw() {
    c.beginPath();
    c.rect(this.x, this.y, this.width, this.height);
    c.strokeStyle = this.color;
    c.stroke();
    c.fillStyle = this.color;
    c.fill();
    c.closePath();
  };
  update() {
    this.draw();
    if (enemiesProjectiles.length === 0) {
      // Only last row can shoot
      if (this.row === enemies.length - 1) {
        // Which one can shoot
        if (this.pos === whichEnemyCanShot) {
          handleEnemiesProjectiles(this.x + (this.width / 2), this.y + this.height);
        }
      }
    }
  };
};

// Particles use for the explosion
class Particle {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
    this.alpha = 1;
  };
  draw() {
    c.save();
    c.globalAlpha = this.alpha;
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    c.fillStyle = this.color;
    c.fill();
    c.closePath();
    c.restore();
  };
  update() {
    this.draw();
    this.velocity.x *= friction;
    this.velocity.y *= friction;
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
    this.alpha -= 0.005;
  };
};

// ******************** Functions ********************
const init = () => {
  playerProjectiles = [];
  enemiesProjectiles = [];
  enemies = [];
  particles = [];
  enemiesMoveTimer = enemiesInitMoveTimer;
  whichEnemyCanShot = 1;
  lives = 3;
  score = 0;
  scoreEl.innerHTML = score;
  createEnemies();
  player.draw();
};
const player = new Player(playerX, playerY, playerWidth, playerHeight, playerColor);

const startNewGame = () => {
  init();
  livesUpdate();
  stop = false;
  startAnimating(60);
  menuEl.style.display = 'none';
};

const livesUpdate = () => {
  livesEl.innerHTML = '';
  for (let i = 0; i < lives; i++) {
    livesEl.innerHTML += '&hearts;';
  };
};

const createEnemies = () => {
  // Create ennemies for each row
  for (let iRows = 0; iRows < enemiesRows; iRows++) {
    const enemiesArray = [];
    let i;
    // Create enemies for a row
    for (i = 0; i < enemiesPerRow; i++) {
      // Margin left
      if (i === 0) {
        enemiesArray.push(new Enemy(
          spaceLeft / 2, enemyHeight + (enemyHeight * 2 * iRows), enemyWidth, enemyHeight, enemyColor, iRows, i
        ));
      } else {
        enemiesArray.push(new Enemy(
          enemiesArray[i - 1].x + (enemyWidth + spacing), enemyHeight + (enemyHeight * 2 * iRows), enemyWidth, enemyHeight, enemyColor, iRows, i
        ));
      }
    };
    // Push row
    if (i === enemiesPerRow) {
      enemies.push(enemiesArray);
    };
  };
};

const lost = () => {
  // stop animation
  stop = true;
  menuEl.style.display = 'flex';
  gameOverEl.style.display = 'block';
  menuScoresEl.style.display = 'block';
  updateScores();
};

const moveAxis = (axis) => {
  if (axis === 'right') {
    enemiesMoveRight = true;
    enemiesMoveLeft = false;
  } else if (axis === 'left') {
    enemiesMoveRight = false;
    enemiesMoveLeft = true;
  };
  // Speed up
  enemiesMoveTimer *= 0.99;
  enemies.forEach(enemiesArray => {
    enemiesArray.forEach(enemy => {
      // Enemy is at bottom
      if (enemy.y + enemy.height >= player.y) {
        lost();
      } else {
        enemy.y += enemyHeight;
      }
    });
  });
};

const enemiesMove = () => {
  let enemyFarRight = 0;
  let enemyFarLeft = canvas.width;
  // Enemies touch right border
  enemies.forEach(enemiesArray => {
    if (enemyFarRight < enemiesArray[enemiesArray.length - 1].x)
      enemyFarRight = enemiesArray[enemiesArray.length - 1].x;
  });
  // Enemies touch left border
  enemies.forEach(enemiesArray => {
    if (enemyFarLeft > enemiesArray[0].x)
      enemyFarLeft = enemiesArray[0].x;
  });
  // Enemies move to the right
  if (enemiesMoveRight) {
    if (enemyFarRight + spacing <= canvas.width - enemyWidth) {
      enemies.forEach(enemiesArray => {
        enemiesArray.forEach(enemy => {
          enemy.x += spacing;
        });
      });
    } else {
      moveAxis('left');
    };
  };
  // Enemies move to the left
  if (enemiesMoveLeft) {
    if (enemyFarLeft > 0) {
      enemies.forEach(enemiesArray => {
        enemiesArray.forEach(enemy => {
          enemy.x -= spacing;
        });
      });
      if (enemyFarLeft - spacing < spacing) {
        moveAxis('right');
      }
    } else {
      moveAxis('right');
    };
  };
};

const handleEnemiesProjectiles = (x, y) => {
  // Random 1~3
  // Create enemies projectiles
  if (enemiesProjectiles.length === 0) {
    for (let i = 0; i < 1; i++) {
      enemiesProjectiles.push(new Projectile(x, y, projectilesSize, 'white', enemiesProjectilesVelocity, 'enemiesSource'));
    };
  } else {
    enemiesProjectiles.forEach((projectile, index) => {
      if (projectile.y > canvas.height) {
        enemiesProjectiles.splice(index, 1);
      };
    });
  };
};

const getRandomIntInclusive = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Return true if the rectangle and circle are colliding
// https://stackoverflow.com/questions/21089959/detecting-collision-of-rectangle-with-circle
const RectCircleColliding = (circle, rect) => {
  const distX = Math.abs(circle.x - rect.x - rect.width / 2);
  const distY = Math.abs(circle.y - rect.y - rect.height / 2);

  if (distX > (rect.width / 2 + circle.radius)) { return false; };
  if (distY > (rect.height / 2 + circle.radius)) { return false; };

  if (distX <= (rect.width / 2)) { return true; };
  if (distY <= (rect.height / 2)) { return true; };

  const dx = distX - rect.width / 2;
  const dy = distY - rect.height / 2;
  return (dx * dx + dy * dy <= (circle.radius * circle.radius));
};

const startAnimating = (fps) => {
  fpsInterval = 1000 / fps;
  then = Date.now();
  startTime = then;
  timeSinceMove = Date.now();
  animate();
};

const updateScores = () => {
  menuScoreEl.innerHTML = score;
  if (score > highScore) {
    highScore = score;
    highScoreEl.innerHTML = highScore;
    menuHightScoreEl.innerHTML = highScore;
  };
};

// ******************** EventListener ********************
addEventListener('resize', () => {
  init();
});

startBtnEl.addEventListener('click', startNewGame);

addEventListener('keydown', (e) => {
  // Left - q
  if (e.which === 81) {
    playerMoveLeft = true;
  };
  // Right - d
  if (e.which === 68) {
    playerMoveRight = true;
  };
  // Shoot - space
  if (e.which === 32) {
    playerShoot = true;
  };
});

addEventListener('keyup', (e) => {
  // Left - q
  if (e.which === 81) {
    playerMoveLeft = false;
  };
  // Right - d
  if (e.which === 68) {
    playerMoveRight = false;
  };
  // Shoot - space
  if (e.which === 32) {
    playerShoot = false;
  };
});

// ******************** Animation ********************
const animate = () => {
  // stop
  if (stop) {
    return;
  };
  // request another frame
  requestAnimationFrame(animate);
  // calc elapsed time since last loop
  now = Date.now();
  elapsed = now - then;
  timePast = (now - timeSinceMove) / 1000;
  // if enough time has past to move again
  if (timePast > enemiesMoveTimer) {
    timeSinceMove = Date.now();
    enemiesMove();
  };
  // if enough time has elapsed, draw the next frame
  if (elapsed > fpsInterval) {
    // Get ready for next frame by setting then=now, but...
    // Also, adjust for fpsInterval not being multiple of 16.67
    then = now - (elapsed % fpsInterval);
    // Draw stuff
    c.clearRect(0, 0, canvas.width, canvas.height);
    player.update();

    playerProjectiles.forEach(projectile => {
      projectile.update();
      // Remove from edges of canvas
      if (projectile.y + projectile.radius < 0) {
        playerProjectiles = [];
      };
    });

    enemiesProjectiles.forEach((projectile, projIndex) => {
      // Remove from edges of canvas
      if (projectile.y + projectile.radius > canvas.height) {
        enemiesProjectiles = [];
      };
      if (RectCircleColliding(projectile, player)) {
        // Create Explosions
        for (let i = 0; i < 10; i++) {
          particles.push(new Particle(
            projectile.x,
            projectile.y,
            Math.random() * 2,
            player.color,
            {
              x: (Math.random() - 0.5) * 2,
              y: (Math.random() - 0.5) * 2
            }));
        };
        // Remove projectiles
        setTimeout(() => {
          enemiesProjectiles.splice(projIndex, 1);
        }, 0);
        // Lose one life
        lives -= 1;
        livesUpdate();
      };
      // Enemy projectile touch player projectile
      if (playerProjectiles.length > 0) {
        const dist = Math.hypot(projectile.x - playerProjectiles[0].x, projectile.y - playerProjectiles[0].y);
        if (dist - playerProjectiles[0].radius - projectile.radius < 1) {
          // Create Explosions
          for (let i = 0; i < 10; i++) {
            particles.push(new Particle(
              projectile.x,
              projectile.y,
              Math.random() * 2,
              projectile.color,
              {
                x: (Math.random() - 0.5) * 2,
                y: (Math.random() - 0.5) * 2
              }));
          };
          setTimeout(() => {
            enemiesProjectiles.splice(projIndex, 1);
            playerProjectiles = [];
          }, 0);
        };
      };
      projectile.update();
    });

    enemies.forEach((enemiesArray, indexArray) => {
      // For each Row
      // If row is not empty
      if (enemiesArray.length !== 0) {
        // Update each Enemy
        enemiesArray.forEach((enemy, indexEnemy) => {
          // Update pos to handle shooting
          enemy.pos = indexEnemy;
          // Player projectile touch an enemy
          if (playerProjectiles.length > 0) {
            if (RectCircleColliding(playerProjectiles[0], enemy)) {
              // Create Explosions
              for (let i = 0; i < 10; i++) {
                particles.push(new Particle(
                  playerProjectiles[0].x,
                  playerProjectiles[0].y,
                  Math.random() * 2,
                  enemy.color,
                  {
                    x: (Math.random() - 0.5) * 2,
                    y: (Math.random() - 0.5) * 2
                  }));
              };
              // Update score
              score += 10;
              scoreEl.innerHTML = score;
              // Remove enemy
              setTimeout(() => {
                enemiesArray.splice(indexEnemy, 1);
                playerProjectiles = [];
              }, 0);
            };
          };
          enemy.update();
        });
        // Row is empty
      } else {
        // Remove row
        setTimeout(() => {
          enemies.splice(indexArray, 1);
        }, 0);
      };
    });

    particles.forEach((particle, indexParticle) => {
      if (particle.alpha <= 0) {
        particles.splice(indexParticle, 1);
      } else {
        particle.update();
      };
    });
  };
  // If there is no enemies
  if (enemies.length === 0) {
    // Create new enemies
    createEnemies();
  } else {
    // Else random which enemy can shoot
    whichEnemyCanShot = getRandomIntInclusive(0, enemies[enemies.length - 1].length - 1);
  };
  // lost
  if (lives === 0) {
    lost();
  };
};

