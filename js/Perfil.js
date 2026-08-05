import { auth, db } from "./firebase.js";
import { partidas } from "./partidas-data.js";
import { calcularPontuacaoTodosUsuarios } from "./pontuacao.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* =====================================================
   ELEMENTOS DA TELA
===================================================== */

const nomeUsuario = document.getElementById("nomeUsuario");
const usuarioEmail = document.getElementById("usuarioEmail");
const bandeiraUsuario = document.getElementById("bandeiraUsuario");
const pontosUsuario = document.getElementById("pontosUsuario");
const statusGrupos = document.getElementById("statusGrupos");
const statusMataMata = document.getElementById("statusMataMata");
const statusBolao = document.getElementById("statusBolao");

const pontuacaoGruposUsuario = document.getElementById(
    "pontuacaoGruposUsuario"
);

const pontuacaoMataMataUsuario = document.getElementById(
    "pontuacaoMataMataUsuario"
);

const top3Usuario = document.getElementById("top3Usuario");

const melhoresTerceirosUsuario = document.getElementById(
    "melhoresTerceirosUsuario"
);

const btnSair = document.getElementById("btnSair");

/* =====================================================
   ESTADO DA PÁGINA
===================================================== */

let usuarioAtual = null;
let dadosUsuario = {};
let palpiteUsuario = {};
let resultadosPorJogo = {};
let pontuacaoAtual = null;

/* =====================================================
   AUTENTICAÇÃO
===================================================== */

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    usuarioAtual = user;

    await carregarPerfil();
});

/* =====================================================
   CARREGAMENTO PRINCIPAL
===================================================== */

async function carregarPerfil() {
    try {
        definirEstadoCarregando();

        await Promise.all([
            carregarUsuario(),
            carregarPalpite(),
            carregarResultados(),
            carregarStatusBolao()
        ]);

        renderizarDadosUsuario();
        renderizarResumoPalpites();
        renderizarTop3();
        renderizarMelhoresTerceiros();

        await carregarPontuacaoAtual();

    } catch (error) {
        console.error(
            "Erro ao carregar perfil:",
            error
        );

        pontosUsuario.textContent =
            dadosUsuario.pontos ?? 0;

        if (pontuacaoGruposUsuario) {
            pontuacaoGruposUsuario.innerHTML = `
                <div class="erro-card">
                    Não foi possível carregar o detalhamento da pontuação dos grupos.
                </div>
            `;
        }

        if (pontuacaoMataMataUsuario) {
            pontuacaoMataMataUsuario.innerHTML = `
                <div class="erro-card">
                    Não foi possível carregar o detalhamento da pontuação do mata-mata.
                </div>
            `;
        }
    }
}

function definirEstadoCarregando() {
    pontosUsuario.textContent = "...";

    if (pontuacaoGruposUsuario) {
        pontuacaoGruposUsuario.innerHTML = `
            <div class="loading-card">
                Calculando sua pontuação por grupo...
            </div>
        `;
    }

    if (pontuacaoMataMataUsuario) {
        pontuacaoMataMataUsuario.innerHTML = `
            <div class="loading-card">
                Calculando sua pontuação no mata-mata...
            </div>
        `;
    }
}

/* =====================================================
   FIRESTORE
===================================================== */

async function carregarUsuario() {
    const usuarioRef = doc(
        db,
        "usuarios",
        usuarioAtual.uid
    );

    const usuarioSnap =
        await getDoc(usuarioRef);

    dadosUsuario =
        usuarioSnap.exists()
            ? usuarioSnap.data()
            : {};
}

async function carregarPalpite() {
    const palpiteRef = doc(
        db,
        "palpites",
        usuarioAtual.uid
    );

    const palpiteSnap =
        await getDoc(palpiteRef);

    palpiteUsuario =
        palpiteSnap.exists()
            ? palpiteSnap.data()
            : {};
}

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

async function carregarStatusBolao() {
    try {
        const configuracaoRef = doc(
            db,
            "configuracoes",
            "bolao"
        );

        const configuracaoSnap =
            await getDoc(configuracaoRef);

        if (!configuracaoSnap.exists()) {
            statusBolao.textContent =
                "O administrador ainda não configurou a abertura dos palpites.";

            return;
        }

        const configuracao =
            configuracaoSnap.data();

        if (configuracao.bolaoAberto === true) {
            statusBolao.textContent =
                "Os palpites estão abertos. Você ainda pode ajustar suas escolhas enquanto o bolão estiver liberado.";
        } else {
            statusBolao.textContent =
                "Os palpites estão fechados no momento. Você pode acompanhar seus palpites e sua pontuação.";
        }

    } catch (error) {
        console.error(
            "Erro ao carregar status do bolão:",
            error
        );

        statusBolao.textContent =
            "Não foi possível carregar o status do bolão.";
    }
}

/* =====================================================
   DADOS PRINCIPAIS DO USUÁRIO
===================================================== */

