import { auth, db } from "./firebase.js";
import { partidas } from "./partidas-data.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const mensagemStatus = document.getElementById("mensagemStatus");
const avisoMata = document.getElementById("avisoMata");
const btnSalvarMataMata = document.getElementById("btnSalvarMataMata");
const listaTerceiros = document.getElementById("listaTerceiros");
const contadorTerceiros = document.getElementById("contadorTerceiros");
const bracketMataMata = document.getElementById("bracketMataMata");
const resumoTop3 = document.getElementById("resumoTop3");
const btnSair = document.getElementById("btnSair");

const letrasGrupos = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

let usuarioAtual = null;
let bolaoAberto = false;
let palpite = null;
let timesPorCodigo = {};
let melhoresTerceiros = [];
let escolhas = {};

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    usuarioAtual = user;
    await iniciarTela();
});

async function iniciarTela() {
    try {
        await carregarStatusBolao();
        await carregarPalpiteUsuario();

        const gruposNormalizados = normalizarGruposDoPalpite();

        if (!gruposNormalizados) {
            listaTerceiros.innerHTML = `
                <div class="erro-card">
                    Você precisa salvar primeiro os palpites da fase de grupos.
                    Acesse a tela "Palpite dos Grupos" antes de montar o mata-mata.
                </div>
            `;

            bracketMataMata.innerHTML = `
                <div class="empty-card">
                    O chaveamento será liberado após salvar os grupos.
                </div>
            `;

            btnSalvarMataMata.disabled = true;
            return;
        }

        palpite.grupos = gruposNormalizados;

        montarCatalogoTimes();
        carregarDadosSalvos();

        renderizarTerceiros();
        renderizarBracket();
        renderizarResumoFinal();
        atualizarEstadoTela();

    } catch (error) {
        console.error("Erro ao carregar mata-mata:", error);

        listaTerceiros.innerHTML = `
            <div class="erro-card">
                Não foi possível carregar o mata-mata.
            </div>
        `;

        bracketMataMata.innerHTML = `
            <div class="erro-card">
                Não foi possível montar o chaveamento.
            </div>
        `;
    }
}

async function carregarStatusBolao() {
    const configRef = doc(db, "configuracoes", "bolao");
    const configSnap = await getDoc(configRef);

    if (!configSnap.exists()) {
        bolaoAberto = false;
        mensagemStatus.textContent = "O administrador ainda não configurou a abertura dos palpites.";
        return;
    }

    const config = configSnap.data();
    bolaoAberto = config.bolaoAberto === true;

    if (bolaoAberto) {
        mensagemStatus.textContent = "Os palpites estão abertos. Escolha os terceiros, avance os times e salve seu mata-mata.";
    } else {
        mensagemStatus.textContent = "Os palpites estão fechados. Você pode visualizar suas escolhas, mas não pode alterar.";
    }
}

async function carregarPalpiteUsuario() {
    const palpiteRef = doc(db, "palpites", usuarioAtual.uid);
    const palpiteSnap = await getDoc(palpiteRef);

    palpite = palpiteSnap.exists() ? palpiteSnap.data() : null;
}

/* =========================
   NORMALIZAÇÃO DOS GRUPOS
========================= */

function normalizarGruposDoPalpite() {
    if (!palpite) {
        return null;
    }

    if (palpite.grupos && Object.keys(palpite.grupos).length > 0) {
        return palpite.grupos;
    }

    if (!palpite.gruposOrdenados || Object.keys(palpite.gruposOrdenados).length === 0) {
        return null;
    }

    const gruposNormalizados = {};

    Object.entries(palpite.gruposOrdenados).forEach(([nomeGrupo, codigos]) => {
        if (!Array.isArray(codigos)) return;

        const ordemCompleta = codigos.map((codigo, index) => {
            return {
                posicao: index + 1,
                codigo,
                nome: buscarNomeTimePorCodigo(codigo)
            };
        });

        gruposNormalizados[nomeGrupo] = {
            primeiro: ordemCompleta[0]?.codigo || null,
            segundo: ordemCompleta[1]?.codigo || null,
            terceiro: ordemCompleta[2]?.codigo || null,
            quarto: ordemCompleta[3]?.codigo || null,
            ordemCompleta
        };
    });

    return gruposNormalizados;
}

