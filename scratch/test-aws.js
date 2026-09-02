const { EC2Client, DescribeInstancesCommand } = require('@aws-sdk/client-ec2');
const { CloudWatchClient, GetMetricStatisticsCommand } = require('@aws-sdk/client-cloudwatch');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let val = match[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
});

async function test() {
  const region = env.AWS_REGION || 'us-east-1';
  const credentials = {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  };
  console.log('Region:', region);
  console.log('AccessKey:', credentials.accessKeyId);

  const ec2 = new EC2Client({ region, credentials });
  const cw = new CloudWatchClient({ region, credentials });

  try {
    const res = await ec2.send(new DescribeInstancesCommand({}));
    console.log('Reservations count:', res.Reservations?.length);
    const instances = [];
    res.Reservations?.forEach((r) => {
      r.Instances?.forEach((i) => {
        instances.push({ id: i.InstanceId, state: i.State?.Name, type: i.InstanceType, name: i.Tags?.find(t => t.Key === 'Name')?.Value });
      });
    });
    console.log('Instances found:', instances);

    if (instances.length > 0) {
      const targetId = instances[0].id;
      console.log('Testing CloudWatch for target:', targetId);
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 2 * 60 * 60 * 1000); // last 2 hours
      const cwRes = await cw.send(new GetMetricStatisticsCommand({
        Namespace: 'AWS/EC2',
        MetricName: 'CPUUtilization',
        Dimensions: [{ Name: 'InstanceId', Value: targetId }],
        StartTime: startTime,
        EndTime: endTime,
        Period: 300,
        Statistics: ['Average', 'Maximum'],
      }));
      console.log('CloudWatch Datapoints count:', cwRes.Datapoints?.length);
      console.log('CloudWatch Datapoints:', cwRes.Datapoints);
    }
  } catch (err) {
    console.error('AWS Error:', err);
  }
}

test();
