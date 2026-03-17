const MAX_PARTICIPANTS = 100;
const COUNTER_REFRESH_MS = 10000;

const yearEl = document.getElementById('year');
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

async function fetchCount() {
  const response = await fetch('/api/count', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Kon teller niet ophalen.');
  }
  return response.json();
}

function setCounter(count) {
  const normalized = Math.min(Number(count) || 0, MAX_PARTICIPANTS);
  document.querySelectorAll('[data-participant-count]').forEach((el) => {
    el.textContent = String(normalized);
  });
}

async function updateParticipantCounters() {
  try {
    const data = await fetchCount();
    setCounter(data.count);
  } catch {
    setCounter(0);
  }
}

const form = document.getElementById('waitlist-form');
if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const newEntry = {
      voornaam: String(formData.get('voornaam') || '').trim(),
      achternaam: String(formData.get('achternaam') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      telefoon: String(formData.get('telefoon') || '').trim(),
    };

    if (!newEntry.voornaam || !newEntry.achternaam || !newEntry.email || !newEntry.telefoon) {
      alert('Vul alle verplichte velden in.');
      return;
    }

    const response = await fetch('/api/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEntry),
    });

    if (response.status === 409) {
      alert('De wachtlijst heeft het maximum van 100 deelnemers bereikt.');
      await updateParticipantCounters();
      return;
    }

    if (!response.ok) {
      alert('Er liep iets mis bij het inschrijven. Probeer opnieuw.');
      return;
    }

    const result = await response.json();
    setCounter(result.count);
    form.reset();
  });
}

updateParticipantCounters();
window.setInterval(updateParticipantCounters, COUNTER_REFRESH_MS);
