import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const nomeUsuario = document.getElementById("nomeUsuario");
const bandeiraUsuario = document.getElementById("bandeiraUsuario");
const statusBolao = document.getElementById("statusBolao");
const mensagemBolao = document.getElementById("mensagemBolao");
const btnSair = document.getElementById("btnSair");

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    await carregarDadosUsuario(user.uid);
    await carregarStatusBolao();
});

async function carregarDadosUsuario(uid) {
    try {
        const usuarioRef = doc(db, "usuarios", uid);
        const usuarioSnap = await getDoc(usuarioRef);

        if (!usuarioSnap.exists()) {
            nomeUsuario.textContent = "Usuário!";
            bandeiraUsuario.src = "assets/Icon/TBD.png";
            return;
        }

        const usuario = usuarioSnap.data();

        nomeUsuario.textContent = `${usuario.nome || usuario.usuario || "Usuário"}!`;

        const bandeira = usuario.bandeira || "TBD";
        bandeiraUsuario.src = `assets/Icon/${bandeira}.png`;

        bandeiraUsuario.onerror = () => {
            bandeiraUsuario.src = "assets/Icon/TBD.png";
        };

    } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);

        nomeUsuario.textContent = "Usuário!";
        bandeiraUsuario.src = "assets/Icon/TBD.png";
    }
}

async function carregarStatusBolao() {
    try {
        const configRef = doc(db, "configuracoes", "bolao");
        const configSnap = await getDoc(configRef);

        if (!configSnap.exists()) {
            statusBolao.textContent = "Em preparação";
            mensagemBolao.textContent = "O administrador ainda não configurou a abertura dos palpites.";
            return;
        }

        const config = configSnap.data();

        if (config.bolaoAberto) {
            statusBolao.textContent = "Aberto para palpites";
            mensagemBolao.textContent = "Você já pode registrar ou ajustar seus palpites enquanto o bolão estiver aberto.";
        } else {
            statusBolao.textContent = "Fechado para palpites";
            mensagemBolao.textContent = "Os palpites estão fechados no momento. Acompanhe os resultados e o ranking.";
        }

    } catch (error) {
        console.error("Erro ao carregar status do bolão:", error);

        statusBolao.textContent = "Indisponível";
        mensagemBolao.textContent = "Não foi possível carregar o status do bolão agora.";
    }
}

btnSair?.addEventListener("click", async () => {
    try {
        await signOut(auth);
        window.location.href = "login.html";
    } catch (error) {
        console.error("Erro ao sair:", error);
        alert("Não foi possível sair. Tente novamente.");
    }
});