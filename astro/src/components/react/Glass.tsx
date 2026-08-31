import GlassSurface, { type GlassSurfaceProps } from './GlassSurface';

export type GlassProps = GlassSurfaceProps;

/** Site-tuned GlassSurface defaults for dark UI panels. */
export function Glass({
  children,
  width = 'auto',
  height = 'auto',
  borderRadius = 20,
  backgroundOpacity = 0.06,
  saturation = 1.4,
  blur = 11,
  displace = 0.7,
  className = '',
  ...rest
}: GlassProps) {
  return (
    <GlassSurface
      width={width}
      height={height}
      borderRadius={borderRadius}
      backgroundOpacity={backgroundOpacity}
      saturation={saturation}
      blur={blur}
      displace={displace}
      className={className}
      {...rest}
    >
      {children}
    </GlassSurface>
  );
}

export default Glass;
