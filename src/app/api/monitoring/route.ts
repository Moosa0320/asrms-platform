import { NextResponse } from 'next/server';

// In a fully production environment, you would use:
// import monitoring from '@google-cloud/monitoring';
// const client = new monitoring.MetricServiceClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const resourceId = searchParams.get('resourceId') || 'unknown';

  // Check if GCP credentials exist
  const hasGcpCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (hasGcpCredentials) {
    // Real GCP Implementation (Commented out to prevent crash without SDK)
    /*
    const projectId = 'your-project-id';
    const request = {
      name: client.projectPath(projectId),
      filter: 'metric.type="compute.googleapis.com/instance/cpu/utilization"',
      interval: {
        startTime: { seconds: Date.now() / 1000 - 60 * 5, nanos: 0 },
        endTime: { seconds: Date.now() / 1000, nanos: 0 },
      },
    };
    const [timeSeries] = await client.listTimeSeries(request);
    // Parse timeseries...
    */
  }

  // Realistic fallback if no GCP credentials provided yet
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  
  // Simulate fluctuating metrics around a baseline
  const baselineCpu = 45;
  const baselineMem = 60;

  const data = {
    time: timeStr,
    cpu: Math.max(0, Math.min(100, baselineCpu + (Math.floor(Math.random() * 20) - 10))),
    memory: Math.max(0, Math.min(100, baselineMem + (Math.floor(Math.random() * 10) - 5))),
    network: 100 + Math.floor(Math.random() * 50),
    latency: 40 + Math.floor(Math.random() * 20),
    resourceId,
    source: 'GCP Monitoring API (Simulated Fallback)'
  };

  return NextResponse.json(data);
}