function buscarNomeTimePorCodigo(codigo) {
    if (!codigo) return "A definir";

    const jogosGrupos = partidas.filter((partida) => partida.fase === "Fase de Grupos");

    for (const partida of jogosGrupos) {
        if (partida.bandeiraMandante === codigo) {
            return partida.mandante;
        }

        if (partida.bandeiraVisitante === codigo) {
            return partida.visitante;
        }
    }

    return codigo;
}

function montarCatalogoTimes() {
    timesPorCodigo = {};

    Object.values(palpite.grupos || {}).forEach((grupo) => {
        const ordem = grupo.ordemCompleta || [];

        ordem.forEach((time) => {
            if (time?.codigo) {
                timesPorCodigo[time.codigo] = {
                    codigo: time.codigo,
                    nome: time.nome || buscarNomeTimePorCodigo(time.codigo)
                };
            }
        });
    });
}

function carregarDadosSalvos() {
    melhoresTerceiros = palpite?.mataMata?.melhoresTerceiros || [];
    escolhas = palpite?.mataMata?.escolhas || {};
}

/* =========================
   TERCEIROS
========================= */

function obterTerceirosDosGrupos() {
    return letrasGrupos.map((letra) => {
        const grupo = palpite.grupos[`Grupo ${letra}`];

        if (!grupo) return null;

        const terceiroCodigo = grupo.terceiro;

        if (!terceiroCodigo) return null;

        const time = timesPorCodigo[terceiroCodigo];

        return {
            grupo: letra,
            codigo: terceiroCodigo,
            nome: time?.nome || buscarNomeTimePorCodigo(terceiroCodigo)
        };
    }).filter(Boolean);
}

function renderizarTerceiros() {
    const terceiros = obterTerceirosDosGrupos();

    if (terceiros.length === 0) {
        listaTerceiros.innerHTML = `
            <div class="empty-card">
                Não encontramos os terceiros colocados. Volte em grupos e salve novamente seus palpites.
            </div>
        `;
        return;
    }

    listaTerceiros.innerHTML = terceiros.map((time) => {
        const selecionado = melhoresTerceiros.includes(time.grupo);
        const bloqueado = !bolaoAberto;

        return `
            <label class="terceiro-opcao ${selecionado ? "selecionado" : ""} ${bloqueado ? "bloqueado" : ""}">
                <input 
                    type="checkbox"
                    value="${time.grupo}"
                    ${selecionado ? "checked" : ""}
                    ${bloqueado ? "disabled" : ""}
                >

                <div class="terceiro-time">
                    <img src="assets/Icon/${time.codigo}.png" 
                         alt="${time.nome}"
                         onerror="this.src='assets/Icon/TBD.png'">

                    <div>
                        <strong>${time.nome}</strong>
                        <span>3º do Grupo ${time.grupo}</span>
                    </div>
                </div>
            </label>
        `;
    }).join("");

    document.querySelectorAll(".terceiro-opcao input").forEach((input) => {
        input.addEventListener("change", atualizarMelhoresTerceiros);
    });

    atualizarContadorTerceiros();
}

function atualizarMelhoresTerceiros(event) {
    const inputAlterado = event.currentTarget;

    const selecionados = Array.from(document.querySelectorAll(".terceiro-opcao input:checked"))
        .map((input) => input.value);

    if (selecionados.length > 8) {
        inputAlterado.checked = false;
        alert("Você deve selecionar exatamente 8 melhores terceiros.");
        return;
    }

    melhoresTerceiros = Array.from(document.querySelectorAll(".terceiro-opcao input:checked"))
        .map((input) => input.value);

    limparEscolhasMataMata();
    atualizarVisualTerceiros();
    atualizarContadorTerceiros();
    renderizarBracket();
    renderizarResumoFinal();
}

function atualizarVisualTerceiros() {
    document.querySelectorAll(".terceiro-opcao").forEach((label) => {
        const input = label.querySelector("input");

        if (input.checked) {
            label.classList.add("selecionado");
        } else {
            label.classList.remove("selecionado");
        }
    });
}

function atualizarContadorTerceiros() {
    contadorTerceiros.textContent = `${melhoresTerceiros.length} de 8 selecionados`;

    if (melhoresTerceiros.length === 8) {
        contadorTerceiros.classList.add("ok");
    } else {
        contadorTerceiros.classList.remove("ok");
    }
}

/* =========================
   BRACKET
========================= */

