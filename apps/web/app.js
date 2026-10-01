import {
  generatePilotPacket,
  createPilotSession,
  isItemEligible,
  markPresented,
  markBranchSkipped,
  clearAfterIndex,
  recordResponse,
  finishSession,
  validateResponseValue,
  responseMapFor,
  shuffleWithSeed
} from "../../packages/runtime/index.js";

const $ = (id) => document.getElementById(id);
const screens = ["start-screen","question-screen","complete-screen","error-screen"];
const show = (id) => {
  for (const screen of screens) $(screen).classList.toggle("hidden", screen !== id);
};

const repoUrl = (path) => "../../" + path.replace(/^\/+/, "");
const fetchJson = async (path) => {
  const response = await fetch(repoUrl(path), { cache:"no-store" });
  if (!response.ok) throw new Error("Failed to load " + path + ": HTTP " + response.status);
  return response.json();
};

let current;
let pilot;
let bank;
let scalesDoc;
let domains;
let behavior;
let packet = null;
let session = null;
let currentIndex = null;
let questionShownAt = 0;
let rankingOrder = [];
let autoAdvanceEnabled = true;
let advanceTimer = null;
let advancing = false;
let remoteAvailable = false;
let remoteSubmitting = false;

const itemMap = () => new Map(bank.items.map((item) => [item.id, item]));
const scaleMap = () => new Map(scalesDoc.scales.map((scale) => [scale.id, scale]));
const domainMap = () => new Map(domains.domains.map((domain) => [domain.id, domain]));
const storageKey = () => "worldview-sorter:" + pilot.pilotId + ":" + bank.bankVersion;

const saveLocal = () => {
  if (!session || !packet) return;
  localStorage.setItem(storageKey(), JSON.stringify({ packet, session, currentIndex }));
  $("autosave-label").textContent = "Saved locally";
};

const clearLocal = () => localStorage.removeItem(storageKey());

const generateSeed = () => {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  const bytes = new Uint32Array(4);
  crypto.getRandomValues(bytes);
  return [...bytes].map((x) => x.toString(16).padStart(8, "0")).join("-");
};

const createSessionId = () => generateSeed();

const loadSaved = () => {
  const raw = localStorage.getItem(storageKey());
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed?.session?.bankVersion !== bank.bankVersion ||
      parsed?.session?.pilotId !== pilot.pilotId ||
      parsed?.packet?.bankVersion !== bank.bankVersion
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const specialLabel = {
  no_view:"No view",
  not_understood:"I don't understand this item",
  not_applicable:"Not applicable"
};

const clearAdvanceTimer = () => {
  if (advanceTimer !== null) {
    clearTimeout(advanceTimer);
    advanceTimer = null;
  }
  advancing = false;
  $("answer-area")?.setAttribute("data-advancing", "false");
  $("special-area")?.setAttribute("data-advancing", "false");
};

const setAdvancing = (value) => {
  advancing = value;
  $("answer-area")?.setAttribute("data-advancing", String(value));
  $("special-area")?.setAttribute("data-advancing", String(value));
  if ($("next-button")) $("next-button").disabled = value || !currentHasResponse();
  if ($("back-button")) $("back-button").disabled = value || findPrevious((currentIndex ?? 0) - 1) === null;
};

const existingResponse = (itemId) =>
  session.responses.find((response) => response.itemId === itemId) ?? null;

const currentHasResponse = () => {
  if (currentIndex === null || !packet?.entries[currentIndex]) return false;
  return Boolean(existingResponse(packet.entries[currentIndex].itemId));
};

const eligibleAt = (index) => {
  const entry = packet.entries[index];
  const item = itemMap().get(entry.itemId);
  return isItemEligible(item, responseMapFor(session));
};

const findNext = (from) => {
  for (let index = from; index < packet.entries.length; index++) {
    if (eligibleAt(index)) return index;
    markBranchSkipped(session, index);
  }
  return null;
};

const findPrevious = (from) => {
  for (let index = from; index >= 0; index--) {
    const entry = session.presentedItems[index];
    if (entry?.presented && !entry.skippedByBranch) return index;
  }
  return null;
};

const setCollectionStatus = (message, state = "") => {
  const el = $("collection-status");
  el.textContent = message;
  if (state) el.dataset.state = state;
  else delete el.dataset.state;
};

const submitRemoteSession = async () => {
  if (!session || session.completionStatus !== "completed" || remoteSubmitting) return;

  if (!remoteAvailable || !behavior.completion.submitRemoteWhenAvailable) {
    setCollectionStatus("Collector unavailable. Export the raw JSON to retain this pilot session.", "error");
    $("retry-submit-button").classList.remove("hidden");
    return;
  }

  remoteSubmitting = true;
  $("retry-submit-button").classList.add("hidden");
  setCollectionStatus("Submitting raw session…");

  try {
    const response = await fetch("/api/pilot/sessions", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify(session)
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.message || "Collector returned HTTP " + response.status);
    }
    setCollectionStatus(
      body.duplicate ? "Session was already stored by the collector." : "Session stored by the collector.",
      "success"
    );
  } catch (error) {
    setCollectionStatus("Remote submission failed: " + error.message + ". Raw JSON export is still available.", "error");
    $("retry-submit-button").classList.remove("hidden");
  } finally {
    remoteSubmitting = false;
  }
};

