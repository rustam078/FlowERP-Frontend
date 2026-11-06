import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Link,
  Stack,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  LockOutlined as LockIcon,
  PersonOutline as PersonIcon,
  CheckroomOutlined as CheckroomIcon,
  PrecisionManufacturingOutlined as FactoryIcon,
  Inventory2Outlined as InventoryIcon,
  TrendingUpOutlined as SalesIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import axiosInstance from '../../services/axios';
import loginHero from '../../assets/login_hero.png';

const LoginPage = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyName, setCompanyName] = useState('SKR Garment');

  // Company name comes from settings (public endpoint) so the login page shows the real brand.
  useEffect(() => {
    axiosInstance.get('/settings/COMPANY_NAME')
      .then((res) => { const v = res.data?.value; if (v) setCompanyName(v); })
      .catch(() => {});
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      username: 'admin',
      password: 'admin123',
      rememberMe: true,
    },
  });

  // Calculate redirect destination
  const from = location.state?.from?.pathname || '/dashboard';

  const onSubmit = async (data) => {
    setErrorMsg('');
    setIsSubmitting(true);
    
    const result = await login(data.username, data.password);
    
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setErrorMsg(result.error || t('ui.login.invalid', 'Invalid credentials'));
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        width: '100vw',
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        overflow: 'hidden',
      }}
    >
      {/* Left Panel: Factory Illustration & Branding (60% width) */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '60%',
          p: 6,
          position: 'relative',
          overflow: 'hidden',
          color: '#FFFFFF',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Background Image with cover styling & float animation */}
        <Box
          component="img"
          src={loginHero}
          alt="Smart Garment Factory"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 1,
            transform: 'scale(1.1)',
            '@keyframes float': {
              '0%': { transform: 'scale(1.1) translateY(0px)' },
              '50%': { transform: 'scale(1.1) translateY(-15px)' },
              '100%': { transform: 'scale(1.1) translateY(0px)' },
            },
            animation: 'float 8s ease-in-out infinite',
          }}
        />

        {/* Dark overlay to ensure text readability */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, rgba(2, 6, 23, 0.85) 0%, rgba(15, 23, 42, 0.8) 60%, rgba(30, 41, 59, 0.75) 100%)',
            zIndex: 2,
          }}
        />

        {/* Decorative subtle background radial glow on top of overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: '-20%',
            left: '-10%',
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
            zIndex: 3,
          }}
        />

        {/* Left Side Header */}
        <Box sx={{ zIndex: 4 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: '10px',
                backgroundColor: 'rgba(37, 99, 235, 0.25)',
                border: '1px solid rgba(37, 99, 235, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3B82F6',
              }}
            >
              <CheckroomIcon sx={{ fontSize: 26 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '0.5px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
              {companyName}
            </Typography>
          </Stack>
        </Box>

        {/* Left Side Footer / Value Props */}
        <Box sx={{ zIndex: 4, mt: 'auto' }}>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, fontSize: '2.5rem', lineHeight: 1.2, textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
            {t('ui.login.heroTitle', 'Next-Gen Garment ERP Platform')}
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.85)', mb: 4, maxWidth: '580px', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
            {t('ui.login.heroDesc', 'Streamline your apparel production line, maintain precise real-time inventory control, and automate sales management in one unified workspace.')}
          </Typography>

          <Stack direction="row" spacing={4}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
              <FactoryIcon sx={{ color: '#3B82F6', fontSize: 20 }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{t('nav.production', 'Production')}</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
              <InventoryIcon sx={{ color: '#3B82F6', fontSize: 20 }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{t('nav.inventory', 'Inventory')}</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
              <SalesIcon sx={{ color: '#3B82F6', fontSize: 20 }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{t('ui.login.salesMgmt', 'Sales Management')}</Typography>
            </Stack>
          </Stack>
        </Box>
      </Box>

      {/* Right Panel: Login Card Area (40% width on desktop, 100% on mobile) */}
      <Box
        sx={{
          flex: 1,
          width: { xs: '100%', md: '40%' },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F8FAFC',
          p: { xs: 3, sm: 6 },
          position: 'relative',
        }}
      >
        <Card
          sx={{
            maxWidth: 460,
            width: '100%',
            borderRadius: 4,
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.08), 0 0 1px 1px rgba(15, 23, 42, 0.02)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            backgroundColor: '#FFFFFF',
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
            {/* Logo Area */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: '12px',
                  backgroundColor: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  mb: 2,
                  boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.25)',
                }}
              >
                <CheckroomIcon sx={{ fontSize: 32 }} />
              </Box>
              
              <Typography variant="h4" component="h1" align="center" sx={{ fontWeight: 800, mb: 0.5, color: '#0F172A' }}>
                {companyName}
              </Typography>
              
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {t('ui.login.tagline', 'Production • Inventory • Sales Management')}
              </Typography>
            </Box>

            {errorMsg && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
                {errorMsg}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <TextField
                margin="normal"
                fullWidth
                id="username"
                label={t('ui.login.username', 'Username')}
                placeholder="admin"
                autoComplete="email"
                autoFocus
                error={!!errors.username}
                helperText={errors.username?.message}
                {...register('username', {
                  required: t('ui.login.usernameRequired', 'Username is required'),
                })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              <TextField
                margin="normal"
                fullWidth
                label={t('ui.login.password', 'Password')}
                placeholder="admin123"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                error={!!errors.password}
                helperText={errors.password?.message}
                {...register('password', {
                  required: t('ui.login.passwordRequired', 'Password is required'),
                })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3, mt: 1 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      color="primary"
                      size="small"
                      {...register('rememberMe')}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ userSelect: 'none' }}>
                      {t('ui.login.rememberMe', 'Remember Me')}
                    </Typography>
                  }
                />
                <Link
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    textDecoration: 'none',
                    color: 'primary.main',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  {t('ui.login.forgot', 'Forgot Password?')}
                </Link>
              </Stack>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isSubmitting}
                sx={{
                  py: 1.5,
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  backgroundColor: '#2563EB',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                  '&:hover': {
                    backgroundColor: '#1D4ED8',
                    boxShadow: '0 6px 16px rgba(37, 99, 235, 0.3)',
                  },
                }}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} sx={{ color: '#ffffff' }} />
                ) : (
                  t('ui.login.login', 'Login')
                )}
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Footer Version */}
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{
            position: { xs: 'static', sm: 'absolute' },
            bottom: 24,
            mt: { xs: 4, sm: 0 },
            fontWeight: 500,
          }}
        >
          Version 1.7
        </Typography>
      </Box>
    </Box>
  );
};

export default LoginPage;
