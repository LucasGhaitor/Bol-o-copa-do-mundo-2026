import { db } from "./firebase.js";
import { partidas } from "./partidas-data.js";

import {
    MELHORES_TERCEIROS_OFICIAIS
} from "./mata-mata-oficial.js";

import {
    collection,
    getDocs,
    doc,
    setDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* =====================================================
   PONTOS
===================================================== */

const PONTOS = {
    grupoPrimeiroExato: 5,
    grupoSegundoExato: 4,
    grupoTerceiroExato: 3,
    grupoClassificadoPosicaoErrada: 2,

    melhorTerceiro: 3,

    round32: 2,
    oitavas: 4,
    quartas: 6,
    semifinais: 8,
    terceiroLugar: 8,
    campeao: 15,
    viceCampeao: 10,

    bonusTop3Completo: 20
};

/* =====================================================
   FUNÇÃO PRINCIPAL
===================================================== */

export async function calcularPontuacaoTodosUsuarios({
    salvar = false
} = {}) {
    const usuarios = await carregarUsuarios();
    const palpites = await carregarPalpites();
    const resultados = await carregarResultados();

    const tabelasGrupos =
        calcularTabelasDosGrupos(resultados);

    const melhoresTerceirosReais =
        obterMelhoresTerceirosReais(tabelasGrupos);

    const ranking = usuarios.map((usuario) => {
        const palpite =
            palpites[usuario.uid] || null;

        const pontuacao =
            calcularPontuacaoUsuario({
                palpite,
                resultados,
                tabelasGrupos,
                melhoresTerceirosReais
            });

        return {
            uid: usuario.uid,
            nome: usuario.nome || "Usuário",
            usuario: usuario.usuario || "",
            bandeira: usuario.bandeira || "TBD",
            pontos: pontuacao.total,
            pontuacao
        };
    });

    ranking.sort((a, b) => {
        if (b.pontos !== a.pontos) {
            return b.pontos - a.pontos;
        }

        return String(a.nome || "")
            .localeCompare(String(b.nome || ""));
    });

    if (salvar) {
        await salvarPontuacoes(ranking);
    }

    return ranking;
}

/* =====================================================
   CARREGAMENTOS
===================================================== */

async function carregarUsuarios() {
    const snapshot =
        await getDocs(collection(db, "usuarios"));

    return snapshot.docs.map((documento) => ({
        uid: documento.id,
        ...documento.data()
    }));
}

async function carregarPalpites() {
    const snapshot =
        await getDocs(collection(db, "palpites"));

    const palpites = {};

    snapshot.forEach((documento) => {
        palpites[documento.id] =
            documento.data();
    });

    return palpites;
}

async function carregarResultados() {
    const snapshot =
        await getDocs(collection(db, "resultados"));

    const resultados = {};

    snapshot.forEach((documento) => {
        const dados = documento.data();

        resultados[documento.id] = dados;

        if (dados.jogoId !== undefined) {
            resultados[`jogo_${dados.jogoId}`] =
                dados;

            resultados[String(dados.jogoId)] =
                dados;
        }
    });

    return resultados;
}

async function salvarPontuacoes(ranking) {
    const tarefas = ranking.map(async (item) => {
        await setDoc(
            doc(db, "pontuacoes", item.uid),
            {
                uid: item.uid,
                nome: item.nome,
                usuario: item.usuario,
                bandeira: item.bandeira,
                total: item.pontos,
                detalhamento: item.pontuacao,
                atualizadoEm: serverTimestamp()
            },
            {
                merge: true
            }
        );

        await updateDoc(
            doc(db, "usuarios", item.uid),
            {
                pontos: item.pontos
            }
        );
    });

    await Promise.all(tarefas);
}

/* =====================================================
   CÁLCULO DO USUÁRIO
===================================================== */

function calcularPontuacaoUsuario({
    palpite,
    resultados,
    tabelasGrupos,
    melhoresTerceirosReais
}) {
    const pontuacao =
        criarPontuacaoZerada();

    if (!palpite) {
        return pontuacao;
    }

    calcularPontosGrupos(
        palpite,
        tabelasGrupos,
        pontuacao
    );

    calcularPontosMelhoresTerceiros(
        palpite,
        melhoresTerceirosReais,
        pontuacao
    );

    calcularPontosMataMata(
        palpite,
        resultados,
        pontuacao
    );

    calcularPontosTop3(
        palpite,
        resultados,
        pontuacao
    );

    pontuacao.total =
        pontuacao.grupos +
        pontuacao.melhoresTerceiros +
        pontuacao.mataMata +
        pontuacao.top3 +
        pontuacao.bonus;

    return pontuacao;
}

function criarPontuacaoZerada() {
    return {
        total: 0,
        grupos: 0,
        melhoresTerceiros: 0,
        mataMata: 0,
        top3: 0,
        bonus: 0,

        /*
         * Usado pelo perfil.html para montar os cards completos
         * de transparência da pontuação por grupo.
         */
        detalhesGrupos: {},

        /*
         * Usado para histórico, ranking e futuros detalhamentos.
         */
        detalhes: {
            grupos: [],
            melhoresTerceiros: [],
            mataMata: [],
            top3: []
        }
    };
}

/* =====================================================
   FASE DE GRUPOS
===================================================== */

function calcularTabelasDosGrupos(resultados) {
    const tabelas = {};

    const jogosGrupos = partidas.filter((partida) => {
        return normalizarTexto(partida.fase) ===
            normalizarTexto("Fase de Grupos");
    });

    jogosGrupos.forEach((partida) => {
        if (!tabelas[partida.grupo]) {
            tabelas[partida.grupo] = {
                grupo: partida.grupo,
                times: {},
                jogosFinalizados: 0
            };
        }

        garantirTimeNaTabela(
            tabelas[partida.grupo],
            {
                codigo: normalizarCodigo(partida.bandeiraMandante),
                nome: partida.mandante
            }
        );

        garantirTimeNaTabela(
            tabelas[partida.grupo],
            {
                codigo: normalizarCodigo(partida.bandeiraVisitante),
                nome: partida.visitante
            }
        );
    });

    Object.entries(resultados).forEach(([idResultado, resultado]) => {
        if (!resultado?.finalizado) {
            return;
        }

        const jogoId =
            obterNumeroJogo(idResultado, resultado);

        const partida =
            partidas.find((item) => {
                return Number(item.id) === Number(jogoId);
            });

        if (
            !partida ||
            normalizarTexto(partida.fase) !== normalizarTexto("Fase de Grupos")
        ) {
            return;
        }

        const golsMandante =
            Number(resultado.golsMandante);

        const golsVisitante =
            Number(resultado.golsVisitante);

        if (
            !Number.isFinite(golsMandante) ||
            !Number.isFinite(golsVisitante)
        ) {
            return;
        }

        const tabela =
            tabelas[partida.grupo];

        aplicarResultadoNaTabela({
            tabela,
            mandante: normalizarCodigo(partida.bandeiraMandante),
            visitante: normalizarCodigo(partida.bandeiraVisitante),
            golsMandante,
            golsVisitante
        });
    });

    Object.values(tabelas).forEach((tabela) => {
        tabela.ordenados =
            Object.values(tabela.times)
                .sort(ordenarTabela);
    });

    return tabelas;
}

function garantirTimeNaTabela(tabela, time) {
    if (
        !time.codigo ||
        time.codigo === "TBD"
    ) {
        return;
    }

    if (!tabela.times[time.codigo]) {
        tabela.times[time.codigo] = {
            codigo: time.codigo,
            nome: time.nome,
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

function aplicarResultadoNaTabela({
    tabela,
    mandante,
    visitante,
    golsMandante,
    golsVisitante
}) {
    if (!tabela) {
        return;
    }

    const timeMandante =
        tabela.times[mandante];

    const timeVisitante =
        tabela.times[visitante];

    if (!timeMandante || !timeVisitante) {
        return;
    }

    tabela.jogosFinalizados++;

    timeMandante.jogos++;
    timeVisitante.jogos++;

    timeMandante.golsPro += golsMandante;
    timeMandante.golsContra += golsVisitante;

    timeVisitante.golsPro += golsVisitante;
    timeVisitante.golsContra += golsMandante;

    timeMandante.saldo =
        timeMandante.golsPro -
        timeMandante.golsContra;

    timeVisitante.saldo =
        timeVisitante.golsPro -
        timeVisitante.golsContra;

    if (golsMandante > golsVisitante) {
        timeMandante.pontos += 3;
        timeMandante.vitorias++;
        timeVisitante.derrotas++;
        return;
    }

    if (golsVisitante > golsMandante) {
        timeVisitante.pontos += 3;
        timeVisitante.vitorias++;
        timeMandante.derrotas++;
        return;
    }

    timeMandante.pontos += 1;
    timeVisitante.pontos += 1;
    timeMandante.empates++;
    timeVisitante.empates++;
}

function ordenarTabela(a, b) {
    if (b.pontos !== a.pontos) {
        return b.pontos - a.pontos;
    }

    if (b.saldo !== a.saldo) {
        return b.saldo - a.saldo;
    }

    if (b.golsPro !== a.golsPro) {
        return b.golsPro - a.golsPro;
    }

    if (b.vitorias !== a.vitorias) {
        return b.vitorias - a.vitorias;
    }

    return String(a.nome || "")
        .localeCompare(String(b.nome || ""));
}

function calcularPontosGrupos(
    palpite,
    tabelasGrupos,
    pontuacao
) {
    const gruposPalpitados =
        obterGruposPalpiteNormalizados(palpite);

    Object.keys(tabelasGrupos).forEach((nomeGrupo) => {
        const tabelaReal =
            tabelasGrupos[nomeGrupo];

        const grupoPalpite =
            gruposPalpitados[nomeGrupo];

        if (!tabelaReal?.ordenados) {
            return;
        }

        /*
         * Mesmo que o usuário não tenha palpite neste grupo,
         * ainda criamos o bloco para o perfil conseguir mostrar
         * a classificação real quando houver jogos finalizados.
         */
        if (tabelaReal.jogosFinalizados === 0) {
            return;
        }

        const classificacaoReal =
            tabelaReal.ordenados.map((time, index) => {
                return {
                    codigo: normalizarCodigo(time.codigo),
                    nome: time.nome || buscarNomeTimePorCodigo(time.codigo),
                    posicao: index + 1,
                    pontos: Number(time.pontos || 0),
                    jogos: Number(time.jogos || 0),
                    vitorias: Number(time.vitorias || 0),
                    empates: Number(time.empates || 0),
                    derrotas: Number(time.derrotas || 0),
                    golsPro: Number(time.golsPro || 0),
                    golsContra: Number(time.golsContra || 0),
                    saldoGols: Number(time.saldo || 0),
                    saldo: Number(time.saldo || 0)
                };
            });

        const reaisTop3 =
            classificacaoReal
                .slice(0, 3)
                .map((time) => normalizarCodigo(time.codigo));

        const ordemPalpite =
            obterOrdemCompletaGrupoPalpite(grupoPalpite);

        const palpitesTop3 =
            ordemPalpite
                .slice(0, 3)
                .map((time) => normalizarCodigo(time.codigo));

        const pontosExatos = [
            PONTOS.grupoPrimeiroExato,
            PONTOS.grupoSegundoExato,
            PONTOS.grupoTerceiroExato
        ];

        let pontosGrupo = 0;

        const detalhesPorSelecao =
            ordemPalpite
                .slice(0, 4)
                .map((time, index) => {
                    const codigoPalpite =
                        normalizarCodigo(time.codigo);

                    const posicaoPalpitada =
                        index + 1;

                    const posicaoReal =
                        classificacaoReal.findIndex((real) => {
                            return normalizarCodigo(real.codigo) === codigoPalpite;
                        }) + 1;

                    let pontos = 0;
                    let motivo = "Sem pontuação";

                    if (
                        codigoPalpite &&
                        codigoPalpite !== "TBD" &&
                        posicaoPalpitada <= 3
                    ) {
                        const codigoRealMesmaPosicao =
                            reaisTop3[posicaoPalpitada - 1];

                        if (codigoPalpite === codigoRealMesmaPosicao) {
                            pontos =
                                pontosExatos[posicaoPalpitada - 1];

                            motivo =
                                "Posição exata";
                        } else if (reaisTop3.includes(codigoPalpite)) {
                            pontos =
                                PONTOS.grupoClassificadoPosicaoErrada;

                            motivo =
                                "Classificado em posição diferente";
                        }
                    }

                    pontosGrupo += pontos;

                    if (pontos > 0) {
                        pontuacao.detalhes.grupos.push({
                            grupo: nomeGrupo,
                            tipo: motivo.toLowerCase(),
                            codigo: codigoPalpite,
                            posicaoPalpitada,
                            posicaoReal: posicaoReal || null,
                            pontos
                        });
                    }

                    return {
                        codigo: codigoPalpite,
                        nome:
                            time.nome ||
                            buscarNomeTimePorCodigo(codigoPalpite),
                        posicaoPalpitada,
                        posicaoReal: posicaoReal || null,
                        pontos,
                        motivo
                    };
                });

        pontuacao.grupos += pontosGrupo;

        pontuacao.detalhesGrupos[nomeGrupo] = {
            grupo: nomeGrupo,
            pontos: pontosGrupo,
            jogosFinalizados: Number(tabelaReal.jogosFinalizados || 0),
            classificacao: classificacaoReal,
            porSelecao: detalhesPorSelecao
        };
    });
}

function obterGruposPalpiteNormalizados(palpite) {
    if (
        palpite?.grupos &&
        Object.keys(palpite.grupos).length > 0
    ) {
        return palpite.grupos;
    }

    if (
        !palpite?.gruposOrdenados ||
        Object.keys(palpite.gruposOrdenados).length === 0
    ) {
        return {};
    }

    const gruposNormalizados = {};

    Object.entries(
        palpite.gruposOrdenados
    ).forEach(([nomeGrupo, codigos]) => {
        if (!Array.isArray(codigos)) {
            return;
        }

        const ordemCompleta =
            codigos.map((codigo, index) => {
                return {
                    codigo: normalizarCodigo(codigo),
                    nome: buscarNomeTimePorCodigo(codigo),
                    posicao: index + 1
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

function obterOrdemCompletaGrupoPalpite(grupoPalpite) {
    if (!grupoPalpite) {
        return [];
    }

    if (
        Array.isArray(grupoPalpite.ordemCompleta) &&
        grupoPalpite.ordemCompleta.length > 0
    ) {
        return [...grupoPalpite.ordemCompleta]
            .sort((a, b) => {
                return Number(a.posicao || 0) -
                    Number(b.posicao || 0);
            })
            .map((time, index) => {
                return {
                    codigo: normalizarCodigo(time.codigo),
                    nome:
                        time.nome ||
                        buscarNomeTimePorCodigo(time.codigo),
                    posicao: Number(time.posicao || index + 1)
                };
            });
    }

    return [
        grupoPalpite.primeiro,
        grupoPalpite.segundo,
        grupoPalpite.terceiro,
        grupoPalpite.quarto
    ]
        .filter(Boolean)
        .map((codigo, index) => {
            return {
                codigo: normalizarCodigo(codigo),
                nome: buscarNomeTimePorCodigo(codigo),
                posicao: index + 1
            };
        });
}

/* =====================================================
   MELHORES TERCEIROS
===================================================== */

function obterMelhoresTerceirosReais(tabelasGrupos) {
    /*
     * Como a fase de grupos já terminou e a Copa pode depender
     * de critérios que não estão no sistema, usamos a lista oficial
     * definida no mata-mata-oficial.js.
     */
    if (
        Array.isArray(MELHORES_TERCEIROS_OFICIAIS) &&
        MELHORES_TERCEIROS_OFICIAIS.length > 0
    ) {
        return MELHORES_TERCEIROS_OFICIAIS
            .map((item) => normalizarGrupo(item.grupo))
            .filter(Boolean);
    }

    return calcularMelhoresTerceirosReais(tabelasGrupos);
}

function calcularMelhoresTerceirosReais(tabelasGrupos) {
    const terceiros = [];

    Object.values(tabelasGrupos).forEach((tabela) => {
        if (
            !tabela?.ordenados ||
            tabela.ordenados.length < 3
        ) {
            return;
        }

        if (tabela.jogosFinalizados === 0) {
            return;
        }

        const grupo =
            normalizarGrupo(tabela.grupo);

        const terceiro =
            tabela.ordenados[2];

        terceiros.push({
            grupo,
            ...terceiro
        });
    });

    terceiros.sort(ordenarTabela);

    return terceiros
        .slice(0, 8)
        .map((time) => normalizarGrupo(time.grupo));
}

function calcularPontosMelhoresTerceiros(
    palpite,
    melhoresTerceirosReais,
    pontuacao
) {
    const terceirosPalpitados =
        palpite.mataMata?.melhoresTerceiros || [];

    const reaisNormalizados =
        melhoresTerceirosReais.map(normalizarGrupo);

    terceirosPalpitados.forEach((grupo) => {
        const grupoNormalizado =
            normalizarGrupo(grupo);

        if (
            !grupoNormalizado ||
            !reaisNormalizados.includes(grupoNormalizado)
        ) {
            return;
        }

        pontuacao.melhoresTerceiros +=
            PONTOS.melhorTerceiro;

        pontuacao.detalhes.melhoresTerceiros.push({
            grupo: grupoNormalizado,
            pontos: PONTOS.melhorTerceiro
        });
    });
}

/* =====================================================
   MATA-MATA
===================================================== */

/*
 * NOVA LÓGICA:
 *
 * Pontua por seleção classificada na fase,
 * e não mais pelo confronto exato.
 */

function calcularPontosMataMata(
    palpite,
    resultados,
    pontuacao
) {
    const escolhas =
        palpite.mataMata?.escolhas || {};

    const fases =
        obterFasesMataMataPontuacao();

    fases.forEach((fase) => {
        const classificadosReais =
            obterVencedoresReaisPorJogos(
                resultados,
                fase.jogos
            );

        if (classificadosReais.size === 0) {
            return;
        }

        const classificadosPalpite =
            obterEscolhasPalpitePorJogos(
                escolhas,
                fase.jogos
            );

        classificadosPalpite.forEach((codigoPalpite) => {
            if (!classificadosReais.has(codigoPalpite)) {
                return;
            }

            pontuacao.mataMata +=
                fase.pontos;

            pontuacao.detalhes.mataMata.push({
                fase: fase.nome,
                tipo: fase.tipo,
                codigo: codigoPalpite,
                pontos: fase.pontos
            });
        });
    });
}

function obterFasesMataMataPontuacao() {
    return [
        {
            nome: "16 avos",
            tipo: "classificado para as oitavas",
            jogos: gerarIntervalo(73, 88),
            pontos: PONTOS.round32
        },
        {
            nome: "Oitavas",
            tipo: "classificado para as quartas",
            jogos: gerarIntervalo(89, 96),
            pontos: PONTOS.oitavas
        },
        {
            nome: "Quartas",
            tipo: "classificado para as semifinais",
            jogos: gerarIntervalo(97, 100),
            pontos: PONTOS.quartas
        },
        {
            nome: "Semifinais",
            tipo: "classificado para a final",
            jogos: gerarIntervalo(101, 102),
            pontos: PONTOS.semifinais
        },
        {
            nome: "Disputa de 3º Lugar",
            tipo: "terceiro lugar correto",
            jogos: [103],
            pontos: PONTOS.terceiroLugar
        },
        {
            nome: "Final",
            tipo: "campeão correto",
            jogos: [104],
            pontos: PONTOS.campeao
        }
    ];
}

function obterVencedoresReaisPorJogos(
    resultados,
    jogos
) {
    const vencedores = new Set();

    jogos.forEach((jogoId) => {
        const resultado =
            obterResultadoPorJogoId(
                resultados,
                jogoId
            );

        if (!resultado?.finalizado) {
            return;
        }

        const vencedor =
            obterVencedorResultado(resultado);

        if (
            vencedor &&
            vencedor !== "TBD" &&
            vencedor !== "EMPATE"
        ) {
            vencedores.add(vencedor);
        }
    });

    return vencedores;
}

function obterEscolhasPalpitePorJogos(
    escolhas,
    jogos
) {
    const escolhidos = new Set();

    jogos.forEach((jogoId) => {
        const codigo =
            normalizarCodigo(
                escolhas[String(jogoId)] ||
                escolhas[Number(jogoId)]
            );

        if (
            codigo &&
            codigo !== "TBD" &&
            codigo !== "EMPATE"
        ) {
            escolhidos.add(codigo);
        }
    });

    return escolhidos;
}

/* =====================================================
   TOP 3
===================================================== */

function calcularPontosTop3(
    palpite,
    resultados,
    pontuacao
) {
    const top3 =
        palpite.mataMata?.top3;

    if (!top3) {
        return;
    }

    const resultadoFinal =
        obterResultadoPorJogoId(resultados, 104);

    const resultadoTerceiro =
        obterResultadoPorJogoId(resultados, 103);

    if (
        !resultadoFinal?.finalizado ||
        !resultadoTerceiro?.finalizado
    ) {
        return;
    }

    const campeaoReal =
        obterVencedorResultado(resultadoFinal);

    const viceReal =
        obterPerdedorResultado(resultadoFinal);

    const terceiroReal =
        obterVencedorResultado(resultadoTerceiro);

    if (
        !campeaoReal ||
        !viceReal ||
        !terceiroReal
    ) {
        return;
    }

    const campeaoPalpite =
        normalizarCodigo(top3.campeao);

    const vicePalpite =
        normalizarCodigo(top3.viceCampeao);

    const terceiroPalpite =
        normalizarCodigo(top3.terceiroLugar);

    const acertouCampeao =
        campeaoPalpite === campeaoReal;

    const acertouVice =
        vicePalpite === viceReal;

    const acertouTerceiro =
        terceiroPalpite === terceiroReal;

    /*
     * Campeão e 3º lugar já pontuam em mataMata:
     * - Final, jogo 104 = campeão
     * - Disputa de 3º lugar, jogo 103 = terceiro lugar
     *
     * Aqui pontuamos o vice e o bônus completo.
     */

    if (acertouVice) {
        pontuacao.top3 +=
            PONTOS.viceCampeao;

        pontuacao.detalhes.top3.push({
            tipo: "vice-campeão",
            codigo: viceReal,
            pontos: PONTOS.viceCampeao
        });
    }

    if (
        acertouCampeao &&
        acertouVice &&
        acertouTerceiro
    ) {
        pontuacao.bonus +=
            PONTOS.bonusTop3Completo;

        pontuacao.detalhes.top3.push({
            tipo: "bônus TOP 3 completo",
            pontos: PONTOS.bonusTop3Completo
        });
    }
}

/* =====================================================
   HELPERS DE RESULTADO
===================================================== */

function obterResultadoPorJogoId(
    resultados,
    jogoId
) {
    if (!resultados || !jogoId) {
        return null;
    }

    const id = Number(jogoId);

    return (
        resultados[`jogo_${id}`] ||
        resultados[String(id)] ||
        Object.values(resultados).find((resultado) => {
            return Number(resultado?.jogoId) === id;
        }) ||
        null
    );
}

function obterNumeroJogo(
    idResultado,
    resultado
) {
    if (resultado?.jogoId) {
        return Number(resultado.jogoId);
    }

    return Number(
        String(idResultado)
            .replace("jogo_", "")
    );
}

function obterVencedorResultado(resultado) {
    if (!resultado) {
        return null;
    }

    const vencedorSalvo =
        normalizarCodigo(resultado.vencedor);

    if (
        vencedorSalvo &&
        vencedorSalvo !== "EMPATE" &&
        vencedorSalvo !== "TBD"
    ) {
        return vencedorSalvo;
    }

    if (resultado.resultado === "mandante") {
        return normalizarCodigo(
            resultado.bandeiraMandante
        );
    }

    if (resultado.resultado === "visitante") {
        return normalizarCodigo(
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
                return normalizarCodigo(
                    resultado.bandeiraMandante
                );
            }

            if (penaltisVisitante > penaltisMandante) {
                return normalizarCodigo(
                    resultado.bandeiraVisitante
                );
            }
        }
    }

    return null;
}

function obterPerdedorResultado(resultado) {
    const vencedor =
        obterVencedorResultado(resultado);

    if (!vencedor) {
        return null;
    }

    const mandante =
        normalizarCodigo(resultado.bandeiraMandante);

    const visitante =
        normalizarCodigo(resultado.bandeiraVisitante);

    if (vencedor === mandante) {
        return visitante;
    }

    if (vencedor === visitante) {
        return mandante;
    }

    return null;
}

/* =====================================================
   HELPERS GERAIS
===================================================== */

function gerarIntervalo(inicio, fim) {
    const numeros = [];

    for (let numero = inicio; numero <= fim; numero++) {
        numeros.push(numero);
    }

    return numeros;
}

function buscarNomeTimePorCodigo(codigo) {
    if (!codigo) {
        return "A definir";
    }

    const codigoNormalizado =
        normalizarCodigo(codigo);

    for (const partida of partidas) {
        const mandante =
            normalizarCodigo(partida.bandeiraMandante);

        const visitante =
            normalizarCodigo(partida.bandeiraVisitante);

        if (mandante === codigoNormalizado) {
            return partida.mandante || codigoNormalizado;
        }

        if (visitante === codigoNormalizado) {
            return partida.visitante || codigoNormalizado;
        }
    }

    return codigoNormalizado;
}

function normalizarCodigo(codigo) {
    if (
        codigo === null ||
        codigo === undefined ||
        codigo === ""
    ) {
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

function normalizarGrupo(grupo) {
    if (
        grupo === null ||
        grupo === undefined ||
        grupo === ""
    ) {
        return "";
    }

    return String(grupo)
        .replace(/grupo/gi, "")
        .trim()
        .toUpperCase();
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