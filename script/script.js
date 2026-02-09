/* =========================
   Kids Quiz — Teacher Mode
   Picture → "What is this?" → Answer (big) → next
   Shows ALL pictures
   ========================= */

/* ====== DATA (твои вопросы) ====== */
const QUESTIONS_ALL = [
  { img: "images/ant.png", answer: "Ant" },
  { img: "images/apple.png", answer: "Apple" },
  { img: "images/ball.png", answer: "Ball" },
  { img: "images/bee.png", answer: "Bee" },
  { img: "images/bird.png", answer: "Bird" },
  { img: "images/boy.png", answer: "Boy" },
  { img: "images/car.png", answer: "Car" },
  { img: "images/cat.png", answer: "Cat" },
  { img: "images/crocodile.png", answer: "Crocodile" },
  { img: "images/dog.png", answer: "Dog" },
  { img: "images/duck.png", answer: "Duck" },
  { img: "images/ears.png", answer: "Ears" },
  { img: "images/egg.png", answer: "Egg" },
  { img: "images/elephant.png", answer: "Elephant" },
  { img: "images/eyes.png", answer: "Eyes" },
  { img: "images/flower.png", answer: "Flower" },
  { img: "images/frog.png", answer: "Frog" },
  { img: "images/girl.png", answer: "Girl" },
  { img: "images/goat.png", answer: "Goat" },
  { img: "images/guitar.png", answer: "Guitar" },
  { img: "images/hand.png", answer: "Hand" },
  { img: "images/house.png", answer: "House" },
  { img: "images/helicopter.png", answer: "Helicopter" },
  { img: "images/horse.png", answer: "Horse" },
  { img: "images/jellyfish.png", answer: "Jellyfish" },
  { img: "images/kangaroo.png", answer: "Kangaroo" },
  { img: "images/key.png", answer: "Key" },
  { img: "images/lion.png", answer: "Lion" },
  { img: "images/lollipop.png", answer: "Lollipop" },
  { img: "images/nose.png", answer: "Nose" },
  { img: "images/panda.png", answer: "Panda" },
  { img: "images/pineapple.png", answer: "Pineapple" },
  { img: "images/plane.png", answer: "Plane" },
];

/* ====== CONFIG ====== */
const STORAGE_KEY = "kids_quiz_teacher_mode_v2";
const ANSWER_SHOW_MS = 2000; // сколько показывать ответ перед следующей картинкой

/* ====== HELPERS ====== */
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/* ====== STORAGE ====== */
function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}

/* ====== DOM ====== */
const stageInfo = document.getElementById("stageInfo");
const qInfo = document.getElementById("qInfo");
const scoreInfo = document.getElementById("scoreInfo");

const page1 = document.getElementById("page1");
const page2 = document.getElementById("page2");
const pageGame = document.getElementById("pageGame");

const btnNextPage = document.getElementById("btnNextPage");
const btnStartOver = document.getElementById("btnStartOver");

const timeSelect = document.getElementById("timeSelect");

const timeInfo = document.getElementById("timeInfo");
const timeBar = document.getElementById("timeBar");

const qImg = document.getElementById("qImg");
const qText = document.getElementById("qText");

const resultModal = document.getElementById("resultModal");
const modalBody = document.getElementById("modalBody");
const modalClose = document.getElementById("modalClose");
const modalStartOver = document.getElementById("modalStartOver");

/* ====== APP STATE ====== */
let app = {
  stage: 1, // 1 page, 2 rules, 3 game
  settings: { timeLimitMs: 5000 },
  game: {
    idx: 0,
    questions: [], // shuffled QUESTIONS_ALL
    active: false,
  },
};

let timerId = null;
let startTs = 0;

/* ====== TIMER UI ====== */
function stopTimer() {
  if (timerId) clearInterval(timerId);
  timerId = null;
}
function setBar(p) {
  timeBar.style.transform = `scaleX(${clamp(p, 0, 1)})`;
}
function setTimeLabel(ms) {
  timeInfo.textContent = `${(ms / 1000).toFixed(1)}s`;
}

/* ====== META ====== */
function renderMeta() {
  const total = app.game.questions.length || 0;
  const current = app.stage === 3 && total ? app.game.idx + 1 : 0;

  stageInfo.textContent =
    app.stage === 1
      ? "Stage: First page"
      : app.stage === 2
        ? "Stage: Rules"
        : "Stage: Game";

  qInfo.textContent = `Picture ${current} / ${total}`;
  scoreInfo.textContent = `Shown: ${app.stage === 3 ? app.game.idx : 0}`;
}

