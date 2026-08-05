import { auth, db } from "./firebase.js";

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
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const statusBolao = document.getElementById("statusBolao");
const totalUsuarios = document.getElementById("totalUsuarios");
const totalAdmins = document.getElementById("totalAdmins");

const mensagem = document.getElementById("mensagem");
const btnAbrirBolao = document.getElementById("btnAbrirBolao");
const btnFecharBolao = document.getElementById("btnFecharBolao");

const buscaUsuario = document.getElementById("buscaUsuario");
const filtroTipo = document.getElementById("filtroTipo");
const listaUsuarios = document.getElementById("listaUsuarios");

const btnSair = document.getElementById("btnSair");

let usuarioAtual = null;
let dadosAdmin = null;
let usuarios = [];
let palpitesPorUsuario = {};
let bolaoAberto = false;

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login-admin.html";
        return;
    }

    usuarioAtual = user;

    const podeAcessar = await verificarAdmin();

    if (!podeAcessar) {
        alert("Acesso negado. Esta área é exclusiva para administradores.");
        await signOut(auth);
        window.location.href = "login-admin.html";
        return;
    }

    await iniciarAdmin();
});

async function verificarAdmin() {
    try {
        const usuarioRef = doc(db, "usuarios", usuarioAtual.uid);
        const usuarioSnap = await getDoc(usuarioRef);

        if (!usuarioSnap.exists()) {
            return false;
        }

        dadosAdmin = usuarioSnap.data();

        return dadosAdmin.tipo === "admin";

    } catch (error) {
        console.error("Erro ao verificar admin:", error);
        return false;
    }
}

async function iniciarAdmin() {
    try {
        await garantirConfiguracaoBolao();
        await carregarStatusBolao();

        await Promise.all([
            carregarUsuarios(),
            carregarPalpites()
        ]);

        vincularPalpitesAosUsuarios();

        renderizarResumo();
        renderizarUsuarios();

    } catch (error) {
        console.error("Erro ao iniciar admin:", error);

        mensagem.textContent = "Não foi possível carregar o painel administrativo.";

        listaUsuarios.innerHTML = `
            <div class="erro-card">
                Não foi possível carregar os usuários.
            </div>
        `;
    }
}

/* =========================
   CONFIGURAÇÃO DO BOLÃO
========================= */

async function garantirConfiguracaoBolao() {
    const configRef = doc(db, "configuracoes", "bolao");
    const configSnap = await getDoc(configRef);

    if (!configSnap.exists()) {
        await setDoc(configRef, {
            bolaoAberto: false,
            criadoEm: serverTimestamp(),
            atualizadoEm: serverTimestamp()
        });
    }
}

async function carregarStatusBolao() {
    const configRef = doc(db, "configuracoes", "bolao");
    const configSnap = await getDoc(configRef);

    if (!configSnap.exists()) {
        bolaoAberto = false;
    } else {
        const config = configSnap.data();
        bolaoAberto = config.bolaoAberto === true;
    }

    atualizarVisualStatusBolao();
}

function atualizarVisualStatusBolao() {
    if (bolaoAberto) {
        statusBolao.textContent = "Aberto";
        mensagem.textContent = "O bolão está aberto. Os participantes podem salvar e alterar os palpites.";
        btnAbrirBolao.disabled = true;
        btnFecharBolao.disabled = false;
        return;
    }

    statusBolao.textContent = "Fechado";
    mensagem.textContent = "O bolão está fechado. Os participantes podem visualizar, mas não podem alterar os palpites.";
    btnAbrirBolao.disabled = false;
    btnFecharBolao.disabled = true;
}

async function alterarStatusBolao(novoStatus) {
    try {
        btnAbrirBolao.disabled = true;
        btnFecharBolao.disabled = true;

        const configRef = doc(db, "configuracoes", "bolao");

        await setDoc(configRef, {
            bolaoAberto: novoStatus,
            atualizadoEm: serverTimestamp(),
            atualizadoPor: usuarioAtual.uid
        }, { merge: true });

        bolaoAberto = novoStatus;
        atualizarVisualStatusBolao();

    } catch (error) {
        console.error("Erro ao alterar status do bolão:", error);
        alert("Não foi possível alterar o status do bolão.");
        atualizarVisualStatusBolao();
    }
}

/* =========================
   USUÁRIOS E PALPITES
========================= */

async function carregarUsuarios() {
    const usuariosSnap = await getDocs(collection(db, "usuarios"));

    usuarios = [];

    usuariosSnap.forEach((documento) => {
        usuarios.push({
            id: documento.id,
            ...documento.data()
        });
    });

    ordenarUsuarios();
}