function renderizarDadosUsuario() {
    const nome =
        dadosUsuario.nome ||
        dadosUsuario.usuario ||
        "Usuário";

    const email =
        dadosUsuario.email ||
        usuarioAtual.email ||
        "E-mail não informado";

    const bandeira =
        dadosUsuario.bandeira ||
        "TBD";

    nomeUsuario.textContent = nome;
    usuarioEmail.textContent = email;
    pontosUsuario.textContent = "...";

    bandeiraUsuario.src =
        `assets/Icon/${bandeira}.png`;

    bandeiraUsuario.alt =
        `Bandeira de ${nome}`;

    bandeiraUsuario.onerror = () => {
        bandeiraUsuario.onerror = null;
        bandeiraUsuario.src =
            "assets/Icon/TBD.png";
    };
}

/* =====================================================
   STATUS DOS PALPITES
===================================================== */

function renderizarResumoPalpites() {
    const possuiGrupos =
        Object.keys(
            palpiteUsuario?.grupos || {}
        ).length > 0;

    const possuiGruposOrdenados =
        Object.keys(
            palpiteUsuario?.gruposOrdenados || {}
        ).length > 0;

    const gruposFinalizados =
        palpiteUsuario?.gruposFinalizados === true ||
        possuiGrupos ||
        possuiGruposOrdenados;

    const top3 =
        obterTop3Palpitado();

    const possuiEscolhasMataMata =
        Object.keys(
            palpiteUsuario?.mataMata?.escolhas || {}
        ).length > 0;

    const possuiMelhoresTerceiros =
        Array.isArray(
            palpiteUsuario?.mataMata?.melhoresTerceiros
        ) &&
        palpiteUsuario
            .mataMata
            .melhoresTerceiros
            .length > 0;

    const possuiTop3Completo =
        Boolean(top3?.campeao) &&
        Boolean(top3?.viceCampeao) &&
        Boolean(top3?.terceiroLugar);

    const mataMataFinalizado =
        palpiteUsuario?.mataMata?.finalizado === true ||
        palpiteUsuario?.mataMataFinalizado === true ||
        (
            possuiEscolhasMataMata &&
            possuiMelhoresTerceiros &&
            possuiTop3Completo
        );

    statusGrupos.textContent =
        gruposFinalizados
            ? "Salvo"
            : "Pendente";

    statusMataMata.textContent =
        mataMataFinalizado
            ? "Salvo"
            : "Pendente";
}

/* =====================================================
   PONTUAÇÃO ATUAL
===================================================== */

async function carregarPontuacaoAtual() {
    try {
        pontosUsuario.textContent = "...";

        if (pontuacaoGruposUsuario) {
            pontuacaoGruposUsuario.innerHTML = `
                <div class="loading-card">
                    Calculando sua pontuação por grupo...
                </div>
            `;
        }

        if (pontuacaoMataMataUsuario) {
            pontuacaoMataMataUsuario.innerHTML = `
                <div class="loading-card">
                    Calculando sua pontuação no mata-mata...
                </div>
            `;
        }

        const ranking =
            await calcularPontuacaoTodosUsuarios({
                salvar: false
            });

        pontuacaoAtual =
            ranking.find((participante) => {
                return (
                    participante.uid === usuarioAtual.uid ||
                    participante.id === usuarioAtual.uid
                );
            });

        if (!pontuacaoAtual) {
            pontosUsuario.textContent = "0";
            renderizarPontuacaoPorGrupos();
            renderizarPontuacaoMataMata();
            return;
        }

        pontosUsuario.textContent =
            pontuacaoAtual.pontos ?? 0;

        renderizarPontuacaoPorGrupos();
        renderizarPontuacaoMataMata();

    } catch (error) {
        console.error(
            "Erro ao calcular pontuação do perfil:",
            error
        );

        pontosUsuario.textContent =
            dadosUsuario.pontos ?? 0;

        if (pontuacaoGruposUsuario) {
            pontuacaoGruposUsuario.innerHTML = `
                <div class="erro-card">
                    Não foi possível carregar o detalhamento da pontuação dos grupos.
                </div>
            `;
        }

        if (pontuacaoMataMataUsuario) {
            pontuacaoMataMataUsuario.innerHTML = `
                <div class="erro-card">
                    Não foi possível carregar o detalhamento da pontuação do mata-mata.
                </div>
            `;
        }
    }
}

/* =====================================================
   PONTUAÇÃO POR GRUPO
===================================================== */

