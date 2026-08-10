import { assets, patcher, storage } from '@revenge-mod/api'
import { findByPropsLazy, findByTypeNameLazy } from '@revenge-mod/metro'
import { toasts } from '@revenge-mod/ui'
import { IconButton } from 'shared:components'

const CONFIG = {
    channelId: "1532113648447787068"
};

let isFarming = false;
let hasJoined = false;
let unpatches = [];

// Função para entrar na call usando a API do Revenge
function joinVoice() {
    try {
        const voiceModule = findByPropsLazy('joinVoiceChannel');
        if (voiceModule?.joinVoiceChannel) {
            voiceModule.joinVoiceChannel(CONFIG.channelId);
            hasJoined = true;
            updateStatus("Conectado");
            console.log("[Farm] Entrou na call.");
        } else {
            updateStatus("Erro: módulo de voz não encontrado");
        }
    } catch (e) {
        updateStatus("Erro ao conectar");
        console.error("[Farm] Erro:", e);
    }
}

function leaveVoice() {
    try {
        const voiceModule = findByPropsLazy('leaveVoiceChannel');
        if (voiceModule?.leaveVoiceChannel) {
            voiceModule.leaveVoiceChannel();
            hasJoined = false;
            updateStatus("Desconectado");
            console.log("[Farm] Saiu da call.");
        } else {
            updateStatus("Erro: não foi possível sair");
        }
    } catch (e) {
        console.error("[Farm] Erro ao sair:", e);
    }
}

function updateStatus(text) {
    const statusEl = document.getElementById("farm-status");
    if (statusEl) statusEl.innerText = "Status: " + text;
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

// 🔥 Ciclo de vida usando API Revenge (igual ao Better Calls)
export default {
    start: () => {
        createPanel();
        console.log("[Farm] Plugin iniciado.");
    },
    stop: () => {
        // Remove o painel
        const panel = document.getElementById("farm-panel");
        if (panel) panel.remove();
        
        // Remove todos os patches (se houver)
        for (const unpatch of unpatches) {
            if (typeof unpatch === 'function') unpatch();
        }
        unpatches = [];
        
        console.log("[Farm] Plugin parado.");
    }
};
