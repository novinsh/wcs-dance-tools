const STORAGE_KEY = "wcs-footwork-config";
const DEFAULT_CONFIG_URL = "footworks.config.json";

const state = {
  config: null,
  defaults: null,
  savedConfig: null,
  mode: "display",
  patternKey: "sugarPush",
  role: "leader",
  beat: -1,
  showEdges: true,
  visibleLag: 2,
  playTimer: null,
  dragBeat: null,
  dragStartFoot: null,
  selectedStartFoot: null,
  isDirty: false,
};

const els = {
  patternSelect: document.querySelector("#patternSelect"),
  addPattern: document.querySelector("#addPattern"),
  beatStrip: document.querySelector("#beatStrip"),
  danceFloor: document.querySelector("#danceFloor"),
  stepsLayer: document.querySelector("#stepsLayer"),
  edgeLayer: document.querySelector("#edgeLayer"),
  stepTitle: document.querySelector("#stepTitle"),
  stepHint: document.querySelector("#stepHint"),
  playPause: document.querySelector("#playPause"),
  edgeToggle: document.querySelector("#edgeToggle"),
  lagSelect: document.querySelector("#lagSelect"),
  footSelect: document.querySelector("#footSelect"),
  angleInput: document.querySelector("#angleInput"),
  xInput: document.querySelector("#xInput"),
  yInput: document.querySelector("#yInput"),
  noteInput: document.querySelector("#noteInput"),
  rhythmList: document.querySelector("#rhythmList"),
  addSingleStep: document.querySelector("#addSingleStep"),
  addTripleStep: document.querySelector("#addTripleStep"),
  savePattern: document.querySelector("#savePattern"),
  resetPattern: document.querySelector("#resetPattern"),
  exportConfig: document.querySelector("#exportConfig"),
  importConfig: document.querySelector("#importConfig"),
  unsavedDialog: document.querySelector("#unsavedDialog"),
};

initEditor();

async function initEditor() {
  const defaults = await loadDefaultConfig();
  state.defaults = clone(defaults);
  state.config = normalizeConfig(loadSavedConfig(defaults.version) ?? clone(defaults));
  state.defaults = normalizeConfig(state.defaults);
  state.savedConfig = clone(state.config);
  state.patternKey = Object.keys(state.config.patterns)[0];

  fillPatternSelect();
  bindEvents();
  render();
}

