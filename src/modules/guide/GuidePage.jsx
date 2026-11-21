import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Card, List, ListItemButton, ListItemText, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePermissions } from '../../hooks/usePermissions';
import { GUIDE_SECTIONS } from './guideSections';
import { GuideFlow, GuideScreenshot, PartTitle } from './GuideParts';
import en from './text/en';
import hi from './text/hi';
import hinglish from './text/hinglish';

const TEXTS = { en, hi, hinglish };
const LANG_KEY = 'flowerp_guide_lang';

// Guide language is the reader's own choice (independent of the app language setting).
const initialLang = (appLanguage) => {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && TEXTS[saved]) return saved;
  } catch { /* storage unavailable */ }
  return appLanguage === 'hi' ? 'hi' : 'en';
};

/** One section: what the screen is for, annotated screenshots, how-to steps, flow and tips. */
const GuideSection = ({ section, text, ui }) => (
  <Box>
    <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A' }}>{text.title}</Typography>
    <PartTitle>{ui.whatIsIt}</PartTitle>
    <Typography sx={{ color: '#334155', fontSize: '0.95rem', maxWidth: 760 }}>{text.intro}</Typography>
    <Typography variant="caption" sx={{ display: 'block', color: '#94A3B8', mt: 2, mb: 1 }}>{ui.screenshotHint}</Typography>
    {section.shots.map((shot, i) => <GuideScreenshot key={shot.src} shot={shot} legend={text.legends?.[i]} />)}
    <PartTitle>{ui.howTo}</PartTitle>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
      {text.tasks.map((task) => (
        <Card key={task.title} sx={{ p: 2, boxShadow: 'none', border: '1px solid #E2E8F0', borderRadius: 2 }}>
          <Typography sx={{ fontWeight: 700, mb: 1, color: '#0F172A' }}>{task.title}</Typography>
          <Box component="ol" sx={{ m: 0, pl: 2.5, color: '#334155', fontSize: '0.88rem', '& li': { mb: 0.5 } }}>
            {task.steps.map((step) => <li key={step}>{step}</li>)}
          </Box>
        </Card>
      ))}
    </Box>
    {section.flow && text.flow ? (<><PartTitle>{ui.flow}</PartTitle><GuideFlow steps={text.flow} /></>) : null}
    {text.tips?.length ? (
      <>
        <PartTitle>{ui.tips}</PartTitle>
        <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#FFFBEB', border: '1px solid #FDE68A' }}>
          <Box component="ul" sx={{ m: 0, pl: 2.5, color: '#78350F', fontSize: '0.88rem', '& li': { mb: 0.5 } }}>
            {text.tips.map((tip) => <li key={tip}>{tip}</li>)}
          </Box>
        </Box>
      </>
    ) : null}
  </Box>
);

/** User Guide: short static help for every screen the user can open, in English, Hindi or Hinglish. */
const GuidePage = () => {
  const { language } = useLanguage();
  const { can } = usePermissions();
  const [params, setParams] = useSearchParams();
  const [lang, setLang] = useState(() => initialLang(language));
  const sections = useMemo(() => GUIDE_SECTIONS.filter((s) => s.module === 'always' || can(s.module, 'view')), [can]);
  const active = sections.find((s) => s.key === params.get('section')) || sections[0];
  const texts = TEXTS[lang];

  const changeLang = (_, value) => {
    if (!value) return;
    setLang(value);
    try { localStorage.setItem(LANG_KEY, value); } catch { /* storage unavailable */ }
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
            <MenuBookOutlinedIcon sx={{ color: 'var(--theme-primary)' }} /> {texts.ui.title}
          </Typography>
          <Typography sx={{ color: '#64748B', fontSize: '0.9rem' }}>{texts.ui.subtitle}</Typography>
        </Box>
        <ToggleButtonGroup size="small" exclusive value={lang} onChange={changeLang} aria-label={texts.ui.language}>
          <ToggleButton value="en" sx={{ px: 2, fontWeight: 700 }}>English</ToggleButton>
          <ToggleButton value="hi" sx={{ px: 2, fontWeight: 700 }}>हिंदी</ToggleButton>
          <ToggleButton value="hinglish" sx={{ px: 2, fontWeight: 700 }}>Hinglish</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '220px 1fr' }, gap: 3, alignItems: 'start' }}>
        <Card sx={{ boxShadow: 'none', border: '1px solid #E2E8F0', borderRadius: 2, position: { md: 'sticky' }, top: { md: 88 } }}>
          <List dense disablePadding>
            {sections.map((s) => (
              <ListItemButton key={s.key} selected={s.key === active?.key} onClick={() => setParams({ section: s.key })}
                sx={{ '&.Mui-selected': { bgcolor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', color: 'var(--theme-primary)', fontWeight: 700 } }}>
                <ListItemText primary={texts[s.key].title} primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: s.key === active?.key ? 700 : 500 }} />
              </ListItemButton>
            ))}
          </List>
        </Card>
        <Card sx={{ p: { xs: 2, md: 3 }, boxShadow: 'none', border: '1px solid #E2E8F0', borderRadius: 2 }}>
          {active ? <GuideSection section={active} text={texts[active.key]} ui={texts.ui} /> : null}
        </Card>
      </Box>
    </Box>
  );
};

export default GuidePage;
