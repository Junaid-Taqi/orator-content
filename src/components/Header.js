import React from 'react';


const Header = () => {
    return (
        <header className="header">
            <div className="header-left">
                <h1 className="header-title">MUNICIPALITY OF TISNO</h1>
                <p className="header-subtitle">Monitor your digital signage network</p>
            </div>
            <div className="header-right">
                <button className="notification-btn">
                    <span className="bell-icon">🔔</span>
                </button>
                <div className="user-info">
                    <span className="user-avatar">👤</span>
                    <div className="user-text">
                        <p className="user-role">Admin User</p>
                        <p className="user-email">admin@orator.com</p>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
