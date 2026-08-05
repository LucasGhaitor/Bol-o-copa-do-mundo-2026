import { auth, db } from "./firebase.js";
import { partidas } from "./partidas-data.js";

import {
    obterConfrontos16AvosPorLado,
    obterPartidasPorFaseMataMata,
    obterResumoFinalMataMata
} from "./mata-mata-oficial.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* =====================================================
   ELEMENTOS DA TELA
===================================================== */

const ladoEsquerdo16Avos =
    document.getElementById("ladoEsquerdo16Avos");

const ladoDireito16Avos =
    document.getElementById("ladoDireito16Avos");

const faseOitavas =
    document.getElementById("faseOitavas");

const faseQuartas =
    document.getElementById("faseQuartas");

const faseSemifinais =
    document.getElementById("faseSemifinais");

const faseFinal =
    document.getElementById("faseFinal");

const campeaoBox =
    document.getElementById("campeaoBox");

const viceBox =
    document.getElementById("viceBox");

const terceiroBox =
    document.getElementById("terceiroBox");

const btnSair =
    document.getElementById("btnSair");

/* =====================================================
   ESTADO
===================================================== */

let resultadosPorJogo = {};
let carregandoPagina = false;

/* =====================================================
   AUTENTICAÇÃO
===================================================== */

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    await iniciarPagina();
});

/* =====================================================
   INICIALIZAÇÃO
===================================================== */

async function iniciarPagina() {
    if (carregandoPagina) {
        return;
    }

    carregandoPagina = true;

    try {
        definirEstadoCarregando();

        await carregarResultados();

        renderizar16Avos();
        renderizarProximasFases();
        renderizarResumoFinal();

        configurarEventos();

    } catch (error) {
        console.error(
            "Erro ao carregar mata-mata:",
            error
        );

        renderizarErroGeral();

    } finally {
        carregandoPagina = false;
    }
}

function definirEstadoCarregando() {
    const loading = `
        <div class="loading-chave">
            Carregando chaveamento...
        </div>
    `;

    if (ladoEsquerdo16Avos) {
        ladoEsquerdo16Avos.innerHTML = loading;
    }

    if (ladoDireito16Avos) {
        ladoDireito16Avos.innerHTML = loading;
    }

    [
        faseOitavas,
        faseQuartas,
        faseSemifinais,
        faseFinal
    ].forEach((elemento) => {
        if (elemento) {
            elemento.innerHTML = `
                <div class="loading-chave">
                    Aguardando classificados...
                </div>
            `;
        }
    });
}

function configurarEventos() {
    btnSair?.removeEventListener(
        "click",
        sair
    );

    btnSair?.addEventListener(
        "click",
        sair
    );
}

/* =====================================================
   RESULTADOS
===================================================== */

async function carregarResultados() {
    const resultadosSnapshot =
        await getDocs(
            collection(db, "resultados")
        );

    resultadosPorJogo = {};

    resultadosSnapshot.forEach((documento) => {
        const dados = documento.data();

        resultadosPorJogo[documento.id] =
            dados;

        if (dados.jogoId !== undefined) {
            resultadosPorJogo[
                `jogo_${dados.jogoId}`
            ] = dados;

            resultadosPorJogo[
                String(dados.jogoId)
            ] = dados;
        }
    });
}

function obterResultadoSalvo(jogoId) {
    return (
        resultadosPorJogo[`jogo_${jogoId}`] ||
        resultadosPorJogo[String(jogoId)] ||
        null
    );
}

/* =====================================================
   16 AVOS — CHAVEAMENTO PRINCIPAL
===================================================== */

function renderizar16Avos() {
    const {
        ladoEsquerdo,
        ladoDireito
    } = obterConfrontos16AvosPorLado(
        partidas,
        resultadosPorJogo
    );

    if (ladoEsquerdo16Avos) {
        ladoEsquerdo16Avos.innerHTML =
            ladoEsquerdo.length > 0
                ? ladoEsquerdo
                    .map((partida) => {
                        return criarConfrontoPrincipal(
                            partida,
                            "esquerdo"
                        );
                    })
                    .join("")
                : criarEstadoVazio(
                    "Nenhum confronto encontrado."
                );
    }

    if (ladoDireito16Avos) {
        ladoDireito16Avos.innerHTML =
            ladoDireito.length > 0
                ? ladoDireito
                    .map((partida) => {
                        return criarConfrontoPrincipal(
                            partida,
                            "direito"
                        );
                    })
                    .join("")
                : criarEstadoVazio(
                    "Nenhum confronto encontrado."
                );
    }
}

function criarConfrontoPrincipal(
    partida,
    lado
) {
    const mandante = {
        nome:
            partida.mandante ||
            "A definir",

        codigo:
            partida.bandeiraMandante ||
            "TBD"
    };

    const visitante = {
        nome:
            partida.visitante ||
            "A definir",

        codigo:
            partida.bandeiraVisitante ||
            "TBD"
    };

    return `
        <article
            class="confronto-chave"
            data-jogo-id="${partida.id}"
            data-lado="${lado}"
        >
            ${criarTimePrincipal(mandante)}

            ${criarTimePrincipal(visitante)}
        </article>
    `;
}

function criarTimePrincipal(time) {
    const codigo =
        normalizarCodigo(time?.codigo);

    const nome =
        time?.nome || "A definir";

    const indefinido =
        codigo === "TBD" ||
        normalizarTexto(nome).includes("definir") ||
        normalizarTexto(nome).includes("vencedor") ||
        normalizarTexto(nome).includes("perdedor");

    return `
        <div class="time-chave ${indefinido ? "a-definir" : ""}">
            <img
                src="assets/Icon/${escaparHTML(codigo)}.png"
                alt="${escaparHTML(nome)}"
                onerror="this.onerror=null; this.src='assets/Icon/TBD.png'"
            >

            <strong>
                ${escaparHTML(nome)}
            </strong>
        </div>
    `;
}