/* ====== STAGES ====== */
function showStage(stage) {
  app.stage = stage;

  page1.classList.toggle("active", stage === 1);
  page2.classList.toggle("active", stage === 2);
  pageGame.classList.toggle("active", stage === 3);

  // Next нельзя в игре
  btnNextPage.disabled = stage === 3;

  renderMeta();
  saveState(app);
}

/* ====== IMAGE ANIMATION ====== */
function resetImageAnimation() {
  // если у тебя есть .img-animate — будет красиво.
  // если нет — все равно покажется, потому что ниже выставим opacity=1 при onload.
  qImg.classList.remove("img-animate");
  qImg.style.opacity = "0";
  qImg.style.transform = "translateY(22px) scale(.92)";
}
function playImageAnimation() {
  void qImg.offsetWidth;
  qImg.classList.add("img-animate");
}

/* ====== GAME LOGIC ====== */
function buildGame() {
  app.game.questions = shuffle(QUESTIONS_ALL);
  app.game.idx = 0;
  app.game.active = true;
  saveState(app);
}

function showQuestion() {
  const q = app.game.questions[app.game.idx];
  if (!q) {
    finishGame();
    return;
  }

  stopTimer();
  resetImageAnimation();

  // текст вопроса
  qText.textContent = "What is this?";
  qText.classList.remove("answer");

  // ВАЖНО: onload ДО src
  qImg.onload = () => {
    // гарантированно показываем даже если анимации нет
    qImg.style.opacity = "1";
    qImg.style.transform = "translateY(0) scale(1)";
    playImageAnimation();
  };

  qImg.onerror = () => {
    console.error("Image not found:", q.img);
  };

  qImg.src = q.img;

  renderMeta();
  startTimer();
}

function startTimer() {
  stopTimer();
  const T = app.settings.timeLimitMs;

  startTs = Date.now();
  setTimeLabel(T);
  setBar(1);

  timerId = setInterval(() => {
    const elapsed = Date.now() - startTs;
    const left = T - elapsed;

    setTimeLabel(Math.max(0, left));
    setBar(1 - elapsed / T);

    if (left <= 0) {
      stopTimer();
      showAnswer();
    }
  }, 50);
}

function showAnswer() {
  const q = app.game.questions[app.game.idx];
  if (!q) return;

  // показываем ответ крупно вместо вопроса
  qText.textContent = q.answer;
  qText.classList.add("answer");

  setTimeout(nextQuestion, ANSWER_SHOW_MS);
}

function nextQuestion() {
  app.game.idx += 1;
  saveState(app);

  if (app.game.idx >= app.game.questions.length) {
    finishGame();
    return;
  }
  showQuestion();
}

function finishGame() {
  stopTimer();
  app.game.active = false;
  saveState(app);

  modalBody.innerHTML = `<b>Finished!</b><br>All pictures are shown 🎉`;
  resultModal.classList.add("show");
}

/* ====== EVENTS ====== */
btnNextPage.addEventListener("click", () => {
  if (app.stage === 1) {
    showStage(2);
    return;
  }

  if (app.stage === 2) {
    app.settings.timeLimitMs = parseInt(timeSelect.value, 10);
    saveState(app);

    buildGame();
    showStage(3);
    showQuestion();
  }
});

timeSelect.addEventListener("change", () => {
  app.settings.timeLimitMs = parseInt(timeSelect.value, 10);
  saveState(app);
  setTimeLabel(app.settings.timeLimitMs);
  setBar(1);
});

btnStartOver.addEventListener("click", () => {
  clearState();
  location.reload();
});

modalClose.addEventListener("click", () => {
  resultModal.classList.remove("show");
});

modalStartOver.addEventListener("click", () => {
  clearState();
  location.reload();
});

/* ====== INIT ====== */
(function init() {
  const saved = loadState();
  if (saved) {
    app = saved;

    if (app.settings?.timeLimitMs) {
      timeSelect.value = String(app.settings.timeLimitMs);
      setTimeLabel(app.settings.timeLimitMs);
      setBar(1);
    }

    showStage(app.stage || 1);

    // если были в игре — продолжаем
    if (app.stage === 3 && app.game?.questions?.length) {
      showQuestion();
    }
  } else {
    saveState(app);
    showStage(1);
    setTimeLabel(app.settings.timeLimitMs);
    setBar(1);
  }
})();
