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

const listaGrupos = document.getElementById("listaGrupos");
const btnSalvarGrupos = document.getElementById("btnSalvarGrupos");
const mensagemStatus = document.getElementById("mensagemStatus");
const avisoGrupos = document.getElementById("avisoGrupos");
const btnSair = document.getElementById("btnSair");

let usuarioAtual = null;
let bolaoAberto = false;
let gruposTimes = {};
let palpitesSalvos = {};
let instanciasSortable = [];

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
        gruposTimes = montarGruposAPartirDasPartidas();

        await carregarStatusBolao();
        await carregarPalpitesSalvos();

        renderizarGrupos();
        iniciarSortable();
        atualizarEstadoTela();

    } catch (error) {
        console.error("Erro ao carregar grupos:", error);

        listaGrupos.innerHTML = `
            <div class="erro-card">
                Não foi possível carregar os grupos.
            </div>
        `;
    }
}

function montarGruposAPartirDasPartidas() {
    const grupos = {};

    const jogosGrupos = partidas.filter((partida) => partida.fase === "Fase de Grupos");

    jogosGrupos.forEach((partida) => {
        if (!grupos[partida.grupo]) {
            grupos[partida.grupo] = {};
        }

        adicionarTimeAoGrupo(grupos[partida.grupo], {
            codigo: partida.bandeiraMandante,
            nome: partida.mandante
        });

        adicionarTimeAoGrupo(grupos[partida.grupo], {
            codigo: partida.bandeiraVisitante,
            nome: partida.visitante
        });
    });

    const gruposOrdenados = {};

    Object.keys(grupos)
        .sort((a, b) => a.localeCompare(b))
        .forEach((nomeGrupo) => {
            gruposOrdenados[nomeGrupo] = Object.values(grupos[nomeGrupo]).sort((a, b) => {
                return a.nome.localeCompare(b.nome);
            });
        });

    return gruposOrdenados;
}

function adicionarTimeAoGrupo(grupo, time) {
    if (!time.codigo || time.codigo === "TBD") return;

    if (!grupo[time.codigo]) {
        grupo[time.codigo] = {
            codigo: time.codigo,
            nome: time.nome
        };
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
        mensagemStatus.textContent = "Os palpites estão abertos. Arraste as seleções e salve sua classificação.";
    } else {
        mensagemStatus.textContent = "Os palpites estão fechados. Você pode visualizar suas escolhas, mas não pode alterar.";
    }
}

async function carregarPalpitesSalvos() {
    if (!usuarioAtual) return;

    const palpiteRef = doc(db, "palpites", usuarioAtual.uid);
    const palpiteSnap = await getDoc(palpiteRef);

    if (!palpiteSnap.exists()) {
        palpitesSalvos = {};
        return;
    }

    const dados = palpiteSnap.data();

    if (dados.gruposOrdenados) {
        palpitesSalvos = dados.gruposOrdenados;
        return;
    }

    if (dados.grupos) {
        const gruposOrdenados = {};

        Object.entries(dados.grupos).forEach(([nomeGrupo, grupo]) => {
            if (grupo.ordemCompleta && Array.isArray(grupo.ordemCompleta)) {
                gruposOrdenados[nomeGrupo] = grupo.ordemCompleta.map((time) => time.codigo);
            }
        });

        palpitesSalvos = gruposOrdenados;
        return;
    }

    palpitesSalvos = {};
}

function renderizarGrupos() {
    const nomesGrupos = Object.keys(gruposTimes);

    if (nomesGrupos.length === 0) {
        listaGrupos.innerHTML = `
            <div class="empty-card">
                Nenhum grupo encontrado.
            </div>
        `;
        return;
    }

    listaGrupos.innerHTML = nomesGrupos.map((nomeGrupo) => {
        const times = obterOrdemDoGrupo(nomeGrupo);

        return `
            <article class="grupo-palpite-card">
                <div class="grupo-palpite-topo">
                    <h2>${nomeGrupo}</h2>
                    <span>Arraste para ordenar</span>
                </div>

                <div class="times-lista" data-grupo="${nomeGrupo}">
                    ${times.map((time, index) => criarCardTime(time, index)).join("")}
                </div>
            </article>
        `;
    }).join("");

    atualizarNumerosPosicao();
}

function obterOrdemDoGrupo(nomeGrupo) {
    const timesOriginais = gruposTimes[nomeGrupo] || [];
    const ordemSalva = palpitesSalvos[nomeGrupo];

    if (!ordemSalva || !Array.isArray(ordemSalva)) {
        return timesOriginais;
    }

    const mapaTimes = {};

    timesOriginais.forEach((time) => {
        mapaTimes[time.codigo] = time;
    });

    const timesOrdenados = [];

    ordemSalva.forEach((codigo) => {
        if (mapaTimes[codigo]) {
            timesOrdenados.push(mapaTimes[codigo]);
            delete mapaTimes[codigo];
        }
    });

    Object.values(mapaTimes).forEach((time) => {
        timesOrdenados.push(time);
    });

    return timesOrdenados;
}

