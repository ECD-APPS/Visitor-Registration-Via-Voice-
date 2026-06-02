import { useEffect, useMemo, useRef, useState } from 'react';

const fields = [
  { key: 'visitor_name', label: 'Your full name', prompt: 'Please state your full name.' },
  { key: 'company_name', label: 'Company name', prompt: 'Which company are you representing?' },
  { key: 'visiting_person', label: 'Person you are visiting', prompt: 'Who are you visiting today?' },
  { key: 'visiting_department', label: 'Department', prompt: 'Which department is the person you are visiting in?' },
  { key: 'pass_number', label: 'Pass number', prompt: 'Please say your pass number starting with E A P.' },
  { key: 'mobile_number', label: 'Mobile number', prompt: 'What is your mobile number?' },
  { key: 'email_address', label: 'Email address', prompt: 'What is your email address?' },
  { key: 'visit_start_date', label: 'Visit start date', prompt: 'What is your visit start date?' },
  { key: 'visit_end_date', label: 'Visit end date', prompt: 'What is your visit end date?' }
];

const defaultData = {
  visitor_name: '',
  company_name: '',
  visiting_person: '',
  visiting_department: '',
  pass_number: '',
  employee_tag: 'Visitor',
  mobile_number: '',
  email_address: '',
  visit_start_date: '',
  visit_end_date: ''
};

const API_BASE = import.meta.env.VITE_API_BASE || '';
function apiUrl(path) {
  return API_BASE ? `${API_BASE.replace(/\/$/, '')}${path}` : path;
}

function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function parseDateResponse(rawText) {
  return rawText
    .replace(/\bfirst\b/gi, '1')
    .replace(/\bsecond\b/gi, '2')
    .replace(/\bthird\b/gi, '3')
    .replace(/\bfourth\b/gi, '4')
    .replace(/\bfifth\b/gi, '5')
    .replace(/\bto\b/gi, '2')
    .slice(0, 25);
}

function formatField(key, value) {
  if (key === 'visit_start_date' || key === 'visit_end_date') {
    return value ? value : 'Not captured';
  }
  return value || 'Not captured';
}

export default function App() {
  const recognition = useRef(null);
  const [visitorData, setVisitorData] = useState(defaultData);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState('waiting');
  const [log, setLog] = useState('Press Start to begin voice registration.');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [confirmMode, setConfirmMode] = useState(false);

  const currentField = useMemo(() => fields[currentIndex], [currentIndex]);

  useEffect(() => {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      setError('SpeechRecognition is not supported in this browser. Use Chrome or Edge.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition.current = new SpeechRecognition();
    recognition.current.continuous = false;
    recognition.current.interimResults = false;
    recognition.current.lang = 'en-US';

    recognition.current.onstart = () => {
      setStatus('listening');
      setLog('Listening... please speak clearly.');
    };

    recognition.current.onresult = event => {
      const transcript = event.results[0][0].transcript.trim();
      handleTranscript(transcript);
    };

    recognition.current.onend = () => {
      if (status === 'listening') {
        setStatus('idle');
      }
    };

    recognition.current.onerror = event => {
      setStatus('idle');
      setError(`Speech recognition error: ${event.error}`);
    };
  }, []);

  const startQuestion = field => {
    if (!field) return;
    setError('');
    setLog(field.prompt);
    speak(field.prompt);
    setTimeout(() => {
      recognition.current?.start();
    }, 500);
  };

  const handleTranscript = transcript => {
    setStatus('idle');
    const key = currentField?.key;
    if (!key) return;

    let value = transcript;
    if (key === 'visit_start_date' || key === 'visit_end_date') {
      value = parseDateResponse(transcript);
    }

    setVisitorData(prev => ({ ...prev, [key]: value }));
    setLog(`Captured ${currentField.label}: ${value}`);

    const nextIndex = currentIndex + 1;
    if (nextIndex < fields.length) {
      setCurrentIndex(nextIndex);
      setTimeout(() => startQuestion(fields[nextIndex]), 1200);
    } else {
      setConfirmMode(true);
      speak('I have captured your details. Please review and confirm.');
    }
  };

  const beginRegistration = () => {
    setVisitorData(defaultData);
    setCurrentIndex(0);
    setConfirmMode(false);
    setSubmitted(false);
    setError('');
    startQuestion(fields[0]);
  };

  const submitRegistration = async () => {
    setError('');
    setLog('Submitting registration...');
    try {
      const response = await fetch(apiUrl('/api/visitor/voice-register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visitorData)
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Submission failed.');
      }
      setSubmitted(true);
      setLog('Registration complete. Your details have been sent to the CRM.');
      speak('Registration complete. Your details have been sent to the CRM.');
    } catch (err) {
      setError(err.message);
      setLog('Submission failed. Please try again.');
    }
  };

  return (
    <div className="app-shell">
      <header>
        <h1>Visitor Registration via Voice</h1>
        <p>Use the Start button to begin voice-based visitor registration.</p>
      </header>

      <main>
        <section className="control-panel">
          <button onClick={beginRegistration}>Start Registration</button>
          <p className="status">Status: {status}</p>
          {error && <p className="error">{error}</p>}
          <p className="log">{log}</p>
        </section>

        <section className="summary">
          <h2>Captured Visitor Data</h2>
          <div className="grid">
            {Object.entries(visitorData).map(([key, value]) => (
              <div key={key} className="field-card">
                <strong>{fields.find(field => field.key === key)?.label || key}</strong>
                <span>{formatField(key, value)}</span>
              </div>
            ))}
          </div>
        </section>

        {confirmMode && !submitted && (
          <section className="confirmation">
            <h2>Confirm Information</h2>
            <p>
              I have you down as {visitorData.visitor_name} from {visitorData.company_name}, visiting {visitorData.visiting_person} in {visitorData.visiting_department} from {visitorData.visit_start_date} to {visitorData.visit_end_date}.
            </p>
            <button onClick={submitRegistration}>Confirm and Submit</button>
          </section>
        )}

        {submitted && (
          <section className="finished">
            <p>Thank you. Your registration has been submitted.</p>
          </section>
        )}
      </main>
    </div>
  );
}
