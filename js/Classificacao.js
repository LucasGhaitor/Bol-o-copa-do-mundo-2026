import { auth, db } from "./firebase.js";
import { partidas } from "./partidas-data.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const jogosFinalizadosEl = document.getElementById("jogosFinalizados");
const totalGruposEl = document.getElementById("totalGrupos");
const statusGeralEl = document.getElementById("statusGeral");
const listaGruposClassificacao = document.getElementById("listaGruposClassificacao");
const listaMelhoresTerceiros = document.getElementById("listaMelhoresTerceiros");
const btnSair = document.getElementById("btnSair");

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    await carregarClassificacao();
});

async function carregarClassificacao() {
    try {
        const resultados = await carregarResultados();
        const tabelas = calcularClassificacaoGrupos(resultados);
        const melhoresTerceiros = calcularMelhoresTerceiros(tabelas);

        atualizarResumo(tabelas);
        renderizarGrupos(tabelas, melhoresTerceiros);
        renderizarMelhoresTerceiros(melhoresTerceiros);

    } catch (error) {
        console.error("Erro ao carregar classificação:", error);

        listaGruposClassificacao.innerHTML = `
            <div class="erro-card">
                Não foi possível carregar a classificação.
            </div>
        `;

        listaMelhoresTerceiros.innerHTML = `
            <div class="erro-card">
                Não foi possível carregar os melhores terceiros.
            </div>
        `;

        statusGeralEl.textContent = "Erro";
    }
}

async function carregarResultados() {
    const snapshot = await getDocs(collection(db, "resultados"));
    const resultados = {};

    snapshot.forEach((documento) => {
        resultados[documento.id] = documento.data();
    });

    return resultados;
}

function calcularClassificacaoGrupos(resultados) {
    const jogosGrupos = partidas.filter((partida) => partida.fase === "Fase de Grupos");
    const tabelas = {};

    jogosGrupos.forEach((partida) => {
        if (!tabelas[partida.grupo]) {
            tabelas[partida.grupo] = {
                grupo: partida.grupo,
                jogosFinalizados: 0,
                times: {}
            };
        }

        adicionarTime(tabelas[partida.grupo], partida.bandeiraMandante, partida.mandante);
        adicionarTime(tabelas[partida.grupo], partida.bandeiraVisitante, partida.visitante);
    });

    jogosGrupos.forEach((partida) => {
        const resultado = resultados[`jogo_${partida.id}`];

        if (!resultado || resultado.finalizado !== true) return;

        const golsMandante = Number(resultado.golsMandante);
        const golsVisitante = Number(resultado.golsVisitante);

        if (!Number.isFinite(golsMandante) || !Number.isFinite(golsVisitante)) return;

        const tabela = tabelas[partida.grupo];

        aplicarResultado({
            tabela,
            mandante: partida.bandeiraMandante,
            visitante: partida.bandeiraVisitante,
            golsMandante,
            golsVisitante
        });
    });

    Object.values(tabelas).forEach((tabela) => {
        tabela.ordenados = Object.values(tabela.times).sort(ordenarTimes);
    });

    return tabelas;
}

function adicionarTime(tabela, codigo, nome) {
    if (!codigo || codigo === "TBD") return;

    if (!tabela.times[codigo]) {
        tabela.times[codigo] = {
            codigo,
            nome,
            pontos: 0,
            jogos: 0,
            vitorias: 0,
            empates: 0,
            derrotas: 0,
            golsPro: 0,
            golsContra: 0,
            saldo: 0
        };
    }
}

function aplicarResultado({
    tabela,
    mandante,
    visitante,
    golsMandante,
    golsVisitante
}) {
    const timeMandante = tabela.times[mandante];
    const timeVisitante = tabela.times[visitante];

    if (!timeMandante || !timeVisitante) return;

    tabela.jogosFinalizados++;

    timeMandante.jogos++;
    timeVisitante.jogos++;

    timeMandante.golsPro += golsMandante;
    timeMandante.golsContra += golsVisitante;

    timeVisitante.golsPro += golsVisitante;
    timeVisitante.golsContra += golsMandante;

    timeMandante.saldo = timeMandante.golsPro - timeMandante.golsContra;
    timeVisitante.saldo = timeVisitante.golsPro - timeVisitante.golsContra;

    if (golsMandante > golsVisitante) {
        timeMandante.pontos += 3;
        timeMandante.vitorias++;
        timeVisitante.derrotas++;
    } else if (golsVisitante > golsMandante) {
        timeVisitante.pontos += 3;
        timeVisitante.vitorias++;
        timeMandante.derrotas++;
    } else {
        timeMandante.pontos++;
        timeVisitante.pontos++;
        timeMandante.empates++;
        timeVisitante.empates++;
    }
}

