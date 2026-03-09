import React from 'react';
import {QRCodeSVG} from 'qrcode.react';
import '../styles/TemplateDocumentView.css';

const formatDisplayDate = (value) => {
    if (!value) {
        return '--.--';
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }
    return parsed.toLocaleDateString('en-GB', {day: '2-digit', month: '2-digit'}).replace(/\//g, '.');
};

const TemplateDocumentView = ({
    title = '',
    subtitle = '',
    description = '',
    startDate = '',
    archiveDate = '',
    categoryLabel = '',
    categoryColor = '',
    viewMode = 'web',
}) => {
    const SCAN_QR_HARDCODED_URL = 'https://orator.hr/';
    const now = new Date();
    const timeValue = now.toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'});
    const topCurrentDate = formatDisplayDate(now);
    const currentDate = formatDisplayDate(startDate);
    const archiveDateText = formatDisplayDate(archiveDate);
    const mainTitle = (title || 'Title');
    const subTitle = (subtitle || 'Sub Title');
    const bodyText = description || 'Description';
    const badgeText = (categoryLabel || 'Events').toUpperCase();
    const catehgoryStyle = categoryColor.toLowerCase();

    return (
        <div className={`template-document ${viewMode} bg-header-${catehgoryStyle}`}>
            <div className="template-top-strip">
                <div className="template-top-item">
                    <div className="template-top-label">LOCAL TIME</div>
                    <div className="template-top-value">{timeValue}</div>
                </div>
                <div className="template-badge">{badgeText}</div>
                <div className="template-top-item align-right">
                    <div className="template-top-label">CURRENT DATE</div>
                    <div className="template-top-value">{topCurrentDate}</div>
                </div>
            </div>

            <div className="template-divider" />
            <div className="template-logo">LOGO</div>

            <div className="template-main">
                <div>
                    <h1 className="template-title">{mainTitle}</h1>
                    <h2 className="template-subtitle">{subTitle}</h2>
                    <p className="template-description">{bodyText}</p>
                </div>

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
                    <QRCodeSVG
                        value={SCAN_QR_HARDCODED_URL}
                        size={122}
                        bgColor="#ffffff"
                        fgColor="#111111"
                        level="M"
                        includeMargin={false}
                    />
                </div>
                <div className="template-footer-text">
                    "SCAN FOR MORE INFORMATION"
                </div>
            </div>
        </div>
    );
};

export default TemplateDocumentView;
