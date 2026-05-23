const canvas = document.querySelector("#typhoonCanvas");
const ctx = canvas.getContext("2d");
const pressureCanvas = document.querySelector("#pressureCanvas");
const pressureCtx = pressureCanvas.getContext("2d");

const tabButtons = document.querySelectorAll("[data-demo-target]");
const demoPages = document.querySelectorAll("[data-demo]");

const pressureInput = document.querySelector("#pressure");
const windInput = document.querySelector("#wind");
const pressureOutput = document.querySelector("#pressureOutput");
const windOutput = document.querySelector("#windOutput");
const pressureReadout = document.querySelector("#pressureReadout");
const windReadout = document.querySelector("#windReadout");
const damageReadout = document.querySelector("#damageReadout");
const damageBar = document.querySelector("#damageBar");
const conceptText = document.querySelector("#conceptText");

const formationInput = document.querySelector("#formation");
const formationOutput = document.querySelector("#formationOutput");
const hemisphereButtons = document.querySelectorAll("[data-hemisphere]");
const rotationReadout = document.querySelector("#rotationReadout");
const hemisphereLegend = document.querySelector("#hemisphereLegend");
const horizontalReadout = document.querySelector("#horizontalReadout");
const pressureConceptText = document.querySelector("#pressureConceptText");

const state = {
  pressure: Number(pressureInput.value),
  wind: Number(windInput.value),
  time: 0,
  particles: [],
  debris: [],
};

const pressureState = {
  formation: Number(formationInput.value),
  hemisphere: "north",
  time: 0,
  parcels: [],
  droplets: [],
};

let activeDemo = "typhoon";

const typhoonRanges = {
  pressureMin: 870,
  pressureMax: 975,
  windMin: 32.7,
  windMax: 75,
};

const pressureWindPoints = [
  { pressure: 975, wind: 32.7 },
  { pressure: 950, wind: 41.5 },
  { pressure: 920, wind: 51 },
  { pressure: 870, wind: 70 },
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function norm(value, min, max) {
  return clamp((value - min) / (max - min), 0, 1);
}

function interpolate(value, startValue, endValue, startResult, endResult) {
  const ratio = (value - startValue) / (endValue - startValue);
  return startResult + ratio * (endResult - startResult);
}

function windForPressure(pressure) {
  const value = clamp(pressure, typhoonRanges.pressureMin, typhoonRanges.pressureMax);
  for (let i = 0; i < pressureWindPoints.length - 1; i += 1) {
    const high = pressureWindPoints[i];
    const low = pressureWindPoints[i + 1];
    if (value <= high.pressure && value >= low.pressure) {
      return interpolate(value, high.pressure, low.pressure, high.wind, low.wind);
    }
  }
  return value <= typhoonRanges.pressureMin ? 70 : typhoonRanges.windMin;
}

function pressureForWind(wind) {
  const value = clamp(wind, typhoonRanges.windMin, typhoonRanges.windMax);
  for (let i = 0; i < pressureWindPoints.length - 1; i += 1) {
    const weak = pressureWindPoints[i];
    const strong = pressureWindPoints[i + 1];
    if (value >= weak.wind && value <= strong.wind) {
      return interpolate(value, weak.wind, strong.wind, weak.pressure, strong.pressure);
    }
  }
  return value >= 70 ? typhoonRanges.pressureMin : typhoonRanges.pressureMax;
}

function setPressure(value) {
  const pressure = Math.round(clamp(value, typhoonRanges.pressureMin, typhoonRanges.pressureMax));
  state.pressure = pressure;
  pressureInput.value = String(pressure);
}

function setWind(value) {
  const wind = Math.round(clamp(value, typhoonRanges.windMin, typhoonRanges.windMax) * 10) / 10;
  state.wind = wind;
  windInput.value = wind.toFixed(1);
}

function resizeCanvasElement(targetCanvas, targetContext) {
  const bounds = targetCanvas.getBoundingClientRect();
  if (bounds.width <= 0 || bounds.height <= 0) {
    return;
  }

  const ratio = window.devicePixelRatio || 1;
  targetCanvas.width = Math.max(1, Math.floor(bounds.width * ratio));
  targetCanvas.height = Math.max(1, Math.floor(bounds.height * ratio));
  targetContext.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function resizeCanvas() {
  resizeCanvasElement(canvas, ctx);
  resizeCanvasElement(pressureCanvas, pressureCtx);
}

function setActiveDemo(demo) {
  activeDemo = demo;
  tabButtons.forEach((button) => {
    const isActive = button.dataset.demoTarget === demo;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  demoPages.forEach((page) => {
    const isActive = page.dataset.demo === demo;
    page.hidden = !isActive;
    page.classList.toggle("is-active", isActive);
  });

  requestAnimationFrame(resizeCanvas);
}

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveDemo(button.dataset.demoTarget);
  });
});

function pressureStrength() {
  return 1 - norm(state.pressure, typhoonRanges.pressureMin, typhoonRanges.pressureMax);
}

function windStrength() {
  return norm(state.wind, typhoonRanges.windMin, typhoonRanges.windMax);
}