function renderizarPontuacaoPorGrupos() {
    const detalhesGrupos =
        pontuacaoAtual
            ?.pontuacao
            ?.detalhesGrupos || {};

    const gruposComJogos =
        Object.entries(detalhesGrupos)
            .filter(([, detalhe]) => {
                return Number(
                    detalhe?.jogosFinalizados || 0
                ) > 0;
            })
            .sort(([grupoA], [grupoB]) => {
                return ordenarNomeGrupo(
                    grupoA,
                    grupoB
                );
            });

    if (gruposComJogos.length === 0) {
        pontuacaoGruposUsuario.innerHTML = `
            <div class="empty-card">
                Nenhum grupo possui partida finalizada no momento.
                O detalhamento aparecerá após o primeiro resultado finalizado.
            </div>
        `;

        return;
    }

    pontuacaoGruposUsuario.innerHTML =
        gruposComJogos
            .map(([nomeGrupo, detalhe]) => {
                return criarCardPontuacaoGrupo(
                    nomeGrupo,
                    detalhe
                );
            })
            .join("");
}

function criarCardPontuacaoGrupo(
    nomeGrupo,
    detalhe
) {
    const pontosGrupo =
        Number(detalhe?.pontos || 0);

    const jogosFinalizados =
        Number(detalhe?.jogosFinalizados || 0);

    const classificacaoReal =
        Array.isArray(detalhe?.classificacao)
            ? detalhe.classificacao
            : [];

    const detalhesSelecoes =
        Array.isArray(detalhe?.porSelecao)
            ? detalhe.porSelecao
            : [];

    const percentualProgresso =
        Math.min(
            100,
            Math.max(
                0,
                (jogosFinalizados / 6) * 100
            )
        );

    return `
        <article class="pontuacao-grupo-card">
            <div class="pontuacao-grupo-topo">
                <div>
                    <span class="grupo-etiqueta">
                        ${escaparHTML(nomeGrupo)}
                    </span>

                    <h3>
                        ${pontosGrupo}
                        <small>
                            ${pontosGrupo === 1 ? "ponto" : "pontos"}
                        </small>
                    </h3>
                </div>

                <span class="jogos-finalizados">
                    ${jogosFinalizados} de 6 jogos
                </span>
            </div>

            <div class="progresso-grupo">
                <div
                    class="progresso-grupo-barra"
                    style="width: ${percentualProgresso}%"
                ></div>
            </div>

            <div class="comparacao-grupo">
                <div class="classificacao-resumo">
                    <h4>
                        Classificação atual
                    </h4>

                    ${
                        classificacaoReal.length > 0
                            ? classificacaoReal
                                .map((time, index) => {
                                    return criarLinhaClassificacaoReal(
                                        time,
                                        index
                                    );
                                })
                                .join("")
                            : `
                                <div class="aviso-sem-palpite">
                                    Classificação indisponível.
                                </div>
                            `
                    }
                </div>

                <div class="classificacao-resumo">
                    <h4>
                        Meu palpite
                    </h4>

                    ${
                        detalhesSelecoes.length > 0
                            ? detalhesSelecoes
                                .map((selecao) => {
                                    return criarLinhaPalpitePontuacao(
                                        selecao
                                    );
                                })
                                .join("")
                            : `
                                <div class="aviso-sem-palpite">
                                    Nenhum palpite encontrado para este grupo.
                                </div>
                            `
                    }
                </div>
            </div>

            <div class="detalhamento-pontos">
                <h4>
                    Como os pontos foram calculados
                </h4>

                ${
                    detalhesSelecoes.length > 0
                        ? detalhesSelecoes
                            .map((selecao) => {
                                return criarDetalheSelecao(
                                    selecao
                                );
                            })
                            .join("")
                        : `
                            <div class="aviso-sem-palpite">
                                Não há detalhes de pontuação disponíveis para este grupo.
                            </div>
                        `
                }
            </div>

            <div class="total-grupo">
                <span>
                    Total do ${escaparHTML(nomeGrupo)}
                </span>

                <strong>
                    ${pontosGrupo}
                    ${pontosGrupo === 1 ? "ponto" : "pontos"}
                </strong>
            </div>
        </article>
    `;
}

function criarLinhaClassificacaoReal(
    time,
    index
) {
    const codigo =
        normalizarCodigoTime(time?.codigo);

    const nome =
        time?.nome ||
        buscarNomeTimePorCodigo(codigo);

    const pontos =
        Number(time?.pontos || 0);

    const jogos =
        Number(time?.jogos || 0);

    const saldo =
        formatarSaldo(time?.saldoGols);

    return `
        <div class="linha-classificacao">
            <span class="numero-classificacao">
                ${index + 1}º
            </span>

            <img
                src="assets/Icon/${escaparHTML(codigo)}.png"
                alt="${escaparHTML(nome)}"
                onerror="this.onerror=null; this.src='assets/Icon/TBD.png'"
            >

            <div>
                <strong>
                    ${escaparHTML(nome)}
                </strong>

                <small>
                    ${pontos} pts • ${jogos} jogos • SG ${saldo}
                </small>
            </div>
        </div>
    `;
}