const complete = () => {
  clearAdvanceTimer();
  if (session.completionStatus !== "completed") finishSession(session);
  currentIndex = null;
  saveLocal();
  $("status-pill").textContent = "Complete";

  const answered = session.responses.filter((r) => r.state === "answered").length;
  const special = session.responses.length - answered;
  const skipped = session.presentedItems.filter((p) => p.skippedByBranch).length;

  $("complete-summary").textContent =
    "Session: " + session.sessionId + "\n" +
    "Packet: " + session.packetId + "\n" +
    "Answered: " + answered + "\n" +
    "Special responses: " + special + "\n" +
    "Branch-skipped: " + skipped + "\n" +
    "Bank: " + session.bankVersion;

  show("complete-screen");
  void submitRemoteSession();
};

const moveTo = (index) => {
  clearAdvanceTimer();
  if (index === null || index >= packet.entries.length) {
    complete();
    return;
  }

  currentIndex = index;
  markPresented(session, index);
  questionShownAt = performance.now();
  renderQuestion();
  show("question-screen");
  saveLocal();
};

const advanceFromCurrent = () => {
  if (currentIndex === null || !currentHasResponse()) return;
  clearAdvanceTimer();
  moveTo(findNext(currentIndex + 1));
};

const scheduleAdvance = () => {
  if (!behavior.autoAdvance.supported || !autoAdvanceEnabled) return;
  clearAdvanceTimer();
  setAdvancing(true);
  advanceTimer = setTimeout(() => {
    advanceTimer = null;
    advancing = false;
    advanceFromCurrent();
  }, behavior.autoAdvance.delayMs);
};

const submit = (state, value) => {
  if (advancing || currentIndex === null) return;

  const entry = packet.entries[currentIndex];
  const item = itemMap().get(entry.itemId);
  const scale = scaleMap().get(item.responseScaleId);
  validateResponseValue(item, scale, state, value);

  const prior = existingResponse(item.id);
  const changed = prior &&
    (prior.state !== state || JSON.stringify(prior.value) !== JSON.stringify(value));

  if (changed && behavior.navigation.changedEarlierAnswerClearsLaterState) {
    clearAfterIndex(session, currentIndex);
  }

  recordResponse(session, {
    itemId:item.id,
    itemRevision:item.revision,
    state,
    value,
    responseTimeMs:Math.max(0, Math.round(performance.now() - questionShownAt))
  });

  saveLocal();
  renderQuestion();
  scheduleAdvance();
};

