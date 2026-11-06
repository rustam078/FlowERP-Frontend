import React, { useState } from 'react';
import { productService } from '../../services/productService';
import { getProductIconAndLabel, getProductIcon } from '../../utils/product-icons';

/**
 * Shows a product's uploaded image as a small thumbnail next to its name.
 * Falls back to the emoji icon + name when there is no image (or it fails to load).
 */
const ProductLabel = ({ productId, iconName, name, hasImage, size = 22, nameStyle, round = false, borderColor }) => {
  const [failed, setFailed] = useState(false);
  const showImage = !!productId && hasImage !== false && !failed;

  if (!showImage) {
    // No image → profile-style emoji badge (when round) so it matches the image look.
    if (round) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{
            width: size, height: size, borderRadius: '50%', flexShrink: 0,
            border: `2px solid ${borderColor || '#E2E8F0'}`, background: '#fff',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: size * 0.55, lineHeight: 1,
          }}>
            {getProductIcon(iconName, name || 'Product')}
          </span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', ...nameStyle }}>{name || 'Product'}</span>
        </span>
      );
    }
    // Otherwise keep the existing inline emoji + name look.
    return <span style={nameStyle}>{getProductIconAndLabel(iconName, name || 'Product')}</span>;
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
      <img
        src={productService.imageUrl(productId)}
        onError={() => setFailed(true)}
        alt=""
        style={{
          width: size, height: size, borderRadius: round ? '50%' : 6, objectFit: 'cover',
          flexShrink: 0, border: `2px solid ${borderColor || '#E2E8F0'}`, background: '#fff',
        }}
      />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', ...nameStyle }}>{name || 'Product'}</span>
    </span>
  );
};

/**
 * Image-only thumbnail. Shows the product image if present, otherwise renders `fallback`
 * (e.g. an existing icon box). Keeps custom layouts intact.
 */
export const ProductThumb = ({ productId, hasImage, size = 30, fallback = null, radius = 6 }) => {
  const [failed, setFailed] = useState(false);
  if (!productId || hasImage === false || failed) return fallback;
  return (
    <img
      src={productService.imageUrl(productId)}
      onError={() => setFailed(true)}
      alt=""
      style={{ width: size, height: size, borderRadius: radius, objectFit: 'cover', flexShrink: 0, border: '1px solid #E2E8F0', background: '#fff' }}
    />
  );
};

export default ProductLabel;
