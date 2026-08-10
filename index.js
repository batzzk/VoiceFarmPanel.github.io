let isFakeMute = false;
let originalMuteState = false;

// Função para ativar/desativar o fake mute
function toggleFakeMute() {
    isFakeMute = !isFakeMute;
    
    try {
        // Tenta achar o módulo de voz
        const modules = Object.values(webpackChunkdiscord_app?.push?.([[], {}, e => e])?.c || {});
        const voiceMod = modules.find(m => m?.exports?.setSelfMute);
        
        if (voiceMod) {
            if (isFakeMute) {
                // Salva o estado real e força mute = true (mas sem enviar pro servidor)
                originalMuteState = voiceMod.exports.isSelfMute?.() || false;
                voiceMod.exports.setSelfMute(true);
                updateStatus("🔇 Fake Mute ATIVO");
                console.log("[FakeMute] Ativado - você parece mutado mas não está.");
            } else {
                // Restaura o estado real
                voiceMod.exports.setSelfMute(originalMuteState);
                updateStatus("🔊 Fake Mute DESATIVADO");
                console.log("[FakeMute] Desativado - estado real restaurado.");
            }
        } else {
            updateStatus("❌ Erro: módulo de voz não encontrado");
        }
    } catch (e) {
        updateStatus("❌ Erro ao alternar");
        console.error("[FakeMute] Erro:", e);
    }
}

function updateStatus(text) {
    const statusEl = document.getElementById("fake-mute-status");
    if (statusEl) statusEl.innerText = text;
}

function createPanel() {
    const old = document.getElementById("fake-mute-panel");
    if (old) old.remove();

    const panel = document.createElement("div");
    panel.id = "fake-mute-panel";
    panel.style.cssText = `
        position: fixed;
        bottom: 150px;
        right: 20px;
        width: 200px;
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
            <strong style="color:#f9e2af;">🎭 Fake Mute</strong>
            <span id="fake-mute-status" style="font-size:12px; color:#cdd6f4;">🔊 Desativado</span>
        </div>
        <button id="fake-mute-toggle" style="
            width:100%;
            padding:8px;
            background: #585b70;
            border: none;
            border-radius:6px;
            color:#fff;
            font-weight:bold;
            cursor:pointer;
            transition:0.2s;
        ">Ativar Fake Mute</button>
        <div style="margin-top:10px; font-size:11px; color:#a6adc8; text-align:center;">
            <span>Você parece mutado, mas não está</span>
        </div>
    `;

    document.body.appendChild(panel);

    const toggleBtn = document.getElementById("fake-mute-toggle");
    toggleBtn.addEventListener("click", () => {
        toggleFakeMute();
        toggleBtn.innerText = isFakeMute ? "Desativar Fake Mute" : "Ativar Fake Mute";
        toggleBtn.style.background = isFakeMute ? "#f38ba8" : "#585b70";
    });
}

// 🔥 Ciclo de vida
export default {
    start: () => {
        createPanel();
        console.log("[FakeMute] Plugin iniciado.");
    },
    stop: () => {
        // Restaura o mute real ao desativar
        if (isFakeMute) {
            try {
                const modules = Object.values(webpackChunkdiscord_app?.push?.([[], {}, e => e])?.c || {});
                const voiceMod = modules.find(m => m?.exports?.setSelfMute);
                if (voiceMod) {
                    voiceMod.exports.setSelfMute(originalMuteState);
                }
            } catch (e) {}
            isFakeMute = false;
        }
        const panel = document.getElementById("fake-mute-panel");
        if (panel) panel.remove();
        console.log("[FakeMute] Plugin parado.");
    }
};
