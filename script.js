const STORAGE_KEY = 'backyard-wachtlijst';
const MAX_PARTICIPANTS = 100;

const yearEl = document.getElementById('year');
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

function readWaitlist() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveWaitlist(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function updateParticipantCounters() {
  const entries = readWaitlist();
  const count = Math.min(entries.length, MAX_PARTICIPANTS);
  document.querySelectorAll('[data-participant-count]').forEach((el) => {
    el.textContent = String(count);
  });
}

const form = document.getElementById('waitlist-form');
if (form) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const entries = readWaitlist();
    if (entries.length >= MAX_PARTICIPANTS) {
      alert('De wachtlijst heeft het maximum van 100 deelnemers bereikt.');
      updateParticipantCounters();
      return;
    }

    const formData = new FormData(form);
    const newEntry = {
      voornaam: String(formData.get('voornaam') || '').trim(),
      achternaam: String(formData.get('achternaam') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      telefoon: String(formData.get('telefoon') || '').trim(),
    };

    if (!newEntry.voornaam || !newEntry.achternaam) {
      return;
    }

    entries.push(newEntry);
    saveWaitlist(entries);
    form.reset();
    updateParticipantCounters();
  });
}

updateParticipantCounters();
