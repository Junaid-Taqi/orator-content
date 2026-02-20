import React, { useRef, useState, useEffect } from 'react';
import '../styles/DisplaysDashboard.css'; // Path check kar lein apne structure ke hisaab se
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp, faUser, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";

const DisplayNav = ({ user }) => {
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);

    // Click outside to close menu logic
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
                        <span className="nav-user-name">{user?.fullName || "User Name"}</span>
                        <span className="nav-user-email">{user?.email || "user@email.com"}</span>
                    </div>

                    {/* Toggle Arrow Logic */}
                    <div className="nav-user-chevron-box">
                        <FontAwesomeIcon
                            icon={userMenuOpen ? faChevronUp : faChevronDown}
                            className="nav-user-chevron"
                        />
                    </div>
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                    <div className="displays-dashboard__nav-user-menu" role="menu">
                        <button type="button" className="displays-dashboard__nav-user-menu-item" role="menuitem">
                            <FontAwesomeIcon icon={faUser} style={{marginRight: '10px'}} />
                            Profile
                        </button>
                        <button
                            type="button"
                            className="displays-dashboard__nav-user-menu-item displays-dashboard__nav-user-menu-item--logout"
                            role="menuitem"
                            onClick={handleLogout}
                        >
                            <FontAwesomeIcon icon={faSignOutAlt} style={{marginRight: '10px'}} />
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default DisplayNav;