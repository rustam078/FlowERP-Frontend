import React from 'react';
import { InputNumber } from 'antd';
import { getCurrencySymbol } from '../../utils/currency';

/**
 * App-wide currency input: a single bottom border (no box / background), the
 * configured currency symbol shown inline on the left, and no spinner arrows.
 * The symbol follows Application Settings (₹ / $ / €) via getCurrencySymbol,
 * so callers never hardcode it.
 */
const CurrencyInput = ({ style, className = '', ...props }) => (
  <InputNumber
    controls={false}
    min={0}
    prefix={<span style={{ color: '#64748B', fontWeight: 600, marginRight: 2 }}>{getCurrencySymbol()}</span>}
    className={`skr-currency-input ${className}`.trim()}
    style={{ width: '100%', ...style }}
    {...props}
  />
);

export default CurrencyInput;
