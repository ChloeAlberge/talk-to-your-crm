const chat = document.getElementById('chat');
const emptyState = document.getElementById('empty-state');
const form = document.getElementById('chat-form');
const input = document.getElementById('chat-input');
const actionsList = document.getElementById('actions-list');

let conversationHistory = [];

const TOOL_LABELS = {
  search_contacts: 'Recherche de contacts',
  search_opportunities: "Recherche d'opportunités",
  get_opportunity_details: "Détails d'une opportunité",
  summarize_opportunity_notes: 'Résumé des notes',
  classify_opportunity_priority: 'Classification de priorité',
};

function addMessage(text, sender) {
  if (emptyState) emptyState.remove();
  const div = document.createElement('div');
  div.className = 'message ' + sender;
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  return div;
}

function truncate(value, max = 50) {
  const str = String(value);
  return str.length > max ? str.slice(0, max) + '…' : str;
}

function renderTrace(trace) {
  actionsList.innerHTML = '';
  if (!trace || trace.length === 0) {
    actionsList.innerHTML = '<div class="actions-empty">Aucun tool nécessaire pour cette réponse.</div>';
    return;
  }
  trace.forEach((step) => {
    const item = document.createElement('div');
    item.className = 'action-item';
    const label = TOOL_LABELS[step.tool] || step.tool;
    const inputSummary = Object.entries(step.input || {})
      .map(([k, v]) => k + ': ' + truncate(v))
      .join(', ');
    item.innerHTML =
      '<span class="tool-name">' + label + '</span>' +
      '<span class="tool-input">' + (inputSummary || '—') + '</span>';
    actionsList.appendChild(item);
  });
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const message = input.value.trim();
  if (!message) return;

  addMessage(message, 'user');
  input.value = '';
  input.disabled = true;
  actionsList.innerHTML = '<div class="actions-empty">Traitement en cours...</div>';

  const pending = addMessage('Recherche en cours...', 'agent pending');

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history: conversationHistory }),
    });
    const data = await res.json();
    pending.textContent = data.answer || data.error || 'Erreur inconnue.';
    pending.classList.remove('pending');
    renderTrace(data.trace);
    if (data.history) conversationHistory = data.history;
  } catch (err) {
    pending.textContent = 'Erreur de connexion au serveur.';
    pending.classList.remove('pending');
    renderTrace([]);
  } finally {
    input.disabled = false;
    input.focus();
  }
});