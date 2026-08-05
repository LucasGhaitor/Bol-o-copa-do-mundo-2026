import { auth, db } from "./firebase.js";
import { partidas } from "./partidas-data.js";
import { aplicarMataMataOficial } from "./mata-mata-oficial.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* =====================================================
   ELEMENTOS DA TELA
===================================================== */

const campoBusca = buscarElementoPorIds([
    "buscaPartida",
    "campoBusca",
    "buscarPartida",
    "filtroBusca"
]);

const filtroFase = buscarElementoPorIds([
    "filtroFase",
    "selectFase",
    "faseFiltro"
]);

const listaPartidas = buscarElementoPorIds([
    "listaPartidas",
    "partidasAdmin",
    "containerPartidas",
    "resultadosLista"
]);

const mensagemPagina = buscarElementoPorIds([
    "mensagem",
    "mensagemPagina",
    "statusMensagem",
    "feedbackAdmin"
]);

const contadorPartidas = buscarElementoPorIds([
    "contadorPartidas",
    "totalPartidas",
    "quantidadePartidas"
]);

const btnLimparFiltros = buscarElementoPorIds([
    "btnLimparFiltros",
    "limparFiltros"
]);

const btnSair = buscarElementoPorIds([
    "btnSair",
    "sair"
]);

/* =====================================================
   ESTADO
===================================================== */

let usuarioAtual = null;
let resultadosPorJogo = {};
let partidasComMataMata = [];
let partidasExibidas = [];
let carregandoPagina = false;

/* =====================================================
   AUTENTICAÇÃO E PERMISSÃO
===================================================== */

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login-admin.html";
        return;
    }

    usuarioAtual = user;

    try {
        const possuiPermissao =
            await verificarAdministrador(user.uid);

        if (!possuiPermissao) {
            alert(
                "Seu usuário não possui permissão de administrador."
            );

            await signOut(auth);

            window.location.href = "login-admin.html";
            return;
        }

        await iniciarPagina();

    } catch (error) {
        console.error(
            "Erro ao validar administrador:",
            error
        );

        mostrarMensagem(
            "Não foi possível validar o acesso de administrador.",
            "erro"
        );
    }
});

async function verificarAdministrador(uid) {
    const usuarioRef = doc(
        db,
        "usuarios",
        uid
    );

    const usuarioSnap =
        await getDoc(usuarioRef);

    if (!usuarioSnap.exists()) {
        return false;
    }

    const dados = usuarioSnap.data();

    return dados.tipo === "admin";
}

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
            "Erro ao iniciar página de resultados:",
            error
        );

        mostrarMensagem(
            "Não foi possível carregar as partidas.",
            "erro"
        );

        if (listaPartidas) {
            listaPartidas.innerHTML = `
                <div class="estado-vazio erro">
                    Não foi possível carregar as partidas.
                </div>
            `;
        }

    } finally {
        carregandoPagina = false;
    }
}

