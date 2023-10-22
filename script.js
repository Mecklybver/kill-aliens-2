class Enemy {
  constructor(game) {
    this.game = game;
    this.x = 0;
    this.y = 0;
    this.radius = 40;
    this.width = this.radius * 2;
    this.height = this.radius * 2;
    this.speedX = 0;
    this.speedY = 0;
    this.free = true;
    this.timer = 0;
    this.interval = 120;
    this.widthFrame = 80;
    this.heightFrame = 80;
    this.wave = 0;
    this.frameX = 0;
    this.maxFrameX = 7;
    this.frameY = Math.floor(Math.random() * 4);
    this.rotation = 0;
    this.speedRotation = Math.random() * 0.05 - 0.1;
    this.img = document.getElementById("asteroid");
    this.collided = false;
  }
  start() {
    this.free = false;
    if (Math.random() < 0.5) {
      this.x = Math.random() * this.game.width + this.radius;
      this.y =
        Math.random() < 0.5 ? -this.radius : this.game.height + this.radius;
    } else {
      this.x =
        Math.random() < 0.5 ? -this.radius : this.game.width + this.radius;
      this.y = Math.random() * this.game.height + this.radius;
    }
    const aim = this.game.calcAim(this, this.game.planet);
    this.speedX = -aim[0];
    this.speedY = -aim[1];
  }
  reset() {
    this.frameX = 0;
    this.free = true;
  }
  draw(ctx) {
    if (!this.free) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.beginPath();
      ctx.lineWidth = 4;
      if (this.game.debug) ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.rotate(this.rotation);
      ctx.drawImage(
        this.img,
        this.frameX * this.widthFrame,
        this.frameY * this.heightFrame,
        this.widthFrame,
        this.heightFrame,
        -this.radius,
        -this.radius,
        this.radius * 2,
        this.radius * 2
      );
      ctx.stroke();
      ctx.restore();
    }
  }
  update(deltaTime) {
    this.wave += 1;
    this.rotation += this.speedRotation;
    if (!this.free) {
      this.x += this.speedX;
      this.y += this.speedY;
      // check collision enemy/planet
      if (this.game.checkCollision(this, this.game.planet)) {
        this.explosion(deltaTime);
      }
      // check collision enemy/player
      if (this.game.checkCollision(this, this.game.player)) {
        this.explosion(deltaTime);
      }
      // check collision enemy / projectiles
      this.game.projectilePool.forEach((projectile) => {
        if (this.game.checkCollision(this, projectile)) {
          projectile.reset();

          this.explosion(deltaTime);
        }
      });
    }
  }
  explosion(deltaTime) {
    console.log(deltaTime);
    this.timer += deltaTime;

    if (this.timer >= this.interval) {
      this.timer = 0;
      this.frameX++;
    }
    if (this.frameX >= this.maxFrameX) {
      this.reset();
      this.frameX = 0;
    }
  }
}

