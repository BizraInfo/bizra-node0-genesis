const BLOCKCHAIN_API_URL = process.env.BLOCKCHAIN_API_URL || 'http://localhost:8080'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Transform block data to match BIZRA NODE0 consensus API format
    const transformedBody = {
      transactions: body.transactions || [],
      proposer: body.proposer || 'unknown',
      timestamp: body.timestamp || new Date().toISOString(),
      parentHash: body.parentHash || '0x0000000000000000000000000000000000000000000000000000000000000000',
      qc: body.qc || null,
      احسانScore: body.احسانScore || 100.0,
    }

    // Proxy to BIZRA NODE0 consensus block submission endpoint
    const response = await fetch(`${BLOCKCHAIN_API_URL}/api/consensus/block/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transformedBody),
    })

    if (!response.ok) {
      throw new Error(`BIZRA NODE0 API returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    // Transform response to match UI expectations
    const transformedResponse = {
      success: true,
      blockHash: data.blockHash || 'pending',
      blockHeight: data.blockHeight || 0,
      timestamp: data.timestamp || new Date().toISOString(),
      status: data.status || 'submitted',
      احسانScore: data.احسانScore || 100.0,
      transactionCount: transformedBody.transactions.length,
    }

    return Response.json(transformedResponse, { status: 200 })
  } catch (error) {
    console.error('BIZRA NODE0 submit block API error:', error)
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