function definirEstadoCarregando() {
    if (listaPartidas) {
        listaPartidas.innerHTML = `
            <div class="estado-vazio">
                Carregando partidas e resultados...
            </div>
        `;
    }

    atualizarContador(0);
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
    campoBusca?.removeEventListener(
        "input",
        aplicarFiltros
    );

    campoBusca?.addEventListener(
        "input",
        aplicarFiltros
    );

    filtroFase?.removeEventListener(
        "change",
        aplicarFiltros
    );

    filtroFase?.addEventListener(
        "change",
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

    listaPartidas?.removeEventListener(
        "click",
        tratarCliqueLista
    );

    listaPartidas?.addEventListener(
        "click",
        tratarCliqueLista
    );

    listaPartidas?.removeEventListener(
        "change",
        tratarAlteracaoLista
    );

    listaPartidas?.addEventListener(
        "change",
        tratarAlteracaoLista
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

async function tratarCliqueLista(event) {
    const botaoSalvar =
        event.target.closest(
            "[data-acao='salvar-resultado']"
        );

    if (botaoSalvar) {
        const jogoId = Number(
            botaoSalvar.dataset.jogoId
        );

        if (Number.isInteger(jogoId)) {
            await salvarResultadoPartida(
                jogoId,
                botaoSalvar
            );
        }

        return;
    }

    const botaoLimpar =
        event.target.closest(
            "[data-acao='limpar-resultado']"
        );

    if (botaoLimpar) {
        const jogoId = Number(
            botaoLimpar.dataset.jogoId
        );

        if (Number.isInteger(jogoId)) {
            limparCamposPartida(jogoId);
        }
    }
}

function tratarAlteracaoLista(event) {
    const campoFinalizado =
        event.target.closest(
            "[data-campo='finalizado']"
        );

    if (!campoFinalizado) {
        return;
    }

    const jogoId = Number(
        campoFinalizado.dataset.jogoId
    );

    const card =
        obterCardPartida(jogoId);

    if (!card) {
        return;
    }

    atualizarEstadoVisualFinalizado(
        card,
        campoFinalizado.checked
    );
}

/* =====================================================
   CARREGAMENTO DOS RESULTADOS
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
   FILTROS
===================================================== */

function aplicarFiltros() {
    const termoBusca =
        normalizarTexto(
            campoBusca?.value
        );

    const faseSelecionada =
        normalizarTexto(
            filtroFase?.value || "todas"
        );

    partidasExibidas =
        partidasComMataMata.filter((partida) => {
            const correspondeFase =
                verificarCorrespondenciaFase(
                    partida,
                    faseSelecionada
                );

            const correspondeBusca =
                verificarCorrespondenciaBusca(
                    partida,
                    termoBusca
                );

            return (
                correspondeFase &&
                correspondeBusca
            );
        });

    renderizarPartidas(partidasExibidas);
    atualizarContador(partidasExibidas.length);
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
        faseSelecionada === "semifinal" ||
        faseSelecionada === "semi finais" ||
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

function correspondeFiltroTodos(valor) {
    return (
        !valor ||
        valor === "todos" ||
        valor === "todas" ||
        valor === "todas as fases" ||
        valor === "todas as partidas"
    );
}

function verificarCorrespondenciaBusca(
    partida,
    termoBusca
) {
    if (!termoBusca) {
        return true;
    }

    const resultado =
        obterResultadoSalvo(partida.id);

    const conteudoPesquisavel = [
        partida.id,
        partida.mandante,
        partida.visitante,
        partida.cidade,
        partida.estadio,
        partida.grupo,
        partida.fase,
        partida.data,
        partida.hora,
        partida.bandeiraMandante,
        partida.bandeiraVisitante,
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
        conteudoPesquisavel
    ).includes(termoBusca);
}

function limparFiltros() {
    if (campoBusca) {
        campoBusca.value = "";
    }

    definirValorPadraoSelect(filtroFase);

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
    const resultado =
        obterResultadoSalvo(partida.id);

    const golsMandante =
        valorCampoPlacar(
            resultado?.golsMandante
        );

    const golsVisitante =
        valorCampoPlacar(
            resultado?.golsVisitante
        );

    const penaltisMandante =
        valorCampoPlacar(
            resultado?.penaltisMandante
        );

    const penaltisVisitante =
        valorCampoPlacar(
            resultado?.penaltisVisitante
        );

    const finalizado =
        resultado?.finalizado === true;

    const jogoMataMata =
        ehJogoMataMata(partida.id);

    const vencedor =
        obterVencedorResultado(
            resultado,
            partida
        );

    const statusTexto =
        finalizado
            ? "Finalizada"
            : resultado
                ? "Resultado salvo"
                : "Aguardando resultado";

    const statusClasse =
        finalizado
            ? "finalizada"
            : resultado
                ? "salva"
                : "pendente";

    return `
        <article
            class="partida-admin-card ${
                finalizado
                    ? "partida-finalizada"
                    : ""
            }"
            data-card-jogo="${partida.id}"
        >
            <div class="partida-admin-topo">
                <div>
                    <span class="partida-fase">
                        ${escaparHTML(
                            partida.fase ||
                            "Partida"
                        )}
                    </span>

                    ${
                        partida.grupo
                            ? `
                                <span class="partida-grupo">
                                    ${escaparHTML(
                                        partida.grupo
                                    )}
                                </span>
                            `
                            : ""
                    }
                </div>

                <span
                    class="status-partida ${statusClasse}"
                    data-status-jogo="${partida.id}"
                >
                    ${statusTexto}
                </span>
            </div>

            <div class="partida-identificacao">
                <strong>
                    Jogo ${partida.id}
                </strong>

                <span>
                    ${formatarInformacoesPartida(
                        partida
                    )}
                </span>
            </div>

            <div class="placar-admin">
                <div class="selecao-admin mandante">
                    <img
                        src="assets/Icon/${escaparHTML(
                            partida.bandeiraMandante ||
                            "TBD"
                        )}.png"
                        alt="${escaparHTML(
                            partida.mandante ||
                            "Mandante"
                        )}"
                        onerror="this.onerror=null; this.src='assets/Icon/TBD.png'"
                    >

                    <strong>
                        ${escaparHTML(
                            partida.mandante ||
                            "A definir"
                        )}
                    </strong>
                </div>

                <div class="campos-placar">
                    <input
                        id="golsMandante-${partida.id}"
                        class="input-gol"
                        type="number"
                        min="0"
                        max="99"
                        inputmode="numeric"
                        value="${golsMandante}"
                        aria-label="Gols de ${escaparHTML(
                            partida.mandante ||
                            "mandante"
                        )}"
                    >

                    <span class="separador-placar">
                        ×
                    </span>

                    <input
                        id="golsVisitante-${partida.id}"
                        class="input-gol"
                        type="number"
                        min="0"
                        max="99"
                        inputmode="numeric"
                        value="${golsVisitante}"
                        aria-label="Gols de ${escaparHTML(
                            partida.visitante ||
                            "visitante"
                        )}"
                    >
                </div>

                <div class="selecao-admin visitante">
                    <img
                        src="assets/Icon/${escaparHTML(
                            partida.bandeiraVisitante ||
                            "TBD"
                        )}.png"
                        alt="${escaparHTML(
                            partida.visitante ||
                            "Visitante"
                        )}"
                        onerror="this.onerror=null; this.src='assets/Icon/TBD.png'"
                    >

                    <strong>
                        ${escaparHTML(
                            partida.visitante ||
                            "A definir"
                        )}
                    </strong>
                </div>
            </div>

            ${
                jogoMataMata
                    ? criarBlocoPenaltis(
                        partida,
                        penaltisMandante,
                        penaltisVisitante
                    )
                    : ""
            }

            <div class="resultado-adicional">
                <label class="controle-finalizado">
                    <input
                        type="checkbox"
                        data-campo="finalizado"
                        data-jogo-id="${partida.id}"
                        ${finalizado ? "checked" : ""}
                    >

                    <span>
                        Marcar partida como finalizada
                    </span>
                </label>

                <div class="vencedor-atual">
                    <span>
                        Vencedor:
                    </span>

                    <strong data-vencedor-jogo="${partida.id}">
                        ${escaparHTML(
                            obterNomeVencedor(
                                vencedor,
                                partida
                            )
                        )}
                    </strong>
                </div>
            </div>

            <div class="acoes-resultado">
                <button
                    class="btn-limpar-resultado"
                    type="button"
                    data-acao="limpar-resultado"
                    data-jogo-id="${partida.id}"
                >
                    LIMPAR
                </button>

                <button
                    class="btn-salvar-resultado"
                    type="button"
                    data-acao="salvar-resultado"
                    data-jogo-id="${partida.id}"
                >
                    SALVAR RESULTADO
                </button>
            </div>
        </article>
    `;
}

function criarBlocoPenaltis(
    partida,
    penaltisMandante,
    penaltisVisitante
) {
    return `
        <div class="penaltis-admin">
            <div class="penaltis-info">
                <strong>
                    Pênaltis
                </strong>

                <span>
                    Preencha apenas se o jogo do mata-mata terminar empatado no tempo normal.
                </span>
            </div>

            <div class="campos-penaltis">
                <div class="penalti-time">
                    <span>
                        ${escaparHTML(
                            partida.mandante ||
                            "Mandante"
                        )}
                    </span>

                    <input
                        id="penaltisMandante-${partida.id}"
                        class="input-penalti"
                        type="number"
                        min="0"
                        max="99"
                        inputmode="numeric"
                        value="${penaltisMandante}"
                        aria-label="Pênaltis de ${escaparHTML(
                            partida.mandante ||
                            "mandante"
                        )}"
                    >
                </div>

                <span class="separador-penaltis">
                    ×
                </span>

                <div class="penalti-time">
                    <span>
                        ${escaparHTML(
                            partida.visitante ||
                            "Visitante"
                        )}
                    </span>

                    <input
                        id="penaltisVisitante-${partida.id}"
                        class="input-penalti"
                        type="number"
                        min="0"
                        max="99"
                        inputmode="numeric"
                        value="${penaltisVisitante}"
                        aria-label="Pênaltis de ${escaparHTML(
                            partida.visitante ||
                            "visitante"
                        )}"
                    >
                </div>
            </div>
        </div>
    `;
}

function formatarInformacoesPartida(partida) {
    return [
        partida.data,
        partida.hora,
        partida.estadio,
        partida.cidade
    ]
        .filter(Boolean)
        .map(escaparHTML)
        .join(" • ");
}

/* =====================================================
   SALVAMENTO DO RESULTADO
===================================================== */

async function salvarResultadoPartida(
    jogoId,
    botao
) {
    const partida = partidasComMataMata.find(
        (item) => Number(item.id) === jogoId
    );

    if (!partida) {
        mostrarMensagem(
            "Partida não encontrada.",
            "erro"
        );

        return;
    }

    const jogoMataMata =
        ehJogoMataMata(jogoId);

    const card =
        obterCardPartida(jogoId);

    const inputMandante =
        document.getElementById(
            `golsMandante-${jogoId}`
        );

    const inputVisitante =
        document.getElementById(
            `golsVisitante-${jogoId}`
        );

    const inputPenaltisMandante =
        document.getElementById(
            `penaltisMandante-${jogoId}`
        );

    const inputPenaltisVisitante =
        document.getElementById(
            `penaltisVisitante-${jogoId}`
        );

    const checkboxFinalizado =
        card?.querySelector(
            "[data-campo='finalizado']"
        );

    const golsMandante =
        converterPlacar(
            inputMandante?.value
        );

    const golsVisitante =
        converterPlacar(
            inputVisitante?.value
        );

    const penaltisMandante =
        converterPlacarOpcional(
            inputPenaltisMandante?.value
        );

    const penaltisVisitante =
        converterPlacarOpcional(
            inputPenaltisVisitante?.value
        );

    if (
        golsMandante === null ||
        golsVisitante === null
    ) {
        mostrarMensagem(
            `Informe um placar válido para o Jogo ${jogoId}.`,
            "erro"
        );

        destacarCampoInvalido(
            inputMandante,
            golsMandante === null
        );

        destacarCampoInvalido(
            inputVisitante,
            golsVisitante === null
        );

        return;
    }

    destacarCampoInvalido(
        inputMandante,
        false
    );

    destacarCampoInvalido(
        inputVisitante,
        false
    );

    const placarNormalEmpatado =
        golsMandante === golsVisitante;

    if (
        jogoMataMata &&
        placarNormalEmpatado
    ) {
        const penaltisInvalidos =
            penaltisMandante === null ||
            penaltisVisitante === null;

        if (penaltisInvalidos) {
            mostrarMensagem(
                `O Jogo ${jogoId} terminou empatado no tempo normal. Informe o resultado dos pênaltis.`,
                "erro"
            );

            destacarCampoInvalido(
                inputPenaltisMandante,
                penaltisMandante === null
            );

            destacarCampoInvalido(
                inputPenaltisVisitante,
                penaltisVisitante === null
            );

            return;
        }

        if (penaltisMandante === penaltisVisitante) {
            mostrarMensagem(
                "No mata-mata, o resultado dos pênaltis não pode terminar empatado.",
                "erro"
            );

            destacarCampoInvalido(
                inputPenaltisMandante,
                true
            );

            destacarCampoInvalido(
                inputPenaltisVisitante,
                true
            );

            return;
        }
    }

    destacarCampoInvalido(
        inputPenaltisMandante,
        false
    );

    destacarCampoInvalido(
        inputPenaltisVisitante,
        false
    );

    const finalizado =
        checkboxFinalizado?.checked === true;

    const resultadoPartida =
        determinarResultado(
            golsMandante,
            golsVisitante,
            partida,
            {
                jogoMataMata,
                penaltisMandante,
                penaltisVisitante
            }
        );

    const documentoResultado = {
        jogoId: partida.id,
        fase: partida.fase || "",
        grupo: partida.grupo || "",
        data: partida.data || "",
        hora: partida.hora || "",
        estadio: partida.estadio || "",
        cidade: partida.cidade || "",
        mandante: partida.mandante || "",
        visitante: partida.visitante || "",
        bandeiraMandante:
            partida.bandeiraMandante ||
            "TBD",
        bandeiraVisitante:
            partida.bandeiraVisitante ||
            "TBD",
        golsMandante,
        golsVisitante,

        penaltisMandante:
            resultadoPartida.foiPenaltis
                ? penaltisMandante
                : null,

        penaltisVisitante:
            resultadoPartida.foiPenaltis
                ? penaltisVisitante
                : null,

        resultado:
            resultadoPartida.resultado,

        vencedor:
            resultadoPartida.vencedor,

        finalizado,
        atualizadoPor:
            usuarioAtual?.uid || null,
        atualizadoEm:
            serverTimestamp()
    };

    try {
        definirBotaoCarregando(
            botao,
            true
        );

        const resultadoRef = doc(
            db,
            "resultados",
            `jogo_${jogoId}`
        );

        await setDoc(
            resultadoRef,
            documentoResultado,
            {
                merge: true
            }
        );

        resultadosPorJogo[
            `jogo_${jogoId}`
        ] = documentoResultado;

        resultadosPorJogo[
            String(jogoId)
        ] = documentoResultado;

        atualizarPartidasComMataMata();

        aplicarFiltros();

        mostrarMensagem(
            finalizado
                ? `Jogo ${jogoId} finalizado e salvo com sucesso.`
                : `Resultado do Jogo ${jogoId} salvo como provisório.`,
            "sucesso"
        );

    } catch (error) {
        console.error(
            `Erro ao salvar o Jogo ${jogoId}:`,
            error
        );

        mostrarMensagem(
            "Não foi possível salvar o resultado. Verifique sua conexão e suas permissões.",
            "erro"
        );

    } finally {
        definirBotaoCarregando(
            botao,
            false
        );
    }
}

function determinarResultado(
    golsMandante,
    golsVisitante,
    partida,
    opcoes = {}
) {
    const jogoMataMata =
        opcoes.jogoMataMata === true;

    const penaltisMandante =
        opcoes.penaltisMandante;

    const penaltisVisitante =
        opcoes.penaltisVisitante;

    if (golsMandante > golsVisitante) {
        return {
            resultado: "mandante",
            vencedor:
                partida.bandeiraMandante ||
                null,
            foiPenaltis: false
        };
    }

    if (golsVisitante > golsMandante) {
        return {
            resultado: "visitante",
            vencedor:
                partida.bandeiraVisitante ||
                null,
            foiPenaltis: false
        };
    }

    if (jogoMataMata) {
        if (penaltisMandante > penaltisVisitante) {
            return {
                resultado: "penaltis",
                vencedor:
                    partida.bandeiraMandante ||
                    null,
                foiPenaltis: true
            };
        }

        if (penaltisVisitante > penaltisMandante) {
            return {
                resultado: "penaltis",
                vencedor:
                    partida.bandeiraVisitante ||
                    null,
                foiPenaltis: true
            };
        }
    }

    return {
        resultado: "empate",
        vencedor: "empate",
        foiPenaltis: false
    };
}

/* =====================================================
   ATUALIZAÇÃO VISUAL
===================================================== */

function atualizarEstadoVisualFinalizado(
    card,
    finalizado
) {
    card.classList.toggle(
        "marcado-finalizado",
        finalizado
    );
}

function limparCamposPartida(jogoId) {
    const inputMandante =
        document.getElementById(
            `golsMandante-${jogoId}`
        );

    const inputVisitante =
        document.getElementById(
            `golsVisitante-${jogoId}`
        );

    const inputPenaltisMandante =
        document.getElementById(
            `penaltisMandante-${jogoId}`
        );

    const inputPenaltisVisitante =
        document.getElementById(
            `penaltisVisitante-${jogoId}`
        );

    const card =
        obterCardPartida(jogoId);

    const checkbox =
        card?.querySelector(
            "[data-campo='finalizado']"
        );

    [
        inputMandante,
        inputVisitante,
        inputPenaltisMandante,
        inputPenaltisVisitante
    ].forEach((campo) => {
        if (campo) {
            campo.value = "";
            campo.classList.remove(
                "campo-invalido"
            );
        }
    });

    if (checkbox) {
        checkbox.checked = false;
    }

    card?.classList.remove(
        "marcado-finalizado"
    );
}

/* =====================================================
   VENCEDOR
===================================================== */

function obterVencedorResultado(
    resultado,
    partida
) {
    if (!resultado) {
        return null;
    }

    if (resultado.vencedor) {
        return resultado.vencedor;
    }

    const golsMandante =
        converterPlacar(
            resultado.golsMandante
        );

    const golsVisitante =
        converterPlacar(
            resultado.golsVisitante
        );

    if (
        golsMandante === null ||
        golsVisitante === null
    ) {
        return null;
    }

    const jogoMataMata =
        ehJogoMataMata(partida.id);

    const penaltisMandante =
        converterPlacarOpcional(
            resultado.penaltisMandante
        );

    const penaltisVisitante =
        converterPlacarOpcional(
            resultado.penaltisVisitante
        );

    return determinarResultado(
        golsMandante,
        golsVisitante,
        partida,
        {
            jogoMataMata,
            penaltisMandante,
            penaltisVisitante
        }
    ).vencedor;
}

function obterNomeVencedor(
    vencedor,
    partida
) {
    if (!vencedor) {
        return "A definir";
    }

    if (vencedor === "empate") {
        return "Empate";
    }

    if (
        vencedor ===
        partida.bandeiraMandante
    ) {
        return (
            partida.mandante ||
            vencedor
        );
    }

    if (
        vencedor ===
        partida.bandeiraVisitante
    ) {
        return (
            partida.visitante ||
            vencedor
        );
    }

    return vencedor;
}

/* =====================================================
   CONTADOR
===================================================== */

function atualizarContador(quantidade) {
    if (!contadorPartidas) {
        return;
    }

    contadorPartidas.textContent =
        quantidade === 1
            ? "1 partida encontrada"
            : `${quantidade} partidas encontradas`;
}

/* =====================================================
   MENSAGENS
===================================================== */

function mostrarMensagem(
    texto,
    tipo = "informacao"
) {
    if (!mensagemPagina) {
        if (tipo === "erro") {
            console.error(texto);
        } else {
            console.log(texto);
        }

        return;
    }

    mensagemPagina.textContent = texto;

    mensagemPagina.className =
        `mensagem-admin ${tipo}`;

    mensagemPagina.hidden = false;

    window.clearTimeout(
        mostrarMensagem.timeout
    );

    mostrarMensagem.timeout =
        window.setTimeout(() => {
            mensagemPagina.hidden = true;
        }, 4500);
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

        window.location.href =
            "login-admin.html";

    } catch (error) {
        console.error(
            "Erro ao sair:",
            error
        );

        if (btnSair) {
            btnSair.disabled = false;
            btnSair.textContent = "SAIR";
        }

        mostrarMensagem(
            "Não foi possível sair. Tente novamente.",
            "erro"
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

function obterCardPartida(jogoId) {
    return (
        listaPartidas?.querySelector(
            `[data-card-jogo="${jogoId}"]`
        ) || null
    );
}

function ehJogoMataMata(jogoId) {
    const id = Number(jogoId);

    return id >= 73 && id <= 104;
}

function converterPlacar(valor) {
    if (
        valor === null ||
        valor === undefined ||
        String(valor).trim() === ""
    ) {
        return null;
    }

    const numero = Number(valor);

    if (
        !Number.isInteger(numero) ||
        numero < 0 ||
        numero > 99
    ) {
        return null;
    }

    return numero;
}

function converterPlacarOpcional(valor) {
    if (
        valor === null ||
        valor === undefined ||
        String(valor).trim() === ""
    ) {
        return null;
    }

    return converterPlacar(valor);
}

function valorCampoPlacar(valor) {
    const numero =
        converterPlacarOpcional(valor);

    return numero === null
        ? ""
        : numero;
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

function destacarCampoInvalido(
    campo,
    invalido
) {
    campo?.classList.toggle(
        "campo-invalido",
        invalido
    );

    if (invalido) {
        campo?.focus();
    }
}

function definirBotaoCarregando(
    botao,
    carregando
) {
    if (!botao) {
        return;
    }

    if (carregando) {
        botao.disabled = true;

        botao.dataset.textoOriginal =
            botao.textContent;

        botao.textContent =
            "SALVANDO...";
    } else {
        botao.disabled = false;

        botao.textContent =
            botao.dataset.textoOriginal ||
            "SALVAR RESULTADO";
    }
}