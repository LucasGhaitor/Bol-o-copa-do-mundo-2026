import { auth, db } from "./firebase.js";
import { partidas } from "./partidas-data.js";
import { aplicarMataMataOficial } from "./mata-mata-oficial.js";

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

const filtroFase = buscarElementoPorIds([
    "filtroFase",
    "faseFiltro",
    "selectFase"
]);

const filtroGrupo = buscarElementoPorIds([
    "filtroGrupo",
    "grupoFiltro",
    "selectGrupo"
]);

const filtroStatus = buscarElementoPorIds([
    "filtroStatus",
    "statusFiltro",
    "selectStatus"
]);

const campoBusca = buscarElementoPorIds([
    "buscaPartida",
    "campoBusca",
    "buscarPartida",
    "filtroBusca"
]);

const btnLimparFiltros = buscarElementoPorIds([
    "btnLimparFiltros",
    "limparFiltros"
]);

const contadorPartidas = buscarElementoPorIds([
    "contadorPartidas",
    "totalPartidas",
    "quantidadePartidas"
]);

const contadorFinalizadas = buscarElementoPorIds([
    "contadorFinalizadas",
    "totalFinalizadas",
    "partidasFinalizadas"
]);

const contadorAbertas = buscarElementoPorIds([
    "contadorAbertas",
    "totalAbertas",
    "partidasAbertas"
]);

const listaPartidas = buscarElementoPorIds([
    "listaPartidas",
    "partidasLista",
    "containerPartidas"
]);

const btnSair = buscarElementoPorIds([
    "btnSair",
    "sair"
]);

/* =====================================================
   ESTADO
===================================================== */

let resultadosPorJogo = {};
let partidasComMataMata = [];
let partidasExibidas = [];
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

        atualizarPartidasComMataMata();

        configurarEventos();

        aplicarFiltros();

    } catch (error) {
        console.error(
            "Erro ao carregar partidas:",
            error
        );

        if (listaPartidas) {
            listaPartidas.innerHTML = `
                <div class="estado-vazio erro">
                    Não foi possível carregar as partidas.
                    Tente atualizar a página.
                </div>
            `;
        }

        atualizarResumo([]);

    } finally {
        carregandoPagina = false;
    }
}

function definirEstadoCarregando() {
    if (listaPartidas) {
        listaPartidas.innerHTML = `
            <div class="estado-vazio">
                Carregando partidas...
            </div>
        `;
    }

    atualizarResumo([]);
}

function atualizarPartidasComMataMata() {
    partidasComMataMata = aplicarMataMataOficial(
        partidas,
        resultadosPorJogo
    );
}

/* =====================================================
   EVENTOS
===================================================== */