class Projectile {
  constructor(game) {
    this.game = game;
    this.x = 0;
    this.y = 0;
    this.radius = 5;
    this.free = true;
    this.speedX = 1;
    this.speedY = 1;
    this.speedModifier = 5;
  }
  start(x, y, speedX, speedY) {
    this.free = false;
    this.x = x;
    this.y = y;
    this.speedX = speedX * this.speedModifier;
    this.speedY = speedY * this.speedModifier;
  }
  reset() {
    this.free = true;
  }
  draw(ctx) {
    if (!this.free) {
      ctx.save();
      ctx.beginPath();
      ctx.fillStyle = "gold";
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  update() {
    if (!this.free) {
      this.x += this.speedX;
      this.y += this.speedY;
    }
    if (
      this.x < 0 ||
      this.x > this.game.width ||
      this.y < 0 ||
      this.y > this.game.height
    ) {
      this.reset();
    }
  }
}

class Planet {
  constructor(game) {
    this.game = game;
    this.x = game.width * 0.5;
    this.y = game.height * 0.5;
    this.radius = 80;
    this.img = document.getElementById("planet");
    this.rotation = 0;
    this.rotationSpeed = 0.0007;
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.drawImage(this.img, -this.radius - 20, -this.radius - 20);
    ctx.beginPath();
    if (this.game.debug) ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    this.rotation += this.rotationSpeed;
  }
}

class Player {
  constructor(game) {
    this.game = game;
    this.x = this.game.width * 0.5;
    this.y = this.game.height * 0.5;
    this.radius = 40;
    this.img = document.getElementById("player");
    this.aim;
    this.angle = 0;
    this.wave = 0;
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.beginPath();
    if (this.game.debug) ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.rotate(this.angle);
    ctx.drawImage(
      this.img,
      -this.radius + Math.sin(0.1 * this.wave),
      -this.radius
    );
    ctx.globalAlpha = 0.6;
    ctx.ellipse(70 + Math.sin(0.1 * this.wave), 0, 10, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    if (this.game.debug) ctx.stroke();
    ctx.restore();
  }
  update() {
    this.wave += 1;

    this.aim = this.game.calcAim(this.game.mouse, this.game.planet);
    const x = this.game.planet.x + 120 * this.aim[0];
    const y = this.game.planet.y + 120 * this.aim[1];
    this.x = this.game.lerp(this.x, x, 0.1);
    this.y = this.game.lerp(this.y, y, 0.1);
    this.angle = Math.atan2(this.aim[3], this.aim[2]) + Math.PI;
  }
  shoot() {
    const projectile = this.game.getProjectile();
    if (projectile)
      projectile.start(
        this.x + this.radius * this.aim[0],
        this.y + this.radius * this.aim[1],
        this.aim[0],
        this.aim[1]
      );
  }
}

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.planet = new Planet(this);
    this.player = new Player(this);
    this.debug = false;
    this.projectilePool = [];
    this.numberOfProjectiles = 30;
    this.createProjectilePool();
    this.enemyPool = [];
    this.numberOfEnemies = 30;
    this.createEnemyPool();
    this.enemyPool[0].start();
    this.enemyTimer = 0;
    this.enemyInterval = 1000;

    this.mouse = {
      x: 0,
      y: 0,
    };

    window.addEventListener("mousemove", (e) => {
      this.mouse.x = e.offsetX;
      this.mouse.y = e.offsetY;
    });

    window.addEventListener("mousedown", (e) => {
      this.mouse.x = e.offsetX;
      this.mouse.y = e.offsetY;
      this.player.shoot();
    });

    window.addEventListener("keyup", (e) => {
      if (e.key === "d") {
        this.debug = !this.debug;
      }
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === " ") {
        this.player.shoot();
      }
    });
  }
  render(ctx, deltaTime) {
    // console.log(this.enemyPool);

    this.planet.render(ctx);
    this.player.draw(ctx);
    this.player.update();
    this.projectilePool.forEach((projectile) => {
      projectile.draw(ctx);
      projectile.update();
    });
    this.enemyPool.forEach((enemy) => {
      enemy.draw(ctx);
      enemy.update(deltaTime);
    });
    // periodically activate an enemy
    if (this.enemyTimer < this.enemyInterval) {
      this.enemyTimer += deltaTime;
    } else {
      this.enemyTimer = 0;
      const enemy = this.getEnemy();
      if (enemy) enemy.start();
    }

    ctx.save();
    ctx.strokeStyle = "red";
    ctx.beginPath();
    ctx.moveTo(this.planet.x, this.planet.y);
    ctx.lineTo(this.mouse.x, this.mouse.y);
    if (this.debug) ctx.stroke();
    ctx.restore();
  }
  calcAim(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const distance = Math.hypot(dx, dy);
    const aimX = dx / distance;
    const aimY = dy / distance;
    return [aimX, aimY, dx, dy];
  }

  checkCollision(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const distance = Math.hypot(dx, dy);
    const sumOfRadii = a.radius + b.radius;

    return distance < sumOfRadii;
  }
  lerp(a, b, t) {
    return (1 - t) * a + t * b;
  }

  //We are going to create the pool for the projectiles

  createProjectilePool() {
    for (let i = 0; i < this.numberOfProjectiles; i++) {
      this.projectilePool.push(new Projectile(this));
    }
  }
  getProjectile() {
    for (let i = 0; i < this.projectilePool.length; i++) {
      if (this.projectilePool[i].free) return this.projectilePool[i];
    }
  }

  // we are going to create the pool for the enemies

  createEnemyPool() {
    for (let i = 0; i < this.numberOfEnemies; i++) {
      this.enemyPool.push(new Enemy(this));
    }
  }

  getEnemy() {
    for (let i = 0; i < this.enemyPool.length; i++) {
      if (this.enemyPool[i].free) return this.enemyPool[i];
    }
  }
}

addEventListener("load", () => {
  const canvas = document.querySelector("canvas");
  canvas.width = 800;
  canvas.height = 800;
  const ctx = canvas.getContext("2d");
  const game = new Game(canvas);

  let lastTime = 0;
  function animate(timeStamp) {
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    game.render(ctx, deltaTime);
  }
  animate(0);
});