function criarLinhaPalpitePontuacao(selecao) {
    const codigo =
        normalizarCodigoTime(selecao?.codigo);

    const nome =
        buscarNomeTimePorCodigo(codigo);

    const posicaoPalpitada =
        obterPosicaoExibicao(
            selecao?.posicaoPalpitada
        );

    const posicaoReal =
        obterPosicaoExibicao(
            selecao?.posicaoReal
        );

    return `
        <div class="linha-classificacao">
            <span class="numero-classificacao">
                ${posicaoPalpitada}
            </span>

            <img
                src="assets/Icon/${escaparHTML(codigo)}.png"
                alt="${escaparHTML(nome)}"
                onerror="this.onerror=null; this.src='assets/Icon/TBD.png'"
            >

            <div>
                <strong>
                    ${escaparHTML(nome)}
                </strong>

                <small>
                    Posição atual: ${posicaoReal}
                </small>
            </div>
        </div>
    `;
}

function criarDetalheSelecao(selecao) {
    const codigo =
        normalizarCodigoTime(selecao?.codigo);

    const nome =
        buscarNomeTimePorCodigo(codigo);

    const pontos =
        Number(selecao?.pontos || 0);

    const posicaoPalpitada =
        obterPosicaoExibicao(
            selecao?.posicaoPalpitada
        );

    const posicaoReal =
        obterPosicaoExibicao(
            selecao?.posicaoReal
        );

    const motivo =
        selecao?.motivo ||
        "Sem pontuação";

    const pontuou =
        pontos > 0;

    return `
        <div
            class="detalhe-selecao ${
                pontuou ? "pontuou" : "nao-pontuou"
            }"
        >
            <div class="detalhe-selecao-time">
                <img
                    src="assets/Icon/${escaparHTML(codigo)}.png"
                    alt="${escaparHTML(nome)}"
                    onerror="this.onerror=null; this.src='assets/Icon/TBD.png'"
                >

                <div>
                    <strong>
                        ${escaparHTML(nome)}
                    </strong>

                    <span>
                        Palpite: ${posicaoPalpitada} • Atual: ${posicaoReal}
                    </span>
                </div>
            </div>

            <div class="detalhe-selecao-resultado">
                <strong>
                    +${pontos}
                </strong>

                <span>
                    ${escaparHTML(motivo)}
                </span>
            </div>
        </div>
    `;
}

/* =====================================================
   PONTUAÇÃO DO MATA-MATA
===================================================== */

function renderizarPontuacaoMataMata() {
    if (!pontuacaoMataMataUsuario) {
        return;
    }

    const escolhas =
        palpiteUsuario?.mataMata?.escolhas || {};

    if (
        !escolhas ||
        Object.keys(escolhas).length === 0
    ) {
        pontuacaoMataMataUsuario.innerHTML = `
            <div class="empty-card">
                Você ainda não possui escolhas salvas no mata-mata.
            </div>
        `;

        return;
    }

    const fases =
        obterFasesMataMataPerfil();

    pontuacaoMataMataUsuario.innerHTML =
        fases
            .map((fase) => {
                return criarCardPontuacaoMataMata(
                    fase,
                    escolhas
                );
            })
            .join("");
}

function criarCardPontuacaoMataMata(
    fase,
    escolhas
) {
    const escolhasDaFase =
        obterEscolhasDaFase(
            escolhas,
            fase.jogos
        );

    const classificadosReais =
        obterClassificadosReaisDaFase(
            fase.jogos
        );

    const jogosFinalizados =
        fase.jogos.filter((jogoId) => {
            const resultado =
                obterResultadoPorJogoId(jogoId);

            return resultado?.finalizado === true;
        }).length;

    const percentualProgresso =
        Math.min(
            100,
            Math.max(
                0,
                (jogosFinalizados / fase.jogos.length) * 100
            )
        );

    const detalhes =
        escolhasDaFase.map((escolha) => {
            return calcularStatusEscolhaMataMata(
                escolha,
                fase
            );
        });

    const pontosFase =
        detalhes.reduce((total, detalhe) => {
            return total + Number(detalhe.pontos || 0);
        }, 0);

    return `
        <article class="pontuacao-mata-card">
            <div class="pontuacao-grupo-topo">
                <div>
                    <span class="grupo-etiqueta">
                        ${escaparHTML(fase.nome)}
                    </span>

                    <h3>
                        ${pontosFase}
                        <small>
                            ${pontosFase === 1 ? "ponto" : "pontos"}
                        </small>
                    </h3>
                </div>

                <span class="jogos-finalizados">
                    ${jogosFinalizados} de ${fase.jogos.length} jogos
                </span>
            </div>

            <div class="progresso-grupo">
                <div
                    class="progresso-grupo-barra"
                    style="width: ${percentualProgresso}%"
                ></div>
            </div>

            <div class="comparacao-grupo comparacao-mata">
                <div class="classificacao-resumo">
                    <h4>
                        Minhas escolhas
                    </h4>

                    ${
                        escolhasDaFase.length > 0
                            ? escolhasDaFase
                                .map((escolha) => {
                                    return criarLinhaEscolhaMataMata(
                                        escolha
                                    );
                                })
                                .join("")
                            : `
                                <div class="aviso-sem-palpite">
                                    Nenhuma escolha encontrada para esta fase.
                                </div>
                            `
                    }
                </div>

                <div class="classificacao-resumo">
                    <h4>
                        Classificados reais
                    </h4>

                    ${
                        classificadosReais.length > 0
                            ? classificadosReais
                                .map((time, index) => {
                                    return criarLinhaClassificadoRealMataMata(
                                        time,
                                        index
                                    );
                                })
                                .join("")
                            : `
                                <div class="aviso-sem-palpite">
                                    Aguardando resultados finalizados nesta fase.
                                </div>
                            `
                    }
                </div>
            </div>

            <div class="detalhamento-pontos">
                <h4>
                    Como os pontos foram calculados
                </h4>

                ${
                    detalhes.length > 0
                        ? detalhes
                            .map((detalhe) => {
                                return criarDetalheMataMata(
                                    detalhe
                                );
                            })
                            .join("")
                        : `
                            <div class="aviso-sem-palpite">
                                Não há escolhas para detalhar nesta fase.
                            </div>
                        `
                }
            </div>

            <div class="total-grupo total-mata">
                <span>
                    Total em ${escaparHTML(fase.nome)}
                </span>

                <strong>
                    ${pontosFase}
                    ${pontosFase === 1 ? "ponto" : "pontos"}
                </strong>
            </div>
        </article>
    `;
}

