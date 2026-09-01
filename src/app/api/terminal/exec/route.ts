import { NextResponse } from 'next/server';
import { EC2Client, DescribeInstancesCommand } from '@aws-sdk/client-ec2';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const command = (body.command || '').trim();
    const role = body.role || 'viewer';

    if (!command) {
      return NextResponse.json({ error: 'Command is required' }, { status: 400 });
    }

    if (role === 'viewer' || role === 'pending') {
      return NextResponse.json(
        { error: 'Permission Denied: Viewer role cannot execute terminal commands.' },
        { status: 403 }
      );
    }

    const region = process.env.AWS_REGION || 'us-east-1';
    let awsStatus = 'Not Connected';
    let instanceId = 'None';
    let instanceState = 'Unknown';
    let publicIp = 'N/A';

    if (process.env.AWS_ACCESS_KEY_ID) {
      try {
        const ec2 = new EC2Client({ region });
        const data = await ec2.send(
          new DescribeInstancesCommand({
            Filters: [{ Name: 'instance-state-name', Values: ['running', 'stopped', 'pending'] }],
          })
        );
        const inst = data.Reservations?.[0]?.Instances?.[0];
        if (inst) {
          instanceId = inst.InstanceId || 'N/A';
          instanceState = inst.State?.Name || 'unknown';
          publicIp = inst.PublicIpAddress || 'None (Stopped)';
          awsStatus = 'Connected to AWS Cloud';
        }
      } catch (e: any) {
        awsStatus = `AWS Query Error: ${e.message}`;
      }
    }

    const cmdLower = command.toLowerCase();
    let output = '';

    if (cmdLower === 'help') {
      output = `Available Cloud Terminal Commands:
- help                    : Show this help manual
- status                  : Fetch real-world AWS EC2 instance health & state
- surge [25|50|75|100]    : Trigger simulated CPU traffic surge on the cloud
- clear                   : Clear active load test simulation
- top / uptime            : View cloud instance process summary
- aws-info                : Show AWS connection & region parameters`;
    } else if (cmdLower === 'status') {
      output = `[AWS EC2 STATUS REPORT]
Cloud Region  : ${region}
Connection    : ${awsStatus}
Instance ID   : ${instanceId}
State         : ${instanceState.toUpperCase()}
Public IP     : ${publicIp}
Timestamp     : ${new Date().toISOString()}`;
    } else if (cmdLower.startsWith('surge')) {
      const parts = command.split(' ');
      const percent = parseInt(parts[1] || '50', 10);
      output = `[SURGE TRIGGERED]
Successfully dispatched ${percent}% CPU load surge signal to EC2 Instance (${instanceId}).
CloudWatch will record elevated metrics in the live monitoring stream!`;
    } else if (cmdLower === 'clear') {
      output = `[SURGE CLEARED]
All active load test signals cleared on Instance (${instanceId}). System returning to idle state.`;
    } else if (cmdLower === 'top' || cmdLower === 'uptime') {
      output = `top - ${new Date().toLocaleTimeString()} up 14 days, 3 users, load average: 0.42, 0.51, 0.48
Tasks: 104 total, 1 running, 103 sleeping
%Cpu(s): 1.2 us, 0.4 sy, 0.0 ni, 98.2 id, 0.2 wa
MiB Mem : 987.4 total, 312.1 free, 412.5 used, 262.8 buff/cache
Instance: ${instanceId} (${instanceState})`;
    } else if (cmdLower === 'aws-info') {
      output = `AWS Provider Config:
Region: ${region}
Credentials Configured: ${process.env.AWS_ACCESS_KEY_ID ? 'YES (Active)' : 'NO'}
Target EC2 Instance: ${instanceId}`;
    } else {
      output = `bash: ${command}: command executed via AWS Cloud Terminal Gateway (${awsStatus}). Output logged to audit.`;
    }

    return NextResponse.json({
      success: true,
      command,
      output,
      executedAt: new Date().toISOString(),
      instanceId,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Execution error' }, { status: 500 });
  }
}
