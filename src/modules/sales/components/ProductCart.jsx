import React from 'react';
import { getCurrencySymbol } from '../../../utils/currency';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  IconButton,
  Button,
  Stack,
  CircularProgress,
  Typography,
  Paper,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useT } from '../../../contexts/LanguageContext';

const ProductCart = ({
  items,
  onProductSearch,
  productOptions,
  onProductSelect,
  onItemChange,
  onAddItem,
  onRemoveItem,
  loadingSearch,
  searchValue,
  onSearchInput,
  error,
}) => {
  const t = useT();
  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardHeader title={t('sales.productCart', 'Product Cart')} />
      <CardContent>
        <Stack spacing={3}>
          <TextField
            label={t('sales.searchProduct', 'Search product')}
            value={searchValue}
            onChange={(e) => onSearchInput(e.target.value)}
            placeholder={t('sales.typeProductNameSku', 'Type product name or SKU')}
            fullWidth
            helperText={t('sales.selectProductHint', 'Select a product to add it to the cart')}
          />
          <Box>
            {loadingSearch ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={28} />
              </Box>
            ) : (
              productOptions.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {t('sales.searchResults', 'Search results')}
                  </Typography>
                  <Stack spacing={1}>
                    {productOptions.slice(0, 4).map((option) => (
                      <Button
                        key={option.productId || option.id}
                        variant="outlined"
                        fullWidth
                        onClick={() => onProductSelect(option)}
                        sx={{ justifyContent: 'space-between' }}
                      >
                        <span>{option.productName || option.name}</span>
                        <Typography color="text.secondary">{t('sales.stock', 'Stock')} {option.availableStock ?? option.stock ?? '-'}</Typography>
                      </Button>
                    ))}
                  </Stack>
                </Box>
              )
            )}
            {error && (
              <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                {error}
              </Typography>
            )}
          </Box>

          <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('sales.product', 'Product')}</TableCell>
                  <TableCell>{t('sales.colAvailableStock', 'Available Stock')}</TableCell>
                  <TableCell>{t('sales.colQuantity', 'Quantity')}</TableCell>
                  <TableCell>{t('sales.colSellingPrice', 'Selling Price')}</TableCell>
                  <TableCell>{t('sales.discount', 'Discount')}</TableCell>
                  <TableCell>{t('sales.colLineTotal', 'Line Total')}</TableCell>
                  <TableCell align="center">{t('common.delete', 'Delete')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={item.productId || index}>
                    <TableCell>{item.productName || t('sales.selectProduct', 'Select product')}</TableCell>
                    <TableCell>{item.quantityAvailable != null ? item.quantityAvailable : '-'}</TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={item.quantity}
                        onChange={(e) => onItemChange(index, 'quantity', Number(e.target.value))}
                        inputProps={{ min: 1 }}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={item.sellingPrice}
                        onChange={(e) => onItemChange(index, 'sellingPrice', Number(e.target.value))}
                        inputProps={{ min: 0, step: 1 }}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={item.discount}
                        onChange={(e) => onItemChange(index, 'discount', Number(e.target.value))}
                        inputProps={{ min: 0, step: 0.5 }}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{getCurrencySymbol()}{((item.sellingPrice || 0) * (item.quantity || 0) - (item.discount || 0)).toFixed(2)}</TableCell>
                    <TableCell align="center">
                      <IconButton color="error" onClick={() => onRemoveItem(index)} disabled={items.length === 1}>
                        <DeleteOutlineIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Button variant="outlined" onClick={onAddItem}>
            {t('sales.addProduct', 'Add Product')}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default ProductCart;