function obterFasesMataMataPerfil() {
    return [
        {
            nome: "16 Avos",
            jogos: gerarIntervalo(73, 88),
            pontos: 2,
            textoAcerto: "Classificado para as oitavas"
        },
        {
            nome: "Oitavas",
            jogos: gerarIntervalo(89, 96),
            pontos: 4,
            textoAcerto: "Classificado para as quartas"
        },
        {
            nome: "Quartas",
            jogos: gerarIntervalo(97, 100),
            pontos: 6,
            textoAcerto: "Classificado para as semifinais"
        },
        {
            nome: "Semifinais",
            jogos: gerarIntervalo(101, 102),
            pontos: 8,
            textoAcerto: "Classificado para a final"
        },
        {
            nome: "Disputa de 3º Lugar",
            jogos: [103],
            pontos: 8,
            textoAcerto: "Terceiro lugar correto"
        },
        {
            nome: "Final",
            jogos: [104],
            pontos: 15,
            textoAcerto: "Campeão correto"
        }
    ];
}

function obterEscolhasDaFase(
    escolhas,
    jogos
) {
    const escolhasUnicas = new Map();

    jogos.forEach((jogoId) => {
        const codigo =
            normalizarCodigoTime(
                escolhas[String(jogoId)] ||
                escolhas[Number(jogoId)]
            );

        if (
            !codigo ||
            codigo === "TBD" ||
            codigo === "EMPATE"
        ) {
            return;
        }

        if (!escolhasUnicas.has(codigo)) {
            escolhasUnicas.set(codigo, {
                jogoId,
                codigo,
                nome: buscarNomeTimePorCodigo(codigo)
            });
        }
    });

    return Array.from(
        escolhasUnicas.values()
    );
}

function obterClassificadosReaisDaFase(jogos) {
    const classificados = [];

    jogos.forEach((jogoId) => {
        const resultado =
            obterResultadoPorJogoId(jogoId);

        if (resultado?.finalizado !== true) {
            return;
        }

        const vencedor =
            obterVencedorResultado(resultado);

        if (!vencedor) {
            return;
        }

        classificados.push({
            jogoId,
            codigo: vencedor,
            nome: buscarNomeTimePorCodigo(vencedor)
        });
    });

    return classificados;
}

function calcularStatusEscolhaMataMata(
    escolha,
    fase
) {
    const vencedoresReais =
        new Set(
            obterClassificadosReaisDaFase(fase.jogos)
                .map((time) => time.codigo)
        );

    const todosJogosFinalizados =
        fase.jogos.every((jogoId) => {
            const resultado =
                obterResultadoPorJogoId(jogoId);

            return resultado?.finalizado === true;
        });

    const perdeuEmJogoFinalizado =
        fase.jogos.some((jogoId) => {
            const resultado =
                obterResultadoPorJogoId(jogoId);

            if (resultado?.finalizado !== true) {
                return false;
            }

            const mandante =
                normalizarCodigoTime(resultado.bandeiraMandante);

            const visitante =
                normalizarCodigoTime(resultado.bandeiraVisitante);

            const vencedor =
                obterVencedorResultado(resultado);

            const participou =
                mandante === escolha.codigo ||
                visitante === escolha.codigo;

            return participou && vencedor !== escolha.codigo;
        });

    if (vencedoresReais.has(escolha.codigo)) {
        return {
            ...escolha,
            status: "pontuou",
            pontos: fase.pontos,
            motivo: fase.textoAcerto
        };
    }

    if (perdeuEmJogoFinalizado) {
        return {
            ...escolha,
            status: "nao-pontuou",
            pontos: 0,
            motivo: "Seleção eliminada nesta fase"
        };
    }

    if (todosJogosFinalizados) {
        return {
            ...escolha,
            status: "nao-pontuou",
            pontos: 0,
            motivo: "Seleção não avançou nesta fase"
        };
    }

    return {
        ...escolha,
        status: "aguardando",
        pontos: 0,
        motivo: "Aguardando resultados da fase"
    };
}

