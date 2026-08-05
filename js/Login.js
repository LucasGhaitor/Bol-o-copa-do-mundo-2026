import { auth, db } from "./firebase.js";

import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const form = document.getElementById("formLogin");
const mensagem = document.getElementById("mensagem");

const modalRecuperacao = document.getElementById("modalRecuperacao");
const abrirRecuperacao = document.getElementById("abrirRecuperacao");
const fecharRecuperacao = document.getElementById("fecharRecuperacao");
const btnRecuperarSenha = document.getElementById("btnRecuperarSenha");
const mensagemRecuperacao = document.getElementById("mensagemRecuperacao");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const usuario = document.getElementById("usuario").value.trim().toLowerCase();
  const senha = document.getElementById("senha").value;

  try {
    const dadosUsuario = await buscarUsuarioPorNome(usuario);

    if (!dadosUsuario) {
      mostrarMensagem("Usuário não encontrado.", "red");
      return;
    }

    await signInWithEmailAndPassword(auth, dadosUsuario.email, senha);

    mostrarMensagem("Login realizado com sucesso!", "green");

    setTimeout(() => {
      window.location.href = "home.html";
    }, 1000);

  } catch (error) {
    console.error(error);
    mostrarMensagem("Usuário ou senha inválidos.", "red");
  }
});

abrirRecuperacao.addEventListener("click", (event) => {
  event.preventDefault();
  modalRecuperacao.classList.add("ativo");
});

fecharRecuperacao.addEventListener("click", () => {
  modalRecuperacao.classList.remove("ativo");
  mensagemRecuperacao.textContent = "";
});

btnRecuperarSenha.addEventListener("click", async () => {
  const usuario = document.getElementById("usuarioRecuperacao").value.trim().toLowerCase();

  if (!usuario) {
    mostrarMensagemRecuperacao("Informe seu nome de usuário.", "red");
    return;
  }

  try {
    const dadosUsuario = await buscarUsuarioPorNome(usuario);

    if (!dadosUsuario) {
      mostrarMensagemRecuperacao("Usuário não encontrado.", "red");
      return;
    }

    await sendPasswordResetEmail(auth, dadosUsuario.email);

    mostrarMensagemRecuperacao(
      "E-mail de recuperação enviado para o e-mail cadastrado.",
      "green"
    );

  } catch (error) {
    console.error(error);
    mostrarMensagemRecuperacao("Erro ao enviar recuperação de senha.", "red");
  }
});

async function buscarUsuarioPorNome(usuario) {
  const usuariosRef = collection(db, "usuarios");
  const consulta = query(usuariosRef, where("usuario", "==", usuario));
  const resultado = await getDocs(consulta);

  if (resultado.empty) {
    return null;
  }

  return resultado.docs[0].data();
}

function mostrarMensagem(texto, cor) {
  mensagem.textContent = texto;
  mensagem.style.color = cor;
}

function mostrarMensagemRecuperacao(texto, cor) {
  mensagemRecuperacao.textContent = texto;
  mensagemRecuperacao.style.color = cor;
}