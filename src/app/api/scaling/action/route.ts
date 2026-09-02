import { NextResponse } from 'next/server';
import {
  EC2Client,
  DescribeInstancesCommand,
  StartInstancesCommand,
  StopInstancesCommand,
  RebootInstancesCommand,
} from '@aws-sdk/client-ec2';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action; // 'start' | 'stop' | 'reboot' | 'scale_up' | 'scale_down'
    const role = body.role || 'viewer';

    if (role === 'viewer' || role === 'developer' || role === 'pending') {
      return NextResponse.json(
        { error: 'Permission Denied: Only Operator, Admin, or Super Admin can execute AWS Cloud Scaling actions.' },
        { status: 403 }
      );
    }

    if (!process.env.AWS_ACCESS_KEY_ID) {
      return NextResponse.json(
        { error: 'AWS Credentials not configured on Vercel platform.' },
        { status: 400 }
      );
    }

    const region = process.env.AWS_REGION || 'us-east-1';
    const ec2 = new EC2Client({ region });

    // Discover target EC2 instance
    const listRes = await ec2.send(
      new DescribeInstancesCommand({
        Filters: [{ Name: 'instance-state-name', Values: ['running', 'stopped'] }],
      })
    );

    const instance = listRes.Reservations?.[0]?.Instances?.[0];
    if (!instance || !instance.InstanceId) {
      return NextResponse.json(
        { error: 'No AWS EC2 instance found in region ' + region },
        { status: 404 }
      );
    }

    const instanceId = instance.InstanceId;
    let message = '';

    if (action === 'start' || action === 'scale_up') {
      await ec2.send(new StartInstancesCommand({ InstanceIds: [instanceId] }));
      message = `Successfully issued START command to AWS EC2 Instance (${instanceId}). Server booting up.`;
    } else if (action === 'stop' || action === 'scale_down') {
      await ec2.send(new StopInstancesCommand({ InstanceIds: [instanceId] }));
      message = `Successfully issued STOP command to AWS EC2 Instance (${instanceId}). Server shutting down.`;
    } else if (action === 'reboot') {
      await ec2.send(new RebootInstancesCommand({ InstanceIds: [instanceId] }));
      message = `Successfully issued REBOOT command to AWS EC2 Instance (${instanceId}). Server rebooting.`;
    } else {
      return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action,
      instanceId,
      region,
      message,
      executedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[AWS Scaling Action] Error:', err);
    let errMsg = err.message || 'AWS Action Failed';
    if (err.name === 'UnauthorizedOperation' || errMsg.includes('is not authorized')) {
      errMsg = `AWS IAM Permission Required: Your AWS IAM user 'asrms' needs 'AmazonEC2FullAccess' (or ec2:StartInstances/StopInstances/RebootInstances permissions) attached in the AWS IAM Console to execute live EC2 power commands.`;
    }
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
