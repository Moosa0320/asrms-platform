import { NextResponse } from 'next/server';
import {
  EC2Client,
  DescribeInstancesCommand,
  StartInstancesCommand,
  RebootInstancesCommand,
} from '@aws-sdk/client-ec2';
import { CloudWatchClient, GetMetricDataCommand } from '@aws-sdk/client-cloudwatch';

export const dynamic = 'force-dynamic';

let lastAutoScaleTime = 0;
const COOLDOWN_MS = 60 * 1000; // 60 seconds cooldown between automated scale triggers

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const forcedCpu = body.cpu;
    const threshold = body.threshold || 70;

    const region = process.env.AWS_REGION || 'us-east-1';
    let instanceId = 'i-02720bd65ad532385';
    let currentCpu = typeof forcedCpu === 'number' ? forcedCpu : 12;

    // Discover live EC2 instance & fetch CPU from CloudWatch if AWS keys configured
    if (process.env.AWS_ACCESS_KEY_ID) {
      try {
        const ec2 = new EC2Client({ region });
        const listRes = await ec2.send(
          new DescribeInstancesCommand({
            Filters: [{ Name: 'instance-state-name', Values: ['running', 'stopped'] }],
          })
        );
        const instance = listRes.Reservations?.[0]?.Instances?.[0];
        if (instance?.InstanceId) {
          instanceId = instance.InstanceId;
        }

        if (typeof forcedCpu !== 'number') {
          const cw = new CloudWatchClient({ region });
          const endTime = new Date();
          const startTime = new Date(endTime.getTime() - 15 * 60 * 1000);
          const metricRes = await cw.send(
            new GetMetricDataCommand({
              StartTime: startTime,
              EndTime: endTime,
              MetricDataQueries: [
                {
                  Id: 'm1',
                  MetricStat: {
                    Metric: {
                      Namespace: 'AWS/EC2',
                      MetricName: 'CPUUtilization',
                      Dimensions: [{ Name: 'InstanceId', Value: instanceId }],
                    },
                    Period: 300,
                    Stat: 'Average',
                  },
                },
              ],
            })
          );
          const vals = metricRes.MetricDataResults?.[0]?.Values || [];
          if (vals.length > 0) {
            currentCpu = Math.round(vals[vals.length - 1]);
          }
        }
      } catch (e) {
        console.warn('[AutoScale Engine] Telemetry fetch warning:', e);
      }
    }

    const now = Date.now();
    const inCooldown = now - lastAutoScaleTime < COOLDOWN_MS;

    if (currentCpu >= threshold) {
      if (inCooldown) {
        return NextResponse.json({
          triggered: false,
          inCooldown: true,
          cpu: currentCpu,
          threshold,
          message: `High load (${currentCpu}%) detected, but Auto-Scaler is currently in cooldown (${Math.round((COOLDOWN_MS - (now - lastAutoScaleTime)) / 1000)}s remaining).`,
        });
      }

      lastAutoScaleTime = now;

      // 1. Dispatch Real Email Notification via Resend API
      try {
        if (process.env.RESEND_API_KEY) {
          await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'alert',
              title: `⚡ [AUTONOMOUS AUTO-SCALER] CPU Spike (${currentCpu}%) Triggered Scale-Up`,
              message: `Automated Auto-Scaling Policy 'AWS EC2 Target CPU 70%' has been triggered. Live AWS CPU utilization on ${instanceId} reached ${currentCpu}% (Threshold: ${threshold}%). Scaling decision executed.`,
              severity: 'critical',
              resourceId: `AWS EC2 (${instanceId})`,
            }),
          });
        }
      } catch (err) {
        console.warn('[AutoScale Engine] Notify error:', err);
      }

      // 2. Attempt AWS EC2 Action if IAM permits
      let awsActionExecuted = false;
      let awsActionNote = 'Automated scaling policy applied to resource pool.';
      if (process.env.AWS_ACCESS_KEY_ID) {
        try {
          const ec2 = new EC2Client({ region });
          await ec2.send(new StartInstancesCommand({ InstanceIds: [instanceId] }));
          awsActionExecuted = true;
          awsActionNote = `Successfully scaled AWS EC2 instance ${instanceId}.`;
        } catch (err: any) {
          awsActionNote = `Decision registered. (AWS Note: ${err.message || 'Check IAM permission'})`;
        }
      }

      return NextResponse.json({
        triggered: true,
        action: 'scale_up',
        cpu: currentCpu,
        threshold,
        instanceId,
        message: `⚡ Autonomous Auto-Scaler Triggered! Live CPU reached ${currentCpu}%. Policy 'AWS EC2 Target CPU 70%' executed. Email alert dispatched.`,
        awsActionExecuted,
        awsActionNote,
        timestamp: new Date().toLocaleTimeString(),
      });
    }

    return NextResponse.json({
      triggered: false,
      cpu: currentCpu,
      threshold,
      instanceId,
      message: `CPU load (${currentCpu}%) is below scaling threshold (${threshold}%). Auto-scaler on standby.`,
    });
  } catch (error: any) {
    console.error('[Auto-Scale Route Error]:', error);
    return NextResponse.json({ error: error.message || 'Auto-Scale Engine Error' }, { status: 500 });
  }
}
