const state = {
  values: [],
  algorithm: "bubble",
  steps: [],
  stepIndex: 0,
  running: false,
  paused: false,
  completed: false,
  sorted: [],
  speed: 2,
};

const stage = document.querySelector("#stage");
const algorithm = document.querySelector("#algorithm");
const size = document.querySelector("#size");
const speed = document.querySelector("#speed");
const runButton = document.querySelector("#run");
const stepButton = document.querySelector("#step");
const stopButton = document.querySelector("#stop");
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
  merge: {
    name: "Merge sort",
    copy: "Merge sort divides the array into smaller halves, sorts each half, and merges them back together in order.",
    complexity: "O(n log n)",
    hint: "Follow the values as sorted halves become one ordered array.",
  },
  quick: {
    name: "Quick sort",
    copy: "Quick sort chooses a pivot, moves smaller values to its left and larger values to its right, then repeats on each side.",
    complexity: "O(n log n)",
    hint: "The highlighted pivot becomes fixed when its partition is complete.",
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
  } else if (type === "merge") {
    function mergeSort(start, end) {
      if (end - start < 2) return;
      const middle = Math.floor((start + end) / 2);
      mergeSort(start, middle);
      mergeSort(middle, end);

      const left = working.slice(start, middle);
      const right = working.slice(middle, end);
      let leftIndex = 0;
      let rightIndex = 0;
      let writeIndex = start;
      while (leftIndex < left.length || rightIndex < right.length) {
        const currentLeft = start + leftIndex;
        const currentRight = middle + rightIndex;
        const active = [];
        if (leftIndex < left.length) active.push(currentLeft);
        if (rightIndex < right.length) active.push(currentRight);
        record(active, "Comparing sorted halves");
        if (rightIndex >= right.length || (leftIndex < left.length && left[leftIndex] <= right[rightIndex])) {
          working[writeIndex] = left[leftIndex];
          leftIndex += 1;
        } else {
          working[writeIndex] = right[rightIndex];
          rightIndex += 1;
        }
        record([writeIndex], "Merging values into place");
        writeIndex += 1;
      }
    }
    mergeSort(0, working.length);
  } else if (type === "quick") {
    function quickSort(low, high) {
      if (low >= high) return;
      const pivot = working[high];
      let smaller = low;
      record([high], "Pivot selected");
      for (let index = low; index < high; index += 1) {
        record([index, high], "Comparing with pivot");
        if (working[index] <= pivot) {
          [working[smaller], working[index]] = [working[index], working[smaller]];
          record([smaller, index], "Moving value before pivot");
          smaller += 1;
        }
      }
      [working[smaller], working[high]] = [working[high], working[smaller]];
      sorted.push(smaller);
      record([smaller], "Pivot found its position");
      quickSort(low, smaller - 1);
      quickSort(smaller + 1, high);
    }
    quickSort(0, working.length - 1);
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
  state.running = false;
  state.paused = false;
  state.completed = false;
  state.steps = makeSteps(state.values, state.algorithm);
  state.stepIndex = 0;
  state.sorted = [];
  render();
  stepCount.textContent = "0";
  activityLabel.textContent = "Ready when you are.";
  runButton.textContent = "Run sort";
  stopButton.textContent = "Stop";
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
  if (state.stepIndex >= state.steps.length) {
    state.completed = true;
    runButton.textContent = "Reset";
  }
  return true;
}

async function run() {
  if (state.running || state.completed) return;
  state.running = true;
  state.paused = false;
  state.completed = false;
  runButton.textContent = "Running...";
  stopButton.textContent = "Stop";
  while (state.stepIndex < state.steps.length && state.running) {
    advance();
    await new Promise((resolve) => setTimeout(resolve, 760 - state.speed * 180));
  }
  state.running = false;
  if (state.stepIndex >= state.steps.length) {
    state.completed = true;
    runButton.textContent = "Reset";
    state.paused = false;
    stopButton.textContent = "Stop";
  } else {
    runButton.textContent = "Run sort";
    stopButton.textContent = "Resume";
  }
}

function handleRun() {
  if (state.completed) {
    resetSteps();
    return;
  }
  run();
}

function toggleStop() {
  if (state.running) {
    state.running = false;
    state.paused = true;
    stopButton.textContent = "Resume";
    runButton.textContent = "Run sort";
    activityLabel.textContent = "Paused. The current comparison is held.";
    return;
  }
  if (state.paused) run();
}

function shuffle() {
  state.running = false;
  state.paused = false;
  state.values = randomValues(Number(size.value));
  resetSteps();
}

algorithm.addEventListener("change", () => { state.algorithm = algorithm.value; updateDetails(); resetSteps(); });
size.addEventListener("input", () => { document.querySelector("#sizeValue").textContent = size.value; document.querySelector("#arraySize").textContent = size.value; shuffle(); });
speed.addEventListener("input", () => { state.speed = Number(speed.value); document.querySelector("#speedValue").textContent = ["SLOW", "MEDIUM", "FAST"][state.speed - 1]; if (state.completed) resetSteps(); else runButton.textContent = "Run sort"; });
runButton.addEventListener("click", handleRun);
stepButton.addEventListener("click", advance);
stopButton.addEventListener("click", toggleStop);
shuffleButton.addEventListener("click", shuffle);

state.values = randomValues(Number(size.value));
updateDetails();
resetSteps();