function criarLinhaEscolhaMataMata(escolha) {
    return `
        <div class="linha-classificacao">
            <span class="numero-classificacao">
                J${escaparHTML(escolha.jogoId)}
            </span>

            <img
                src="assets/Icon/${escaparHTML(escolha.codigo)}.png"
                alt="${escaparHTML(escolha.nome)}"
                onerror="this.onerror=null; this.src='assets/Icon/TBD.png'"
            >

            <div>
                <strong>
                    ${escaparHTML(escolha.nome)}
                </strong>

                <small>
                    Escolha no seu chaveamento
                </small>
            </div>
        </div>
    `;
}

function criarLinhaClassificadoRealMataMata(
    time,
    index
) {
    return `
        <div class="linha-classificacao">
            <span class="numero-classificacao">
                ${index + 1}
            </span>

            <img
                src="assets/Icon/${escaparHTML(time.codigo)}.png"
                alt="${escaparHTML(time.nome)}"
                onerror="this.onerror=null; this.src='assets/Icon/TBD.png'"
            >

            <div>
                <strong>
                    ${escaparHTML(time.nome)}
                </strong>

                <small>
                    Vencedor do Jogo ${escaparHTML(time.jogoId)}
                </small>
            </div>
        </div>
    `;
}

function criarDetalheMataMata(detalhe) {
    const pontuou =
        detalhe.status === "pontuou";

    const aguardando =
        detalhe.status === "aguardando";

    return `
        <div
            class="detalhe-selecao detalhe-mata ${
                pontuou
                    ? "pontuou"
                    : aguardando
                        ? "aguardando"
                        : "nao-pontuou"
            }"
        >
            <div class="detalhe-selecao-time">
                <img
                    src="assets/Icon/${escaparHTML(detalhe.codigo)}.png"
                    alt="${escaparHTML(detalhe.nome)}"
                    onerror="this.onerror=null; this.src='assets/Icon/TBD.png'"
                >

                <div>
                    <strong>
                        ${escaparHTML(detalhe.nome)}
                    </strong>

                    <span>
                        Escolha feita no Jogo ${escaparHTML(detalhe.jogoId)}
                    </span>
                </div>
            </div>

            <div class="detalhe-selecao-resultado">
                <strong>
                    +${Number(detalhe.pontos || 0)}
                </strong>

                <span>
                    ${escaparHTML(detalhe.motivo)}
                </span>
            </div>
        </div>
    `;
}

/* =====================================================
   TOP 3
===================================================== */

function renderizarTop3() {
    const top3 =
        obterTop3Palpitado();

    if (
        !top3 ||
        (
            !top3.campeao &&
            !top3.viceCampeao &&
            !top3.terceiroLugar
        )
    ) {
        top3Usuario.innerHTML = `
            <div class="empty-card">
                Você ainda não finalizou o mata-mata.
            </div>
        `;

        return;
    }

    const campeao =
        buscarTimePorCodigo(
            top3.campeao
        );

    const vice =
        buscarTimePorCodigo(
            top3.viceCampeao
        );

    const terceiro =
        buscarTimePorCodigo(
            top3.terceiroLugar
        );

    top3Usuario.innerHTML = `
        ${criarTop3Card("Campeão", campeao, "campeao")}
        ${criarTop3Card("Vice-campeão", vice, "vice")}
        ${criarTop3Card("3º lugar", terceiro, "terceiro")}
    `;
}

function obterTop3Palpitado() {
    const mataMata =
        palpiteUsuario?.mataMata || {};

    if (mataMata.top3) {
        return {
            campeao:
                mataMata.top3.campeao || null,
            viceCampeao:
                mataMata.top3.viceCampeao || null,
            terceiroLugar:
                mataMata.top3.terceiroLugar || null
        };
    }

    return {
        campeao:
            mataMata.campeao || null,
        viceCampeao:
            mataMata.viceCampeao || null,
        terceiroLugar:
            mataMata.terceiroLugar || null
    };
}

