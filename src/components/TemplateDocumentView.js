import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {QRCodeSVG} from 'qrcode.react';
import '../styles/TemplateDocumentView.css';
import { serverUrl } from '../Services/Constants/Constants';

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

let cachedLogoUrl = '';
let cachedLogoGroupId = '';
let logoFetchPromise = null;

const fetchMunicipalityLogoUrl = async (groupId) => {
    if (cachedLogoUrl && cachedLogoGroupId === String(groupId || '')) {
        return cachedLogoUrl;
    }
    if (logoFetchPromise) {
        return logoFetchPromise;
    }
    logoFetchPromise = (async () => {
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${sessionStorage.getItem('token')}`,
                },
            };
            const payload = { groupId: String(groupId) };
            const response = await axios.post(
                `${serverUrl}/o/settingsManagement/getMunicipalityDetails`,
                payload,
                config
            );
            const nextUrl = response?.data?.data?.logoUrl || '';
            if (nextUrl) {
                cachedLogoUrl = nextUrl;
                cachedLogoGroupId = String(groupId || '');
            }
            return cachedLogoUrl;
        } catch (error) {
            return '';
        } finally {
            logoFetchPromise = null;
        }
    })();
    return logoFetchPromise;
};

const TemplateDocumentView = ({
    title = '',
    subtitle = '',
    description = '',
    startDate = '',
    archiveDate = '',
    categoryLabel = '',
    categoryColor = '',
    linkUrl = '',
    qrValue = '',
    logoUrl = '',
    groupId = '',
    bgImageEnabled = false,
    bgImageUrl = '',
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
    const qrCodeValue = qrValue || SCAN_QR_HARDCODED_URL;
    const footerText = linkUrl || 'SCAN FOR MORE INFORMATION';
    const [resolvedLogoUrl, setResolvedLogoUrl] = useState(logoUrl || cachedLogoUrl);

    useEffect(() => {
        let isMounted = true;
        if (logoUrl) {
            setResolvedLogoUrl(logoUrl);
            return () => { isMounted = false; };
        }
        if (cachedLogoUrl && cachedLogoGroupId === String(groupId || '')) {
            setResolvedLogoUrl(cachedLogoUrl);
            return () => { isMounted = false; };
        }
        if (!groupId) {
            return () => { isMounted = false; };
        }
        fetchMunicipalityLogoUrl(groupId).then((url) => {
            if (isMounted) {
                setResolvedLogoUrl(url || '');
            }
        });
        return () => { isMounted = false; };
    }, [logoUrl, groupId]);

    return (
        <div className={`template-document ${viewMode} bg-header-${catehgoryStyle}`}>
            {bgImageEnabled && bgImageUrl ? (
                <div
                    className="template-bg-image"
                    style={{ backgroundImage: `url(${bgImageUrl})` }}
                    aria-hidden="true"
                />
            ) : null}
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
            <div className="template-logo">
                {resolvedLogoUrl ? (
                    <img src={resolvedLogoUrl} alt="Municipality logo" className="template-logo-image" />
                ) : (
                    'LOGO'
                )}
            </div>

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
                        value={qrCodeValue}
                        size={122}
                        bgColor="#ffffff"
                        fgColor="#111111"
                        level="M"
                        includeMargin={false}
                    />
                </div>
                <div className="template-footer-text">
                    {footerText}
                </div>
            </div>
        </div>
    );
};

export default TemplateDocumentView;