const renderRanking = (item, existing) => {
  if (existing?.state === "answered" && Array.isArray(existing.value)) {
    rankingOrder = [...existing.value];
  } else {
    rankingOrder = shuffleWithSeed(
      item.options.map((option) => option.id),
      session.randomizationSeed + ":" + item.id + ":ranking"
    );
  }

  const optionMap = new Map(item.options.map((option) => [option.id, option]));

  const redraw = () => {
    const area = $("answer-area");
    area.innerHTML = "";

    const list = document.createElement("div");
    list.className = "ranking-list";

    rankingOrder.forEach((id, index) => {
      const row = document.createElement("div");
      row.className = "rank-row";

      const number = document.createElement("div");
      number.className = "rank-number";
      number.textContent = String(index + 1);

      const label = document.createElement("div");
      label.textContent = optionMap.get(id)?.label ?? id;

      const controls = document.createElement("div");
      controls.className = "rank-controls";

      const up = document.createElement("button");
      up.type = "button";
      up.className = "rank-button";
      up.textContent = "↑";
      up.disabled = index === 0 || advancing;
      up.setAttribute("aria-label", "Move up");
      up.addEventListener("click", () => {
        [rankingOrder[index - 1], rankingOrder[index]] = [rankingOrder[index], rankingOrder[index - 1]];
        redraw();
      });

      const down = document.createElement("button");
      down.type = "button";
      down.className = "rank-button";
      down.textContent = "↓";
      down.disabled = index === rankingOrder.length - 1 || advancing;
      down.setAttribute("aria-label", "Move down");
      down.addEventListener("click", () => {
        [rankingOrder[index + 1], rankingOrder[index]] = [rankingOrder[index], rankingOrder[index + 1]];
        redraw();
      });

      controls.append(up, down);
      row.append(number, label, controls);
      list.append(row);
    });

    const submitButton = document.createElement("button");
    submitButton.type = "button";
    submitButton.className = "primary";
    submitButton.disabled = advancing;
    submitButton.textContent = "Save ranking";
    submitButton.addEventListener("click", () => submit("answered", [...rankingOrder]));

    area.append(list, submitButton);
  };

  redraw();
};

const renderQuestion = () => {
  const entry = packet.entries[currentIndex];
  const item = itemMap().get(entry.itemId);
  const existing = existingResponse(item.id);
  const d = domainMap().get(item.domainId);
  const percent = Math.round(((currentIndex + 1) / packet.entries.length) * 100);

  $("domain-label").textContent = d?.name ?? item.domainId;
  $("progress-text").textContent =
    "Question " + String(currentIndex + 1) + " of " + String(packet.entries.length) + " · " + String(percent) + "%";
  $("progress-bar").value = percent;
  $("question-text").textContent = item.text;
  $("status-pill").textContent = "Pilot session";

  const context = $("question-context");
  context.innerHTML = "";

  if (item.responseType === "paired_choice") {
    for (const option of item.options) {
      const line = document.createElement("div");
      line.className = "context-option";
      line.textContent = option.label;
      context.append(line);
    }
  }

  const answerArea = $("answer-area");
  answerArea.innerHTML = "";
  answerArea.dataset.advancing = String(advancing);

  if (item.responseType === "ranking") {
    renderRanking(item, existing);
  } else {
    let answers;
    if (item.responseType === "likert" || item.responseType === "paired_choice") {
      answers = scaleMap().get(item.responseScaleId).options.map((option) => ({
        label:option.label,
        value:option.value
      }));
    } else {
      answers = item.options.map((option) => ({
        label:option.label,
        value:option.id
      }));
    }

    for (const answer of answers) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "answer-button";
      button.disabled = advancing;
      button.textContent = answer.label;
      if (
        existing?.state === "answered" &&
        JSON.stringify(existing.value) === JSON.stringify(answer.value)
      ) {
        button.classList.add("selected");
      }
      button.addEventListener("click", () => submit("answered", answer.value));
      answerArea.append(button);
    }
  }

  const specialArea = $("special-area");
  specialArea.innerHTML = "";
  specialArea.dataset.advancing = String(advancing);

  for (const state of item.specialStates) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "special-button";
    button.disabled = advancing;
    button.textContent = specialLabel[state] ?? state;
    if (existing?.state === state) button.classList.add("selected");
    button.addEventListener("click", () => submit(state, null));
    specialArea.append(button);
  }

  $("back-button").disabled = advancing || findPrevious(currentIndex - 1) === null;
  $("next-button").disabled = advancing || !currentHasResponse();
};

const startNew = ({ size, seed }) => {
  clearAdvanceTimer();
  packet = generatePilotPacket({
    bank,
    pilot,
    seed,
    size,
    packetId:pilot.pilotId + "-" + seed
  });
  session = createPilotSession({
    pilot,
    packet,
    locale:"en-US",
    clientVersion:"web-0.2",
    sessionId:createSessionId()
  });
  currentIndex = null;
  saveLocal();
  moveTo(findNext(0));
};

