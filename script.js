class Moon {
  constructor(game, delay) {
    this.game = game;
    this.wave = 0;
    this.Amplitude = 0;
    this.MaxAmplitudeLimit = 220;
    this.MinAmplitudeLimit = 80;
    this.Frequency = 0.1;
    this.radius = 10;
    this.x = this.game.width * 0.5;
    this.y = this.game.height * 0.5;
    this.delay = delay;
  
    
  }

  render(ctx) {

    this.wave += 0.006;
    if (this.Amplitude <= this.MaxAmplitudeLimit && this.game.moonActivate)
      this.Amplitude += 0.05;
    if (this.Amplitude >= this.MinAmplitudeLimit && !this.game.moonActivate)
      this.Amplitude -= 0.05;

    const centerX = this.game.player.x
    const centerY =  this.game.player.y
    this.Amplitude += Math.sin(0.5 * this.wave) * 0.1;
    this.x =
      centerX +
      Math.sin(this.Frequency * this.wave + this.delay) * this.Amplitude
    this.y =
      centerY +
      Math.cos(this.Frequency * this.wave + this.delay) * this.Amplitude
    ctx.save();
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

class Enemy {
  constructor(game) {
    this.game = game;
    this.x = 0;
    this.y = 0;
    this.Initialx = 0;
    this.Initialy = 0;
    this.radius = 30;
    this.Initialradius = 30;
    this.width = this.radius * 2;
    this.height = this.radius * 2;
    this.speedX = 0;
    this.speedY = 0;
    this.free = true;
    this.timer = 0;
    this.interval = 120;
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

    this.speedX = -aim[0] * this.speedModifier;
    this.speedY = -aim[1] * this.speedModifier;
    this.Initialx = this.x;
    this.Initialy = this.y;
  }
  reset() {
    this.frameX = 0;
    this.radius = this.Initialradius;
    this.speedModifier = Math.random();
    this.free = true;
  }
  draw(ctx) {
    if (!this.free) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.beginPath();
      ctx.lineWidth = 4;
      if (this.game.debug) {
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.beginPath();
        ctx.moveTo(this.Initialx - this.x, this.Initialy - this.y);
        ctx.lineTo(this.game.planet.x - this.x, this.game.planet.y - this.y);
        ctx.stroke();
      }
      ctx.rotate(this.rotation);
      if (this.collided) {
        if (this.game.shadow) ctx.shadowColor = "red";
        if (this.game.shadow) ctx.shadowBlur = 25;
      }
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
      ctx.save();
      if (this.game.debug) {
        ctx.font = "30px Impact";
        ctx.fillStyle = "red";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${this.lives}`, this.x, this.y);
        ctx.restore();
      }
    }
  }
  hit(damage) {
    this.lives -= damage;
  }
  update(deltaTime) {
    this.wave += 1;

    this.rotation += this.speedRotation;
    if (!this.free) {
      this.x += this.speedX;
      this.y += this.speedY + Math.cos(0.3 * this.wave) * 0.6;
      // check collision enemy/planet
      if (this.game.checkCollision(this, this.game.planet)) {
        this.lives = 0;
        this.game.quake = true;
      }
      // check collision enemy/player
      if (this.game.checkCollision(this, this.game.player)) {
        this.lives = 0;
        this.game.quake = true;
      }
      // check collision enemy / projectiles
      this.game.projectilePool.forEach((projectile) => {
        if (
          !projectile.free &&
          !this.collided &&
          this.game.checkCollision(this, projectile)
        ) {
          projectile.reset();
          this.hit(1);
        }
      });
      this.game.moonArray.forEach((moon) => {
        if (this.game.checkCollision(this, moon)) {
          this.hit(1);
        }
      });

      if (this.lives <= 0) {
        this.collided = true;
      }

      if (this.collided && this.timer >= this.interval) {
        this.frameX++;
        this.timer = 0;
        if (this.frameX >= this.maxFrameX) {
          this.collided = false;
          this.lives = this.initialLives;
          this.reset();
        }
      }
    }
    this.timer += deltaTime;

    const distance = this.game.calcAim(this, this.game.planet)[4]
  }
}

class Asteroid extends Enemy {
  constructor(game) {
    super(game);
    this.speedModifier = Math.random();
    this.widthFrame = 80;
    this.heightFrame = 80;
    this.wave = 0;
    this.frameX = 0;
    this.initialLives = 3;
    this.lives = this.initialLives;
    this.maxFrameX = 7;
    this.frameY = Math.floor(Math.random() * 4);
    this.rotation = 0;
    this.speedRotation = Math.random() * 0.05 - 0.1;
    this.img = document.getElementById("asteroid");
    this.collided = false;
  }
}

class Projectile {
  constructor(game) {
    this.game = game;
    this.x = 0;
    this.y = 0;
    this.radius = 5;
    this.free = true;
    this.speedX = Math.random() + 0.2;
    this.speedY = Math.random() + 0.2;
    this.speedModifier = 5;
    this.trace = [];
    this.trailLength = 6;
    this.wave = 0;
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
    this.trace = [];
    
  }

  draw(ctx) {
    if (!this.free) {
      // Draw the projectile
      ctx.save();
      ctx.beginPath();
      ctx.fillStyle = "gold";
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Draw the delayed copies of the projectile as the trail
      for (let i = 0; i < this.trace.length; i++) {
        const delayedProjectile = this.trace[i];
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        const red = Math.floor(255 - i * 5);
        const green = Math.floor(100 + i * 5);
        const blue = 0;
        ctx.fillStyle = `rgba(${red},${green},${blue},0.6`;
        ctx.shadowColor = "red";
        ctx.shadowBlur = 6;
        ctx.arc(
          delayedProjectile.x,
          delayedProjectile.y,
          this.radius - 0.6 + i,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.restore();
      }
    }
  }

  update(deltaTime) {
    this.wave += deltaTime;
    if (!this.free) {
      // Store a delayed copy of the projectile in the trail
      this.trace.push({ x: this.x, y: this.y });

      // Trim the trail to a certain length
      if (this.trace.length > this.trailLength) {
        this.trace.shift(); // Remove the oldest copy
      }

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
    this.wave = 0;
  }

  render(ctx) {
    this.wave += 1;
    this.y += Math.cos(0.5 * this.wave) * 0.1;
    this.x += Math.sin(0.5 * this.wave) * 0.1;
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
    this.shootTimer = 501;
    this.shootInterval = 180;
    this.angle = 0;
    this.wave = 0;
    this.distanceFromCenter = 120
    this.EllipseXradius = 120 - this.distanceFromCenter
    this.EllipseYradius = 130 - this.distanceFromCenter
    
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.beginPath();
    if (this.game.debug) ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.rotate(this.angle);
    if (this.game.shadow) ctx.shadowColor = "blue";
    if (this.game.shadow && this.shootTimer < 500) ctx.shadowColor = "red";
    if (this.game.shadow) ctx.shadowBlur = 5;
    ctx.drawImage(
      this.img,
      -this.radius + Math.sin(0.1 * this.wave),
      -this.radius
    );
    ctx.ellipse(70 + Math.sin(0.1 * this.wave), this.EllipseXradius, this.EllipseYradius, 20, 0, 0, Math.PI * 2);
    
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.fill();
    ctx.restore();

    if (this.game.debug) ctx.stroke();
  }
  update(deltaTime) {
    
    this.wave += 1;
    this.shootTimer += deltaTime;

    this.aim = this.game.calcAim(this.game.mouse, this.game.planet);
    const x = this.game.planet.x + this.distanceFromCenter * this.aim[0];
    const y = this.game.planet.y + this.distanceFromCenter * this.aim[1];
    this.x = this.game.lerp(this.x, x, 0.1);
    this.y = this.game.lerp(this.y, y, 0.1);
    this.angle = Math.atan2(this.aim[3], this.aim[2]) + Math.PI;
    this.EllipseXradius =   (-this.distanceFromCenter * 0.01)
    this.EllipseYradius =Math.max(3, 20 - (this.distanceFromCenter *0.1)) 
  }
  shoot() {
    this.shootTimer = 0;
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
    this.moonActivate = false;
    this.moonGrow = true;
    this.moonShrink = false;
    this.moonArray = [];
    this.debug = false;
    this.shadow = false;
    this.projectilePool = [];
    this.numberOfProjectiles = 30;
    this.createProjectilePool();
    this.enemyPool = [];
    this.numberOfEnemies = 30;
    this.createEnemyPool();
    this.enemyPool[0].start();
    this.enemyTimer = 0;
    this.enemyInterval = 2500;
    this.quake = false;
    this.quakeTime = 0;
    this.pause = false;

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
      if (this.player.shootTimer >= this.player.shootInterval)
        this.player.shoot();
    });

    window.addEventListener("keyup", (e) => {
      if (e.key === "d" && e.ctrlKey === true && e.altKey === true) {
        this.debug = !this.debug;
      }

      if (e.key === "a") {
        this.shadow = !this.shadow;
      }
      if (e.key === "y") {
        this.moonActivate = !this.moonActivate;
      
        if (this.moonActivate) {
          this.createMoons();
          setTimeout(() => {
            this.moonActivate = false;
            setTimeout(() => {
              this.moonArray = [];
            }, 3000); // Wait 3 seconds before clearing moonArray
          }, 6000); 
        }
      }
      
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === " ") {
        if (this.player.shootTimer >= this.player.shootInterval)
          this.player.shoot();
      }
      if (e.key === "z") {
        this.player.distanceFromCenter +=10
      }
      if (e.key === "x") {
        this.player.distanceFromCenter -=10
      }
      
    });
  }
  render(ctx, deltaTime) {
    if (this.quake) this.quakeTime += deltaTime;
    this.planet.render(ctx);
    this.player.draw(ctx);
    this.player.update(deltaTime);
    this.projectilePool.forEach((projectile) => {
      projectile.draw(ctx);
      projectile.update();
    });

    //   for (let i = 0; i < this.enemyPool.length; i++) {
    //     for (let j = i + 1; j < this.enemyPool.length; j++) {
    //       if (this.checkCollision(this.enemyPool[j], this.enemyPool[i])){
    //         // this.enemyPool[j].start()
    //         // this.enemyPool[i].start()
    //       }

    //   }
    // }

    this.enemyPool.forEach((enemy, i) => {
      enemy.draw(ctx);
      enemy.update(deltaTime);
      if (this.calcAim(enemy, this.planet)[4] < 370) {
        for (let j = i + 1; j < this.enemyPool.length; j++) {
          if (this.checkCollision(enemy, this.enemyPool[j])) {
            enemy.collided = true;
            this.enemyPool[j].collided = true;
          }
        }
      }

      this.moonArray.forEach((moon) => moon.render(ctx, deltaTime));
    
    });

    // periodically activate an enemy
    if (this.enemyTimer < this.enemyInterval) {
      this.enemyTimer += deltaTime;
      this.enemyInterval = Math.random() * 4000 + 1000;
    } else {
      this.enemyTimer = 0;
      // const randomNumberOfEnemies = Math.floor(Math.random() * 2) + 1; // Generates a random number between 1 and 3

      // for (let i = 0; i < randomNumberOfEnemies; i++) {
        const enemy = this.getEnemy();
        if (enemy) enemy.start();
      // }
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
    return [aimX, aimY, dx, dy, distance];
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
      this.enemyPool.push(new Asteroid(this));
    }
  }

  getEnemy() {
    for (let i = 0; i < this.enemyPool.length; i++) {
      if (this.enemyPool[i].free) return this.enemyPool[i];
    }
  }

  createMoons() {
    this.moonArray = [];
    const numMoons = 10;
    const separation = (2 * Math.PI) / numMoons;

    for (let i = 0; i < numMoons; i++) {
      const delay = i * separation;
      this.moonArray.push(new Moon(this, delay));
    }
  }
}

addEventListener("load", () => {
  const bg = document.getElementById("bg");
  const canvas = document.querySelector("canvas");
  canvas.width = 800;
  canvas.height = 800;
  const ctx = canvas.getContext("2d");
  const game = new Game(canvas);

  let lastTime = 0;
  let animationId;
  let quakeDuration = 800;
  let intensity = 5;

  function animate(timeStamp) {
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;

    if (game.quake) {
      if (game.quakeTime < quakeDuration) {
        const offsetX = Math.random() * intensity * 2 - intensity;
        const offsetY = Math.random() * intensity * 2 - intensity;

        // Clear the canvas
        // ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(offsetX, offsetY);
        game.planet.render(ctx);
        ctx.globalAlpha = 0.3;

        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

        ctx.translate(offsetX, offsetY);
        ctx.restore();
        game.render(ctx, deltaTime); // Call render instead of draw

        requestAnimationFrame(animate);
      } else {
        game.quake = false;
        game.quakeTime = 0;

        ctx.save();
        game.planet.render(ctx);

        ctx.globalAlpha = 0.3;

        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

        ctx.restore();
        game.render(ctx, deltaTime); // Call render instead of draw
        requestAnimationFrame(animate);
      }
    } else {
      if (!game.pause) {
        animationId = requestAnimationFrame(animate);
      }

      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
      ctx.restore();
      game.render(ctx, deltaTime);
    }
  }

  animate(0);

  //Pause and restart the game
  window.addEventListener("keydown", (e) => {
    if (e.key === "p") {
      game.pause = !game.pause;

      if (!game.pause) {
        if (animationId === null) {
          animationId = requestAnimationFrame(animate);
        }
      } else {
        if (animationId) {
          cancelAnimationFrame(animationId);
          animationId = null;
        }
      }
    }
  });
});
