const BLOCKCHAIN_API_URL = process.env.BLOCKCHAIN_API_URL || 'http://localhost:8080'

export async function GET() {
  try {
    // Proxy to BIZRA NODE0 validator attestations endpoint
    const response = await fetch(`${BLOCKCHAIN_API_URL}/api/validator/list`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`BIZRA NODE0 API returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    // Transform validator data to match PoI attestations format
    const transformedData = {
      attestations: data.validators?.map((validator: any) => ({
        id: validator.id,
        validatorId: validator.id,
        blockHash: validator.lastBlock || '0x0000...',
        timestamp: validator.lastSeen || new Date().toISOString(),
        proofOfImpact: validator.stake || 0,
        احسانScore: validator.reputation || 100.0,
        status: validator.isActive ? 'active' : 'inactive',
        networkParticipation: validator.participation || 0,
      })) || [],
      totalAttestations: data.totalValidators || 0,
      averageاحسانScore: data.averageاحسانScore || 100.0,
      networkHealth: data.networkHealth || 'healthy',
      timestamp: new Date().toISOString(),
    }

    return Response.json(transformedData, { status: 200 })
  } catch (error) {
    console.error('BIZRA NODE0 attestations API error:', error)
    return Response.json(
      {
        error: 'BIZRA NODE0 blockchain API unavailable',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    )
  }
}
