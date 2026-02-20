import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/CategorySelector.css';
import { serverUrl } from '../Services/Constants/Constants';

const colorToHex = {
  blue: '#3b82f6',
  purple: '#8b5cf6',
  orange: '#f59e0b',
  green: '#22c55e',
  red: '#ef4444',
};

const CategorySelector = ({ onSelectCategory, onBack, user }) => {
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchActiveContentPools = async () => {
      const groupId = user?.groups?.[0]?.id;
      if (!groupId) {
        setError('Group not found for current user.');
        return;
      }

      setStatus('loading');
      setError('');

      try {
        const config = {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionStorage.getItem('token')}`,
          },
        };

        const payload = { groupId: String(groupId) };
        const response = await axios.post(
          `${serverUrl}/o/contentPoolApplication/getAllActiveContentPool`,
          payload,
          config
        );

        if (!response.data?.success) {
          setStatus('failed');
          setError(response.data?.message || 'Unable to load categories.');
          return;
        }

        const mapped = (response.data?.data || []).map((pool) => ({
          id: String(pool.contentPoolId),
          title: pool.name,
          color: pool.color,
          description: pool.description,
        }));

        setCategories(mapped);
        setStatus('succeeded');
      } catch (err) {
        setStatus('failed');
        setError(err?.response?.data?.message || err.message || 'Unable to load categories.');
      }
    };

    fetchActiveContentPools();
  }, [user]);

  const renderGridContent = () => {
    if (status === 'loading') {
      return <div className="category-name">Loading active categories...</div>;
    }

    if (status === 'failed') {
      return <div className="category-name">{error}</div>;
    }

    if (!categories.length) {
      return <div className="category-name">No active categories found.</div>;
    }

    return categories.map((c) => {
      const dotColor = colorToHex[String(c.color || '').toLowerCase()] || '#94a3b8';
      const titleText = String(c.title || '');
      const emojiMatch = titleText.match(
        /(\p{Extended_Pictographic}(?:\uFE0F)?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F)?)*)/u
      );
      const leadingEmoji = emojiMatch ? emojiMatch[0] : '';
      const cleanTitle = titleText
        .replace(/(\p{Extended_Pictographic}(?:\uFE0F)?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F)?)*)/gu, '')
        .trim();
      return (
        <div
          key={c.id}
          className="category-card"
          onClick={() => onSelectCategory(c)}
        >
          <div className="category-icon" style={{ color: dotColor }}>{leadingEmoji || '•'}</div>
          <div className="category-name">{cleanTitle || c.title}</div>
        </div>
      );
    });
  };

  return (
    <div className="category-selector">
      <h2 className="category-title">Select Category</h2>
      <p className="category-desc">Choose the category for your slide. The template will be based on the category you select.</p>

      <div className="category-grid">
        {renderGridContent()}
      </div>

      <div className="category-actions">
        <button className="back-btn" onClick={onBack}>Back</button>
      </div>
    </div>
  );
};

export default CategorySelector;
