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

const parseDateValue = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
    return null;
};

const normalizeEventDateItems = (dates = []) => dates.map((item) => {
    if (typeof item === 'string') {
        return { date: item, label: '' };
    }
    if (item && typeof item === 'object') {
        return { date: item.date || '', label: item.label || '' };
    }
    return { date: '', label: '' };
});

const getNextEventDates = (dates, maxCount = 2) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const parsed = normalizeEventDateItems(dates || [])
        .map((d) => ({ ...d, parsed: parseDateValue(d.date) }))
        .filter((d) => d.parsed)
        .sort((a, b) => a.parsed.getTime() - b.parsed.getTime());
    if (!parsed.length) return [];
    const upcoming = parsed.filter((d) => d.parsed.getTime() >= today.getTime());
    const pool = upcoming.length ? upcoming : parsed;
    return pool.slice(0, maxCount).map((d) => ({ date: d.date, label: d.label }));
};

const MAX_MULTIPLE_EVENT_DATES = 8;

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
    hideLogo = false,
    eventEnabled = false,
    eventMode = 1,
    eventStartDate = '',
    eventEndDate = '',
    eventDates = [],
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
    const bodyLines = bodyText.split(/\r?\n/);
    const badgeText = (categoryLabel || 'Events').toUpperCase();
    const catehgoryStyle = categoryColor.toLowerCase();
    const qrCodeValue = qrValue || SCAN_QR_HARDCODED_URL;
    const footerText = linkUrl || 'SCAN FOR MORE INFORMATION';
    const [resolvedLogoUrl, setResolvedLogoUrl] = useState(logoUrl || cachedLogoUrl);
    const normalizedEventMode = Number(eventMode || 1);
    const normalizedEventDates = Array.isArray(eventDates) ? eventDates : [];
    const multipleEventDates = normalizedEventMode === 3
        ? getNextEventDates(normalizedEventDates, MAX_MULTIPLE_EVENT_DATES)
        : [];
    const isMultipleEventMode = eventEnabled && normalizedEventMode === 3;

    const eventDisplay = (() => {
        if (!eventEnabled) {
            return {
                leftLabel: viewMode === 'totem' ? '' : 'START DATE',
                leftValue: viewMode === 'totem' ? '' : currentDate,
                rightLabel: viewMode === 'totem' ? '' : 'ARCHIVE DATE',
                rightValue: viewMode === 'totem' ? '' : archiveDateText,
            };
        }

        if (normalizedEventMode === 2) {
            return {
                leftLabel: 'EVENT START',
                leftValue: formatDisplayDate(eventStartDate),
                rightLabel: 'EVENT END',
                rightValue: formatDisplayDate(eventEndDate),
            };
        }

        if (normalizedEventMode === 3) {
            return {
                leftLabel: 'EVENT DATE',
                leftValue: multipleEventDates[0] ? formatDisplayDate(multipleEventDates[0].date) : '--.--',
                rightLabel: '',
                rightValue: '',
            };
        }

        return {
            leftLabel: 'EVENT DATE',
            leftValue: formatDisplayDate(eventStartDate),
            rightLabel: '',
            rightValue: '',
        };
    })();

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
                <img
                    className="template-bg-image"
                    src={bgImageUrl}
                    alt=""
                    aria-hidden="true"
                />
            ) : null}
            <div className="template-top-strip">
                {/* <div className="template-top-item">
                    <div className="template-top-label">LOCAL TIME</div>
                    <div className="template-top-value">{timeValue}</div>
                </div> */}
                <div className="template-badge">{badgeText}</div>
                {/* <div className="template-top-item align-right">
                    <div className="template-top-label">CURRENT DATE</div>
                    <div className="template-top-value">{topCurrentDate}</div>
                </div> */}
            </div>

            <div className="template-divider" />
            <div className="template-logo">
                {!hideLogo && resolvedLogoUrl ? (
                    <img src={resolvedLogoUrl} alt="Municipality logo" className="template-logo-image" />
                ) : (
                    'LOGO'
                )}
            </div>

            <div className="template-main">
                <div>
                    <h1 className="template-title">{mainTitle}</h1>
                    <h2 className="template-subtitle">{subTitle}</h2>
                    <p className="template-description">
                        {bodyLines.map((line, index) => (
                            <React.Fragment key={`desc-line-${index}`}>
                                {line}
                                {index < bodyLines.length - 1 ? <br /> : null}
                            </React.Fragment>
                        ))}
                    </p>
                </div>

                <div className={`template-dates ${isMultipleEventMode ? 'multiple' : ''}`}>
                    {isMultipleEventMode ? (
                        (multipleEventDates.length ? multipleEventDates : [{ date: '', label: '' }]).map((eventItem, index) => (
                            <div key={`event-date-${index}`} className="template-date-block">
                                <span>{eventItem.label || `EVENT DATE ${index + 1}`}</span>
                                <strong>{eventItem.date ? formatDisplayDate(eventItem.date) : '--.--'}</strong>
                            </div>
                        ))
                    ) : (
                        <>
                            <div className="template-date-block">
                                <span>{eventDisplay.leftLabel}</span>
                                <strong>{eventDisplay.leftValue}</strong>
                            </div>
                            {eventDisplay.rightLabel ? (
                                <div className="template-date-block">
                                    <span>{eventDisplay.rightLabel}</span>
                                    <strong>{eventDisplay.rightValue}</strong>
                                </div>
                            ) : null}
                        </>
                    )}
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