const resumeSaved = (saved) => {
  clearAdvanceTimer();
  packet = saved.packet;
  session = saved.session;
  currentIndex = saved.currentIndex;

  if (session.completionStatus === "completed") {
    complete();
    return;
  }

  let index = currentIndex;
  if (index === null || !packet.entries[index]) index = findNext(0);
  else if (!eligibleAt(index)) index = findNext(index + 1);
  moveTo(index);
};

const exportSession = () => {
  const blob = new Blob([JSON.stringify(session, null, 2) + "\n"], { type:"application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "worldview-sorter-" + session.sessionId + ".json";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const renderPresets = () => {
  const grid = $("preset-grid");
  grid.innerHTML = "";
  for (const preset of behavior.presets) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "preset-button";

    const title = document.createElement("strong");
    title.textContent = preset.label;

    const detail = document.createElement("span");
    detail.textContent = String(preset.size) + " questions";

    button.append(title, detail);
    button.addEventListener("click", () => {
      const seed = $("packet-seed").value.trim() || generateSeed();
      $("packet-size").value = preset.size;
      startNew({ size:preset.size, seed });
    });
    grid.append(button);
  }
};

const checkRemote = async () => {
  try {
    const response = await fetch("/api/health", { cache:"no-store" });
    if (!response.ok) return false;
    const health = await response.json();
    return (
      health.status === "ok" &&
      health.pilotId === pilot.pilotId &&
      health.bankVersion === bank.bankVersion &&
      health.instrumentVersion === current.instrument.version
    );
  } catch {
    return false;
  }
};

const bootstrap = async () => {
  current = await fetchJson("data/current.json");
  [pilot, bank, scalesDoc, domains, behavior] = await Promise.all([
    fetchJson(current.pilot.path),
    fetchJson(current.candidateBank.path),
    fetchJson("data/response-scales.json"),
    fetchJson("data/domains.json"),
    fetchJson(current.uiBehavior.path)
  ]);

  autoAdvanceEnabled = behavior.autoAdvance.defaultEnabled;
  $("auto-advance-toggle").checked = autoAdvanceEnabled;

  $("packet-size").min = pilot.administration.allowedPacketSize.min;
  $("packet-size").max = pilot.administration.allowedPacketSize.max;
  $("packet-size").value = pilot.administration.defaultPacketSize;
  $("packet-seed").value = generateSeed();
  $("status-pill").textContent = String(bank.items.length) + "-item bank";

  renderPresets();
  remoteAvailable = await checkRemote();

  const saved = loadSaved();
  if (saved) {
    $("resume-box").classList.remove("hidden");
    $("resume-detail").textContent =
      (saved.session.completionStatus === "completed" ? "Completed" : "In progress") + " · " +
      String(saved.packet.size) + " items · " +
      String(saved.session.responses.length) + " responses saved";
    $("resume-button").onclick = () => resumeSaved(saved);
    $("discard-button").onclick = () => {
      clearLocal();
      $("resume-box").classList.add("hidden");
    };
  }

  $("start-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const size = Number($("packet-size").value);
    const seed = $("packet-seed").value.trim() || generateSeed();
    startNew({ size, seed });
  });

  $("back-button").addEventListener("click", () => {
    clearAdvanceTimer();
    const previous = findPrevious(currentIndex - 1);
    if (previous !== null) moveTo(previous);
  });

  $("next-button").addEventListener("click", advanceFromCurrent);

  $("auto-advance-toggle").addEventListener("change", () => {
    autoAdvanceEnabled = $("auto-advance-toggle").checked;
    if (!autoAdvanceEnabled) clearAdvanceTimer();
  });

  $("retry-submit-button").addEventListener("click", async () => {
    remoteAvailable = await checkRemote();
    await submitRemoteSession();
  });

  $("export-button").addEventListener("click", exportSession);

  $("restart-button").addEventListener("click", () => {
    clearAdvanceTimer();
    clearLocal();
    packet = null;
    session = null;
    currentIndex = null;
    $("packet-seed").value = generateSeed();
    $("resume-box").classList.add("hidden");
    $("status-pill").textContent = String(bank.items.length) + "-item bank";
    show("start-screen");
  });

  show("start-screen");
};

bootstrap().catch((error) => {
  console.error(error);
  $("error-message").textContent = error?.stack ?? String(error);
  $("status-pill").textContent = "Error";
  show("error-screen");
});
