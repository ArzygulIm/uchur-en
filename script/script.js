// ====== НАСТРОЙКИ ======
const TIME_LIMIT_MS = 5000; // 5 секунд

// ====== ВОПРОСЫ (МЕНЯЙТЕ ТУТ) ======
// correctIndex — индекс правильного варианта (0..3)
const QUESTIONS = [
  {
    text: "What is this?",
    img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=60",
    options: ["Apple", "Banana", "Orange", "Grapes"],
    correctIndex: 0,
  },
  {
    text: "Choose the correct word:",
    img: "https://images.unsplash.com/photo-1560807707-8cc77767d783?auto=format&fit=crop&w=1200&q=60",
    options: ["Car", "House", "Dog", "Book"],
    correctIndex: 2,
  },
  {
    text: "What animal is it?",
    img: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=1200&q=60",
    options: ["Cat", "Cow", "Tiger", "Horse"],
    correctIndex: 0,
  },
];

// ====== СТЕЙТ ======
let idx = 0;
let score = 0;
let started = false;
let locked = false;

let timerId = null;
let startTs = 0; // timestamp начала вопроса

// ====== DOM ======
const qInfo = document.getElementById("qInfo");
const scoreInfo = document.getElementById("scoreInfo");
const timeInfo = document.getElementById("timeInfo");
const timeBar = document.getElementById("timeBar");

const qImg = document.getElementById("qImg");
const qText = document.getElementById("qText");
const optionsEl = document.getElementById("options");

const btnStart = document.getElementById("btnStart");
const btnNext = document.getElementById("btnNext");
const btnReset = document.getElementById("btnReset");
const resultBox = document.getElementById("resultBox");

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function stopTimer() {
  if (timerId) clearInterval(timerId);
  timerId = null;
}

function renderMeta() {
  qInfo.textContent = `Вопрос ${Math.min(idx + 1, QUESTIONS.length)} / ${QUESTIONS.length}`;
  scoreInfo.textContent = `Баллы: ${score}`;
}

function setBar(progress01) {
  const p = clamp(progress01, 0, 1);
  timeBar.style.transform = `scaleX(${p})`;
}

function setTimeLabel(msLeft) {
  timeInfo.textContent = `${(msLeft / 1000).toFixed(1)}s`;
}

function lockOptions(value) {
  locked = value;
  const btns = optionsEl.querySelectorAll("button");
  btns.forEach((b) => (b.disabled = value));
}

function showQuestion() {
  resultBox.style.display = "none";
  btnNext.disabled = true;

  renderMeta();

  const q = QUESTIONS[idx];
  qImg.src = q.img;
  qImg.alt = q.text;
  qText.textContent = q.text;

  // очистить
  optionsEl.innerHTML = "";

  q.options.forEach((opt, i) => {
    const b = document.createElement("button");
    b.className = "btn";
    b.textContent = `${String.fromCharCode(65 + i)}) ${opt}`;
    b.addEventListener("click", () => choose(i));
    optionsEl.appendChild(b);
  });

  lockOptions(false);
  startTimerForQuestion();
}

function startTimerForQuestion() {
  stopTimer();
  startTs = Date.now();
  setBar(1);
  setTimeLabel(TIME_LIMIT_MS);

  timerId = setInterval(() => {
    const elapsed = Date.now() - startTs;
    const left = TIME_LIMIT_MS - elapsed;

    setTimeLabel(Math.max(0, left));
    setBar(1 - elapsed / TIME_LIMIT_MS);

    if (left <= 0) {
      stopTimer();
      onTimeout();
    }
  }, 50);
}

function highlightCorrect() {
  const q = QUESTIONS[idx];
  const btns = optionsEl.querySelectorAll("button");
  btns.forEach((b, i) => {
    if (i === q.correctIndex) b.classList.add("correct");
  });
}

function choose(choiceIndex) {
  if (!started || locked) return;

  lockOptions(true);
  stopTimer();

  const q = QUESTIONS[idx];
  const btns = optionsEl.querySelectorAll("button");
  const isCorrect = choiceIndex === q.correctIndex;

  if (isCorrect) {
    score += 1;
    btns[choiceIndex].classList.add("correct");
  } else {
    btns[choiceIndex].classList.add("wrong");
    highlightCorrect();
  }

  renderMeta();

  // небольшая пауза и следующий
  btnNext.disabled = false;
  setTimeout(() => {
    nextQuestion();
  }, 600);
}

function onTimeout() {
  lockOptions(true);
  highlightCorrect(); // можно убрать, если не хотите показывать ответ
  btnNext.disabled = false;

  // сразу следующий
  setTimeout(() => {
    nextQuestion();
  }, 500);
}

function nextQuestion() {
  stopTimer();

  idx += 1;
  if (idx >= QUESTIONS.length) {
    finish();
    return;
  }
  showQuestion();
}

function finish() {
  stopTimer();
  lockOptions(true);
  btnNext.disabled = true;

  const total = QUESTIONS.length;
  const percent = Math.round((score / total) * 100);

  resultBox.style.display = "block";
  resultBox.innerHTML = `
        Итог: <b>${score}</b> / <b>${total}</b> (${percent}%).
        <br/>Нажмите <b>Сброс</b>, чтобы начать заново.
      `;
}

function resetAll() {
  stopTimer();
  idx = 0;
  score = 0;
  started = false;
  locked = false;

  optionsEl.innerHTML = "";
  qText.textContent = "Нажмите «Старт»";
  qImg.removeAttribute("src");

  setBar(1);
  setTimeLabel(TIME_LIMIT_MS);

  renderMeta();
  btnNext.disabled = true;
  resultBox.style.display = "none";
}

btnStart.addEventListener("click", () => {
  if (started) return;
  started = true;
  idx = 0;
  score = 0;
  showQuestion();
});

btnNext.addEventListener("click", () => {
  if (!started) return;
  nextQuestion();
});

btnReset.addEventListener("click", resetAll);

// init
resetAll();