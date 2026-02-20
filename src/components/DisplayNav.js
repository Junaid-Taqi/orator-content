import React, { useRef, useState, useEffect } from 'react';
import DisplaysDashboard from '../styles/DisplaysDashboard.css';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faBell} from "@fortawesome/free-solid-svg-icons/faBell";

const DisplayNav = ({ user }) => {
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setUserMenuOpen(false);
            }
        };
        if (userMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [userMenuOpen]);

    const handleLogout = () => {
        setUserMenuOpen(false);
        window.location.href = '/c/portal/logout';
    };

    return (
        <nav className="displays-dashboard__nav">
            <div className="header-left">
                <h1 className="header-title">MUNICIPALITY OF TISNO</h1>
                <p className="header-subtitle">Monitor your digital signage network</p>
            </div>

            <div className="displays-dashboard__nav-user-wrap" ref={userMenuRef}>
                <button
                    type="button"
                    className="displays-dashboard__nav-user"
                    onClick={() => setUserMenuOpen((v) => !v)}
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                >
                    <i className="pi pi-user nav-user-icon" />
                    <div className="nav-user-info">
                        <span className="nav-user-name">{user?.fullName}</span>
                        <span className="nav-user-email">{user?.email}</span>
                    </div>
                    <i className={`pi pi-chevron-down nav-user-chevron ${userMenuOpen ? 'is-open' : ''}`} />
                </button>
                {userMenuOpen && (
                    <div className="displays-dashboard__nav-user-menu" role="menu">
                        <button type="button" className="displays-dashboard__nav-user-menu-item" role="menuitem">
                            <i className="pi pi-user" />
                            Profile
                        </button>
                        <button
                            type="button"
                            className="displays-dashboard__nav-user-menu-item displays-dashboard__nav-user-menu-item--logout"
                            role="menuitem"
                            onClick={handleLogout}
                        >
                            <i className="pi pi-sign-out" />
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default DisplayNav;
