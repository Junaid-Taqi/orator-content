import React, { useEffect, useState } from 'react';
import './App.css';
import { Provider, useDispatch, useSelector } from 'react-redux';
import store from './Services/Store/Store';
import { fetchToken } from './Services/Slices/AuthSlice';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/Header.css';
import Navigation from './components/Navigation';
import SlidesPage from './components/SlidesPage';
import PoolsPage from './components/PoolPage';
import TimelinePage from './components/TimelinePage';
import DisplayNav from "./components/DisplayNav";

function AppContent() {
  const dispatch = useDispatch();
  const { token, expiresIn, status, error } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('slides');
  const user = JSON.parse(sessionStorage.getItem("liferayUser")) || {
    "userId": "24608",
    "fullName": "admin lahore",
    "email": "admin@lahore.com",
    "groups": [
      {
        "id": "24593",
        "name": "Municipility One"
      }
    ]
  }

  useEffect(() => {
    dispatch(fetchToken());
  }, [dispatch]);

  useEffect(() => {
    if (token && expiresIn) {
      // Refresh token 60 seconds before it expires
      const refreshTime = (expiresIn - 60) * 1000;

      if (refreshTime > 0) {
        const timer = setTimeout(() => {
          console.log("Token expiring soon, refreshing...");
          dispatch(fetchToken());
        }, refreshTime);

        return () => clearTimeout(timer);
      }
    }
  }, [token, expiresIn, dispatch]);

  if (status === 'idle' || status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <div style={{ fontSize: '16px', fontWeight: 600 }}>Loading...</div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#b91c1c' }}>
        <div>Failed to load token{error ? `: ${error}` : ''}</div>
      </div>
    );
  }

  return (
    <>
      <DisplayNav user={user} />
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        {activeTab === 'slides' && <SlidesPage user={user} />}
        {activeTab === 'pools' && (
          <div className="content-placeholder">
            <PoolsPage user={user} />
          </div>
        )}
        {activeTab === 'timeline' && (
          <div className="content-placeholder">
            <TimelinePage user={user} />
          </div>
        )}
      </main>
    </>
  );
}

function App() {
  return (
    <div className="App">
      <Provider store={store}>
        <AppContent />
      </Provider>
    </div>
  );
}

export default App;
