import { auth } from "./firebase.js";
import { calcularPontuacaoTodosUsuarios } from "./pontuacao.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const totalParticipantes = document.getElementById("totalParticipantes");
const liderAtual = document.getElementById("liderAtual");
const maiorPontuacao = document.getElementById("maiorPontuacao");
const listaRanking = document.getElementById("listaRanking");
const btnAtualizarRanking = document.getElementById("btnAtualizarRanking");
const btnSair = document.getElementById("btnSair");

let rankingAtual = [];

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    await carregarRanking();
});

async function carregarRanking() {
    try {
        listaRanking.innerHTML = `
            <div class="loading-card">
                Calculando pontuação...
            </div>
        `;

        btnAtualizarRanking.disabled = true;
        btnAtualizarRanking.textContent = "Atualizando...";

        rankingAtual = await calcularPontuacaoTodosUsuarios({ salvar: false });

        atualizarResumo();
        renderizarRanking();

        btnAtualizarRanking.disabled = false;
        btnAtualizarRanking.textContent = "Atualizar ranking";

    } catch (error) {
        console.error("Erro ao carregar ranking:", error);

        listaRanking.innerHTML = `
            <div class="erro-card">
                Não foi possível carregar os placares. Verifique se o arquivo pontuacao.js existe e se as permissões do Firebase estão corretas.
            </div>
        `;

        totalParticipantes.textContent = "0";
        liderAtual.textContent = "--";
        maiorPontuacao.textContent = "0";

        btnAtualizarRanking.disabled = false;
        btnAtualizarRanking.textContent = "Tentar novamente";
    }
}

function atualizarResumo() {
    totalParticipantes.textContent = rankingAtual.length;

    if (rankingAtual.length === 0) {
        liderAtual.textContent = "--";
        maiorPontuacao.textContent = "0";
        return;
    }

    const lider = rankingAtual[0];

    liderAtual.textContent = lider.nome || lider.usuario || "Participante";
    maiorPontuacao.textContent = lider.pontos || 0;
}

function renderizarRanking() {
    if (!rankingAtual || rankingAtual.length === 0) {
        listaRanking.innerHTML = `
            <div class="empty-card">
                Nenhum participante encontrado no ranking.
            </div>
        `;
        return;
    }

    listaRanking.innerHTML = rankingAtual.map((item, index) => {
        return criarCardRanking(item, index);
    }).join("");
}

function criarCardRanking(item, index) {
    const posicao = index + 1;
    const classePodio = obterClassePodio(posicao);
    const nome = item.nome || item.usuario || "Participante";
    const usuario = item.usuario ? `@${item.usuario}` : "Participante";
    const bandeira = item.bandeira || "TBD";
    const pontos = item.pontos || 0;

    const pontuacao = item.pontuacao || {};
    const grupos = pontuacao.grupos || 0;
    const melhoresTerceiros = pontuacao.melhoresTerceiros || 0;
    const mataMata = pontuacao.mataMata || 0;
    const top3 = pontuacao.top3 || 0;
    const bonus = pontuacao.bonus || 0;

    return `
        <article class="ranking-card ${classePodio}">
            <div class="ranking-posicao">
                ${obterIconePosicao(posicao)}
            </div>

            <div class="ranking-usuario">
                <img src="assets/Icon/${bandeira}.png" 
                     alt="${nome}"
                     onerror="this.src='assets/Icon/TBD.png'">

                <div class="ranking-info">
                    <h3>${nome}</h3>
                    <span>${usuario}</span>
                </div>
            </div>

            <div class="ranking-pontos">
                <strong>${pontos}</strong>
                <span>pontos</span>
            </div>

            <div class="ranking-detalhes">
                <div class="detalhe-ponto">
                    <strong>${grupos}</strong>
                    <span>Grupos</span>
                </div>

                <div class="detalhe-ponto">
                    <strong>${melhoresTerceiros}</strong>
                    <span>3º lugares</span>
                </div>

                <div class="detalhe-ponto">
                    <strong>${mataMata}</strong>
                    <span>Mata-mata</span>
                </div>

                <div class="detalhe-ponto">
                    <strong>${top3}</strong>
                    <span>Top 3</span>
                </div>

                <div class="detalhe-ponto">
                    <strong>${bonus}</strong>
                    <span>Bônus</span>
                </div>
            </div>
        </article>
    `;
}

function obterClassePodio(posicao) {
    if (posicao === 1) return "podio-1";
    if (posicao === 2) return "podio-2";
    if (posicao === 3) return "podio-3";
    return "";
}

function obterIconePosicao(posicao) {
    if (posicao === 1) return "1º";
    if (posicao === 2) return "2º";
    if (posicao === 3) return "3º";
    return `${posicao}º`;
}

btnAtualizarRanking?.addEventListener("click", carregarRanking);

btnSair?.addEventListener("click", async () => {
    try {
        await signOut(auth);
        window.location.href = "login.html";
    } catch (error) {
        console.error("Erro ao sair:", error);
        alert("Não foi possível sair. Tente novamente.");
    }
});