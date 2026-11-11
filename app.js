const state = {
  values: [],
  algorithm: "bubble",
  steps: [],
  stepIndex: 0,
  running: false,
  sorted: [],
  speed: 2,
};

const stage = document.querySelector("#stage");
const algorithm = document.querySelector("#algorithm");
const size = document.querySelector("#size");
const speed = document.querySelector("#speed");
const runButton = document.querySelector("#run");
const stepButton = document.querySelector("#step");
const shuffleButton = document.querySelector("#shuffle");
const activityLabel = document.querySelector("#activityLabel");
const stepCount = document.querySelector("#stepCount");

const descriptions = {
  bubble: {
    name: "Bubble sort",
    copy: "Bubble sort repeatedly compares neighboring values and swaps them when they are out of order. Larger values slowly rise toward the end of the array.",
    complexity: "O(n²)",
    hint: "Step through the first comparison to see the algorithm's rhythm.",
  },
  selection: {
    name: "Selection sort",
    copy: "Selection sort searches the unsorted portion for its smallest value, then places it in the next open position.",
    complexity: "O(n²)",
    hint: "Watch the smallest value travel to the front of the unsorted range.",
  },
  insertion: {
    name: "Insertion sort",
    copy: "Insertion sort grows a sorted section one value at a time, sliding each new value left until it finds its place.",
    complexity: "O(n²)",
    hint: "The left side is always sorted. Try stepping one value at a time.",
  },
};

function randomValues(count) {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 82) + 12);
}

function makeSteps(values, type) {
  const working = [...values];
  const steps = [];
  const sorted = [];
  const record = (active = [], action = "Comparing values") => steps.push({ values: [...working], active, sorted: [...sorted], action });

  if (type === "selection") {
    for (let start = 0; start < working.length - 1; start += 1) {
      let minimum = start;
      for (let index = start + 1; index < working.length; index += 1) {
        record([minimum, index], "Looking for the smallest value");
        if (working[index] < working[minimum]) minimum = index;
      }
      [working[start], working[minimum]] = [working[minimum], working[start]];
      sorted.push(start);
      record([start], "Placed the next value");
    }
  } else if (type === "insertion") {
    sorted.push(0);
    for (let index = 1; index < working.length; index += 1) {
      let cursor = index;
      while (cursor > 0) {
        record([cursor - 1, cursor], "Finding the next position");
        if (working[cursor - 1] <= working[cursor]) break;
        [working[cursor - 1], working[cursor]] = [working[cursor], working[cursor - 1]];
        cursor -= 1;
        record([cursor], "Sliding value into place");
      }
      sorted.push(index);
    }
  } else {
    for (let end = working.length - 1; end > 0; end -= 1) {
      for (let index = 0; index < end; index += 1) {
        record([index, index + 1]);
        if (working[index] > working[index + 1]) {
          [working[index], working[index + 1]] = [working[index + 1], working[index]];
          record([index, index + 1], "Swapped neighboring values");
        }
      }
      sorted.unshift(end);
    }
  }
  sorted.push(0);
  steps.push({ values: [...working], active: [], sorted: Array.from({ length: working.length }, (_, index) => index), action: "Array sorted" });
  return steps;
}

function render(snapshot = { values: state.values, active: [], sorted: [] }) {
  stage.innerHTML = "";
  snapshot.values.forEach((value, index) => {
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.height = `${value}%`;
    bar.setAttribute("aria-label", `Value ${value}`);
    if (snapshot.active.includes(index)) bar.classList.add("comparing");
    if (snapshot.sorted.includes(index)) bar.classList.add("sorted");
    stage.appendChild(bar);
  });
}

function resetSteps() {
  state.steps = makeSteps(state.values, state.algorithm);
  state.stepIndex = 0;
  state.sorted = [];
  render();
  stepCount.textContent = "0";
  activityLabel.textContent = "Ready when you are.";
}

function updateDetails() {
  const detail = descriptions[state.algorithm];
  document.querySelector("#arrayLabel").textContent = detail.name;
  document.querySelector("#detailTitle").textContent = detail.name;
  document.querySelector("#detailCopy").textContent = detail.copy;
  document.querySelector("#timeComplexity").textContent = detail.complexity;
  document.querySelector("#hintText").textContent = detail.hint;
}

function advance() {
  if (state.stepIndex >= state.steps.length) return false;
  const snapshot = state.steps[state.stepIndex];
  render(snapshot);
  state.stepIndex += 1;
  stepCount.textContent = state.stepIndex;
  activityLabel.textContent = snapshot.action;
  return true;
}

async function run() {
  if (state.running) return;
  state.running = true;
  runButton.textContent = "Running...";
  while (state.stepIndex < state.steps.length && state.running) {
    advance();
    await new Promise((resolve) => setTimeout(resolve, 760 - state.speed * 180));
  }
  state.running = false;
  runButton.textContent = "Run sort";
}

function shuffle() {
  state.running = false;
  state.values = randomValues(Number(size.value));
  resetSteps();
}

algorithm.addEventListener("change", () => { state.algorithm = algorithm.value; updateDetails(); resetSteps(); });
size.addEventListener("input", () => { document.querySelector("#sizeValue").textContent = size.value; document.querySelector("#arraySize").textContent = size.value; shuffle(); });
speed.addEventListener("input", () => { state.speed = Number(speed.value); document.querySelector("#speedValue").textContent = ["SLOW", "MEDIUM", "FAST"][state.speed - 1]; });
runButton.addEventListener("click", run);
stepButton.addEventListener("click", advance);
shuffleButton.addEventListener("click", shuffle);

state.values = randomValues(Number(size.value));
updateDetails();
resetSteps();
