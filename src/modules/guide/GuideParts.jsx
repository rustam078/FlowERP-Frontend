import React from 'react';
import { Box, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// Numbered circle used on screenshots and in their legend.
export const Marker = ({ n, sx }) => (
  <Box sx={{
    width: 24, height: 24, borderRadius: '50%', bgcolor: '#DC2626', color: '#fff', fontWeight: 800, fontSize: '0.75rem',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 3px rgba(220,38,38,0.25)', flexShrink: 0, ...sx,
  }}>
    {n}
  </Box>
);

/** Screenshot with numbered markers (positions in %), and the matching numbered explanation list. */
export const GuideScreenshot = ({ shot, legend }) => (
  <Box sx={{ mb: 3 }}>
    <Box sx={{ position: 'relative', border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 16px rgba(15,23,42,0.08)' }}>
      <Box component="img" src={shot.src} alt="" loading="lazy" sx={{ display: 'block', width: '100%', height: 'auto' }} />
      {shot.markers.map(([x, y], i) => (
        <Marker key={i} n={i + 1} sx={{ position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }} />
      ))}
    </Box>
    <Box component="ol" sx={{ listStyle: 'none', p: 0, m: 0, mt: 1.5, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1 }}>
      {(legend || []).map((text, i) => (
        <Box component="li" key={i} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', fontSize: '0.88rem', color: '#334155' }}>
          <Marker n={i + 1} />
          <span>{text}</span>
        </Box>
      ))}
    </Box>
  </Box>
);

/** Simple left-to-right flow diagram (wraps on small screens). */
export const GuideFlow = ({ steps }) => (
  <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
    {steps.map((step, i) => (
      <React.Fragment key={step}>
        <Box sx={{
          px: 1.75, py: 1, borderRadius: 2, fontWeight: 700, fontSize: '0.85rem',
          bgcolor: 'color-mix(in srgb, var(--theme-primary) 10%, white)', color: 'var(--theme-primary)',
          border: '1px solid color-mix(in srgb, var(--theme-primary) 30%, white)',
        }}>
          {step}
        </Box>
        {i < steps.length - 1 ? <ArrowForwardIcon sx={{ color: '#94A3B8' }} /> : null}
      </React.Fragment>
    ))}
  </Box>
);

/** Heading for one part of a section. */
export const PartTitle = ({ children }) => (
  <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1, mt: 3 }}>
    {children}
  </Typography>
);