/* =====================================================
   PRÓXIMAS FASES
===================================================== */

function renderizarProximasFases() {
    renderizarFase(
        faseOitavas,
        "Oitavas",
        "Aguardando vencedores dos 16 avos..."
    );

    renderizarFase(
        faseQuartas,
        "Quartas",
        "Aguardando vencedores das oitavas..."
    );

    renderizarFase(
        faseSemifinais,
        "Semifinais",
        "Aguardando vencedores das quartas..."
    );

    renderizarFase(
        faseFinal,
        "Final",
        "Aguardando finalistas..."
    );
}

function renderizarFase(
    elemento,
    fase,
    mensagemVazio
) {
    if (!elemento) {
        return;
    }

    const partidasDaFase =
        obterPartidasPorFaseMataMata(
            partidas,
            resultadosPorJogo,
            fase
        );

    if (
        !Array.isArray(partidasDaFase) ||
        partidasDaFase.length === 0
    ) {
        elemento.innerHTML =
            criarEstadoVazio(mensagemVazio);

        return;
    }

    elemento.innerHTML =
        partidasDaFase
            .map((partida) => {
                return criarConfrontoMini(partida);
            })
            .join("");
}

function criarConfrontoMini(partida) {
    const mandante = {
        nome:
            partida.mandante ||
            "A definir",

        codigo:
            partida.bandeiraMandante ||
            "TBD"
    };

    const visitante = {
        nome:
            partida.visitante ||
            "A definir",

        codigo:
            partida.bandeiraVisitante ||
            "TBD"
    };

    return `
        <article
            class="confronto-mini"
            data-jogo-id="${partida.id}"
        >
            <div class="confronto-mini-numero">
                <span>
                    Jogo ${partida.id}
                </span>

                <span>
                    ${escaparHTML(partida.fase || "")}
                </span>
            </div>

            ${criarTimeMini(mandante)}
            ${criarTimeMini(visitante)}
        </article>
    `;
}

function criarTimeMini(time) {
    const codigo =
        normalizarCodigo(time?.codigo);

    const nome =
        time?.nome || "A definir";

    const indefinido =
        codigo === "TBD" ||
        normalizarTexto(nome).includes("definir") ||
        normalizarTexto(nome).includes("vencedor") ||
        normalizarTexto(nome).includes("perdedor");

    return `
        <div class="time-mini ${indefinido ? "a-definir" : ""}">
            <img
                src="assets/Icon/${escaparHTML(codigo)}.png"
                alt="${escaparHTML(nome)}"
                onerror="this.onerror=null; this.src='assets/Icon/TBD.png'"
            >

            <strong>
                ${escaparHTML(nome)}
            </strong>
        </div>
    `;
}

/* =====================================================
   CAMPEÃO / VICE / TERCEIRO
===================================================== */

function renderizarResumoFinal() {
    const {
        campeao,
        vice,
        terceiro
    } = obterResumoFinalMataMata(
        partidas,
        resultadosPorJogo
    );

    renderizarBoxFinal(
        campeaoBox,
        campeao,
        "Aguardando finalização da grande final."
    );

    renderizarBoxFinal(
        viceBox,
        vice,
        "Será definido após a final."
    );

    renderizarBoxFinal(
        terceiroBox,
        terceiro,
        "Será definido após a disputa de 3º lugar."
    );
}

function renderizarBoxFinal(
    elemento,
    time,
    mensagem
) {
    if (!elemento) {
        return;
    }

    if (!time) {
        elemento.innerHTML = `
            <img
                src="assets/Icon/TBD.png"
                alt="A definir"
            >

            <strong>
                A definir
            </strong>
        `;

        return;
    }

    const codigo =
        normalizarCodigo(time.codigo);

    const nome =
        time.nome || "A definir";

    elemento.innerHTML = `
        <img
            src="assets/Icon/${escaparHTML(codigo)}.png"
            alt="${escaparHTML(nome)}"
            onerror="this.onerror=null; this.src='assets/Icon/TBD.png'"
        >

        <strong>
            ${escaparHTML(nome)}
        </strong>
    `;
}

/* =====================================================
   ERRO
===================================================== */

function renderizarErroGeral() {
    const erro = `
        <div class="estado-vazio">
            Não foi possível carregar o chaveamento.
            Atualize a página e tente novamente.
        </div>
    `;

    if (ladoEsquerdo16Avos) {
        ladoEsquerdo16Avos.innerHTML = erro;
    }

    if (ladoDireito16Avos) {
        ladoDireito16Avos.innerHTML = erro;
    }
}

function criarEstadoVazio(mensagem) {
    return `
        <div class="loading-chave">
            ${escaparHTML(mensagem)}
        </div>
    `;
}

/* =====================================================
   SAIR
===================================================== */

async function sair() {
    try {
        if (btnSair) {
            btnSair.disabled = true;
            btnSair.textContent = "SAINDO...";
        }

        await signOut(auth);

        window.location.href = "login.html";

    } catch (error) {
        console.error(
            "Erro ao sair:",
            error
        );

        if (btnSair) {
            btnSair.disabled = false;
            btnSair.textContent = "SAIR";
        }

        alert(
            "Não foi possível sair. Tente novamente."
        );
    }
}

/* =====================================================
   HELPERS
===================================================== */

function normalizarCodigo(codigo) {
    if (!codigo) {
        return "TBD";
    }

    return String(codigo)
        .trim()
        .toUpperCase();
}

function normalizarTexto(valor) {
    return String(valor || "")
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .trim();
}

function escaparHTML(valor) {
    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}