import { ImageResponse } from 'next/og';
import { getOfficialTeams } from '@/lib/kv';

export const runtime = 'nodejs';

export async function GET() {
  const teams = await getOfficialTeams();
  if (!teams || !teams.locked) {
    return new Response('No official teams available', { status: 404 });
  }

  const { teamA, teamB, generatedAt } = teams;

  const date = new Date(generatedAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const maxRows = Math.max(teamA.length, teamB.length);

  return new ImageResponse(
    (
      <div
        style={{
          width: '800px',
          height: '900px',
          background: 'linear-gradient(160deg, #0f172a 0%, #0d1f12 50%, #0f172a 100%)',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'sans-serif',
          padding: '0',
          overflow: 'hidden',
        }}
      >
        {/* Pitch lines — decorative */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: 0.04,
          }}
        >
          {/* Centre circle */}
          <div
            style={{
              width: '220px',
              height: '220px',
              border: '3px solid #fff',
              borderRadius: '50%',
            }}
          />
        </div>

        {/* Header */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: '44px',
            paddingBottom: '20px',
            gap: '6px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#22c55e',
              }}
            />
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#4ade80',
                letterSpacing: '3px',
                textTransform: 'uppercase',
              }}
            >
              Final Teams
            </span>
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#22c55e',
              }}
            />
          </div>
          <span
            style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.3)',
              letterSpacing: '1px',
            }}
          >
            {date}
          </span>
        </div>

        {/* Divider */}
        <div
          style={{
            height: '1px',
            background: 'rgba(255,255,255,0.08)',
            marginLeft: '40px',
            marginRight: '40px',
          }}
        />

        {/* Team headers */}
        <div
          style={{
            display: 'flex',
            paddingLeft: '40px',
            paddingRight: '40px',
            paddingTop: '28px',
            paddingBottom: '0px',
            gap: '20px',
          }}
        >
          {/* Team A header */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div
              style={{
                width: '5px',
                height: '28px',
                background: '#3b82f6',
                borderRadius: '3px',
              }}
            />
            <span
              style={{
                fontSize: '18px',
                fontWeight: 800,
                color: '#93c5fd',
                letterSpacing: '0.5px',
              }}
            >
              Team A
            </span>
          </div>

          {/* Team B header */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div
              style={{
                width: '5px',
                height: '28px',
                background: '#ef4444',
                borderRadius: '3px',
              }}
            />
            <span
              style={{
                fontSize: '18px',
                fontWeight: 800,
                color: '#fca5a5',
                letterSpacing: '0.5px',
              }}
            >
              Team B
            </span>
          </div>
        </div>

        {/* Player rows */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            paddingLeft: '40px',
            paddingRight: '40px',
            paddingTop: '16px',
            paddingBottom: '0px',
            gap: '20px',
          }}
        >
          {/* Team A column */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {teamA.map((name, i) => (
              <div
                key={`a-${i}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '12px',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                }}
              >
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'rgba(147,197,253,0.5)',
                    minWidth: '20px',
                  }}
                >
                  {i + 1}
                </span>
                <span
                  style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.92)',
                  }}
                >
                  {name}
                </span>
              </div>
            ))}
          </div>

          {/* Team B column */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {teamB.map((name, i) => (
              <div
                key={`b-${i}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: '12px',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                }}
              >
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'rgba(252,165,165,0.5)',
                    minWidth: '20px',
                  }}
                >
                  {i + 1}
                </span>
                <span
                  style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.92)',
                  }}
                >
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            paddingBottom: '32px',
            paddingTop: '24px',
            gap: '6px',
          }}
        >
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', letterSpacing: '1px' }}>
            ⚽ Collina · collina-web.vercel.app
          </span>
        </div>
      </div>
    ),
    {
      width: 800,
      height: 900,
    }
  );
}
