const BLOCKCHAIN_API_URL = process.env.BLOCKCHAIN_API_URL || 'http://localhost:8080'

export async function GET() {
  try {
    // Proxy to BIZRA NODE0 consensus tipset endpoint
    const response = await fetch(`${BLOCKCHAIN_API_URL}/api/consensus/tipset`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`BIZRA NODE0 API returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    // Transform tipset data to match UI expectations
    const transformedData = {
      blocks: data.blocks || [],
      height: data.height || 0,
      timestamp: data.timestamp || new Date().toISOString(),
      totalWeight: data.totalWeight || 0,
      minerPower: data.minerPower || 0,
      networkPower: data.networkPower || 1,
      blockCount: data.blockCount || 0,
      gasUsed: data.gasUsed || 0,
      gasLimit: data.gasLimit || 0,
      baseFee: data.baseFee || 0,
      احسانScore: data.احسانScore || 100.0,
    }

    return Response.json(transformedData, { status: 200 })
  } catch (error) {
    console.error('BIZRA NODE0 tipset API error:', error)
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