function obterTimeGrupo(letra, posicao) {
    const grupo = palpite.grupos[`Grupo ${letra}`];

    if (!grupo) return null;

    const codigo = grupo[posicao];
    const time = timesPorCodigo[codigo];

    if (!codigo || !time) return null;

    return {
        codigo,
        nome: time.nome || buscarNomeTimePorCodigo(codigo)
    };
}

function obterTerceiroSelecionado(index) {
    const grupoLetra = melhoresTerceiros[index];

    if (!grupoLetra) {
        return null;
    }

    return obterTimeGrupo(grupoLetra, "terceiro");
}

function montarJogosRound32() {
    return [
        { id: 73, a: obterTimeGrupo("A", "primeiro"), b: obterTerceiroSelecionado(0) },
        { id: 74, a: obterTimeGrupo("B", "primeiro"), b: obterTerceiroSelecionado(1) },
        { id: 75, a: obterTimeGrupo("C", "primeiro"), b: obterTerceiroSelecionado(2) },
        { id: 76, a: obterTimeGrupo("D", "primeiro"), b: obterTerceiroSelecionado(3) },
        { id: 77, a: obterTimeGrupo("E", "primeiro"), b: obterTerceiroSelecionado(4) },
        { id: 78, a: obterTimeGrupo("F", "primeiro"), b: obterTerceiroSelecionado(5) },
        { id: 79, a: obterTimeGrupo("G", "primeiro"), b: obterTerceiroSelecionado(6) },
        { id: 80, a: obterTimeGrupo("H", "primeiro"), b: obterTerceiroSelecionado(7) },
        { id: 81, a: obterTimeGrupo("I", "primeiro"), b: obterTimeGrupo("A", "segundo") },
        { id: 82, a: obterTimeGrupo("J", "primeiro"), b: obterTimeGrupo("B", "segundo") },
        { id: 83, a: obterTimeGrupo("K", "primeiro"), b: obterTimeGrupo("C", "segundo") },
        { id: 84, a: obterTimeGrupo("L", "primeiro"), b: obterTimeGrupo("D", "segundo") },
        { id: 85, a: obterTimeGrupo("E", "segundo"), b: obterTimeGrupo("F", "segundo") },
        { id: 86, a: obterTimeGrupo("G", "segundo"), b: obterTimeGrupo("H", "segundo") },
        { id: 87, a: obterTimeGrupo("I", "segundo"), b: obterTimeGrupo("J", "segundo") },
        { id: 88, a: obterTimeGrupo("K", "segundo"), b: obterTimeGrupo("L", "segundo") }
    ];
}

function vencedorDoJogo(jogoId) {
    const codigo = escolhas[jogoId];

    if (!codigo) return null;

    return timesPorCodigo[codigo] || {
        codigo,
        nome: buscarNomeTimePorCodigo(codigo)
    };
}

function montarRodada(ids, rodadaAnterior) {
    return ids.map((id, index) => {
        const jogoOrigemA = rodadaAnterior[index * 2];
        const jogoOrigemB = rodadaAnterior[index * 2 + 1];

        return {
            id,
            a: vencedorDoJogo(jogoOrigemA.id),
            b: vencedorDoJogo(jogoOrigemB.id)
        };
    });
}

function montarTodosJogos() {
    const round32 = montarJogosRound32();

    const oitavas = montarRodada(
        [89, 90, 91, 92, 93, 94, 95, 96],
        round32
    );

    const quartas = montarRodada(
        [97, 98, 99, 100],
        oitavas
    );

    const semi = montarRodada(
        [101, 102],
        quartas
    );

    const final = montarRodada(
        [104],
        semi
    );

    const terceiro = {
        id: 103,
        a: obterPerdedorDoJogoMontado(semi[0]),
        b: obterPerdedorDoJogoMontado(semi[1])
    };

    return {
        round32,
        oitavas,
        quartas,
        semi,
        terceiro: [terceiro],
        final
    };
}

function obterTodosJogos() {
    const jogos = montarTodosJogos();

    return [
        ...jogos.round32,
        ...jogos.oitavas,
        ...jogos.quartas,
        ...jogos.semi,
        ...jogos.terceiro,
        ...jogos.final
    ];
}

function obterPerdedorDoJogoMontado(jogo) {
    if (!jogo || !escolhas[jogo.id]) {
        return null;
    }

    const vencedorCodigo = escolhas[jogo.id];

    if (jogo.a?.codigo === vencedorCodigo) {
        return jogo.b || null;
    }

    if (jogo.b?.codigo === vencedorCodigo) {
        return jogo.a || null;
    }

    return null;
}

