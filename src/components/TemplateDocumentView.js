import React from 'react';
import '../styles/TemplateDocumentView.css';

const formatDisplayDate = (value) => {
    if (!value) {
        return '--.--.--';
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }
    return parsed.toLocaleDateString('en-GB').replace(/\//g, '.');
};

const TemplateDocumentView = ({
    title = '',
    subtitle = '',
    description = '',
    startDate = '',
    archiveDate = '',
    linkUrl = '',
    viewMode = 'web',
}) => {
    const now = new Date();
    const timeValue = now.toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'});
    const currentDate = formatDisplayDate(startDate || now.toISOString().slice(0, 10));
    const archiveDateText = formatDisplayDate(archiveDate);
    const mainTitle = (title || 'Community').toUpperCase();
    const subTitle = (subtitle || 'Festival 2026').toUpperCase();
    const bodyText = description || 'Main text - Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

    return (
        <div className={`template-document ${viewMode}`}>
            <div className="template-top-strip">
                <div className="template-top-item">
                    <div className="template-top-label">LOCAL TIME</div>
                    <div className="template-top-value">{timeValue}</div>
                </div>
                <div className="template-top-brand">ORATOR</div>
                <div className="template-top-item align-right">
                    <div className="template-top-label">CURRENT DATE</div>
                    <div className="template-top-value">{currentDate}</div>
                </div>
            </div>

            <div className="template-badge">EVENTS</div>

            <div className="template-main">
                <h1 className="template-title">{mainTitle}</h1>
                <h2 className="template-subtitle">{subTitle}</h2>

                <div className="template-logo">LOGO</div>

                <p className="template-highlight">
                    {viewMode === 'totem' ? 'VISIT US TODAY' : 'JOIN US FOR A DAY OF FUN'}
                </p>

                <div className="template-line" />

                <p className="template-description">{bodyText}</p>

                <div className="template-dates">
                    <div className="template-date-block">
                        <span>START DATE</span>
                        <strong>{currentDate}</strong>
                    </div>
                    <div className="template-date-block">
                        <span>ARCHIVE DATE</span>
                        <strong>{archiveDateText}</strong>
                    </div>
                </div>
            </div>

            <div className="template-footer">
                <div className="template-qr">
                    <div className="qr-dot" />
                    <div className="qr-dot" />
                    <div className="qr-dot" />
                    <div className="qr-dot" />
                    <div className="qr-dot" />
                    <div className="qr-dot" />
                    <div className="qr-dot" />
                    <div className="qr-dot" />
                    <div className="qr-dot" />
                </div>
                <div className="template-footer-text">
                    {linkUrl ? `"${linkUrl}"` : '"SCAN FOR MORE INFORMATION"'}
                </div>
            </div>
        </div>
    );
};

export default TemplateDocumentView;
