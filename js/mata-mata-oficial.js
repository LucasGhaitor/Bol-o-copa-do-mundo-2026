/* =====================================================
   MATA-MATA OFICIAL — COPA 2026
===================================================== */

/*
 * Este arquivo centraliza os confrontos oficiais do mata-mata.
 *
 * Regras:
 * - Jogos 73 a 88: confrontos oficiais definidos após a fase de grupos.
 * - Jogos 89 a 104: preenchidos automaticamente conforme vencedores
 *   e perdedores avançam pelos resultados finalizados.
 *
 * Usado em:
 * - admin-resultados.js
 * - partidas.js
 * - mata-mata-status.js
 */

/* =====================================================
   MELHORES TERCEIROS OFICIAIS
===================================================== */

export const MELHORES_TERCEIROS_OFICIAIS = [
    {
        posicao: 1,
        grupo: "Grupo K",
        codigo: "COD",
        nome: "RD Congo"
    },
    {
        posicao: 2,
        grupo: "Grupo F",
        codigo: "SWE",
        nome: "Suécia"
    },
    {
        posicao: 3,
        grupo: "Grupo L",
        codigo: "GHA",
        nome: "Gana"
    },
    {
        posicao: 4,
        grupo: "Grupo E",
        codigo: "ECU",
        nome: "Equador"
    },
    {
        posicao: 5,
        grupo: "Grupo B",
        codigo: "BIH",
        nome: "Bósnia-Herzegovina"
    },
    {
        posicao: 6,
        grupo: "Grupo J",
        codigo: "DZA",
        nome: "Argélia"
    },
    {
        posicao: 7,
        grupo: "Grupo D",
        codigo: "PAR",
        nome: "Paraguai"
    },
    {
        posicao: 8,
        grupo: "Grupo I",
        codigo: "SEN",
        nome: "Senegal"
    }
];

/* =====================================================
   CONFRONTOS OFICIAIS — 16 AVOS
===================================================== */

/*
 * Jogos 73 a 88.
 *
 * Chaveamento oficial enviado:
 *
 * Lado esquerdo:
 * Alemanha x Paraguai
 * França x Suécia
 * África do Sul x Canadá
 * Holanda x Marrocos
 * Portugal x Croácia
 * Espanha x Áustria
 * Estados Unidos x Bósnia-Herzegovina
 * Bélgica x Senegal
 *
 * Lado direito:
 * Brasil x Japão
 * Costa do Marfim x Noruega
 * México x Equador
 * Inglaterra x RD Congo
 * Argentina x Cabo Verde
 * Austrália x Egito
 * Suíça x Argélia
 * Colômbia x Gana
 */