function ordenarTimes(a, b) {
    if (b.pontos !== a.pontos) return b.pontos - a.pontos;
    if (b.saldo !== a.saldo) return b.saldo - a.saldo;
    if (b.golsPro !== a.golsPro) return b.golsPro - a.golsPro;
    if (b.vitorias !== a.vitorias) return b.vitorias - a.vitorias;
    return a.nome.localeCompare(b.nome);
}

function calcularMelhoresTerceiros(tabelas) {
    const terceiros = [];

    Object.values(tabelas).forEach((tabela) => {
        if (!tabela.ordenados || tabela.ordenados.length < 3) return;

        const terceiro = tabela.ordenados[2];
        const grupoLetra = tabela.grupo.replace("Grupo ", "");

        terceiros.push({
            ...terceiro,
            grupo: tabela.grupo,
            grupoLetra,
            jogosFinalizadosGrupo: tabela.jogosFinalizados
        });
    });

    terceiros.sort(ordenarTimes);

    return terceiros;
}

function atualizarResumo(tabelas) {
    const grupos = Object.values(tabelas);
    const jogosFinalizados = grupos.reduce((total, grupo) => total + grupo.jogosFinalizados, 0);

    jogosFinalizadosEl.textContent = jogosFinalizados;
    totalGruposEl.textContent = grupos.length;

    if (jogosFinalizados === 0) {
        statusGeralEl.textContent = "Aguardando";
    } else if (jogosFinalizados < 72) {
        statusGeralEl.textContent = "Em andamento";
    } else {
        statusGeralEl.textContent = "Finalizada";
    }
}

function renderizarGrupos(tabelas, melhoresTerceiros) {
    const grupos = Object.values(tabelas).sort((a, b) => {
        return a.grupo.localeCompare(b.grupo);
    });

    if (grupos.length === 0) {
        listaGruposClassificacao.innerHTML = `
            <div class="empty-card">
                Nenhum grupo encontrado.
            </div>
        `;
        return;
    }

    const melhoresTerceirosCodigos = melhoresTerceiros
        .slice(0, 8)
        .map((time) => time.codigo);

    listaGruposClassificacao.innerHTML = grupos.map((grupo) => {
        return `
            <article class="grupo-card">
                <div class="grupo-topo">
                    <h3>${grupo.grupo}</h3>
                    <span>${grupo.jogosFinalizados} jogos finalizados</span>
                </div>

                <table class="tabela-grupo">
                    <thead>
                        <tr>
                            <th>Seleção</th>
                            <th>PTS</th>
                            <th>J</th>
                            <th>V</th>
                            <th>E</th>
                            <th>D</th>
                            <th>GP</th>
                            <th>GC</th>
                            <th>SG</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${grupo.ordenados.map((time, index) => {
                            const posicao = index + 1;
                            const classificadoDireto = posicao <= 2;
                            const terceiroClassificado = posicao === 3 && melhoresTerceirosCodigos.includes(time.codigo);

                            let classePosicao = "";

                            if (classificadoDireto) {
                                classePosicao = "classificado";
                            } else if (terceiroClassificado) {
                                classePosicao = "terceiro";
                            }

                            return `
                                <tr>
                                    <td>
                                        <div class="time-info">
                                            <span class="posicao ${classePosicao}">${posicao}</span>
                                            <img src="assets/Icon/${time.codigo}.png" 
                                                 alt="${time.nome}"
                                                 onerror="this.src='assets/Icon/TBD.png'">
                                            <strong>${time.nome}</strong>
                                        </div>
                                    </td>
                                    <td class="pontos-time">${time.pontos}</td>
                                    <td>${time.jogos}</td>
                                    <td>${time.vitorias}</td>
                                    <td>${time.empates}</td>
                                    <td>${time.derrotas}</td>
                                    <td>${time.golsPro}</td>
                                    <td>${time.golsContra}</td>
                                    <td>${time.saldo}</td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            </article>
        `;
    }).join("");
}

function renderizarMelhoresTerceiros(melhoresTerceiros) {
    if (!melhoresTerceiros || melhoresTerceiros.length === 0) {
        listaMelhoresTerceiros.innerHTML = `
            <div class="empty-card">
                Ainda não há terceiros colocados para exibir.
            </div>
        `;
        return;
    }

    listaMelhoresTerceiros.innerHTML = `
        <div class="terceiros-grid">
            ${melhoresTerceiros.map((time, index) => {
                const classificado = index < 8;

                return `
                    <div class="terceiro-card ${classificado ? "classificado" : ""}">
                        <span class="terceiro-posicao">${index + 1}</span>

                        <div class="terceiro-time">
                            <img src="assets/Icon/${time.codigo}.png" 
                                 alt="${time.nome}"
                                 onerror="this.src='assets/Icon/TBD.png'">
                            <strong>${time.nome}</strong>
                        </div>

                        <p>
                            <strong>${time.grupo}</strong><br>
                            ${time.pontos} pts • SG ${time.saldo} • GP ${time.golsPro}
                        </p>
                    </div>
                `;
            }).join("")}
        </div>
    `;
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