async function loadDefaultConfig() {
  const response = await fetch(DEFAULT_CONFIG_URL, { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(`Could not load ${DEFAULT_CONFIG_URL}`);
  }
  const manifest = await response.json();
  if (!Array.isArray(manifest.patterns)) return manifest;

  const releaseVersion = manifest.version ?? 1;
  const patterns = {};
  await Promise.all(
    manifest.patterns.map(async (entry) => {
      const patternResponse = await fetch(withReleaseVersion(entry.file, releaseVersion));
      if (!patternResponse.ok) {
        throw new Error(`Could not load ${entry.file}`);
      }
      const pattern = await patternResponse.json();
      const key = pattern.key ?? entry.key;
      patterns[key] = {
        ...pattern,
        name: pattern.name ?? entry.name,
      };
      delete patterns[key].key;
      delete patterns[key].version;
    }),
  );

  return {
    version: releaseVersion,
    patterns,
  };
}

function withReleaseVersion(url, version) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${encodeURIComponent(version)}`;
}

function loadSavedConfig(defaultVersion) {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const savedConfig = JSON.parse(raw);
    if (savedConfig.version !== defaultVersion) return null;
    return savedConfig;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function saveConfig() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.config));
  state.savedConfig = clone(state.config);
  state.isDirty = false;
  render();
}

function markDirty() {
  state.isDirty = true;
}

async function resolveUnsavedChanges() {
  if (!state.isDirty) return true;

  const choice = await showUnsavedDialog();
  if (choice === "cancel") return false;
  if (choice === "save") {
    saveConfig();
    return true;
  }

  discardUnsavedChanges();
  return true;
}

function showUnsavedDialog() {
  return new Promise((resolve) => {
    const dialog = els.unsavedDialog;

    if (!dialog?.showModal) {
      const shouldSave = window.confirm("Save changes before continuing?");
      resolve(shouldSave ? "save" : "discard");
      return;
    }

    const handleClose = () => {
      dialog.removeEventListener("close", handleClose);
      resolve(dialog.returnValue || "cancel");
    };

    dialog.addEventListener("close", handleClose);
    dialog.showModal();
  });
}

function discardUnsavedChanges() {
  state.config = clone(state.savedConfig);
  state.isDirty = false;
  if (!state.config.patterns[state.patternKey]) {
    state.patternKey = Object.keys(state.config.patterns)[0];
  }
  fillPatternSelect();
}

function bindEvents() {
  els.patternSelect.addEventListener("change", async () => {
    const nextPatternKey = els.patternSelect.value;
    if (nextPatternKey === state.patternKey) return;

    const canLeave = await resolveUnsavedChanges();
    if (!canLeave) {
      els.patternSelect.value = state.patternKey;
      return;
    }

    state.patternKey = nextPatternKey;
    state.beat = -1;
    state.selectedStartFoot = null;
    stopPlayback();
    render();
  });

  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.mode = button.dataset.mode;
      stopPlayback();
      render();
    });
  });

  document.querySelectorAll("[data-role]").forEach((button) => {
    button.addEventListener("click", () => {
      state.role = button.dataset.role;
      state.beat = -1;
      state.selectedStartFoot = null;
      stopPlayback();
      render();
    });
  });

  document.querySelector("#prevStep").addEventListener("click", () => {
    advanceBeat(-1);
    state.selectedStartFoot = null;
    render();
  });

  document.querySelector("#nextStep").addEventListener("click", () => {
    advanceBeat(1);
    state.selectedStartFoot = null;
    render();
  });

  els.playPause.addEventListener("click", togglePlayback);

  els.edgeToggle.addEventListener("change", () => {
    state.showEdges = els.edgeToggle.checked;
    render();
  });

  els.lagSelect.addEventListener("change", () => {
    state.visibleLag = els.lagSelect.value === "all" ? "all" : Number(els.lagSelect.value);
    render();
  });

  els.danceFloor.addEventListener("pointerdown", handleFloorPointerDown);
  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", () => {
    state.dragBeat = null;
    state.dragStartFoot = null;
  });

  [els.footSelect, els.angleInput, els.xInput, els.yInput, els.noteInput].forEach((input) => {
    input.addEventListener("input", updateSelectedStepFromForm);
  });

  els.addSingleStep.addEventListener("click", () => addRhythmPhrase("step"));
  els.addTripleStep.addEventListener("click", () => addRhythmPhrase("triple"));
  els.addPattern.addEventListener("click", addPattern);
  els.savePattern.addEventListener("click", saveConfig);
  els.resetPattern.addEventListener("click", resetCurrentPattern);
  els.exportConfig.addEventListener("click", exportConfig);
  els.importConfig.addEventListener("change", importConfig);
}

function fillPatternSelect() {
  els.patternSelect.innerHTML = Object.entries(state.config.patterns)
    .map(([key, pattern]) => `<option value="${key}">${pattern.name}</option>`)
    .join("");
  els.patternSelect.value = state.patternKey;
}

function togglePlayback() {
  if (state.playTimer) {
    stopPlayback();
    return;
  }

  els.playPause.textContent = "Pause";
  state.playTimer = window.setInterval(() => {
    advanceBeat(1);
    render();
  }, 900);
}

function stopPlayback() {
  window.clearInterval(state.playTimer);
  state.playTimer = null;
  els.playPause.textContent = "Play";
}

function advanceBeat(direction) {
  const steps = getSteps();
  const totalPositions = steps.length + 1;
  const normalized = state.beat + 1;
  const next = (normalized + direction + totalPositions) % totalPositions;
  state.beat = next - 1;
}

function render() {
  const pattern = getPattern();
  const steps = getSteps();
  const timePoints = getTimePoints();
  state.beat = clamp(state.beat, -1, steps.length - 1);
  const selected = state.beat >= 0 ? steps[state.beat] : null;
  const selectedStart = getSelectedStartStep();

  els.patternSelect.value = state.patternKey;
  els.edgeToggle.checked = state.showEdges;
  els.lagSelect.value = String(state.visibleLag);
  els.savePattern.disabled = !state.isDirty;
  els.danceFloor.classList.toggle("is-editor", state.mode === "editor");

  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === state.mode);
  });

  document.querySelectorAll("[data-role]").forEach((button) => {
    button.classList.toggle("active", button.dataset.role === state.role);
  });

  renderBeatStrip(timePoints, steps);
  renderRhythmList(timePoints);

  els.stepTitle.textContent = selectedStart
    ? `${pattern.name}: start ${selectedStart.foot}`
    : state.beat === -1
      ? `${pattern.name}: start`
      : `${pattern.name}: ${formatTimePoint(timePoints[state.beat], selected)}`;
  if (state.isDirty) {
    els.stepTitle.textContent += " (unsaved)";
  }
  els.stepHint.textContent =
    state.mode === "editor"
      ? "Click the floor to place the selected beat. Drag any footstep, including start feet, to adjust it."
      : state.beat === -1
        ? "Start position only. Press next or play to begin the footwork."
        : selected.note || "Use the beat controls to step through the pattern.";

  renderEditorForm(selectedStart ?? selected ?? getStartSteps()[0], Boolean(selectedStart || state.beat === -1));
  renderEdges(steps, timePoints);
  renderSteps(steps, timePoints);
}

function renderBeatStrip(timePoints, steps) {
  els.beatStrip.style.gridTemplateColumns = `repeat(${timePoints.length + 1}, minmax(58px, 1fr))`;
  els.beatStrip.innerHTML = [
    `
      <button class="beat ${state.beat === -1 ? "active" : ""}" type="button" data-start-timeline="true">
        <span>S</span>
        <small>START</small>
      </button>
    `,
    ...timePoints
    .map((point, index) => {
      const foot = steps[index].foot;
      return `
        <button class="beat ${index === state.beat ? "active" : ""}" type="button" data-beat="${index}">
          <span>${point.label}</span>
          <small>${foot}</small>
        </button>
      `;
    }),
  ].join("");

  els.beatStrip.querySelector("[data-start-timeline]").addEventListener("click", () => {
    state.beat = -1;
    state.selectedStartFoot = null;
    render();
  });

  els.beatStrip.querySelectorAll("[data-beat]").forEach((button) => {
    button.addEventListener("click", () => {
      state.beat = Number(button.dataset.beat);
      state.selectedStartFoot = null;
      render();
    });
  });
}

function renderRhythmList(timePoints) {
  const rhythm = getPattern().rhythm;
  els.rhythmList.innerHTML = rhythm
    .map((phrase, index) => {
      const phrasePoints = timePoints.filter((point) => point.phraseIndex === index);
      const label = phrase.type === "triple" ? "Triple step" : "Step";
      const counts = phrasePoints.map((point) => point.label).join(" ");
      return `
        <div class="rhythm-item">
          <button class="rhythm-chip" type="button" data-rhythm-index="${index}">
            <strong>${label}</strong>
            <span>${counts}</span>
          </button>
          <button class="remove-rhythm" type="button" data-remove-rhythm="${index}" aria-label="Remove ${label}">×</button>
        </div>
      `;
    })
    .join("");

  els.rhythmList.querySelectorAll("[data-rhythm-index]").forEach((button) => {
    button.addEventListener("click", () => {
      const phraseIndex = Number(button.dataset.rhythmIndex);
      const firstPoint = timePoints.findIndex((point) => point.phraseIndex === phraseIndex);
      state.beat = Math.max(firstPoint, 0);
      state.selectedStartFoot = null;
      render();
    });
  });

  els.rhythmList.querySelectorAll("[data-remove-rhythm]").forEach((button) => {
    button.addEventListener("click", () => removeRhythmPhrase(Number(button.dataset.removeRhythm)));
  });
}

function renderEditorForm(step, isStartStep = false) {
  els.footSelect.value = step.foot;
  els.angleInput.value = Math.round(step.angle);
  els.xInput.value = Math.round(step.x);
  els.yInput.value = Math.round(step.y);
  els.noteInput.value = step.note ?? "";
  els.footSelect.disabled = isStartStep;
  els.noteInput.disabled = isStartStep;
  els.noteInput.placeholder = isStartStep ? "Start positions use foot, angle, X, and Y." : "";
}

function renderSteps(steps, timePoints) {
  const startSteps = getStartSteps();
  const visibleHistories = getVisibleFootHistories(steps);
  const visibleStartItems = new Map(
    visibleHistories.filter((item) => item.isStart).map((item) => [item.step.foot, item]),
  );
  const visibleStepItems = new Map(
    visibleHistories.filter((item) => !item.isStart).map((item) => [item.index, item]),
  );

  els.stepsLayer.innerHTML = [
    ...startSteps
      .filter((step) => state.mode === "editor" || visibleStartItems.has(step.foot))
      .map((step) => createStartFootstep(step, step.foot === state.selectedStartFoot, visibleStartItems.get(step.foot)?.isLagged)),
    ...steps
      .map((step, index) => ({ step, index }))
      .filter(({ index }) => state.mode === "editor" || visibleStepItems.has(index))
      .map(({ step, index }) => createFootstep(step, timePoints[index], index, index === state.beat, visibleStepItems.get(index)?.isLagged)),
  ].join("");
}

function renderEdges(steps, timePoints) {
  els.edgeLayer.innerHTML = "";
  if (!state.showEdges) return;

  const lines = [];
  const historiesByFoot = groupHistoryByFoot(getVisibleFootHistories(steps));

  Object.values(historiesByFoot).forEach((history) => {
    for (let index = 1; index < history.length; index += 1) {
      const previous = history[index - 1].step;
      const current = history[index].step;
      lines.push(`<line x1="${previous.x}%" y1="${previous.y}%" x2="${current.x}%" y2="${current.y}%" />`);
    }
  });

  els.edgeLayer.innerHTML = `
    <defs>
      <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
        <path d="M0,0 L0,6 L7,3 z"></path>
      </marker>
    </defs>
    ${lines.join("")}
  `;
}

function getVisibleFootHistories(steps) {
  const histories = groupHistoryByFoot([
    ...getStartSteps().map((step) => ({ step, index: -1, isStart: true })),
    ...steps
      .map((step, index) => ({ step, index, isStart: false }))
      .filter(({ index }) => state.mode === "editor" || index <= state.beat),
  ]);

  return Object.values(histories).flatMap((history) => {
    const visibleHistory =
      state.mode === "editor" || state.visibleLag === "all" ? history : history.slice(-state.visibleLag);
    return visibleHistory.map((item, index) => ({
      ...item,
      isLagged: index < visibleHistory.length - 1,
    }));
  });
}

function groupHistoryByFoot(items) {
  return items.reduce((groups, item) => {
    groups[item.step.foot] = groups[item.step.foot] ?? [];
    groups[item.step.foot].push(item);
    return groups;
  }, {});
}

function createStartFootstep(step, isActive, isLagged = false) {
  return `
    <button
      class="footstep start-footstep ${isActive ? "active" : ""} ${isLagged ? "lagged" : ""}"
      type="button"
      data-start-foot="${step.foot}"
      style="left: ${step.x}%; top: ${step.y}%; --angle: ${step.angle}deg; --color: #d2d5d2; --text: #566066;"
      aria-label="Start position, ${step.foot} foot"
    >
      <span class="step-number">S</span>
      <span class="foot-letter">${step.foot}</span>
    </button>
  `;
}

function createFootstep(step, timePoint, index, isActive, isLagged = false) {
  const color = step.foot === "L" ? "#ffffff" : "#1d2930";
  const textColor = step.foot === "L" ? "#1d2930" : "#ffffff";
  return `
    <button
      class="footstep ${isActive ? "active" : ""} ${isLagged ? "lagged" : ""}"
      type="button"
      data-step-index="${index}"
      style="left: ${step.x}%; top: ${step.y}%; --angle: ${step.angle}deg; --color: ${color}; --text: ${textColor};"
      aria-label="Beat ${timePoint.label}, ${step.foot} foot"
    >
      <span class="step-number">${timePoint.label}</span>
      <span class="foot-letter">${step.foot}</span>
    </button>
  `;
}

function handleFloorPointerDown(event) {
  if (state.mode !== "editor") return;

  const footstep = event.target.closest(".footstep");
  if (footstep) {
    if (footstep.dataset.startFoot) {
      state.dragStartFoot = footstep.dataset.startFoot;
      state.selectedStartFoot = footstep.dataset.startFoot;
      render();
      event.preventDefault();
      return;
    }

    state.selectedStartFoot = null;
    state.beat = Number(footstep.dataset.stepIndex);
    state.dragBeat = state.beat;
    render();
    event.preventDefault();
    return;
  }

  if (state.beat === -1) return;
  updateStepPositionFromEvent(state.beat, event);
}

function handlePointerMove(event) {
  if (state.mode !== "editor") return;
  if (state.dragStartFoot) {
    updateStartPositionFromEvent(state.dragStartFoot, event);
    return;
  }
  if (state.dragBeat !== null) {
    updateStepPositionFromEvent(state.dragBeat, event);
  }
}

function updateStepPositionFromEvent(beat, event) {
  const rect = els.danceFloor.getBoundingClientRect();
  const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 4, 96);
  const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 5, 95);
  const step = getSteps()[beat];

  step.x = roundOne(x);
  step.y = roundOne(y);
  markDirty();
  render();
}

function updateStartPositionFromEvent(foot, event) {
  const rect = els.danceFloor.getBoundingClientRect();
  const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 4, 96);
  const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 5, 95);
  const startStep = getStartSteps().find((step) => step.foot === foot);

  startStep.x = roundOne(x);
  startStep.y = roundOne(y);
  markDirty();
  render();
}

function updateSelectedStepFromForm() {
  const step = getSelectedStartStep() ?? (state.beat === -1 ? getStartSteps()[0] : getSteps()[state.beat]);
  if (!state.selectedStartFoot) {
    step.foot = els.footSelect.value;
  }
  step.angle = Number(els.angleInput.value);
  step.x = clamp(Number(els.xInput.value), 0, 100);
  step.y = clamp(Number(els.yInput.value), 0, 100);
  if (!state.selectedStartFoot) {
    step.note = els.noteInput.value;
  }
  markDirty();
  render();
}

async function addPattern() {
  const canLeave = await resolveUnsavedChanges();
  if (!canLeave) return;

  const name = window.prompt("Pattern name");
  if (!name?.trim()) return;

  const key = uniquePatternKey(slugify(name));
  state.config.patterns[key] = createBlankPattern(name.trim());
  state.patternKey = key;
  state.beat = -1;
  state.selectedStartFoot = null;
  state.role = "leader";
  markDirty();
  fillPatternSelect();
  render();
}

function resetCurrentPattern() {
  const defaultPattern = state.defaults.patterns[state.patternKey];
  if (!defaultPattern) return;

  state.config.patterns[state.patternKey] = clone(defaultPattern);
  state.beat = -1;
  state.selectedStartFoot = null;
  markDirty();
  render();
}

function createBlankPattern(name) {
  const pattern = {
    name,
    rhythm: [{ type: "step" }, { type: "step" }, { type: "triple" }, { type: "triple" }],
    roles: {
      leader: { steps: [], startSteps: defaultStartSteps("leader") },
      follower: { steps: [], startSteps: defaultStartSteps("follower") },
    },
  };
  syncStepsToRhythm(pattern);
  return pattern;
}

function slugify(value) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "pattern"
  );
}

function uniquePatternKey(baseKey) {
  let key = baseKey;
  let suffix = 2;
  while (state.config.patterns[key]) {
    key = `${baseKey}-${suffix}`;
    suffix += 1;
  }
  return key;
}

function addRhythmPhrase(type) {
  const pattern = getPattern();
  const selectedPoint = getTimePoints()[state.beat];
  const insertIndex = selectedPoint ? selectedPoint.phraseIndex + 1 : pattern.rhythm.length;
  pattern.rhythm.splice(insertIndex, 0, { type });
  syncStepsToRhythm(pattern);
  const nextPoints = getTimePoints();
  state.beat = Math.max(
    nextPoints.findIndex((point) => point.phraseIndex === insertIndex),
    0,
  );
  state.selectedStartFoot = null;
  markDirty();
  render();
}

function removeRhythmPhrase(index) {
  const pattern = getPattern();
  if (pattern.rhythm.length <= 1) return;

  pattern.rhythm.splice(index, 1);
  syncStepsToRhythm(pattern);
  state.beat = clamp(state.beat, -1, getSteps().length - 1);
  state.selectedStartFoot = null;
  markDirty();
  render();
}

function exportConfig() {
  const pattern = {
    version: 1,
    key: state.patternKey,
    ...getPattern(),
  };
  const blob = new Blob([JSON.stringify(pattern, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${state.patternKey}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importConfig(event) {
  const [file] = event.target.files;
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const imported = JSON.parse(String(reader.result));
      if (imported.roles && imported.name) {
        const key = uniquePatternKey(imported.key ?? slugify(imported.name));
        const pattern = clone(imported);
        delete pattern.key;
        delete pattern.version;
        state.config.patterns[key] = pattern;
        state.patternKey = key;
        normalizeConfig(state.config);
        markDirty();
      } else {
        if (!imported.patterns && !imported["mo" + "ves"]) throw new Error("Missing patterns");
        state.config = normalizeConfig(imported);
        state.patternKey = Object.keys(state.config.patterns)[0];
        state.savedConfig = clone(state.config);
        state.isDirty = false;
      }
      state.beat = -1;
      state.selectedStartFoot = null;
      fillPatternSelect();
      render();
    } catch {
      alert("That JSON file does not look like a footwork config.");
    }
  });
  reader.readAsText(file);
  event.target.value = "";
}

function getPattern() {
  return state.config.patterns[state.patternKey];
}

function getSteps() {
  return getPattern().roles[state.role].steps;
}

function getStartSteps() {
  return getPattern().roles[state.role].startSteps;
}

function getSelectedStartStep() {
  if (!state.selectedStartFoot) return null;
  return getStartSteps().find((step) => step.foot === state.selectedStartFoot) ?? null;
}

function getTimePoints() {
  return expandRhythm(getPattern().rhythm);
}

function expandRhythm(rhythm) {
  let count = 1;
  const points = [];

  rhythm.forEach((phrase, phraseIndex) => {
    if (phrase.type === "triple") {
      points.push({ label: String(count), phraseIndex, type: phrase.type });
      points.push({ label: "&", phraseIndex, type: phrase.type });
      points.push({ label: String(count + 1), phraseIndex, type: phrase.type });
      count += 2;
      return;
    }

    points.push({ label: String(count), phraseIndex, type: "step" });
    count += 1;
  });

  return points;
}

function normalizeConfig(config) {
  const legacyPatterns = config["mo" + "ves"];
  if (!config.patterns && legacyPatterns) {
    config.patterns = legacyPatterns;
    delete config["mo" + "ves"];
  }

  Object.values(config.patterns).forEach((pattern) => {
    pattern.rhythm = pattern.rhythm ?? inferRhythm(pattern);
    Object.entries(pattern.roles).forEach(([roleName, role]) => {
      role.steps = role.steps ?? [];
      role.startSteps = normalizeStartSteps(role.startSteps, roleName);
    });
    syncStepsToRhythm(pattern);
  });
  return config;
}

function normalizeStartSteps(startSteps, roleName) {
  const defaults = defaultStartSteps(roleName);
  const hasLegacyAngles =
    startSteps?.length === 2 &&
    startSteps.every((step) => step.angle === 0 || step.angle === 180);

  return defaults.map((fallback) => {
    const existing = startSteps?.find((step) => step.foot === fallback.foot);
    if (existing && hasLegacyAngles) {
      return {
        ...fallback,
        ...existing,
        angle: fallback.angle,
      };
    }
    return {
      ...fallback,
      ...existing,
    };
  });
}

function defaultStartSteps(roleName) {
  const y = roleName === "leader" ? 66 : 34;
  return [
    { foot: "L", x: 48, y, angle: -15 },
    { foot: "R", x: 52, y, angle: 30 },
  ];
}

function inferRhythm(pattern) {
  const firstRole = Object.values(pattern.roles)[0];
  const stepCount = firstRole?.steps?.length ?? 6;
  if (pattern.name?.toLowerCase().includes("whip")) {
    return [{ type: "step" }, { type: "step" }, { type: "triple" }, { type: "step" }, { type: "step" }, { type: "triple" }];
  }
  if (stepCount >= 10) return [{ type: "step" }, { type: "step" }, { type: "triple" }, { type: "step" }, { type: "step" }, { type: "triple" }];
  return [{ type: "step" }, { type: "step" }, { type: "triple" }, { type: "triple" }];
}

function syncStepsToRhythm(pattern) {
  const timePoints = expandRhythm(pattern.rhythm);
  Object.entries(pattern.roles).forEach(([roleName, role]) => {
    const existing = role.steps ?? [];
    const firstFoot = roleName === "follower" ? "R" : "L";
    role.steps = timePoints.map((point, index) => {
      const current = existing[index] ?? {};
      return {
        beat: point.label,
        foot: current.foot ?? alternatingFoot(firstFoot, index),
        x: current.x ?? defaultX(index),
        y: current.y ?? defaultY(roleName, index, timePoints.length),
        angle: current.angle ?? 0,
        note: current.note ?? "",
      };
    });
  });
}

function alternatingFoot(firstFoot, index) {
  const secondFoot = firstFoot === "L" ? "R" : "L";
  return index % 2 === 0 ? firstFoot : secondFoot;
}

function defaultX(index) {
  return index % 2 === 0 ? 47 : 53;
}

function defaultY(roleName, index, total) {
  const start = roleName === "leader" ? 82 : 18;
  const end = roleName === "leader" ? 24 : 76;
  if (total <= 1) return start;
  return roundOne(start + ((end - start) * index) / (total - 1));
}

function formatTimePoint(point, step) {
  return `${point.label}(${step.foot})`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function roundOne(value) {
  return Math.round(value * 10) / 10;
}