function perdedorDoJogo(jogoId) {
    const todosJogos = obterTodosJogos();
    const jogo = todosJogos.find((item) => item.id === Number(jogoId));

    if (!jogo) {
        return null;
    }

    return obterPerdedorDoJogoMontado(jogo);
}

function renderizarBracket() {
    if (melhoresTerceiros.length !== 8) {
        bracketMataMata.innerHTML = `
            <div class="empty-card">
                Selecione exatamente 8 melhores terceiros para liberar o chaveamento.
            </div>
        `;
        return;
    }

    const jogos = montarTodosJogos();

    bracketMataMata.innerHTML = `
        <div class="bracket-grid">
            ${renderizarColuna("16 avos", jogos.round32)}
            ${renderizarColuna("Oitavas", jogos.oitavas)}
            ${renderizarColuna("Quartas", jogos.quartas)}
            ${renderizarColuna("Semifinais", jogos.semi)}
            ${renderizarColuna("3º lugar", jogos.terceiro, "terceiro")}
            ${renderizarColuna("Final", jogos.final, "final")}
        </div>
    `;

    document.querySelectorAll(".time-btn").forEach((botao) => {
        botao.addEventListener("click", escolherVencedor);
    });
}

function renderizarColuna(titulo, jogos, classeExtra = "") {
    return `
        <div class="rodada-coluna">
            <div class="rodada-titulo">${titulo}</div>
            ${jogos.map((jogo) => renderizarJogo(jogo, classeExtra)).join("")}
        </div>
    `;
}

function renderizarJogo(jogo, classeExtra = "") {
    return `
        <div class="jogo-card ${classeExtra}">
            <span class="jogo-numero">Jogo ${jogo.id}</span>
            ${renderizarTimeBotao(jogo.id, jogo.a)}
            ${renderizarTimeBotao(jogo.id, jogo.b)}
        </div>
    `;
}

function renderizarTimeBotao(jogoId, time) {
    if (!time) {
        return `
            <div class="placeholder-time">
                Aguardando confronto
            </div>
        `;
    }

    const selecionado = escolhas[jogoId] === time.codigo;

    return `
        <button 
            class="time-btn ${selecionado ? "selecionado" : ""}" 
            type="button"
            data-jogo="${jogoId}"
            data-codigo="${time.codigo}"
            ${!bolaoAberto ? "disabled" : ""}
        >
            <img src="assets/Icon/${time.codigo}.png" 
                 alt="${time.nome}"
                 onerror="this.src='assets/Icon/TBD.png'">

            <strong>${time.nome}</strong>
        </button>
    `;
}

function escolherVencedor(event) {
    const botao = event.currentTarget;
    const jogoId = Number(botao.dataset.jogo);
    const codigo = botao.dataset.codigo;

    escolhas[jogoId] = codigo;

    limparEscolhasPosteriores(jogoId);
    renderizarBracket();
    renderizarResumoFinal();
}

function limparEscolhasPosteriores(jogoId) {
    const dependencias = {
        73: [89, 97, 101, 103, 104],
        74: [89, 97, 101, 103, 104],
        75: [90, 97, 101, 103, 104],
        76: [90, 97, 101, 103, 104],
        77: [91, 98, 101, 103, 104],
        78: [91, 98, 101, 103, 104],
        79: [92, 98, 101, 103, 104],
        80: [92, 98, 101, 103, 104],
        81: [93, 99, 102, 103, 104],
        82: [93, 99, 102, 103, 104],
        83: [94, 99, 102, 103, 104],
        84: [94, 99, 102, 103, 104],
        85: [95, 100, 102, 103, 104],
        86: [95, 100, 102, 103, 104],
        87: [96, 100, 102, 103, 104],
        88: [96, 100, 102, 103, 104],

        89: [97, 101, 103, 104],
        90: [97, 101, 103, 104],
        91: [98, 101, 103, 104],
        92: [98, 101, 103, 104],
        93: [99, 102, 103, 104],
        94: [99, 102, 103, 104],
        95: [100, 102, 103, 104],
        96: [100, 102, 103, 104],

        97: [101, 103, 104],
        98: [101, 103, 104],
        99: [102, 103, 104],
        100: [102, 103, 104],

        101: [103, 104],
        102: [103, 104]
    };

    const lista = dependencias[jogoId] || [];

    lista.forEach((id) => {
        delete escolhas[id];
    });
}