function criarTop3Card(
    titulo,
    time,
    classe
) {
    if (!time?.codigo) {
        return `
            <div class="top3-card ${classe}">
                <span>
                    ${escaparHTML(titulo)}
                </span>

                <img
                    src="assets/Icon/TBD.png"
                    alt="A definir"
                >

                <h3>
                    A definir
                </h3>
            </div>
        `;
    }

    return `
        <div class="top3-card ${classe}">
            <span>
                ${escaparHTML(titulo)}
            </span>

            <img
                src="assets/Icon/${escaparHTML(time.codigo)}.png"
                alt="${escaparHTML(time.nome)}"
                onerror="this.onerror=null; this.src='assets/Icon/TBD.png'"
            >

            <h3>
                ${escaparHTML(time.nome)}
            </h3>
        </div>
    `;
}

/* =====================================================
   MELHORES TERCEIROS
===================================================== */

function renderizarMelhoresTerceiros() {
    const melhoresTerceiros =
        palpiteUsuario?.mataMata?.melhoresTerceiros || [];

    if (
        !Array.isArray(melhoresTerceiros) ||
        melhoresTerceiros.length === 0
    ) {
        melhoresTerceirosUsuario.innerHTML = `
            <div class="empty-card">
                Você ainda não selecionou os melhores terceiros.
            </div>
        `;

        return;
    }

    melhoresTerceirosUsuario.innerHTML =
        melhoresTerceiros
            .map((item) => {
                const letraGrupo =
                    obterLetraGrupo(item);

                const time =
                    obterTerceiroDoGrupo(letraGrupo);

                if (!time) {
                    return `
                        <div class="terceiro-card">
                            <span>
                                Grupo ${escaparHTML(letraGrupo)}
                            </span>

                            <div class="terceiro-info">
                                <img
                                    src="assets/Icon/TBD.png"
                                    alt="A definir"
                                >

                                <strong>
                                    A definir
                                </strong>
                            </div>
                        </div>
                    `;
                }

                return `
                    <div class="terceiro-card">
                        <span>
                            Grupo ${escaparHTML(letraGrupo)}
                        </span>

                        <div class="terceiro-info">
                            <img
                                src="assets/Icon/${escaparHTML(time.codigo)}.png"
                                alt="${escaparHTML(time.nome)}"
                                onerror="this.onerror=null; this.src='assets/Icon/TBD.png'"
                            >

                            <strong>
                                ${escaparHTML(time.nome)}
                            </strong>
                        </div>
                    </div>
                `;
            })
            .join("");
}

function obterLetraGrupo(item) {
    if (typeof item === "string") {
        return item
            .replace("Grupo ", "")
            .trim();
    }

    return String(
        item?.grupo ||
        item?.letraGrupo ||
        item?.letra ||
        ""
    )
        .replace("Grupo ", "")
        .trim();
}

/* =====================================================
   NORMALIZAÇÃO DOS GRUPOS SALVOS
===================================================== */