function severity() {
  return clamp(pressureStrength() * 0.52 + windStrength() * 0.48, 0, 1);
}

function isExtremeDamage(level = severity()) {
  return level >= 0.94;
}

function typhoonGrade() {
  if (state.pressure <= 870 || state.wind > 70) {
    return "极端/历史极值";
  }
  if (state.pressure <= 920 || state.wind >= 51) {
    return "超强台风";
  }
  if (state.pressure <= 950 || state.wind >= 41.5) {
    return "强台风";
  }
  return "标准台风";
}

function updateReadouts() {
  const pressure = `${state.pressure} hPa`;
  const wind = `${state.wind.toFixed(1)} m/s`;
  const level = severity();
  const label = typhoonGrade();

  pressureOutput.value = pressure;
  windOutput.value = wind;
  pressureReadout.textContent = pressure;
  windReadout.textContent = wind;
  damageReadout.textContent = label;
  damageBar.style.width = `${Math.round(12 + level * 88)}%`;

  if (isExtremeDamage(level)) {
    conceptText.textContent =
      "中心气压降至极低，中心风力同步增强，强烈上升气流带来更密集降水，树木被吹离原位，房屋被吹倒。";
  } else if (level < 0.28) {
    conceptText.textContent =
      "中心气压接近常压，中心风力较弱，上升气流和降水都不明显，树木和房屋基本保持稳定。";
  } else if (level < 0.56) {
    conceptText.textContent =
      "中心气压降低，中心风力随之增强，空气向中心汇聚后上升，降水开始增多，树冠摇摆。";
  } else if (level < 0.78) {
    conceptText.textContent =
      "中心气压明显偏低，上升气流增强并促成更多降水，近地面风速较大，树木大幅弯曲，屋顶出现松动。";
  } else {
    conceptText.textContent =
      "中心气压很低，强烈上升气流带动空气快速汇聚旋转，降水密集，高风速使树木倒伏，房屋破坏显著。";
  }
}

function formationStrength() {
  return norm(pressureState.formation, 0, 100);
}

function formationLabel(level) {
  if (level < 0.26) {
    return "初生";
  }
  if (level < 0.56) {
    return "形成";
  }
  if (level < 0.82) {
    return "加强";
  }
  return "成熟";
}

function updatePressureReadouts() {
  const level = formationStrength();
  const isNorth = pressureState.hemisphere === "north";
  const direction = isNorth ? "北半球逆时针" : "南半球顺时针";

  formationOutput.value = formationLabel(level);
  rotationReadout.textContent = `气旋·${isNorth ? "北逆" : "南顺"}`;
  hemisphereLegend.textContent = `${direction}旋转`;
  horizontalReadout.textContent = `近地面由四周向中心旋转辐合，${direction}`;

  if (level < 0.26) {
    pressureConceptText.textContent =
      "局地空气开始受热上升，近地面气压略有下降，四周空气开始向中心补充。";
  } else if (level < 0.56) {
    pressureConceptText.textContent =
      "中心低压逐步形成，近地面空气由四周向中心旋转辐合，上升气流开始贯通。";
  } else if (level < 0.82) {
    pressureConceptText.textContent =
      "低气压加强，气旋环流更清晰，中心上升气流增强，水汽抬升后凝结成云雨。";
  } else {
    pressureConceptText.textContent =
      "成熟低压系统中，近地面强烈辐合并旋转，中心空气持续上升，常带来阴雨天气。";
  }
}

function onPressureInput() {
  setPressure(Number(pressureInput.value));
  setWind(windForPressure(state.pressure));
  updateReadouts();
}

function onWindInput() {
  setWind(Number(windInput.value));
  setPressure(pressureForWind(state.wind));
  updateReadouts();
}

function onFormationInput() {
  pressureState.formation = Number(formationInput.value);
  updatePressureReadouts();
}

pressureInput.addEventListener("input", onPressureInput);
windInput.addEventListener("input", onWindInput);
formationInput.addEventListener("input", onFormationInput);
window.addEventListener("resize", resizeCanvas);

hemisphereButtons.forEach((button) => {
  button.addEventListener("click", () => {
    pressureState.hemisphere = button.dataset.hemisphere;
    hemisphereButtons.forEach((item) => {
      const isActive = item === button;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-pressed", String(isActive));
    });
    updatePressureReadouts();
  });
});

function ensureParticles() {
  const target = Math.floor(80 + pressureStrength() * 150 + windStrength() * 35);
  while (state.particles.length < target) {
    state.particles.push({
      offset: Math.random() * Math.PI * 2,
      level: Math.random(),
      radius: 0.2 + Math.random() * 0.9,
      speed: 0.45 + Math.random() * 0.95,
      tint: Math.random(),
    });
  }
  if (state.particles.length > target) {
    state.particles.length = target;
  }

  const debrisTarget = Math.floor(5 + windStrength() * 26);
  while (state.debris.length < debrisTarget) {
    state.debris.push({
      x: Math.random(),
      y: Math.random(),
      phase: Math.random() * Math.PI * 2,
      size: 2 + Math.random() * 5,
      speed: 0.2 + Math.random() * 0.8,
    });
  }
  if (state.debris.length > debrisTarget) {
    state.debris.length = debrisTarget;
  }
}

