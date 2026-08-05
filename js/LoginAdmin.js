import { auth, db } from "./firebase.js";

import {
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const form = document.getElementById("formAdminLogin");
const mensagem = document.getElementById("mensagem");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const usuario = document.getElementById("usuario").value.trim().toLowerCase();
  const senha = document.getElementById("senha").value;

  try {
    const dadosUsuario = await buscarUsuarioPorNome(usuario);

    if (!dadosUsuario) {
      mostrarMensagem("Usuário admin não encontrado.", "red");
      return;
    }

    const credencial = await signInWithEmailAndPassword(
      auth,
      dadosUsuario.email,
      senha
    );

    if (dadosUsuario.tipo !== "admin") {
      await signOut(auth);
      mostrarMensagem("Acesso negado. Este usuário não é administrador.", "red");
      return;
    }

    localStorage.setItem("adminUid", credencial.user.uid);

    mostrarMensagem("Login admin realizado com sucesso!", "green");

    setTimeout(() => {
      window.location.href = "admin.html";
    }, 1000);

  } catch (error) {
    console.error(error);
    mostrarMensagem("Usuário ou senha inválidos.", "red");
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