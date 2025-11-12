import React, { forwardRef } from 'react';
import { BaseProps } from '../../types';
import { clsx } from 'clsx';

export interface VideoProps extends BaseProps {
  src: string;
  poster?: string;
  controls?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  width?: string | number;
  height?: string | number;
}

export const Video = forwardRef<HTMLVideoElement, VideoProps>(
  (
    {
      src,
      poster,
      controls = true,
      autoPlay = false,
      loop = false,
      muted = false,
      width,
      height,
      className,
      ...props
    },
    ref
  ) => (
    <video
      ref={ref}
      src={src}
      poster={poster}
      controls={controls}
      autoPlay={autoPlay}
      loop={loop}
      muted={muted}
      width={width}
      height={height}
      className={clsx('max-w-full', className)}
      {...props}
    />
  )
);

Video.displayName = 'Video';
