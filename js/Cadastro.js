import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  doc,
  setDoc,
  getDocs,
  query,
  where,
  collection,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const form = document.getElementById("formCadastro");
const mensagem = document.getElementById("mensagem");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const nome = document.getElementById("nome").value.trim();
  const usuario = document.getElementById("usuario").value.trim().toLowerCase();
  const email = document.getElementById("email").value.trim().toLowerCase();
  const senha = document.getElementById("senha").value;
  const confirmarSenha = document.getElementById("confirmarSenha").value;
  const bandeiraSelecionada = document.querySelector('input[name="bandeira"]:checked');

  if (!bandeiraSelecionada) {
    mostrarMensagem("Selecione uma bandeira favorita.", "red");
    return;
  }

  if (senha !== confirmarSenha) {
    mostrarMensagem("As senhas não coincidem.", "red");
    return;
  }

  if (senha.length < 6) {
    mostrarMensagem("A senha precisa ter pelo menos 6 caracteres.", "red");
    return;
  }

  try {
    const usuarioExiste = await verificarUsuarioExistente(usuario);

    if (usuarioExiste) {
      mostrarMensagem("Este nome de usuário já está em uso.", "red");
      return;
    }

    const credencial = await createUserWithEmailAndPassword(auth, email, senha);
    const user = credencial.user;

    await setDoc(doc(db, "usuarios", user.uid), {
      uid: user.uid,
      nome,
      usuario,
      email,
      bandeira: bandeiraSelecionada.value,
      tipo: "usuario",
      pontos: 0,
      palpitesFinalizados: false,
      criadoEm: serverTimestamp()
    });

    mostrarMensagem("Cadastro realizado com sucesso!", "green");

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1200);

  } catch (error) {
    console.error(error);
    mostrarMensagem("Erro ao cadastrar. Verifique os dados informados.", "red");
  }
});

async function verificarUsuarioExistente(usuario) {
  const usuariosRef = collection(db, "usuarios");
  const consulta = query(usuariosRef, where("usuario", "==", usuario));
  const resultado = await getDocs(consulta);

  return !resultado.empty;
}

function mostrarMensagem(texto, cor) {
  mensagem.textContent = texto;
  mensagem.style.color = cor;
}