export const CONFRONTOS_OFICIAIS_16_AVOS = {
    73: {
        lado: "esquerdo",
        ordem: 1,
        mandante: "Alemanha",
        bandeiraMandante: "GER",
        visitante: "Paraguai",
        bandeiraVisitante: "PAR"
    },

    74: {
        lado: "esquerdo",
        ordem: 2,
        mandante: "França",
        bandeiraMandante: "FRA",
        visitante: "Suécia",
        bandeiraVisitante: "SWE"
    },

    75: {
        lado: "esquerdo",
        ordem: 3,
        mandante: "África do Sul",
        bandeiraMandante: "RSA",
        visitante: "Canadá",
        bandeiraVisitante: "CAN"
    },

    76: {
        lado: "esquerdo",
        ordem: 4,
        mandante: "Holanda",
        bandeiraMandante: "NED",
        visitante: "Marrocos",
        bandeiraVisitante: "MAR"
    },

    77: {
        lado: "esquerdo",
        ordem: 5,
        mandante: "Portugal",
        bandeiraMandante: "POR",
        visitante: "Croácia",
        bandeiraVisitante: "CRO"
    },

    78: {
        lado: "esquerdo",
        ordem: 6,
        mandante: "Espanha",
        bandeiraMandante: "ESP",
        visitante: "Áustria",
        bandeiraVisitante: "AUT"
    },

    79: {
        lado: "esquerdo",
        ordem: 7,
        mandante: "Estados Unidos",
        bandeiraMandante: "USA",
        visitante: "Bósnia-Herzegovina",
        bandeiraVisitante: "BIH"
    },

    80: {
        lado: "esquerdo",
        ordem: 8,
        mandante: "Bélgica",
        bandeiraMandante: "BEL",
        visitante: "Senegal",
        bandeiraVisitante: "SEN"
    },

    81: {
        lado: "direito",
        ordem: 1,
        mandante: "Brasil",
        bandeiraMandante: "BRA",
        visitante: "Japão",
        bandeiraVisitante: "JPN"
    },

    82: {
        lado: "direito",
        ordem: 2,
        mandante: "Costa do Marfim",
        bandeiraMandante: "CIV",
        visitante: "Noruega",
        bandeiraVisitante: "NOR"
    },

    83: {
        lado: "direito",
        ordem: 3,
        mandante: "México",
        bandeiraMandante: "MEX",
        visitante: "Equador",
        bandeiraVisitante: "ECU"
    },

    84: {
        lado: "direito",
        ordem: 4,
        mandante: "Inglaterra",
        bandeiraMandante: "ENG",
        visitante: "RD Congo",
        bandeiraVisitante: "COD"
    },

    85: {
        lado: "direito",
        ordem: 5,
        mandante: "Argentina",
        bandeiraMandante: "ARG",
        visitante: "Cabo Verde",
        bandeiraVisitante: "CPV"
    },

    86: {
        lado: "direito",
        ordem: 6,
        mandante: "Austrália",
        bandeiraMandante: "AUS",
        visitante: "Egito",
        bandeiraVisitante: "EGY"
    },

    87: {
        lado: "direito",
        ordem: 7,
        mandante: "Suíça",
        bandeiraMandante: "SUI",
        visitante: "Argélia",
        bandeiraVisitante: "DZA"
    },

    88: {
        lado: "direito",
        ordem: 8,
        mandante: "Colômbia",
        bandeiraMandante: "COL",
        visitante: "Gana",
        bandeiraVisitante: "GHA"
    }
};

/* =====================================================
   MAPA DE AVANÇO DO MATA-MATA
===================================================== */

/*
 * Define de onde vem cada time das fases seguintes.
 */

export const MAPA_AVANCO_MATA_MATA = {
    89: {
        fase: "Oitavas",
        origemMandante: {
            jogoId: 73,
            tipo: "vencedor"
        },
        origemVisitante: {
            jogoId: 74,
            tipo: "vencedor"
        }
    },

    90: {
        fase: "Oitavas",
        origemMandante: {
            jogoId: 75,
            tipo: "vencedor"
        },
        origemVisitante: {
            jogoId: 76,
            tipo: "vencedor"
        }
    },

    91: {
        fase: "Oitavas",
        origemMandante: {
            jogoId: 77,
            tipo: "vencedor"
        },
        origemVisitante: {
            jogoId: 78,
            tipo: "vencedor"
        }
    },

    92: {
        fase: "Oitavas",
        origemMandante: {
            jogoId: 79,
            tipo: "vencedor"
        },
        origemVisitante: {
            jogoId: 80,
            tipo: "vencedor"
        }
    },

    93: {
        fase: "Oitavas",
        origemMandante: {
            jogoId: 81,
            tipo: "vencedor"
        },
        origemVisitante: {
            jogoId: 82,
            tipo: "vencedor"
        }
    },

    94: {
        fase: "Oitavas",
        origemMandante: {
            jogoId: 83,
            tipo: "vencedor"
        },
        origemVisitante: {
            jogoId: 84,
            tipo: "vencedor"
        }
    },

    95: {
        fase: "Oitavas",
        origemMandante: {
            jogoId: 85,
            tipo: "vencedor"
        },
        origemVisitante: {
            jogoId: 86,
            tipo: "vencedor"
        }
    },

    96: {
        fase: "Oitavas",
        origemMandante: {
            jogoId: 87,
            tipo: "vencedor"
        },
        origemVisitante: {
            jogoId: 88,
            tipo: "vencedor"
        }
    },

    97: {
        fase: "Quartas",
        origemMandante: {
            jogoId: 89,
            tipo: "vencedor"
        },
        origemVisitante: {
            jogoId: 90,
            tipo: "vencedor"
        }
    },

    98: {
        fase: "Quartas",
        origemMandante: {
            jogoId: 91,
            tipo: "vencedor"
        },
        origemVisitante: {
            jogoId: 92,
            tipo: "vencedor"
        }
    },

    99: {
        fase: "Quartas",
        origemMandante: {
            jogoId: 93,
            tipo: "vencedor"
        },
        origemVisitante: {
            jogoId: 94,
            tipo: "vencedor"
        }
    },

    100: {
        fase: "Quartas",
        origemMandante: {
            jogoId: 95,
            tipo: "vencedor"
        },
        origemVisitante: {
            jogoId: 96,
            tipo: "vencedor"
        }
    },

    101: {
        fase: "Semifinais",
        origemMandante: {
            jogoId: 97,
            tipo: "vencedor"
        },
        origemVisitante: {
            jogoId: 98,
            tipo: "vencedor"
        }
    },

    102: {
        fase: "Semifinais",
        origemMandante: {
            jogoId: 99,
            tipo: "vencedor"
        },
        origemVisitante: {
            jogoId: 100,
            tipo: "vencedor"
        }
    },

    103: {
        fase: "Disputa de 3º Lugar",
        origemMandante: {
            jogoId: 101,
            tipo: "perdedor"
        },
        origemVisitante: {
            jogoId: 102,
            tipo: "perdedor"
        }
    },

    104: {
        fase: "Final",
        origemMandante: {
            jogoId: 101,
            tipo: "vencedor"
        },
        origemVisitante: {
            jogoId: 102,
            tipo: "vencedor"
        }
    }
};

