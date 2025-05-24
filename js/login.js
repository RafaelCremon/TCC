function login() {
  const usuario = document.getElementById("usuario").value;
  const senha = document.getElementById("senha").value;
  const erroUsuario = document.getElementById("erroUsuario");
  const erroSenha = document.getElementById("erroSenha");

  // Limpa mensagens anteriores
  erroUsuario.textContent = "";
  erroSenha.textContent = "";

  const usuariosValidos = [
    { usuario: "admin", senha: "1234" }
  ];

  const autorizado = usuariosValidos.find(u => u.usuario === usuario && u.senha === senha);

  if (autorizado) {
    window.location.href = "pages/mapa.html"; // Redireciona para o mapa
  } else {
    if (!usuario) erroUsuario.textContent = "Usuário obrigatório.";
    else erroUsuario.textContent = "";

    if (!senha) erroSenha.textContent = "Senha obrigatória.";
    else erroSenha.textContent = "";

    if (usuario && senha) {
      erroSenha.textContent = "Usuário ou senha incorretos.";
    }
  }
}