function configurarEventos() {
    filtroFase?.removeEventListener(
        "change",
        aplicarFiltros
    );

    filtroFase?.addEventListener(
        "change",
        aplicarFiltros
    );

    filtroGrupo?.removeEventListener(
        "change",
        aplicarFiltros
    );

    filtroGrupo?.addEventListener(
        "change",
        aplicarFiltros
    );

    filtroStatus?.removeEventListener(
        "change",
        aplicarFiltros
    );

    filtroStatus?.addEventListener(
        "change",
        aplicarFiltros
    );

    campoBusca?.removeEventListener(
        "input",
        aplicarFiltros
    );

    campoBusca?.addEventListener(
        "input",
        aplicarFiltros
    );

    btnLimparFiltros?.removeEventListener(
        "click",
        limparFiltros
    );

    btnLimparFiltros?.addEventListener(
        "click",
        limparFiltros
    );

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
    const resultadosSnapshot = await getDocs(
        collection(db, "resultados")
    );

    resultadosPorJogo = {};

    resultadosSnapshot.forEach((documento) => {
        const dados = documento.data();

        resultadosPorJogo[documento.id] = dados;

        if (dados.jogoId !== undefined) {
            resultadosPorJogo[`jogo_${dados.jogoId}`] = dados;
            resultadosPorJogo[String(dados.jogoId)] = dados;
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
   FILTROS
===================================================== */

function aplicarFiltros() {
    const faseSelecionada = normalizarTexto(
        filtroFase?.value
    );

    const grupoSelecionado = normalizarTexto(
        filtroGrupo?.value
    );

    const statusSelecionado = normalizarTexto(
        filtroStatus?.value
    );

    const termoBusca = normalizarTexto(
        campoBusca?.value
    );

    partidasExibidas = partidasComMataMata.filter((partida) => {
        const resultado = obterResultadoSalvo(partida.id);

        const correspondeFase =
            verificarCorrespondenciaFase(
                partida,
                faseSelecionada
            );

        const correspondeGrupo =
            verificarCorrespondenciaGrupo(
                partida,
                grupoSelecionado
            );

        const correspondeStatus =
            verificarStatus(
                resultado,
                statusSelecionado
            );

        const correspondeBusca =
            verificarBusca(
                partida,
                resultado,
                termoBusca
            );

        return (
            correspondeFase &&
            correspondeGrupo &&
            correspondeStatus &&
            correspondeBusca
        );
    });

    renderizarPartidas(partidasExibidas);
    atualizarResumo(partidasExibidas);
}

function verificarCorrespondenciaFase(
    partida,
    faseSelecionada
) {
    if (correspondeFiltroTodos(faseSelecionada)) {
        return true;
    }

    const jogoId = Number(partida.id);
    const fasePartida = normalizarTexto(partida.fase);

    if (
        faseSelecionada === "fase de grupos" ||
        faseSelecionada === "grupos" ||
        faseSelecionada === "grupo"
    ) {
        return jogoId >= 1 && jogoId <= 72;
    }

    if (
        faseSelecionada === "16 avos" ||
        faseSelecionada === "32 avos" ||
        faseSelecionada === "mata-mata" ||
        faseSelecionada === "mata mata" ||
        faseSelecionada.includes("16 avos") ||
        faseSelecionada.includes("32 avos")
    ) {
        return jogoId >= 73 && jogoId <= 88;
    }

    if (
        faseSelecionada === "oitavas" ||
        faseSelecionada === "oitavas de final" ||
        faseSelecionada.includes("oitavas")
    ) {
        return jogoId >= 89 && jogoId <= 96;
    }

    if (
        faseSelecionada === "quartas" ||
        faseSelecionada === "quartas de final" ||
        faseSelecionada.includes("quartas")
    ) {
        return jogoId >= 97 && jogoId <= 100;
    }

    if (
        faseSelecionada === "semifinais" ||
        faseSelecionada === "semi finais" ||
        faseSelecionada === "semifinal" ||
        faseSelecionada.includes("semi")
    ) {
        return jogoId === 101 || jogoId === 102;
    }

    if (
        faseSelecionada === "disputa de 3º lugar" ||
        faseSelecionada === "disputa de 3 lugar" ||
        faseSelecionada === "terceiro lugar" ||
        faseSelecionada === "3º lugar" ||
        faseSelecionada === "3 lugar"
    ) {
        return jogoId === 103;
    }

    if (
        faseSelecionada === "final" ||
        faseSelecionada === "grande final"
    ) {
        return jogoId === 104;
    }

    return fasePartida === faseSelecionada;
}

function verificarCorrespondenciaGrupo(
    partida,
    grupoSelecionado
) {
    if (correspondeFiltroTodos(grupoSelecionado)) {
        return true;
    }

    const grupoPartida =
        normalizarTexto(partida.grupo);

    const fasePartida =
        normalizarTexto(partida.fase);

    if (
        grupoSelecionado === "mata-mata" ||
        grupoSelecionado === "mata mata"
    ) {
        const jogoId = Number(partida.id);
        return jogoId >= 73 && jogoId <= 104;
    }

    return (
        grupoPartida === grupoSelecionado ||
        fasePartida === grupoSelecionado
    );
}

function correspondeFiltroTodos(valor) {
    return (
        !valor ||
        valor === "todos" ||
        valor === "todas" ||
        valor === "todas as fases" ||
        valor === "todos os grupos" ||
        valor === "todas as partidas" ||
        valor === "todos os status" ||
        valor === "todas as selecoes" ||
        valor === "todas as seleções"
    );
}

function verificarStatus(
    resultado,
    statusSelecionado
) {
    if (correspondeFiltroTodos(statusSelecionado)) {
        return true;
    }

    const finalizado =
        resultado?.finalizado === true;

    const possuiResultado =
        resultado &&
        resultado.golsMandante !== undefined &&
        resultado.golsVisitante !== undefined &&
        resultado.golsMandante !== "" &&
        resultado.golsVisitante !== "";

    if (
        statusSelecionado === "finalizadas" ||
        statusSelecionado === "finalizada" ||
        statusSelecionado === "finalizado" ||
        statusSelecionado === "finalizados"
    ) {
        return finalizado;
    }

    if (
        statusSelecionado === "em aberto" ||
        statusSelecionado === "abertas" ||
        statusSelecionado === "abertos" ||
        statusSelecionado === "pendentes" ||
        statusSelecionado === "pendente" ||
        statusSelecionado === "aguardando" ||
        statusSelecionado === "aguardando resultado"
    ) {
        return !finalizado;
    }

    if (
        statusSelecionado === "resultado salvo" ||
        statusSelecionado === "salvas" ||
        statusSelecionado === "salvo" ||
        statusSelecionado === "salvos"
    ) {
        return possuiResultado && !finalizado;
    }

    return true;
}

function verificarBusca(
    partida,
    resultado,
    termoBusca
) {
    if (!termoBusca) {
        return true;
    }

    const textoPesquisavel = [
        partida.id,
        partida.fase,
        partida.grupo,
        partida.mandante,
        partida.visitante,
        partida.bandeiraMandante,
        partida.bandeiraVisitante,
        partida.estadio,
        partida.cidade,
        partida.data,
        partida.hora,
        resultado?.mandante,
        resultado?.visitante,
        resultado?.bandeiraMandante,
        resultado?.bandeiraVisitante,
        resultado?.penaltisMandante,
        resultado?.penaltisVisitante
    ]
        .filter((valor) => {
            return (
                valor !== null &&
                valor !== undefined
            );
        })
        .join(" ");

    return normalizarTexto(
        textoPesquisavel
    ).includes(termoBusca);
}

function limparFiltros() {
    definirValorPadraoSelect(filtroFase);
    definirValorPadraoSelect(filtroGrupo);
    definirValorPadraoSelect(filtroStatus);

    if (campoBusca) {
        campoBusca.value = "";
    }

    aplicarFiltros();
}

function definirValorPadraoSelect(select) {
    if (!select) {
        return;
    }

    const primeiraOpcao =
        select.options?.[0];

    if (primeiraOpcao) {
        select.value = primeiraOpcao.value;
    }
}

/* =====================================================
   RENDERIZAÇÃO
===================================================== */

function renderizarPartidas(lista) {
    if (!listaPartidas) {
        console.error(
            "Container da lista de partidas não encontrado."
        );

        return;
    }

    if (!Array.isArray(lista) || lista.length === 0) {
        listaPartidas.innerHTML = `
            <div class="estado-vazio">
                Nenhuma partida encontrada para os filtros selecionados.
            </div>
        `;

        return;
    }

    listaPartidas.innerHTML =
        lista
            .map((partida) => {
                return criarCardPartida(partida);
            })
            .join("");
}

function criarCardPartida(partida) {
    const resultado = obterResultadoSalvo(partida.id);

    const finalizado =
        resultado?.finalizado === true;

    const possuiPlacar =
        resultado &&
        resultado.golsMandante !== undefined &&
        resultado.golsVisitante !== undefined &&
        resultado.golsMandante !== "" &&
        resultado.golsVisitante !== "";

    const possuiPenaltis =
        possuiPlacarPenaltis(resultado);

    const statusTexto =
        finalizado
            ? "Finalizado"
            : possuiPlacar
                ? "Resultado salvo"
                : "Aguardando resultado";

    const statusClasse =
        finalizado
            ? "finalizada"
            : possuiPlacar
                ? "salva"
                : "pendente";

    const golsMandante = possuiPlacar
        ? resultado.golsMandante
        : "";

    const golsVisitante = possuiPlacar
        ? resultado.golsVisitante
        : "";

    const grupoOuFase =
        partida.grupo ||
        partida.fase ||
        "Mata-mata";

    const vencedor =
        obterNomeVencedorResultado(
            resultado,
            partida
        );

    return `
        <article
            class="partida-card ${finalizado ? "partida-finalizada" : ""}"
            data-jogo-id="${partida.id}"
        >
            <div class="partida-card-topo">
                <span class="jogo-badge">
                    Jogo ${partida.id}
                </span>

                <span class="partida-fase">
                    ${escaparHTML(partida.fase || "Partida")}
                </span>

                <span class="status-partida ${statusClasse}">
                    ${statusTexto}
                </span>
            </div>

            <div class="partida-data-linha">
                <strong>
                    ${escaparHTML(partida.data || "Data a definir")}
                    ${partida.hora ? ` • ${escaparHTML(partida.hora)}` : ""}
                </strong>

                <span>
                    ${escaparHTML(grupoOuFase)}
                </span>
            </div>

            <div class="confronto-partida">
                <div class="time-partida">
                    <img
                        src="assets/Icon/${escaparHTML(partida.bandeiraMandante || "TBD")}.png"
                        alt="${escaparHTML(partida.mandante || "Mandante")}"
                        onerror="this.onerror=null; this.src='assets/Icon/TBD.png'"
                    >

                    <strong>
                        ${escaparHTML(partida.mandante || "A definir")}
                    </strong>
                </div>

                <div class="placar-partida ${possuiPlacar ? "com-placar" : "sem-placar"}">
                    ${
                        possuiPlacar
                            ? `
                                <strong>
                                    ${escaparHTML(golsMandante)}
                                </strong>

                                <span>
                                    x
                                </span>

                                <strong>
                                    ${escaparHTML(golsVisitante)}
                                </strong>
                            `
                            : `
                                <span class="placar-pendente">
                                    VS
                                </span>
                            `
                    }
                </div>

                <div class="time-partida">
                    <img
                        src="assets/Icon/${escaparHTML(partida.bandeiraVisitante || "TBD")}.png"
                        alt="${escaparHTML(partida.visitante || "Visitante")}"
                        onerror="this.onerror=null; this.src='assets/Icon/TBD.png'"
                    >

                    <strong>
                        ${escaparHTML(partida.visitante || "A definir")}
                    </strong>
                </div>
            </div>

            ${
                possuiPenaltis
                    ? criarBlocoPenaltisUsuario(
                        partida,
                        resultado,
                        vencedor
                    )
                    : ""
            }

            ${
                possuiPlacar && vencedor
                    ? criarBlocoVencedorUsuario(
                        vencedor,
                        possuiPenaltis
                    )
                    : ""
            }

            <div class="partida-local">
                <strong>
                    ${escaparHTML(partida.estadio || "Estádio a definir")}
                </strong>

                <span>
                    ${escaparHTML(partida.cidade || "Cidade a definir")}
                </span>

                ${
                    partida.grupo
                        ? `
                            <em>
                                ${escaparHTML(partida.grupo)}
                            </em>
                        `
                        : `
                            <em>
                                ${escaparHTML(partida.fase || "Mata-mata")}
                            </em>
                        `
                }
            </div>
        </article>
    `;
}

function criarBlocoPenaltisUsuario(
    partida,
    resultado,
    vencedor
) {
    return `
        <div class="penaltis-usuario">
            <div class="penaltis-usuario-topo">
                <strong>
                    Decisão por pênaltis
                </strong>

                <span>
                    Vencedor: ${escaparHTML(vencedor || "A definir")}
                </span>
            </div>

            <div class="penaltis-usuario-placar">
                <div class="penaltis-time">
                    <span>
                        ${escaparHTML(partida.mandante || "Mandante")}
                    </span>

                    <strong>
                        ${escaparHTML(resultado.penaltisMandante)}
                    </strong>
                </div>

                <em>
                    x
                </em>

                <div class="penaltis-time">
                    <span>
                        ${escaparHTML(partida.visitante || "Visitante")}
                    </span>

                    <strong>
                        ${escaparHTML(resultado.penaltisVisitante)}
                    </strong>
                </div>
            </div>
        </div>
    `;
}

function criarBlocoVencedorUsuario(
    vencedor,
    foiPenaltis
) {
    return `
        <div class="vencedor-usuario ${foiPenaltis ? "por-penaltis" : ""}">
            <span>
                ${foiPenaltis ? "Classificado nos pênaltis" : "Vencedor"}
            </span>

            <strong>
                ${escaparHTML(vencedor)}
            </strong>
        </div>
    `;
}

/* =====================================================
   PENALTIS E VENCEDOR
===================================================== */

function possuiPlacarPenaltis(resultado) {
    if (!resultado) {
        return false;
    }

    return (
        resultado.penaltisMandante !== null &&
        resultado.penaltisMandante !== undefined &&
        resultado.penaltisMandante !== "" &&
        resultado.penaltisVisitante !== null &&
        resultado.penaltisVisitante !== undefined &&
        resultado.penaltisVisitante !== ""
    );
}

function obterNomeVencedorResultado(
    resultado,
    partida
) {
    if (!resultado || !resultado.vencedor) {
        return null;
    }

    const vencedor =
        String(resultado.vencedor)
            .trim()
            .toUpperCase();

    if (vencedor === "EMPATE") {
        return "Empate";
    }

    if (
        vencedor ===
        normalizarCodigo(partida.bandeiraMandante)
    ) {
        return partida.mandante || vencedor;
    }

    if (
        vencedor ===
        normalizarCodigo(partida.bandeiraVisitante)
    ) {
        return partida.visitante || vencedor;
    }

    return resultado.vencedor;
}

/* =====================================================
   RESUMO
===================================================== */

function atualizarResumo(lista) {
    const total = Array.isArray(lista)
        ? lista.length
        : 0;

    const finalizadas = Array.isArray(lista)
        ? lista.filter((partida) => {
            const resultado =
                obterResultadoSalvo(partida.id);

            return resultado?.finalizado === true;
        }).length
        : 0;

    const abertas =
        total - finalizadas;

    if (contadorPartidas) {
        contadorPartidas.textContent =
            total === 1
                ? "1 partida encontrada"
                : `${total} partidas encontradas`;
    }

    if (contadorFinalizadas) {
        contadorFinalizadas.textContent =
            finalizadas;
    }

    if (contadorAbertas) {
        contadorAbertas.textContent =
            abertas;
    }
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

function buscarElementoPorIds(ids) {
    for (const id of ids) {
        const elemento =
            document.getElementById(id);

        if (elemento) {
            return elemento;
        }
    }

    return null;
}

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