function criarCardTime(time, index) {
    return `
        <div class="time-item ${!bolaoAberto ? "bloqueado" : ""}" data-codigo="${time.codigo}" data-nome="${time.nome}">
            <span class="numero-posicao">${index + 1}º</span>

            <img src="assets/Icon/${time.codigo}.png" 
                 alt="${time.nome}"
                 onerror="this.src='assets/Icon/TBD.png'">

            <div class="time-nome">
                <strong>${time.nome}</strong>
                <span>${time.codigo}</span>
            </div>

            <span class="drag-icon">☰</span>
        </div>
    `;
}

function iniciarSortable() {
    destruirSortable();

    if (!bolaoAberto) return;

    if (!window.Sortable) {
        console.error("SortableJS não foi carregado.");
        mensagemStatus.textContent = "Não foi possível carregar o recurso de arrastar. Atualize a página.";
        return;
    }

    const listas = document.querySelectorAll(".times-lista");

    listas.forEach((lista) => {
        const instancia = new Sortable(lista, {
            animation: 180,
            ghostClass: "sortable-ghost",
            chosenClass: "sortable-chosen",
            handle: ".time-item",
            onEnd: () => {
                atualizarNumerosPosicao();
                resetarBotaoSalvar();
            }
        });

        instanciasSortable.push(instancia);
    });
}

function destruirSortable() {
    instanciasSortable.forEach((instancia) => {
        instancia.destroy();
    });

    instanciasSortable = [];
}

function atualizarNumerosPosicao() {
    const listas = document.querySelectorAll(".times-lista");

    listas.forEach((lista) => {
        const itens = lista.querySelectorAll(".time-item");

        itens.forEach((item, index) => {
            const numero = item.querySelector(".numero-posicao");

            if (numero) {
                numero.textContent = `${index + 1}º`;
            }
        });
    });
}

function atualizarEstadoTela() {
    if (bolaoAberto) {
        avisoGrupos.classList.remove("fechado");
        btnSalvarGrupos.disabled = false;
        btnSalvarGrupos.textContent = "Salvar palpites dos grupos";
        return;
    }

    avisoGrupos.classList.add("fechado");
    btnSalvarGrupos.disabled = true;
    btnSalvarGrupos.textContent = "Palpites fechados";
}

function resetarBotaoSalvar() {
    if (!bolaoAberto) return;

    btnSalvarGrupos.disabled = false;
    btnSalvarGrupos.textContent = "Salvar palpites dos grupos";
    btnSalvarGrupos.onclick = null;
}

async function salvarPalpitesGrupos() {
    if (!usuarioAtual) return;

    if (!bolaoAberto) {
        alert("Os palpites estão fechados no momento.");
        return;
    }

    try {
        btnSalvarGrupos.disabled = true;
        btnSalvarGrupos.textContent = "Salvando...";

        const dadosGrupos = coletarDadosDosGrupos();

        await setDoc(doc(db, "palpites", usuarioAtual.uid), {
            uid: usuarioAtual.uid,
            gruposOrdenados: dadosGrupos.gruposOrdenados,
            grupos: dadosGrupos.grupos,
            gruposFinalizados: true,
            atualizadoEm: serverTimestamp()
        }, { merge: true });

        palpitesSalvos = dadosGrupos.gruposOrdenados;

        avisoGrupos.classList.add("salvo");
        mensagemStatus.textContent = "Seus palpites dos grupos foram salvos com sucesso.";

        btnSalvarGrupos.disabled = false;
        btnSalvarGrupos.textContent = "Ir para o mata-mata";
        btnSalvarGrupos.onclick = () => {
            window.location.href = "mata-mata.html";
        };

    } catch (error) {
        console.error("Erro ao salvar palpites dos grupos:", error);

        alert("Não foi possível salvar seus palpites. Tente novamente.");

        btnSalvarGrupos.disabled = false;
        btnSalvarGrupos.textContent = "Salvar palpites dos grupos";
    }
}

function coletarDadosDosGrupos() {
    const gruposOrdenados = {};
    const grupos = {};

    const listas = document.querySelectorAll(".times-lista");

    listas.forEach((lista) => {
        const nomeGrupo = lista.dataset.grupo;
        const itens = Array.from(lista.querySelectorAll(".time-item"));

        const ordemCompleta = itens.map((item, index) => {
            return {
                posicao: index + 1,
                codigo: item.dataset.codigo,
                nome: item.dataset.nome
            };
        });

        gruposOrdenados[nomeGrupo] = ordemCompleta.map((time) => time.codigo);

        grupos[nomeGrupo] = {
            primeiro: ordemCompleta[0]?.codigo || null,
            segundo: ordemCompleta[1]?.codigo || null,
            terceiro: ordemCompleta[2]?.codigo || null,
            quarto: ordemCompleta[3]?.codigo || null,
            ordemCompleta
        };
    });

    return {
        gruposOrdenados,
        grupos
    };
}

btnSalvarGrupos?.addEventListener("click", () => {
    if (btnSalvarGrupos.textContent.trim() === "Ir para o mata-mata") {
        window.location.href = "mata-mata.html";
        return;
    }

    salvarPalpitesGrupos();
});

btnSair?.addEventListener("click", async () => {
    try {
        await signOut(auth);
        window.location.href = "login.html";
    } catch (error) {
        console.error("Erro ao sair:", error);
        alert("Não foi possível sair. Tente novamente.");
    }
});