function obterGruposNormalizados() {
    if (
        palpiteUsuario?.grupos &&
        Object.keys(palpiteUsuario.grupos).length > 0
    ) {
        return palpiteUsuario.grupos;
    }

    if (
        !palpiteUsuario?.gruposOrdenados ||
        Object.keys(palpiteUsuario.gruposOrdenados).length === 0
    ) {
        return {};
    }

    const gruposNormalizados = {};

    Object.entries(
        palpiteUsuario.gruposOrdenados
    ).forEach(([nomeGrupo, codigos]) => {
        if (!Array.isArray(codigos)) {
            return;
        }

        const ordemCompleta =
            codigos.map((codigo, index) => ({
                posicao: index + 1,
                codigo,
                nome: buscarNomeTimePorCodigo(codigo)
            }));

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

function obterOrdemCompletaGrupo(grupo) {
    if (
        Array.isArray(grupo?.ordemCompleta) &&
        grupo.ordemCompleta.length > 0
    ) {
        return [...grupo.ordemCompleta]
            .sort((a, b) => {
                return (
                    Number(a.posicao || 0) -
                    Number(b.posicao || 0)
                );
            });
    }

    return [
        grupo?.primeiro,
        grupo?.segundo,
        grupo?.terceiro,
        grupo?.quarto
    ]
        .filter(Boolean)
        .map((codigo, index) => ({
            codigo,
            nome: buscarNomeTimePorCodigo(codigo),
            posicao: index + 1
        }));
}

/* =====================================================
   RESULTADOS DO MATA-MATA
===================================================== */

function obterResultadoPorJogoId(jogoId) {
    const id = Number(jogoId);

    return (
        resultadosPorJogo[`jogo_${id}`] ||
        resultadosPorJogo[String(id)] ||
        Object.values(resultadosPorJogo).find((resultado) => {
            return Number(resultado?.jogoId) === id;
        }) ||
        null
    );
}

function obterVencedorResultado(resultado) {
    if (!resultado) {
        return null;
    }

    const vencedorSalvo =
        normalizarCodigoTime(resultado.vencedor);

    if (
        vencedorSalvo &&
        vencedorSalvo !== "TBD" &&
        vencedorSalvo !== "EMPATE"
    ) {
        return vencedorSalvo;
    }

    if (resultado.resultado === "mandante") {
        return normalizarCodigoTime(
            resultado.bandeiraMandante
        );
    }

    if (resultado.resultado === "visitante") {
        return normalizarCodigoTime(
            resultado.bandeiraVisitante
        );
    }

    if (resultado.resultado === "penaltis") {
        const penaltisMandante =
            converterNumero(resultado.penaltisMandante);

        const penaltisVisitante =
            converterNumero(resultado.penaltisVisitante);

        if (
            penaltisMandante !== null &&
            penaltisVisitante !== null
        ) {
            if (penaltisMandante > penaltisVisitante) {
                return normalizarCodigoTime(
                    resultado.bandeiraMandante
                );
            }

            if (penaltisVisitante > penaltisMandante) {
                return normalizarCodigoTime(
                    resultado.bandeiraVisitante
                );
            }
        }
    }

    return null;
}

/* =====================================================
   TIMES E NOMES
===================================================== */

function buscarTimePorCodigo(codigo) {
    if (!codigo) {
        return null;
    }

    const codigoNormalizado =
        normalizarCodigoTime(codigo);

    const grupos =
        obterGruposNormalizados();

    for (const grupo of Object.values(grupos)) {
        const ordem =
            obterOrdemCompletaGrupo(grupo);

        const timeEncontrado =
            ordem.find((time) => {
                return (
                    normalizarCodigoTime(time.codigo) ===
                    codigoNormalizado
                );
            });

        if (timeEncontrado) {
            return {
                codigo: codigoNormalizado,
                nome:
                    timeEncontrado.nome ||
                    buscarNomeTimePorCodigo(codigoNormalizado)
            };
        }
    }

    return {
        codigo: codigoNormalizado,
        nome: buscarNomeTimePorCodigo(codigoNormalizado)
    };
}

function obterTerceiroDoGrupo(letraGrupo) {
    if (!letraGrupo) {
        return null;
    }

    const grupos =
        obterGruposNormalizados();

    const nomeGrupo =
        String(letraGrupo).startsWith("Grupo ")
            ? String(letraGrupo)
            : `Grupo ${letraGrupo}`;

    const grupo =
        grupos[nomeGrupo];

    if (!grupo) {
        return null;
    }

    const codigoTerceiro =
        grupo.terceiro ||
        obterOrdemCompletaGrupo(grupo)[2]?.codigo;

    if (!codigoTerceiro) {
        return null;
    }

    return buscarTimePorCodigo(
        codigoTerceiro
    );
}

function buscarNomeTimePorCodigo(codigo) {
    if (!codigo) {
        return "A definir";
    }

    const codigoNormalizado =
        normalizarCodigoTime(codigo);

    for (const partida of partidas) {
        const mandante =
            normalizarCodigoTime(partida.bandeiraMandante);

        const visitante =
            normalizarCodigoTime(partida.bandeiraVisitante);

        if (mandante === codigoNormalizado) {
            return partida.mandante || codigoNormalizado;
        }

        if (visitante === codigoNormalizado) {
            return partida.visitante || codigoNormalizado;
        }
    }

    return codigoNormalizado;
}

/* =====================================================
   HELPERS
===================================================== */

function gerarIntervalo(inicio, fim) {
    const numeros = [];

    for (let numero = inicio; numero <= fim; numero++) {
        numeros.push(numero);
    }

    return numeros;
}

function obterPosicaoExibicao(posicao) {
    const numero =
        Number(posicao);

    if (!Number.isInteger(numero)) {
        return "--";
    }

    return `${numero}º`;
}

function formatarSaldo(saldo) {
    const valor =
        Number(saldo || 0);

    return valor > 0
        ? `+${valor}`
        : String(valor);
}

function converterNumero(valor) {
    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {
        return null;
    }

    const numero =
        Number(valor);

    return Number.isFinite(numero)
        ? numero
        : null;
}

function normalizarCodigoTime(codigo) {
    if (!codigo) {
        return "TBD";
    }

    return String(codigo)
        .trim()
        .toUpperCase();
}

function ordenarNomeGrupo(
    grupoA,
    grupoB
) {
    const letraA =
        String(grupoA)
            .replace("Grupo ", "")
            .trim();

    const letraB =
        String(grupoB)
            .replace("Grupo ", "")
            .trim();

    return letraA.localeCompare(
        letraB,
        "pt-BR",
        {
            sensitivity: "base"
        }
    );
}

function escaparHTML(valor) {
    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/* =====================================================
   SAIR
===================================================== */

btnSair?.addEventListener(
    "click",
    async () => {
        try {
            btnSair.disabled = true;
            btnSair.textContent = "SAINDO...";

            await signOut(auth);

            window.location.href = "login.html";

        } catch (error) {
            console.error(
                "Erro ao sair:",
                error
            );

            btnSair.disabled = false;
            btnSair.textContent = "SAIR";

            alert(
                "Não foi possível sair. Tente novamente."
            );
        }
    }
);