async function carregarPalpites() {
    const palpitesSnap = await getDocs(collection(db, "palpites"));

    palpitesPorUsuario = {};

    palpitesSnap.forEach((documento) => {
        palpitesPorUsuario[documento.id] = documento.data();
    });
}

function vincularPalpitesAosUsuarios() {
    usuarios = usuarios.map((usuario) => {
        const palpite = palpitesPorUsuario[usuario.id] || null;

        return {
            ...usuario,
            palpite,
            statusPalpites: obterStatusPalpites(palpite)
        };
    });
}

function obterStatusPalpites(palpite) {
    const gruposSalvos =
        palpite?.gruposFinalizados === true ||
        !!palpite?.grupos ||
        !!palpite?.gruposOrdenados;

    const mataMataSalvo =
        !!palpite?.mataMata?.escolhas &&
        Object.keys(palpite.mataMata.escolhas || {}).length > 0;

    const top3Salvo =
        !!palpite?.mataMata?.top3?.campeao &&
        !!palpite?.mataMata?.top3?.viceCampeao &&
        !!palpite?.mataMata?.top3?.terceiroLugar;

    return {
        gruposSalvos,
        mataMataSalvo,
        top3Salvo
    };
}

function ordenarUsuarios() {
    usuarios.sort((a, b) => {
        const pontosA = Number(a.pontos || 0);
        const pontosB = Number(b.pontos || 0);

        if (pontosB !== pontosA) {
            return pontosB - pontosA;
        }

        return String(a.nome || a.usuario || "").localeCompare(String(b.nome || b.usuario || ""));
    });
}

function renderizarResumo() {
    totalUsuarios.textContent = usuarios.length;

    const admins = usuarios.filter((usuario) => usuario.tipo === "admin").length;
    totalAdmins.textContent = admins;
}

function renderizarUsuarios() {
    const listaFiltrada = aplicarFiltrosUsuarios();

    if (listaFiltrada.length === 0) {
        listaUsuarios.innerHTML = `
            <div class="empty-card">
                Nenhum usuário encontrado com os filtros selecionados.
            </div>
        `;
        return;
    }

    listaUsuarios.innerHTML = listaFiltrada.map((usuario) => criarCardUsuario(usuario)).join("");

    adicionarEventosUsuarios();
}

function aplicarFiltrosUsuarios() {
    const busca = normalizarTexto(buscaUsuario.value);
    const tipo = filtroTipo.value;

    return usuarios.filter((usuario) => {
        const passaTipo = tipo === "todos" || usuario.tipo === tipo;

        const textoBusca = normalizarTexto(`
            ${usuario.nome}
            ${usuario.usuario}
            ${usuario.email}
            ${usuario.bandeira}
        `);

        const passaBusca = !busca || textoBusca.includes(busca);

        return passaTipo && passaBusca;
    });
}

function criarCardUsuario(usuario) {
    const id = usuario.id;
    const nome = usuario.nome || usuario.usuario || "Usuário";
    const user = usuario.usuario ? `@${usuario.usuario}` : "Sem usuário";
    const email = usuario.email || "E-mail não informado";
    const bandeira = usuario.bandeira || "TBD";
    const pontos = usuario.pontos ?? 0;
    const tipo = usuario.tipo || "usuario";

    const statusPalpites = usuario.statusPalpites || {
        gruposSalvos: false,
        mataMataSalvo: false,
        top3Salvo: false
    };

    const classeTipo = tipo === "admin" ? "admin" : "";

    return `
        <article class="usuario-card ${classeTipo}" data-id="${id}">
            <div class="usuario-bandeira">
                <img src="assets/Icon/${bandeira}.png" 
                     alt="${nome}"
                     onerror="this.src='assets/Icon/TBD.png'">
            </div>

            <div class="usuario-info">
                <h3>${nome}</h3>
                <p>${user} • ${email}</p>

                <div class="usuario-tags">
                    <span class="tag ${tipo === "admin" ? "admin" : "usuario"}">
                        ${tipo === "admin" ? "Admin" : "Usuário"}
                    </span>

                    <span class="tag ${statusPalpites.gruposSalvos ? "palpite" : "pendente"}">
                        ${statusPalpites.gruposSalvos ? "Grupos salvo" : "Grupos pendente"}
                    </span>

                    <span class="tag ${statusPalpites.mataMataSalvo ? "palpite" : "pendente"}">
                        ${statusPalpites.mataMataSalvo ? "Mata-mata salvo" : "Mata-mata pendente"}
                    </span>

                    <span class="tag ${statusPalpites.top3Salvo ? "palpite" : "pendente"}">
                        ${statusPalpites.top3Salvo ? "Top 3 salvo" : "Top 3 pendente"}
                    </span>
                </div>
            </div>

            <div class="usuario-acoes">
                <input 
                    class="input-pontos" 
                    type="number" 
                    value="${pontos}" 
                    min="0"
                    data-campo="pontos"
                    aria-label="Pontos de ${nome}"
                >

                <select class="select-tipo" data-campo="tipo" aria-label="Tipo de ${nome}">
                    <option value="usuario" ${tipo === "usuario" ? "selected" : ""}>Usuário</option>
                    <option value="admin" ${tipo === "admin" ? "selected" : ""}>Admin</option>
                </select>

                <button class="btn-salvar-usuario" type="button" data-acao="salvar">
                    Salvar
                </button>

                <button class="btn-excluir-usuario" type="button" data-acao="excluir">
                    Excluir
                </button>
            </div>
        </article>
    `;
}

