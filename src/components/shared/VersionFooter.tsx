'use client';
import packageJson from '../../../package.json';

export function VersionFooter() {
  return (
    <p className="font-label text-on-surface-variant/40 text-[0.6rem] uppercase tracking-widest">
      Version {packageJson.version} • Deep Flow Encrypted
    </p>
  );
}
