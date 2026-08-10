// index.js
// VoiceFarmPanel - formato Replugged/Revenge (module.exports.start/stop)

const CONFIG = {
  channelId: "1532113648447787068",
  maxAttempts: 6,
  attemptDelayMs: 1200
};

let isFarming = false;
let hasJoined = false;
let attemptCount = 0;

function updateStatus(text) {
  const statusEl = document.getElementById("farm-status");
  if (statusEl) statusEl.innerText = "Status: " + text;
  else console.log("[Farm] status:", text);
}

function getWebpackModules() {
  try {
    const forced = window.webpackChunkdiscord_app?.push?.([[], {}, e => e])?.c;
    if (forced) return Object.values(forced);
    const chunks = window.webpackChunkdiscord_app || [];
    for (const chunk of chunks) {
      if (chunk && chunk[1]) return Object.values(chunk[1]);
    }
  } catch (e) {
    console.debug("[Farm] getWebpackModules erro", e);
  }
  return [];
}

function findVoiceModule() {
  const modules = getWebpackModules();
  for (const m of modules) {
    try {
      const ex = m?.exports || m;
      if (!ex) continue;
      if (ex.joinVoiceChannel || ex.leaveVoiceChannel || ex.join || ex.leave) return ex;
      if (ex.default && (ex.default.joinVoiceChannel || ex.default.leaveVoiceChannel || ex.default.join || ex.default.leave)) return ex.default;
      for (const k of Object.keys(ex)) {
        const candidate = ex[k];
        if (candidate && (candidate.joinVoiceChannel || candidate.leaveVoiceChannel || candidate.join || candidate.leave)) return candidate;
      }
    } catch (e) {}
  }
  return null;
}

function tryCallJoin(voiceMod) {
  try {
    if (!voiceMod) return false;
    if (typeof voiceMod.join === "function") { voiceMod.join(CONFIG.channelId); return true; }
    if (typeof voiceMod.joinVoiceChannel === "function") { voiceMod.joinVoiceChannel(CONFIG.channelId); return true; }
    if (voiceMod.voice && typeof voiceMod.voice.join === "function") { voiceMod.voice.join(CONFIG.channelId); return true; }
    return false;
  } catch (e) { console.error("[Farm] erro ao chamar join:", e); return false; }
}

function tryCallLeave(voiceMod) {
  try {
    if (!voiceMod) return false;
    if (typeof voiceMod.leave === "function") { voiceMod.leave(); return true; }
    if (typeof voiceMod.leaveVoiceChannel === "function") { voiceMod.leaveVoiceChannel(); return true; }
    if (voiceMod.voice && typeof voiceMod.voice.leave === "function") { voiceMod.voice.leave(); return true; }
    return false;
  } catch (e) { console.error("[Farm] erro ao chamar leave:", e); return false; }
}

function joinVoice() {
  attemptCount = 0;
  updateStatus("Conectando...");
  if (window.bunny?.voice?.join) {
    try { window.bunny.voice.join(CONFIG.channelId); hasJoined = true; updateStatus("Conectado (via Bunny)"); console.log("[Farm] Entrou via Bunny API."); return; }
    catch (e) { console.warn("[Farm] Bunny join falhou:", e); }
  }
  const tryOnce = () => {
    attemptCount++;
    updateStatus(`Conectando... (${attemptCount}/${CONFIG.maxAttempts})`);
    const vm = findVoiceModule();
    if (vm && tryCallJoin(vm)) { hasJoined = true; updateStatus("Conectado"); console.log("[Farm] Entrou na call via módulo interno."); return; }
    if (attemptCount < CONFIG.maxAttempts) setTimeout(tryOnce, CONFIG.attemptDelayMs);
    else { updateStatus("Erro: módulo de voz não encontrado"); console.error("[Farm] Falha ao localizar módulo de voz."); }
  };
  tryOnce();
}

function leaveVoice() {
  if (window.bunny?.voice?.leave) {
    try { window.bunny.voice.leave(); hasJoined = false; updateStatus("Desconectado (via Bunny)"); console.log("[Farm] Saiu via Bunny API."); return; }
    catch (e) { console.warn("[Farm] Bunny leave falhou:", e); }
  }
  const vm = findVoiceModule();
  if (vm && tryCallLeave(vm)) { hasJoined = false; updateStatus("Desconectado"); console.log("[Farm] Saiu da call via módulo interno."); }
  else { updateStatus("Erro: não foi possível sair"); console.error("[Farm] Não encontrou método para sair do canal."); }
}

function createPanel() {
  const old = document.getElementById("farm-panel");
  if (old) old.remove();
  const panel = document.createElement("div");
  panel.id = "farm-panel";
  panel.style.cssText = `
    position: fixed;
    bottom: 80px;
    right: 20px;
    width: 220px;
    background: #1e1e2e;
    border: 1px solid #444;
    border-radius: 12px;
    padding: 16px;
    color: #fff;
    font-family: 'Segoe UI', sans-serif;
    font-size: 14px;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.6);
  `;
  panel.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
      <strong style="color:#a6e3a1;">🎙️ Farm Panel</strong>
      <span id="farm-status" style="font-size:12px; color:#cdd6f4;">Status: Desativado</span>
    </div>
    <button id="farm-toggle" style="
      width:100%;
      padding:8px;
      background: #585b70;
      border: none;
      border-radius:6px;
      color:#fff;
      font-weight:bold;
      cursor:pointer;
      transition:0.2s;
    ">Ligar</button>
    <div style="margin-top:10px; font-size:11px; color:#a6adc8; text-align:center;">
      <span id="farm-detail">Clique para ativar</span>
    </div>
  `;
  document.body.appendChild(panel);
  const toggleBtn = document.getElementById("farm-toggle");
  toggleBtn.addEventListener("click", () => {
    isFarming = !isFarming;
    if (isFarming) {
      toggleBtn.innerText = "Desligar";
      toggleBtn.style.background = "#f38ba8";
      document.getElementById("farm-detail").innerText = "Farm ativo (conectando...)";
      joinVoice();
    } else {
      toggleBtn.innerText = "Ligar";
      toggleBtn.style.background = "#585b70";
      document.getElementById("farm-detail").innerText = "Farm desativado";
      leaveVoice();
    }
  });
  updateStatus("Desativado");
}

function removePanel() {
  const panel = document.getElementById("farm-panel");
  if (panel) panel.remove();
}

// Replugged/Revenge plugin interface
module.exports = {
  start() {
    createPanel();
    console.log("[Farm] Plugin ativado (start).");
  },
  stop() {
    leaveVoice();
    removePanel();
    console.log("[Farm] Plugin desativado (stop).");
  }
};
