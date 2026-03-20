import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0d1416',
          color: '#52dad3',
          fontSize: 20,
          fontWeight: 700,
          fontFamily:
            'ui-rounded, system-ui, -apple-system, Segoe UI, sans-serif',
        }}
      >
        F
      </div>
    ),
    { ...size },
  )
}