function drawBackground(width, height, groundY, level, pLevel, wLevel) {
  const sky = ctx.createLinearGradient(0, 0, 0, groundY);
  sky.addColorStop(0, pLevel > 0.7 ? "#14272f" : "#1d323b");
  sky.addColorStop(0.55, pLevel > 0.7 ? "#1d3440" : "#263f48");
  sky.addColorStop(1, pLevel > 0.7 ? "#384a4f" : "#425453");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, groundY);

  const rainLevel = clamp(pLevel * 0.82 + level * 0.18, 0, 1);
  const rainAlpha = 0.08 + rainLevel * 0.38;
  ctx.strokeStyle = `rgba(203, 229, 232, ${rainAlpha})`;
  ctx.lineWidth = 1 + rainLevel * 1.25;
  const rainGap = 30 - rainLevel * 20;
  const rainSpeed = 34 + rainLevel * 72;
  for (let x = -60; x < width + 80; x += rainGap) {
    const lean = 10 + wLevel * 42;
    const offset = (state.time * rainSpeed) % rainGap;
    ctx.beginPath();
    ctx.moveTo(x + offset, 12);
    ctx.lineTo(x + lean + offset, groundY - 12);
    ctx.stroke();
  }

  if (rainLevel > 0.58) {
    ctx.strokeStyle = `rgba(238, 247, 244, ${(rainLevel - 0.58) * 0.52})`;
    ctx.lineWidth = 1.2;
    const burstGap = 44 - rainLevel * 18;
    for (let x = -80; x < width + 100; x += burstGap) {
      const offset = (state.time * (74 + rainLevel * 62)) % burstGap;
      const yTop = groundY * (0.12 + 0.12 * Math.sin(x));
      ctx.beginPath();
      ctx.moveTo(x + offset, yTop);
      ctx.lineTo(x + 24 + wLevel * 36 + offset, yTop + 74 + rainLevel * 80);
      ctx.stroke();
    }
  }

  const ground = ctx.createLinearGradient(0, groundY, 0, height);
  ground.addColorStop(0, "#87945f");
  ground.addColorStop(1, "#48533e");
  ctx.fillStyle = ground;
  ctx.fillRect(0, groundY, width, height - groundY);

  ctx.fillStyle = "rgba(7, 16, 19, 0.24)";
  ctx.fillRect(0, groundY + 10, width, 7);
}