/* =====================================================
   GRUPOS DE JOGOS POR FASE
===================================================== */

export const JOGOS_MATA_MATA_POR_FASE = {
    "16 Avos": [
        73, 74, 75, 76, 77, 78, 79, 80,
        81, 82, 83, 84, 85, 86, 87, 88
    ],

    "Oitavas": [
        89, 90, 91, 92, 93, 94, 95, 96
    ],

    "Quartas": [
        97, 98, 99, 100
    ],

    "Semifinais": [
        101, 102
    ],

    "Disputa de 3º Lugar": [
        103
    ],

    "Final": [
        104
    ]
};

/* =====================================================
   FUNÇÃO PRINCIPAL
===================================================== */

export function aplicarMataMataOficial(
    listaPartidas,
    resultadosPorJogo = {}
) {
    const partidasAtualizadas = listaPartidas.map((partida) => {
        return {
            ...partida
        };
    });

    const partidasPorId = {};

    partidasAtualizadas.forEach((partida) => {
        partidasPorId[Number(partida.id)] = partida;
    });

    aplicarConfrontosOficiais16Avos(partidasPorId);

    aplicarAvancoAutomatico(
        partidasPorId,
        resultadosPorJogo
    );

    return partidasAtualizadas;
}

/* =====================================================
   FUNÇÃO PARA PEGAR APENAS MATA-MATA
===================================================== */

export function obterPartidasMataMata(
    listaPartidas,
    resultadosPorJogo = {}
) {
    return aplicarMataMataOficial(
        listaPartidas,
        resultadosPorJogo
    ).filter((partida) => {
        const id = Number(partida.id);

        return id >= 73 && id <= 104;
    });
}

/* =====================================================
   FUNÇÃO PARA PEGAR JOGOS DE UMA FASE
===================================================== */

export function obterPartidasPorFaseMataMata(
    listaPartidas,
    resultadosPorJogo = {},
    fase
) {
    const ids = JOGOS_MATA_MATA_POR_FASE[fase] || [];

    return obterPartidasMataMata(
        listaPartidas,
        resultadosPorJogo
    ).filter((partida) => {
        return ids.includes(Number(partida.id));
    });
}

/* =====================================================
   16 AVOS POR LADO
===================================================== */

