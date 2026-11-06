import React from 'react';
import {
  Autocomplete,
  Box,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import PersonSearchOutlinedIcon from '@mui/icons-material/PersonSearchOutlined';
import { useT } from '../../../contexts/LanguageContext';

const CustomerInformationCard = ({
  formValues,
  onChange,
  onSelectCustomer,
  customers,
  loadingCustomers,
  selectedCustomer,
  errors,
}) => {
  const t = useT();
  return (
    <Card sx={{ borderRadius: 1, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
      <CardHeader
        title={t('sales.customerDetails', 'Customer Details')}
        sx={{
          '& .MuiCardHeader-title': {
            fontWeight: 700,
            fontSize: '1.05rem',
          },
          pb: 0,
        }}
      />
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2}>
          {/* One row: Mobile (search) · Name · Email */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
          <Autocomplete
            freeSolo
            autoHighlight
            options={customers || []}
            loading={loadingCustomers}
            // The backend already filters by mobile; don't re-filter on the client.
            filterOptions={(x) => x}
            value={selectedCustomer && selectedCustomer.mobile === formValues.customerMobile ? selectedCustomer : null}
            inputValue={formValues.customerMobile || ''}
            getOptionLabel={(option) =>
              typeof option === 'string' ? option : (option?.mobile || '')
            }
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            onInputChange={(event, value, reason) => {
              if (reason === 'input' || reason === 'clear') {
                onChange({ target: { name: 'customerMobile', value } });
              }
            }}
            onChange={(event, value) => {
              if (value && typeof value === 'object') {
                onSelectCustomer(value);
              }
            }}
            noOptionsText={
              formValues.customerMobile?.trim()
                ? t('sales.noExistingCustomer', 'No existing customer — a new one will be created')
                : t('sales.typeMobileSearch', 'Type a mobile number to search')
            }
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>{option.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.mobile}{option.email ? ` • ${option.email}` : ''}
                  </Typography>
                </Box>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('sales.mobileNumber', 'Mobile Number')}
                error={Boolean(errors.customerMobile)}
                helperText={errors.customerMobile || t('sales.mobileHelper', 'Type a mobile number to find an existing customer, or enter a new one')}
                fullWidth
                inputProps={{ ...params.inputProps, inputMode: 'numeric' }}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <PersonSearchOutlinedIcon sx={{ color: 'text.disabled', mr: 1 }} fontSize="small" />
                  ),
                  endAdornment: (
                    <>
                      {loadingCustomers ? <CircularProgress color="inherit" size={16} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                label={t('sales.customerNameCap', 'Customer Name')}
                name="customerName"
                value={formValues.customerName}
                onChange={onChange}
                error={Boolean(errors.customerName)}
                helperText={errors.customerName}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                label={t('sales.email', 'Email')}
                name="customerEmail"
                value={formValues.customerEmail}
                onChange={onChange}
                fullWidth
              />
            </Grid>
          </Grid>

          {selectedCustomer && selectedCustomer.mobile === formValues.customerMobile ? (
            <Box sx={{ px: 1.5, py: 1, borderRadius: 1, bgcolor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', border: '1px solid #A7F3D0' }}>
              <Typography sx={{ fontSize: '0.8rem', color: 'var(--theme-primary)', fontWeight: 700 }}>
                {t('sales.existingCustomerSelected', 'Existing customer selected')}
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: '#065F46' }}>
                {selectedCustomer.name} · {selectedCustomer.mobile}
              </Typography>
            </Box>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default CustomerInformationCard;
