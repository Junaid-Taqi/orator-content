import React, { useEffect, useState } from 'react';
import './App.css';
import { Provider, useDispatch, useSelector } from 'react-redux';
import store from './Services/Store/Store';
import { fetchToken } from './Services/Slices/AuthSlice';
import Header from './components/Header';
import Navigation from './components/Navigation';
import SlidesPage from './components/SlidesPage';
import PoolsPage from './components/PoolPage';

function AppContent() {
  const dispatch = useDispatch();
  const { token, expiresIn } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('slides');
  const user = JSON.parse(sessionStorage.getItem("liferayUser")) || {
    "userId": "32533",
    "fullName": "admin lahore",
    "email": "admin@lahore.com",
    "groups": [
      {
        "id": "32394",
        "name": "Municipality One"
      }
    ]
  };

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

  return (
    <>
      <Header />
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        {activeTab === 'slides' && <SlidesPage />}
        {activeTab === 'pools' && (
          <div className="content-placeholder">
            <PoolsPage user={user} />
          </div>
        )}
        {activeTab === 'timeline' && (
          <div className="content-placeholder">
            <h2>Timeline</h2>
            <p>Coming soon...</p>
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
