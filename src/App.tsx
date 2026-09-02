import { useEffect, useState } from 'react';
import Today from './screens/Today';
import Vitals from './screens/Vitals';
import Training from './screens/Training';
import { dayFromDate } from './lib/date';
import { requestPersistence } from './db/local';

type Tab = 'today' | 'training' | 'vitals';

export default function App() {
  const rawDay = dayFromDate();
  /** Program başlamadan önce (rawDay < 1) geri sayım gösterilir, Gün 1 sıkıştırılmaz. */
  const notStarted = rawDay < 1;
  const today = Math.max(1, Math.min(91, rawDay));
  const [tab, setTab] = useState<Tab>('today');
  const [day, setDay] = useState(today);

  useEffect(() => {
    requestPersistence();
  }, []);

  return (
    <div className="app">
      <div className="scroll">
        {notStarted && (
          <div className="alert" style={{ marginBottom: 12 }}>
            <b>Program 3 Eylül Perşembe başlıyor.</b> Bugün hazırlık:
            Apple Watch bildirimleri (düşük nabız 45, uyku apnesi), 8 ilaç kaydı,
            sabah kilo ölçümü. Aşağıdaki liste Gün 1'in planı.
          </div>
        )}
        {tab === 'today' && <Today day={day} onChangeDay={setDay} today={today} />}
        {tab === 'training' && <Training day={day} />}
        {tab === 'vitals' && <Vitals day={day} />}
      </div>

      <nav className="tabbar">
        <button className={`tab${tab === 'today' ? ' active' : ''}`} onClick={() => setTab('today')}>
          <span className="tab-icon">◎</span>
          <span>Bugün</span>
        </button>
        <button className={`tab${tab === 'training' ? ' active' : ''}`} onClick={() => setTab('training')}>
          <span className="tab-icon">◈</span>
          <span>Spor</span>
        </button>
        <button className={`tab${tab === 'vitals' ? ' active' : ''}`} onClick={() => setTab('vitals')}>
          <span className="tab-icon">♡</span>
          <span>Ölçüm</span>
        </button>
      </nav>
    </div>
  );
}
