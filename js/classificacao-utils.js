export function montarClassificacaoInicial(partidasDoGrupo) {
    const times = [];
    const codigosAdicionados = new Set();

    partidasDoGrupo.forEach((partida) => {
        adicionarTime(
            times,
            codigosAdicionados,
            partida.bandeiraMandante,
            partida.mandante
        );

        adicionarTime(
            times,
            codigosAdicionados,
            partida.bandeiraVisitante,
            partida.visitante
        );
    });

    return times.map((time, index) => ({
        codigo: time.codigo,
        nome: time.nome,
        ordemOriginal: index,
        pontos: 0,
        jogos: 0,
        vitorias: 0,
        empates: 0,
        derrotas: 0,
        golsPro: 0,
        golsContra: 0,
        saldoGols: 0
    }));
}

function adicionarTime(lista, adicionados, codigo, nome) {
    if (!codigo || codigo === "TBD" || adicionados.has(codigo)) {
        return;
    }

    adicionados.add(codigo);

    lista.push({
        codigo,
        nome
    });
}

export function calcularClassificacaoGrupo(
    partidasDoGrupo,
    resultadosPorJogo
) {
    const classificacao = montarClassificacaoInicial(partidasDoGrupo);

    const tabelaPorCodigo = {};

    classificacao.forEach((time) => {
        tabelaPorCodigo[time.codigo] = time;
    });

    partidasDoGrupo.forEach((partida) => {
        const resultado = resultadosPorJogo[`jogo_${partida.id}`];

        if (!resultado || resultado.finalizado !== true) {
            return;
        }

        const codigoMandante =
            resultado.bandeiraMandante ||
            partida.bandeiraMandante;

        const codigoVisitante =
            resultado.bandeiraVisitante ||
            partida.bandeiraVisitante;

        const mandante = tabelaPorCodigo[codigoMandante];
        const visitante = tabelaPorCodigo[codigoVisitante];

        if (!mandante || !visitante) {
            return;
        }

        const golsMandante = Number(resultado.golsMandante);
        const golsVisitante = Number(resultado.golsVisitante);

        if (
            !Number.isFinite(golsMandante) ||
            !Number.isFinite(golsVisitante)
        ) {
            return;
        }

        mandante.jogos += 1;
        visitante.jogos += 1;

        mandante.golsPro += golsMandante;
        mandante.golsContra += golsVisitante;

        visitante.golsPro += golsVisitante;
        visitante.golsContra += golsMandante;

        if (golsMandante > golsVisitante) {
            mandante.vitorias += 1;
            visitante.derrotas += 1;
            mandante.pontos += 3;
        } else if (golsVisitante > golsMandante) {
            visitante.vitorias += 1;
            mandante.derrotas += 1;
            visitante.pontos += 3;
        } else {
            mandante.empates += 1;
            visitante.empates += 1;
            mandante.pontos += 1;
            visitante.pontos += 1;
        }
    });

    classificacao.forEach((time) => {
        time.saldoGols = time.golsPro - time.golsContra;
    });

    classificacao.sort(ordenarClassificacao);

    return classificacao.map((time, index) => ({
        ...time,
        posicao: index + 1
    }));
}

export function ordenarClassificacao(a, b) {
    if (b.pontos !== a.pontos) {
        return b.pontos - a.pontos;
    }

    if (b.saldoGols !== a.saldoGols) {
        return b.saldoGols - a.saldoGols;
    }

    if (b.golsPro !== a.golsPro) {
        return b.golsPro - a.golsPro;
    }

    if (b.vitorias !== a.vitorias) {
        return b.vitorias - a.vitorias;
    }

    /*
     * Desempate provisório.
     * Nunca utiliza o palpite do participante.
     */
    return a.ordemOriginal - b.ordemOriginal;
}

export function separarPartidasPorGrupo(partidas) {
    const grupos = {};

    partidas
        .filter((partida) => partida.fase === "Fase de Grupos")
        .forEach((partida) => {
            if (!grupos[partida.grupo]) {
                grupos[partida.grupo] = [];
            }

            grupos[partida.grupo].push(partida);
        });

    return grupos;
}