function limparEscolhasMataMata() {
    escolhas = {};
}

/* =========================
   RESUMO FINAL
========================= */

function obterViceCampeao() {
    const jogos = montarTodosJogos();
    const final = jogos.final[0];

    return obterPerdedorDoJogoMontado(final);
}

function renderizarResumoFinal() {
    const campeao = vencedorDoJogo(104);
    const vice = obterViceCampeao();
    const terceiro = vencedorDoJogo(103);

    if (!campeao && !vice && !terceiro) {
        resumoTop3.innerHTML = `
            <div class="empty-card">
                Escolha os vencedores até a final para ver seu Top 3.
            </div>
        `;
        return;
    }

    resumoTop3.innerHTML = `
        ${renderizarTop3Card("Campeão", campeao, "campeao")}
        ${renderizarTop3Card("Vice-campeão", vice, "vice")}
        ${renderizarTop3Card("3º lugar", terceiro, "terceiro")}
    `;
}

function renderizarTop3Card(titulo, time, classe) {
    if (!time) {
        return `
            <div class="top3-card ${classe}">
                <span>${titulo}</span>
                <h3>A definir</h3>
            </div>
        `;
    }

    return `
        <div class="top3-card ${classe}">
            <span>${titulo}</span>

            <img src="assets/Icon/${time.codigo}.png" 
                 alt="${time.nome}"
                 onerror="this.src='assets/Icon/TBD.png'">

            <h3>${time.nome}</h3>
        </div>
    `;
}

/* =========================
   SALVAR
========================= */

function atualizarEstadoTela() {
    if (bolaoAberto) {
        btnSalvarMataMata.disabled = false;
        btnSalvarMataMata.textContent = "Salvar mata-mata";
        avisoMata.classList.remove("fechado");
        return;
    }

    btnSalvarMataMata.disabled = true;
    btnSalvarMataMata.textContent = "Palpites fechados";
    avisoMata.classList.add("fechado");
}

async function salvarMataMata() {
    if (!bolaoAberto) {
        alert("Os palpites estão fechados no momento.");
        return;
    }

    if (melhoresTerceiros.length !== 8) {
        alert("Selecione exatamente 8 melhores terceiros antes de salvar.");
        return;
    }

    const campeao = vencedorDoJogo(104);
    const vice = obterViceCampeao();
    const terceiro = vencedorDoJogo(103);

    if (!campeao || !vice || !terceiro) {
        alert("Complete todos os confrontos até definir campeão, vice e terceiro lugar.");
        return;
    }

    try {
        btnSalvarMataMata.disabled = true;
        btnSalvarMataMata.textContent = "Salvando...";

        const bracket = montarTodosJogos();

        await setDoc(doc(db, "palpites", usuarioAtual.uid), {
            uid: usuarioAtual.uid,
            grupos: palpite.grupos,
            mataMata: {
                melhoresTerceiros,
                escolhas,
                bracket,
                campeao: campeao.codigo,
                viceCampeao: vice.codigo,
                terceiroLugar: terceiro.codigo,
                top3: {
                    campeao: campeao.codigo,
                    viceCampeao: vice.codigo,
                    terceiroLugar: terceiro.codigo
                },
                atualizadoEm: serverTimestamp()
            }
        }, { merge: true });

        mensagemStatus.textContent = "Seu palpite do mata-mata foi salvo com sucesso.";
        btnSalvarMataMata.textContent = "Salvo com sucesso!";

        setTimeout(() => {
            if (bolaoAberto) {
                mensagemStatus.textContent = "Os palpites estão abertos. Você ainda pode alterar e salvar novamente.";
                btnSalvarMataMata.disabled = false;
                btnSalvarMataMata.textContent = "Salvar mata-mata";
            }
        }, 2200);

    } catch (error) {
        console.error("Erro ao salvar mata-mata:", error);

        alert("Não foi possível salvar o mata-mata. Tente novamente.");

        btnSalvarMataMata.disabled = false;
        btnSalvarMataMata.textContent = "Salvar mata-mata";
    }
}

btnSalvarMataMata?.addEventListener("click", salvarMataMata);

btnSair?.addEventListener("click", async () => {
    try {
        await signOut(auth);
        window.location.href = "login.html";
    } catch (error) {
        console.error("Erro ao sair:", error);
        alert("Não foi possível sair. Tente novamente.");
    }
});