// Aplica o tema salvo ANTES de qualquer renderização
if(localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark-mode');
}

function voltar() {
  document.body.style.animation = "fadeOutScale 0.5s cubic-bezier(.4,1.4,.6,1) forwards";
  setTimeout(() => {
    window.location.href = "inicial.html";
  }, 480);
}
function mostrarUnicantina() {
  document.querySelector('.lanchonetes-card').style.display = 'none';
  var card = document.getElementById('unicantinaCard');
  card.style.display = 'block';
  card.style.animation = 'fadeInUp 0.7s cubic-bezier(.4,1.4,.6,1)';
}
function mostrarImperatriz() {
  document.querySelector('.lanchonetes-card').style.display = 'none';
  var card = document.getElementById('imperatrizCard');
  card.style.display = 'block';
  card.style.animation = 'fadeInUp 0.7s cubic-bezier(.4,1.4,.6,1)';
}
function fecharUnicantina() {
  document.getElementById('unicantinaCard').style.display = 'none';
  document.querySelector('.lanchonetes-card').style.display = 'block';
}
function enviarPedidoUnicantina() {
  const item = document.getElementById('itemUnicantina').value;
  const horario = document.getElementById('horarioUnicantina').value;
  if (!item || !horario) {
    alert('Preencha o item e o horário!');
    return;
  }
  // Exibe modal de confirmação
  document.getElementById('modalItemUnicantina').textContent = item;
  document.getElementById('modalConfirmacaoUnicantina').style.display = 'flex';
  window._unicantinaPedido = { item, horario };
}
// Modal confirmação Unicantina
document.addEventListener('DOMContentLoaded', function() {
  var btnConfirmar = document.getElementById('btnConfirmarUnicantina');
  var btnCancelar = document.getElementById('btnCancelarUnicantina');
  if(btnConfirmar && btnCancelar) {
    btnConfirmar.onclick = function() {
      var pedido = window._unicantinaPedido;
      if(pedido) {
        var numero = '5511933561693';
        var mensagem = `Olá! Gostaria de pedir na Unicantina o item "${pedido.item}" para o horário ${pedido.horario}.`;
        var url = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
        window.open(url, '_blank');
      }
      document.getElementById('modalConfirmacaoUnicantina').style.display = 'none';
    };
    btnCancelar.onclick = function() {
      document.getElementById('modalConfirmacaoUnicantina').style.display = 'none';
    };
  }
});
function mostrarPizzaChicken() {
  document.querySelector('.lanchonetes-card').style.display = 'none';
  const card = document.getElementById('pizzaChickenCard');
  card.style.display = 'block';
  card.style.animation = 'fadeInUp 0.7s cubic-bezier(.4,1.4,.6,1)';
}
function fecharPizzaChicken() {
  document.getElementById('pizzaChickenCard').style.display = 'none';
  document.querySelector('.lanchonetes-card').style.display = 'block';
}
function enviarPedidoPizzaChicken() {
  const item = document.getElementById('itemPizzaChicken').value;
  const horario = document.getElementById('horarioPizzaChicken').value;
  const numero = '5511999999999'; // WhatsApp Pizza & Chicken (exemplo)

  if (!item || !horario) {
    alert('Preencha o item e o horário!');
    return;
  }

  const mensagem = `Olá! Gostaria de pedir no Pizza & Chicken o item "${item}" para o horário ${horario}.`;
  const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
  window.open(url, '_blank');
}
function fecharImperatriz() {
  document.getElementById('imperatrizCard').style.display = 'none';
  document.querySelector('.lanchonetes-card').style.display = 'block';
}
function enviarPedidoImperatriz() {
  const item = document.getElementById('itemImperatriz').value;
  const horario = document.getElementById('horarioImperatriz').value;
  const numero = '551191055229'; // WhatsApp Imperatriz (novo número)

  if (!item || !horario) {
    alert('Preencha o item e o horário!');
    return;
  }

  const mensagem = `Olá! Gostaria de pedir na Imperatriz o item "${item}" para o horário ${horario}.`;
  const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
  window.open(url, '_blank');
}