function drawArrow(x, y, length, alpha, bend = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(bend);
  ctx.strokeStyle = `rgba(217, 250, 247, ${alpha})`;
  ctx.fillStyle = `rgba(217, 250, 247, ${alpha})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -length);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -length - 8);
  ctx.lineTo(-6, -length + 4);
  ctx.lineTo(6, -length + 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawVortex(centerX, groundY, width, height, pLevel, wLevel, level) {
  const columnHeight = height * (0.48 + pLevel * 0.24);
  const topY = groundY - columnHeight;
  const baseRadius = width * (0.085 + level * 0.04);
  const spin = state.time * (1.4 + wLevel * 5.5);

  const cloud = ctx.createRadialGradient(centerX, topY, 10, centerX, topY, width * 0.25);
  cloud.addColorStop(0, `rgba(238, 247, 244, ${0.24 + pLevel * 0.28})`);
  cloud.addColorStop(0.52, `rgba(83, 118, 129, ${0.34 + pLevel * 0.22})`);
  cloud.addColorStop(1, "rgba(20, 36, 42, 0)");
  ctx.fillStyle = cloud;
  ctx.beginPath();
  ctx.ellipse(centerX, topY + 8, width * (0.21 + level * 0.05), height * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  for (let ring = 0; ring < 9; ring += 1) {
    const t = ring / 8;
    const y = groundY - t * columnHeight;
    const radius = baseRadius * (1 - t * 0.48) + 10;
    const alpha = 0.1 + pLevel * 0.11 + t * 0.06;
    ctx.strokeStyle = `rgba(181, 237, 235, ${alpha})`;
    ctx.lineWidth = 1.5 + level * 2.5;
    ctx.beginPath();
    ctx.ellipse(
      centerX + Math.sin(spin + t * 4) * (8 + level * 16),
      y,
      radius,
      radius * 0.28,
      Math.sin(spin + t) * 0.25,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
  }

  const core = ctx.createLinearGradient(centerX, groundY, centerX, topY);
  core.addColorStop(0, `rgba(79, 210, 194, ${0.08 + pLevel * 0.2})`);
  core.addColorStop(0.5, `rgba(226, 247, 244, ${0.06 + pLevel * 0.16})`);
  core.addColorStop(1, "rgba(226, 247, 244, 0)");
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.moveTo(centerX - baseRadius * 0.7, groundY);
  ctx.bezierCurveTo(centerX - baseRadius, groundY - columnHeight * 0.3, centerX - baseRadius * 0.45, topY, centerX, topY);
  ctx.bezierCurveTo(centerX + baseRadius * 0.45, topY, centerX + baseRadius, groundY - columnHeight * 0.3, centerX + baseRadius * 0.7, groundY);
  ctx.closePath();
  ctx.fill();

  state.particles.forEach((particle) => {
    const yProgress = (particle.level + state.time * 0.08 * (1 + pLevel * 1.8) * particle.speed) % 1;
    const y = groundY - yProgress * columnHeight;
    const taper = 1 - yProgress * 0.55;
    const swirlRadius = baseRadius * taper * (0.35 + particle.radius);
    const angle = particle.offset + spin * (0.5 + particle.speed) + yProgress * 7;
    const x = centerX + Math.cos(angle) * swirlRadius;
    const particleAlpha = 0.24 + pLevel * 0.42;

    ctx.fillStyle =
      particle.tint > 0.5
        ? `rgba(238, 247, 244, ${particleAlpha})`
        : `rgba(79, 210, 194, ${particleAlpha})`;
    ctx.beginPath();
    ctx.arc(x, y, 1.2 + level * 2.6 * (1 - yProgress * 0.3), 0, Math.PI * 2);
    ctx.fill();
  });

  const arrowCount = 4 + Math.floor(pLevel * 4);
  for (let i = 0; i < arrowCount; i += 1) {
    const offset = (i - (arrowCount - 1) / 2) * (baseRadius * 0.45);
    drawArrow(centerX + offset, groundY - 20 - i * 4, 55 + pLevel * 70, 0.3 + pLevel * 0.45, Math.sin(spin + i) * 0.08);
  }

  ctx.fillStyle = `rgba(7, 16, 19, ${0.25 + level * 0.18})`;
  ctx.beginPath();
  ctx.ellipse(centerX, groundY + 7, baseRadius * 1.5, 11 + level * 11, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawHouse(x, groundY, scale, level, windLevel, collapsed = false) {
  const shake = Math.sin(state.time * (7 + windLevel * 7)) * windLevel * 4;
  const roofShift = windLevel * 8 + shake;

  ctx.save();
  ctx.translate(x + shake, groundY);
  ctx.scale(scale, scale);

  ctx.fillStyle = "rgba(7, 16, 19, 0.28)";
  ctx.beginPath();
  ctx.ellipse(58, 7, 82, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  if (collapsed) {
    ctx.save();
    ctx.translate(30, -3);
    ctx.rotate(-0.96 - windLevel * 0.12);

    ctx.fillStyle = "#d8c59b";
    ctx.strokeStyle = "#5d4630";
    ctx.lineWidth = 3;
    ctx.fillRect(-8, -74, 112, 74);
    ctx.strokeRect(-8, -74, 112, 74);

    ctx.fillStyle = "#35606a";
    ctx.fillRect(9, -52, 26, 24);
    ctx.fillRect(66, -52, 26, 24);
    ctx.fillStyle = "#5d4630";
    ctx.fillRect(40, -39, 20, 39);

    ctx.strokeStyle = "#463625";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(8, -66);
    ctx.lineTo(24, -48);
    ctx.lineTo(14, -30);
    ctx.moveTo(74, -69);
    ctx.lineTo(92, -50);
    ctx.lineTo(78, -35);
    ctx.stroke();

    ctx.save();
    ctx.translate(-28, -88);
    ctx.rotate(-0.28 - windLevel * 0.16);
    ctx.fillStyle = "#9d4f39";
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(56, -50);
    ctx.lineTo(124, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = "#8f3e2b";
    ctx.rotate(0.5);
    ctx.fillRect(96, -108, 48, 12);
    ctx.restore();
    ctx.restore();
    return;
  }

  ctx.fillStyle = "#d8c59b";
  ctx.strokeStyle = "#5d4630";
  ctx.lineWidth = 3;
  ctx.fillRect(0, -74, 112, 74);
  ctx.strokeRect(0, -74, 112, 74);

  ctx.fillStyle = "#9d4f39";
  ctx.beginPath();
  ctx.moveTo(-12 + roofShift, -72);
  ctx.lineTo(56 + roofShift * 0.4, -122 - windLevel * 10);
  ctx.lineTo(124 + roofShift, -72);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#35606a";
  ctx.fillRect(15, -52, 26, 24);
  ctx.fillRect(72, -52, 26, 24);
  ctx.fillStyle = "#5d4630";
  ctx.fillRect(46, -39, 20, 39);

  if (level > 0.48) {
    ctx.strokeStyle = "#463625";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(22, -66);
    ctx.lineTo(34, -52);
    ctx.lineTo(28, -36);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(82, -69);
    ctx.lineTo(92, -55);
    ctx.lineTo(88, -41);
    ctx.stroke();
  }

  if (level > 0.72) {
    ctx.fillStyle = "#8f3e2b";
    ctx.save();
    ctx.rotate(-0.14 - windLevel * 0.12);
    ctx.fillRect(96, -120, 44, 12);
    ctx.restore();
  }

  ctx.restore();
}

function drawBlownAwayTree(x, groundY, scale, level, windLevel, flip = 1, phase = 0) {
  const lift = 78 + windLevel * 45 + Math.sin(state.time * 3 + phase) * 8;
  const drift = -44 * windLevel + Math.sin(state.time * 2.4 + phase) * 6;
  const rotation = -flip * (1.12 + windLevel * 0.34) + Math.sin(state.time * 4 + phase) * 0.1;

  ctx.save();
  ctx.translate(x + drift, groundY - lift);
  ctx.scale(scale, scale);

  ctx.strokeStyle = `rgba(238, 247, 244, ${0.28 + level * 0.22})`;
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i += 1) {
    const y = 18 + i * 14;
    ctx.beginPath();
    ctx.moveTo(flip * (52 + i * 12), y);
    ctx.lineTo(flip * (108 + i * 18), y - 8);
    ctx.stroke();
  }

  ctx.rotate(rotation);

  ctx.strokeStyle = "#61482f";
  ctx.lineWidth = 12;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-flip * 8, -42, -flip * 18, -86);
  ctx.stroke();

  ctx.fillStyle = "#4a3627";
  ctx.beginPath();
  ctx.ellipse(1, 8, 18, 11, 0.28 * flip, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#5a3e2a";
  ctx.lineWidth = 3;
  for (let i = 0; i < 5; i += 1) {
    const angle = -0.75 + i * 0.34;
    ctx.beginPath();
    ctx.moveTo(2, 8);
    ctx.lineTo(Math.cos(angle) * 30, 8 + Math.sin(angle) * 18);
    ctx.stroke();
  }

  const leafAlpha = 0.72 - level * 0.12;
  ctx.fillStyle = `rgba(60, 122, 72, ${leafAlpha})`;
  ctx.beginPath();
  ctx.ellipse(-flip * 26, -100, 38, 27, -0.35 * flip, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(flip * 8, -116, 33, 24, 0.2 * flip, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(flip * 20, -86, 35, 25, 0.35 * flip, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawTree(x, groundY, scale, level, windLevel, flip = 1) {
  const bend = flip * (0.12 + windLevel * 0.62);
  const sway = Math.sin(state.time * (5 + windLevel * 6) + x) * windLevel * 0.08;

  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(scale, scale);
  ctx.rotate(bend + sway);

  ctx.strokeStyle = "#61482f";
  ctx.lineWidth = 12;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-flip * 8, -42, -flip * 18, -86);
  ctx.stroke();

  const leafAlpha = 0.82 - level * 0.18;
  ctx.fillStyle = `rgba(60, 122, 72, ${leafAlpha})`;
  ctx.beginPath();
  ctx.ellipse(-flip * 26, -100, 38, 27, -0.35 * flip, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(flip * 8, -116, 33, 24, 0.2 * flip, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(flip * 20, -86, 35, 25, 0.35 * flip, 0, Math.PI * 2);
  ctx.fill();

  if (level > 0.8) {
    ctx.strokeStyle = "#61482f";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-flip * 10, -53);
    ctx.lineTo(-flip * 54, -34);
    ctx.stroke();
  }

  ctx.restore();
}

function drawDebris(width, groundY, level, windLevel) {
  ctx.strokeStyle = `rgba(236, 205, 130, ${0.25 + windLevel * 0.45})`;
  ctx.lineWidth = 2;
  state.debris.forEach((debris) => {
    const travel = (debris.x + state.time * 0.035 * debris.speed * (1 + windLevel * 3)) % 1;
    const x = width - travel * width * 1.15;
    const y = groundY - 26 - debris.y * (92 + level * 95) + Math.sin(state.time * 7 + debris.phase) * 8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + debris.size * (2 + windLevel * 3), y - debris.size);
    ctx.stroke();
  });
}

function drawLabels(width, groundY, pLevel, wLevel, level) {
  ctx.font = width < 680 ? "700 14px Microsoft YaHei, sans-serif" : "700 17px Microsoft YaHei, sans-serif";
  ctx.fillStyle = "rgba(238, 247, 244, 0.88)";
  ctx.fillText("中心低压", width * 0.51, groundY - 268 - pLevel * 80);
  ctx.fillText("上升气流", width * 0.54, groundY - 192 - pLevel * 70);
  ctx.fillText("近地面强风", width * 0.65, groundY - 42);

  ctx.strokeStyle = "rgba(242, 193, 78, 0.75)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width * 0.63, groundY - 48);
  ctx.lineTo(width * 0.78, groundY - 48);
  ctx.lineTo(width * 0.75, groundY - 57);
  ctx.moveTo(width * 0.78, groundY - 48);
  ctx.lineTo(width * 0.75, groundY - 39);
  ctx.stroke();

  if (isExtremeDamage(level)) {
    ctx.fillStyle = "rgba(231, 111, 81, 0.94)";
    ctx.fillText("树被吹走", width * 0.16, groundY - 172);
    ctx.fillText("房屋吹倒", width * 0.74, groundY - 132);
  } else if (wLevel > 0.65) {
    ctx.fillStyle = "rgba(231, 111, 81, 0.9)";
    ctx.fillText("破坏增强", width * 0.15, groundY - 148);
  }
}

function renderTyphoon(delta) {
  state.time += delta / 1000;
  ensureParticles();

  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (width <= 0 || height <= 0) {
    return;
  }

  const groundY = height * 0.76;
  const pLevel = pressureStrength();
  const wLevel = windStrength();
  const level = severity();
  const extremeDamage = isExtremeDamage(level);
  const leftScale = Math.max(0.56, Math.min(0.9, width / 1360));
  const treeScale = Math.max(0.54, Math.min(0.86, width / 1350));
  const rightScale = Math.max(0.5, Math.min(0.78, width / 1620));

  ctx.clearRect(0, 0, width, height);
  drawBackground(width, height, groundY, level, pLevel, wLevel);
  drawDebris(width, groundY, level, wLevel);

  drawHouse(width * 0.12, groundY - 2, leftScale, level, wLevel, extremeDamage);
  if (extremeDamage) {
    drawBlownAwayTree(width * 0.18, groundY - 2, treeScale, level, wLevel, 1, 0.2);
    drawBlownAwayTree(width * 0.31, groundY - 2, treeScale * 0.88, level, wLevel, 1, 1.4);
  } else {
    drawTree(width * 0.07, groundY - 2, treeScale, level, wLevel, 1);
    drawTree(width * 0.25, groundY - 2, treeScale * 0.92, level, wLevel, 1);
  }

  drawVortex(width * 0.53, groundY, width, height, pLevel, wLevel, level);

  if (extremeDamage) {
    drawBlownAwayTree(width * 0.76, groundY - 1, treeScale * 0.82, level, wLevel, -1, 2.2);
  } else {
    drawTree(width * 0.75, groundY - 1, treeScale * 0.88, level, wLevel, -1);
  }
  drawHouse(Math.min(width * 0.8, width - 112 * rightScale - 10), groundY - 2, rightScale, level * 0.9, wLevel, extremeDamage);
  drawLabels(width, groundY, pLevel, wLevel, level);
}

function ensurePressureParticles() {
  const level = formationStrength();
  const target = Math.floor(80 + level * 150);
  while (pressureState.parcels.length < target) {
    pressureState.parcels.push({
      angle: Math.random() * Math.PI * 2,
      phase: Math.random(),
      radius: 0.55 + Math.random() * 0.45,
      speed: 0.5 + Math.random() * 0.9,
      tint: Math.random(),
    });
  }
  if (pressureState.parcels.length > target) {
    pressureState.parcels.length = target;
  }

  const rainTarget = Math.floor(level > 0.42 ? 18 + level * 44 : 0);
  while (pressureState.droplets.length < rainTarget) {
    pressureState.droplets.push({
      x: Math.random(),
      y: Math.random(),
      speed: 0.45 + Math.random(),
      length: 8 + Math.random() * 10,
    });
  }
  if (pressureState.droplets.length > rainTarget) {
    pressureState.droplets.length = rainTarget;
  }
}

function drawPressureBackground(width, height, surfaceY, level) {
  const sky = pressureCtx.createLinearGradient(0, 0, 0, surfaceY);
  sky.addColorStop(0, "#263b48");
  sky.addColorStop(0.5, "#405660");
  sky.addColorStop(1, "#6f7a72");
  pressureCtx.fillStyle = sky;
  pressureCtx.fillRect(0, 0, width, surfaceY);

  const ground = pressureCtx.createLinearGradient(0, surfaceY, 0, height);
  ground.addColorStop(0, "#8c8b5f");
  ground.addColorStop(1, "#506040");
  pressureCtx.fillStyle = ground;
  pressureCtx.fillRect(0, surfaceY, width, height - surfaceY);

  pressureCtx.fillStyle = `rgba(242, 193, 78, ${0.08 + level * 0.1})`;
  pressureCtx.beginPath();
  pressureCtx.ellipse(width * 0.5, surfaceY + height * 0.07, width * 0.34, height * 0.08, 0, 0, Math.PI * 2);
  pressureCtx.fill();
}

function drawPressureArrow(startX, startY, controlX, controlY, endX, endY, color, width = 3) {
  pressureCtx.strokeStyle = color;
  pressureCtx.fillStyle = color;
  pressureCtx.lineWidth = width;
  pressureCtx.lineCap = "round";
  pressureCtx.beginPath();
  pressureCtx.moveTo(startX, startY);
  pressureCtx.quadraticCurveTo(controlX, controlY, endX, endY);
  pressureCtx.stroke();

  const angle = Math.atan2(endY - controlY, endX - controlX);
  const size = 8 + width;
  pressureCtx.beginPath();
  pressureCtx.moveTo(endX, endY);
  pressureCtx.lineTo(endX - Math.cos(angle - 0.55) * size, endY - Math.sin(angle - 0.55) * size);
  pressureCtx.lineTo(endX - Math.cos(angle + 0.55) * size, endY - Math.sin(angle + 0.55) * size);
  pressureCtx.closePath();
  pressureCtx.fill();
}

function drawPressureCloud(centerX, topY, width, height, level) {
  const alpha = 0.28 + level * 0.48;
  pressureCtx.fillStyle = `rgba(230, 236, 226, ${alpha})`;
  const cloudParts = [
    [-0.12, 0.02, 0.09, 0.04],
    [-0.04, -0.02, 0.11, 0.055],
    [0.07, 0.01, 0.1, 0.045],
    [0.15, 0.03, 0.075, 0.035],
  ];
  cloudParts.forEach(([x, y, rx, ry]) => {
    pressureCtx.beginPath();
    pressureCtx.ellipse(centerX + width * x, topY + height * y, width * rx, height * ry, 0, 0, Math.PI * 2);
    pressureCtx.fill();
  });

  pressureCtx.strokeStyle = `rgba(203, 229, 232, ${0.18 + level * 0.45})`;
  pressureCtx.lineWidth = 2;
  pressureState.droplets.forEach((drop) => {
    const x = centerX - width * 0.23 + drop.x * width * 0.46;
    const y = topY + height * 0.06 + ((drop.y + pressureState.time * 0.28 * drop.speed) % 1) * height * 0.22;
    pressureCtx.beginPath();
    pressureCtx.moveTo(x, y);
    pressureCtx.lineTo(x + 4, y + drop.length);
    pressureCtx.stroke();
  });
}

function drawPressureVerticalArrow(x, y, length, alpha, size) {
  pressureCtx.strokeStyle = `rgba(238, 247, 244, ${alpha})`;
  pressureCtx.fillStyle = `rgba(238, 247, 244, ${alpha})`;
  pressureCtx.lineWidth = size;
  pressureCtx.lineCap = "round";
  pressureCtx.beginPath();
  pressureCtx.moveTo(x, y);
  pressureCtx.lineTo(x, y - length);
  pressureCtx.stroke();
  pressureCtx.beginPath();
  pressureCtx.moveTo(x, y - length - 11);
  pressureCtx.lineTo(x - 9, y - length + 5);
  pressureCtx.lineTo(x + 9, y - length + 5);
  pressureCtx.closePath();
  pressureCtx.fill();
}

function drawLowPressureSystem(width, height, level) {
  const centerX = width * 0.5;
  const surfaceY = height * 0.68;
  const topY = height * (0.18 - level * 0.03);
  const outerRadius = Math.min(width * 0.34, height * 0.3);
  const innerRadius = Math.max(28, outerRadius * 0.17);
  const ellipseScale = width < 620 ? 0.46 : 0.56;
  const spinDirection = pressureState.hemisphere === "north" ? -1 : 1;
  const spin = pressureState.time * (0.8 + level * 2.2) * spinDirection;

  drawPressureBackground(width, height, surfaceY, level);

  pressureCtx.save();
  pressureCtx.translate(centerX, surfaceY);
  pressureCtx.scale(1, ellipseScale);

  for (let ring = 4; ring >= 1; ring -= 1) {
    const radius = innerRadius + (outerRadius - innerRadius) * (ring / 4);
    pressureCtx.strokeStyle = `rgba(238, 247, 244, ${0.1 + level * 0.14})`;
    pressureCtx.lineWidth = 1.5;
    pressureCtx.beginPath();
    pressureCtx.arc(0, 0, radius, 0, Math.PI * 2);
    pressureCtx.stroke();
  }

  pressureCtx.restore();

  const arrowCount = width < 620 ? 5 : 7;
  for (let i = 0; i < arrowCount; i += 1) {
    const baseAngle = (i / arrowCount) * Math.PI * 2 + spin * 0.16;
    const startAngle = baseAngle;
    const endAngle = baseAngle + spinDirection * (0.78 + level * 0.38);
    const startX = centerX + Math.cos(startAngle) * outerRadius;
    const startY = surfaceY + Math.sin(startAngle) * outerRadius * ellipseScale;
    const controlX = centerX + Math.cos(baseAngle + spinDirection * 0.45) * outerRadius * 0.58;
    const controlY = surfaceY + Math.sin(baseAngle + spinDirection * 0.45) * outerRadius * ellipseScale * 0.58;
    const endX = centerX + Math.cos(endAngle) * innerRadius * 1.25;
    const endY = surfaceY + Math.sin(endAngle) * innerRadius * ellipseScale * 1.25;
    drawPressureArrow(startX, startY, controlX, controlY, endX, endY, `rgba(79, 210, 194, ${0.24 + level * 0.5})`, 2 + level * 2);
  }

  pressureState.parcels.forEach((parcel) => {
    const progress = (parcel.phase + pressureState.time * 0.035 * parcel.speed * (0.7 + level * 2.2)) % 1;
    const radius = outerRadius * parcel.radius * (1 - progress * 0.84) + innerRadius * 0.35;
    const angle = parcel.angle + spin + spinDirection * progress * (2.4 + level * 1.6);
    const x = centerX + Math.cos(angle) * radius;
    const y = surfaceY + Math.sin(angle) * radius * ellipseScale;
    const alpha = 0.2 + level * 0.48;
    pressureCtx.fillStyle =
      parcel.tint > 0.52 ? `rgba(242, 193, 78, ${alpha})` : `rgba(238, 247, 244, ${alpha})`;
    pressureCtx.beginPath();
    pressureCtx.arc(x, y, 1.5 + level * 2.2 * (1 - progress * 0.3), 0, Math.PI * 2);
    pressureCtx.fill();
  });

  const coreGradient = pressureCtx.createRadialGradient(centerX, surfaceY, 4, centerX, surfaceY, outerRadius * 0.4);
  coreGradient.addColorStop(0, `rgba(231, 111, 81, ${0.38 + level * 0.38})`);
  coreGradient.addColorStop(0.45, `rgba(242, 193, 78, ${0.15 + level * 0.24})`);
  coreGradient.addColorStop(1, "rgba(242, 193, 78, 0)");
  pressureCtx.fillStyle = coreGradient;
  pressureCtx.beginPath();
  pressureCtx.ellipse(centerX, surfaceY, outerRadius * 0.36, outerRadius * ellipseScale * 0.36, 0, 0, Math.PI * 2);
  pressureCtx.fill();

  const column = pressureCtx.createLinearGradient(centerX, surfaceY, centerX, topY);
  column.addColorStop(0, `rgba(79, 210, 194, ${0.12 + level * 0.28})`);
  column.addColorStop(0.52, `rgba(238, 247, 244, ${0.08 + level * 0.22})`);
  column.addColorStop(1, "rgba(238, 247, 244, 0)");
  pressureCtx.fillStyle = column;
  pressureCtx.beginPath();
  pressureCtx.moveTo(centerX - outerRadius * 0.18, surfaceY);
  pressureCtx.bezierCurveTo(centerX - outerRadius * 0.3, height * 0.45, centerX - outerRadius * 0.16, height * 0.25, centerX, topY);
  pressureCtx.bezierCurveTo(centerX + outerRadius * 0.16, height * 0.25, centerX + outerRadius * 0.3, height * 0.45, centerX + outerRadius * 0.18, surfaceY);
  pressureCtx.closePath();
  pressureCtx.fill();

  const updraftCount = 3 + Math.floor(level * 4);
  for (let i = 0; i < updraftCount; i += 1) {
    const offset = (i - (updraftCount - 1) / 2) * Math.max(16, outerRadius * 0.08);
    const wobble = Math.sin(pressureState.time * 2.8 + i) * outerRadius * 0.02;
    drawPressureVerticalArrow(centerX + offset + wobble, surfaceY - 18 - i * 4, height * (0.22 + level * 0.24), 0.3 + level * 0.52, 2 + level * 1.8);
  }

  drawPressureCloud(centerX, topY + height * 0.02, width, height, level);

  pressureCtx.fillStyle = "rgba(7, 16, 19, 0.42)";
  pressureCtx.beginPath();
  pressureCtx.ellipse(centerX, surfaceY + 6, innerRadius * 1.35, innerRadius * 0.58, 0, 0, Math.PI * 2);
  pressureCtx.fill();

  pressureCtx.fillStyle = "#f8e7c4";
  pressureCtx.font = width < 620 ? "800 30px Microsoft YaHei, sans-serif" : "800 42px Microsoft YaHei, sans-serif";
  pressureCtx.textAlign = "center";
  pressureCtx.textBaseline = "middle";
  pressureCtx.fillText("低", centerX, surfaceY + 1);
  pressureCtx.textAlign = "start";
  pressureCtx.textBaseline = "alphabetic";

  const labelFont = width < 620 ? "700 13px Microsoft YaHei, sans-serif" : "700 17px Microsoft YaHei, sans-serif";
  pressureCtx.font = labelFont;
  pressureCtx.fillStyle = "rgba(238, 247, 244, 0.92)";
  pressureCtx.fillText("阴雨云系", centerX - outerRadius * 0.42, topY + height * 0.09);
  pressureCtx.fillText("中心上升气流", centerX + outerRadius * 0.18, height * 0.4);
  pressureCtx.fillText("低气压中心", centerX + innerRadius * 1.4, surfaceY + height * 0.02);
  pressureCtx.fillText("近地面辐合", width * 0.1, surfaceY + height * 0.03);

  pressureCtx.strokeStyle = "rgba(242, 193, 78, 0.78)";
  pressureCtx.lineWidth = 2;
  pressureCtx.beginPath();
  pressureCtx.moveTo(width * 0.1, surfaceY + height * 0.045);
  pressureCtx.lineTo(centerX - outerRadius * 0.45, surfaceY + height * 0.015);
  pressureCtx.stroke();
}

function renderPressure(delta) {
  pressureState.time += delta / 1000;
  ensurePressureParticles();

  const width = pressureCanvas.clientWidth;
  const height = pressureCanvas.clientHeight;
  if (width <= 0 || height <= 0) {
    return;
  }

  pressureCtx.clearRect(0, 0, width, height);
  drawLowPressureSystem(width, height, formationStrength());
}

resizeCanvas();
updateReadouts();
updatePressureReadouts();

let lastTyphoonFrame = performance.now();
let lastPressureFrame = performance.now();

function animateTyphoon(now) {
  renderTyphoon(now - lastTyphoonFrame);
  lastTyphoonFrame = now;
  requestAnimationFrame(animateTyphoon);
}

function animatePressure(now) {
  renderPressure(now - lastPressureFrame);
  lastPressureFrame = now;
  requestAnimationFrame(animatePressure);
}

requestAnimationFrame(animateTyphoon);
requestAnimationFrame(animatePressure);
