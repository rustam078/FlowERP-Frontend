import React from 'react';
import { Segmented, Typography } from 'antd';
import { useLanguage, LANGUAGES } from '../../contexts/LanguageContext';

// Pick the app interface language (English default, Hindi). Saved per device; applies instantly.
const LanguageSettings = () => {
  const { language, setLanguage, t } = useLanguage();

  const options = LANGUAGES.map((l) => ({ label: t(l.labelKey), value: l.code }));

  return (
    <div style={{ maxWidth: 420 }}>
      <Typography.Paragraph style={{ color: '#64748B', marginBottom: 12 }}>
        {t('settings.language.desc')}
      </Typography.Paragraph>
      <Segmented
        options={options}
        value={language}
        onChange={(v) => setLanguage(v)}
        size="large"
      />
    </div>
  );
};

export default LanguageSettings;
