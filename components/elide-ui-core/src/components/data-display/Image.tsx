import React, { forwardRef, useState } from 'react';
import { ImageProps } from '../../types/components';
import { clsx } from 'clsx';

export const Image = forwardRef<HTMLImageElement, ImageProps>(
  (
    {
      src,
      alt,
      fallbackSrc,
      loading = 'lazy',
      objectFit = 'cover',
      htmlWidth,
      htmlHeight,
      className,
      ...props
    },
    ref
  ) => {
    const [imgSrc, setImgSrc] = useState(src);

    const handleError = () => {
      if (fallbackSrc) {
        setImgSrc(fallbackSrc);
      }
    };

    return (
      <img
        ref={ref}
        src={imgSrc}
        alt={alt}
        loading={loading}
        width={htmlWidth}
        height={htmlHeight}
        onError={handleError}
        className={clsx(
          {
            'object-contain': objectFit === 'contain',
            'object-cover': objectFit === 'cover',
            'object-fill': objectFit === 'fill',
            'object-none': objectFit === 'none',
            'object-scale-down': objectFit === 'scale-down'
          },
          className
        )}
        {...props}
      />
    );
  }
);

Image.displayName = 'Image';
