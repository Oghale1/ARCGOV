import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'ArcGov — Arc Blockchain Governance'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0F1117',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '24px',
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: '#1D9E75',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '28px',
            fontWeight: '700',
          }}>A</div>
          <span style={{
            color: 'white',
            fontSize: '48px',
            fontWeight: '700',
          }}>ArcGov</span>
        </div>
        <div style={{
          color: '#9CA3AF',
          fontSize: '24px',
          marginBottom: '12px',
        }}>Arc Blockchain Governance Dashboard</div>
        <div style={{
          color: '#1D9E75',
          fontSize: '20px',
        }}>Vote · Validate · Govern</div>
        <div style={{
          color: '#6B7280',
          fontSize: '16px',
          marginTop: '24px',
        }}>arcgov.vercel.app</div>
      </div>
    ),
    { ...size }
  )
}