function adicionarEventosUsuarios() {
    document.querySelectorAll(".btn-salvar-usuario").forEach((botao) => {
        botao.addEventListener("click", salvarUsuario);
    });

    document.querySelectorAll(".btn-excluir-usuario").forEach((botao) => {
        botao.addEventListener("click", excluirUsuario);
    });
}

async function salvarUsuario(event) {
    const card = event.currentTarget.closest(".usuario-card");

    if (!card) return;

    const userId = card.dataset.id;
    const inputPontos = card.querySelector(".input-pontos");
    const selectTipo = card.querySelector(".select-tipo");

    const pontos = Number(inputPontos.value || 0);
    const tipo = selectTipo.value;

    try {
        event.currentTarget.disabled = true;
        event.currentTarget.textContent = "Salvando...";

        await updateDoc(doc(db, "usuarios", userId), {
            pontos,
            tipo,
            atualizadoEm: serverTimestamp()
        });

        const index = usuarios.findIndex((usuario) => usuario.id === userId);

        if (index >= 0) {
            usuarios[index].pontos = pontos;
            usuarios[index].tipo = tipo;
        }

        ordenarUsuarios();

        renderizarResumo();
        renderizarUsuarios();

    } catch (error) {
        console.error("Erro ao salvar usuário:", error);
        alert("Não foi possível salvar as alterações do usuário.");

        event.currentTarget.disabled = false;
        event.currentTarget.textContent = "Salvar";
    }
}

async function excluirUsuario(event) {
    const card = event.currentTarget.closest(".usuario-card");

    if (!card) return;

    const userId = card.dataset.id;
    const usuario = usuarios.find((item) => item.id === userId);
    const nome = usuario?.nome || usuario?.usuario || "este usuário";

    if (userId === usuarioAtual.uid) {
        alert("Você não pode excluir o próprio usuário administrador por esta tela.");
        return;
    }

    const confirmar = confirm(
        `Tem certeza que deseja excluir o documento de ${nome}? Esta ação remove o registro do Firestore, mas não remove a conta do Firebase Auth.`
    );

    if (!confirmar) return;

    try {
        event.currentTarget.disabled = true;
        event.currentTarget.textContent = "Excluindo...";

        await deleteDoc(doc(db, "usuarios", userId));

        usuarios = usuarios.filter((item) => item.id !== userId);

        renderizarResumo();
        renderizarUsuarios();

    } catch (error) {
        console.error("Erro ao excluir usuário:", error);
        alert("Não foi possível excluir o usuário.");

        event.currentTarget.disabled = false;
        event.currentTarget.textContent = "Excluir";
    }
}

function normalizarTexto(texto) {
    return String(texto || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

/* =========================
   EVENTOS
========================= */

btnAbrirBolao?.addEventListener("click", () => {
    alterarStatusBolao(true);
});

btnFecharBolao?.addEventListener("click", () => {
    alterarStatusBolao(false);
});

buscaUsuario?.addEventListener("input", renderizarUsuarios);
filtroTipo?.addEventListener("change", renderizarUsuarios);

btnSair?.addEventListener("click", async () => {
    try {
        await signOut(auth);
        window.location.href = "login-admin.html";
    } catch (error) {
        console.error("Erro ao sair:", error);
        alert("Não foi possível sair. Tente novamente.");
    }
});