export function obterConfrontos16AvosPorLado(
    listaPartidas,
    resultadosPorJogo = {}
) {
    const mataMata = obterPartidasMataMata(
        listaPartidas,
        resultadosPorJogo
    );

    const ladoEsquerdo = [];
    const ladoDireito = [];

    JOGOS_MATA_MATA_POR_FASE["16 Avos"].forEach((jogoId) => {
        const partida = mataMata.find((item) => {
            return Number(item.id) === jogoId;
        });

        const config =
            CONFRONTOS_OFICIAIS_16_AVOS[jogoId];

        if (!partida || !config) {
            return;
        }

        const item = {
            ...partida,
            lado: config.lado,
            ordem: config.ordem
        };

        if (config.lado === "direito") {
            ladoDireito.push(item);
        } else {
            ladoEsquerdo.push(item);
        }
    });

    ladoEsquerdo.sort((a, b) => a.ordem - b.ordem);
    ladoDireito.sort((a, b) => a.ordem - b.ordem);

    return {
        ladoEsquerdo,
        ladoDireito
    };
}

/* =====================================================
   APLICAÇÃO DOS 16 AVOS
===================================================== */

function aplicarConfrontosOficiais16Avos(partidasPorId) {
    Object.entries(CONFRONTOS_OFICIAIS_16_AVOS)
        .forEach(([jogoIdTexto, confronto]) => {
            const jogoId = Number(jogoIdTexto);
            const partida = partidasPorId[jogoId];

            if (!partida) {
                return;
            }

            preencherTimesPartida(
                partida,
                confronto.mandante,
                confronto.bandeiraMandante,
                confronto.visitante,
                confronto.bandeiraVisitante
            );
        });
}

/* =====================================================
   AVANÇO AUTOMÁTICO
===================================================== */

function aplicarAvancoAutomatico(
    partidasPorId,
    resultadosPorJogo
) {
    Object.entries(MAPA_AVANCO_MATA_MATA)
        .forEach(([jogoIdTexto, regra]) => {
            const jogoId = Number(jogoIdTexto);
            const partidaDestino = partidasPorId[jogoId];

            if (!partidaDestino) {
                return;
            }

            const mandante = obterTimeDeOrigem(
                regra.origemMandante,
                partidasPorId,
                resultadosPorJogo
            );

            const visitante = obterTimeDeOrigem(
                regra.origemVisitante,
                partidasPorId,
                resultadosPorJogo
            );

            preencherTimesPartida(
                partidaDestino,
                mandante?.nome || partidaDestino.mandante,
                mandante?.codigo || partidaDestino.bandeiraMandante,
                visitante?.nome || partidaDestino.visitante,
                visitante?.codigo || partidaDestino.bandeiraVisitante
            );
        });
}

function obterTimeDeOrigem(
    origem,
    partidasPorId,
    resultadosPorJogo
) {
    if (!origem?.jogoId) {
        return null;
    }

    const partidaOrigem =
        partidasPorId[Number(origem.jogoId)];

    const resultadoOrigem =
        obterResultadoPartida(
            resultadosPorJogo,
            origem.jogoId
        );

    if (
        !partidaOrigem ||
        !resultadoOrigem ||
        resultadoOrigem.finalizado !== true
    ) {
        return null;
    }

    if (origem.tipo === "perdedor") {
        return obterPerdedorDaPartida(
            partidaOrigem,
            resultadoOrigem
        );
    }

    return obterVencedorDaPartida(
        partidaOrigem,
        resultadoOrigem
    );
}

/* =====================================================
   VENCEDOR E PERDEDOR
===================================================== */

