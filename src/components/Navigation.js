import React from 'react';
import '../styles/Navigation.css';
import { useTranslation } from '../Services/Localization/Localization';

const Navigation = ({activeTab, setActiveTab}) => {
    const { t } = useTranslation();
    const tabs = [
        {id: 'slides', label: t('slides'), icon: '📊'},
        {id: 'pools', label: t('contentPools'), icon: '🎯'},
        {id: 'timeline', label: t('timeline'), icon: '⏱️'},
    ];

    return (
        <nav className="navigation">
            <div className="tabs-container">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <span className="tab-icon">{tab.icon}</span>
                        <span className="tab-label">{tab.label}</span>
                    </button>
                ))}
            </div>
            <button className="connector-btn">
                <span className="connector-icon">🔗</span>
                <span>{t('Connectors')}</span>
            </button>
        </nav>
    );
};

export default Navigation;
