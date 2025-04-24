let cols, rows;
let spacing = 60;
let points = [];
let maxColsRows = 10;
let broches = [];
let letras = ['S', 'O', 'M', 'A'];
let letraIndex = 0;
let initialRadius = 60;
let targetRadius = 200;
let liquidRadius = initialRadius;
let radiusLerpAmt = 0.1;
let minDistance = 80;
let fontSizeSlider;
let shouldExpand = false;
let paperSound;
let soundPlaying = false; // 🔴 Nueva variable para controlar el estado del sonido

function preload() {
  paperSound = loadSound('paper.wav');
  paperSound.loop(false); // 🔴 Desactivar loop automático
}

function setup() {
  createCanvas(600, 600);
  frameRate(10);
  fontSizeSlider = createSlider(20, 80, 48, 1);
  fontSizeSlider.position(10, height + 40);
  fontSizeSlider.style('width', '280px');

  textFont('Helvetica Light');
  noiseDetail(3, 0.5);

  let totalPoints = 100;
  for (let i = 0; i < totalPoints; i++) {
    let angle = map(i, 0, totalPoints, 0, TWO_PI);
    let r = liquidRadius + map(noise(cos(angle) * 2, sin(angle) * 2), 0, 1, -40, 40);
    let x = width / 2 + cos(angle) * r;
    let y = height / 2 + sin(angle) * r;
    points.push(createVector(x, y));
  }
}

function draw() {
  background(0);

  if (shouldExpand) {
    liquidRadius = lerp(liquidRadius, targetRadius, radiusLerpAmt);
  }

  let dynamicRadius = liquidRadius * (fontSizeSlider.value() / 48);

  let deformedPoints = [];
  for (let i = 0; i < points.length; i++) {
    let angle = map(i, 0, points.length, 0, TWO_PI);
    let baseR = liquidRadius + map(noise(cos(angle) * 1, sin(angle) * 1), 0, 1, -40, 40);
    let baseX = width / 2 + cos(angle) * baseR;
    let baseY = height / 2 + sin(angle) * baseR;
    let p = createVector(baseX, baseY);

    let deformedP = p.copy();
    for (let b of broches) {
      let d = dist(p.x, p.y, b.pos.x, b.pos.y);
      if (d < dynamicRadius * 0.8) {
        let force = p5.Vector.sub(b.pos, p);
        force.mult(1.5 * (fontSizeSlider.value() / 48) * (1 - d / (dynamicRadius * 0.8)));
        deformedP.add(force);
      }
    }
    deformedPoints.push(deformedP);
  }

  fill(255);
  noStroke();
  beginShape();
  for (let i = 0; i <= deformedPoints.length; i++) {
    let idx = i % deformedPoints.length;
    let p = deformedPoints[idx];
    curveVertex(p.x, p.y);
  }
  endShape(CLOSE);

  for (let b of broches) {
    b.update();
    b.display(fontSizeSlider.value());
    
    // 🔴 Detener sonido si ya no se está arrastrando pero el sonido sigue
    if (!b.dragging && soundPlaying) {
      paperSound.stop();
      soundPlaying = false;
    }
  }
}

function mousePressed() {
  for (let b of broches) {
    if (b.isMouseOver(fontSizeSlider.value())) {
      b.dragging = true;
      if (!soundPlaying) { // 🔴 Solo reproducir si no está sonando
        paperSound.play();
        soundPlaying = true;
      }
      return;
    }
  }

  let dynamicRadius = liquidRadius * (fontSizeSlider.value() / 48);
  if (dist(mouseX, mouseY, width / 2, height / 2) < dynamicRadius * 0.8) {
    let canPlace = true;
    for (let b of broches) {
      if (dist(mouseX, mouseY, b.pos.x, b.pos.y) < minDistance * (fontSizeSlider.value() / 48)) {
        canPlace = false;
        break;
      }
    }

    if (canPlace) {
      if (broches.length === 0 && !shouldExpand) {
        shouldExpand = true;
      }
      let letra = letras[letraIndex];
      letraIndex = (letraIndex + 1) % letras.length;
      broches.push(new Broche(mouseX, mouseY, letra));
      if (!soundPlaying) { // 🔴 Reproducir solo si no está sonando
        paperSound.play();
        soundPlaying = true;
      }
    }
  }
}

function mouseReleased() {
  for (let b of broches) {
    b.dragging = false;
  }
  if (soundPlaying) { // 🔴 Detener sonido al soltar
    paperSound.stop();
    soundPlaying = false;
  }
}

class Broche {
  constructor(x, y, letra) {
    this.pos = createVector(x, y);
    this.target = this.pos.copy();
    this.dragging = false;
    this.letra = letra;
    this.r = 30;
  }

  update() {
    if (this.dragging) {
      this.target.set(mouseX, mouseY);
    }
    this.pos.lerp(this.target, 0.15);

    let dynamicRadius = liquidRadius * (fontSizeSlider.value() / 48);
    let centerDist = dist(this.pos.x, this.pos.y, width / 2, height / 2);
    if (centerDist > dynamicRadius * 0.9) {
      let angle = atan2(this.pos.y - height / 2, this.pos.x - width / 2);
      this.target.x = width / 2 + cos(angle) * dynamicRadius * 0.9;
      this.target.y = height / 2 + sin(angle) * dynamicRadius * 0.9;
    }
  }

  display(fontSize) {
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(fontSize);
    text(this.letra, this.pos.x, this.pos.y);
    this.r = fontSize * 0.5;
  }

  isMouseOver(fontSize) {
    return dist(mouseX, mouseY, this.pos.x, this.pos.y) < fontSize * 0.6;
  }
}