export function obterVencedorDaPartida(
    partida,
    resultado
) {
    if (!partida || !resultado) {
        return null;
    }

    const vencedor =
        normalizarCodigo(resultado.vencedor);

    if (
        vencedor &&
        vencedor !== "EMPATE" &&
        vencedor !== "TBD"
    ) {
        if (
            vencedor ===
            normalizarCodigo(partida.bandeiraMandante)
        ) {
            return {
                nome: partida.mandante,
                codigo: partida.bandeiraMandante
            };
        }

        if (
            vencedor ===
            normalizarCodigo(partida.bandeiraVisitante)
        ) {
            return {
                nome: partida.visitante,
                codigo: partida.bandeiraVisitante
            };
        }

        return {
            nome: vencedor,
            codigo: vencedor
        };
    }

    const golsMandante =
        converterNumero(resultado.golsMandante);

    const golsVisitante =
        converterNumero(resultado.golsVisitante);

    if (
        golsMandante === null ||
        golsVisitante === null ||
        golsMandante === golsVisitante
    ) {
        return null;
    }

    if (golsMandante > golsVisitante) {
        return {
            nome: partida.mandante,
            codigo: partida.bandeiraMandante
        };
    }

    return {
        nome: partida.visitante,
        codigo: partida.bandeiraVisitante
    };
}

export function obterPerdedorDaPartida(
    partida,
    resultado
) {
    if (!partida || !resultado) {
        return null;
    }

    const vencedor =
        obterVencedorDaPartida(
            partida,
            resultado
        );

    if (!vencedor) {
        return null;
    }

    if (
        normalizarCodigo(vencedor.codigo) ===
        normalizarCodigo(partida.bandeiraMandante)
    ) {
        return {
            nome: partida.visitante,
            codigo: partida.bandeiraVisitante
        };
    }

    if (
        normalizarCodigo(vencedor.codigo) ===
        normalizarCodigo(partida.bandeiraVisitante)
    ) {
        return {
            nome: partida.mandante,
            codigo: partida.bandeiraMandante
        };
    }

    return null;
}

/* =====================================================
   RESULTADOS
===================================================== */

export function obterResultadoPartida(
    resultadosPorJogo,
    jogoId
) {
    if (!resultadosPorJogo || !jogoId) {
        return null;
    }

    return (
        resultadosPorJogo[`jogo_${jogoId}`] ||
        resultadosPorJogo[String(jogoId)] ||
        null
    );
}

/* =====================================================
   IDENTIFICAÇÃO DE CAMPEÃO / VICE / TERCEIRO
===================================================== */

export function obterResumoFinalMataMata(
    listaPartidas,
    resultadosPorJogo = {}
) {
    const partidasResolvidas =
        aplicarMataMataOficial(
            listaPartidas,
            resultadosPorJogo
        );

    const partidasPorId = {};

    partidasResolvidas.forEach((partida) => {
        partidasPorId[Number(partida.id)] = partida;
    });

    const final = partidasPorId[104];
    const disputaTerceiro = partidasPorId[103];

    const resultadoFinal =
        obterResultadoPartida(resultadosPorJogo, 104);

    const resultadoTerceiro =
        obterResultadoPartida(resultadosPorJogo, 103);

    const campeao =
        resultadoFinal?.finalizado === true
            ? obterVencedorDaPartida(final, resultadoFinal)
            : null;

    const vice =
        resultadoFinal?.finalizado === true
            ? obterPerdedorDaPartida(final, resultadoFinal)
            : null;

    const terceiro =
        resultadoTerceiro?.finalizado === true
            ? obterVencedorDaPartida(disputaTerceiro, resultadoTerceiro)
            : null;

    return {
        campeao,
        vice,
        terceiro
    };
}

/* =====================================================
   PREENCHIMENTO DE PARTIDA
===================================================== */

function preencherTimesPartida(
    partida,
    mandante,
    bandeiraMandante,
    visitante,
    bandeiraVisitante
) {
    if (!partida) {
        return;
    }

    if (mandante) {
        partida.mandante = mandante;
    }

    if (bandeiraMandante) {
        partida.bandeiraMandante =
            normalizarCodigo(bandeiraMandante);
    }

    if (visitante) {
        partida.visitante = visitante;
    }

    if (bandeiraVisitante) {
        partida.bandeiraVisitante =
            normalizarCodigo(bandeiraVisitante);
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

function converterNumero(valor) {
    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {
        return null;
    }

    const numero = Number(valor);

    return Number.isFinite(numero)
        ? numero
        : null;
}