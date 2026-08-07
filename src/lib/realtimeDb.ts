import { onValue, ref } from "firebase/database";
import { isFirebaseConfigured, rtdb } from "./firebase";
import { metricSeries } from "./mockData";

export type MetricPoint = (typeof metricSeries)[number];

export function subscribeToMetrics(
  resourceId: string,
  callback: (points: MetricPoint[]) => void,
) {
  if (!isFirebaseConfigured || !rtdb) {
    callback(metricSeries);
    const timer = window.setInterval(() => {
      const last = metricSeries[metricSeries.length - 1];
      callback([
        ...metricSeries.slice(1),
        {
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          cpu: Math.max(30, Math.min(96, last.cpu + Math.round(Math.random() * 14 - 7))),
          memory: Math.max(30, Math.min(92, last.memory + Math.round(Math.random() * 10 - 5))),
          network: Math.max(70, Math.min(190, last.network + Math.round(Math.random() * 24 - 12))),
          latency: Math.max(35, Math.min(140, last.latency + Math.round(Math.random() * 18 - 9))),
        },
      ]);
    }, 10000);
    return () => window.clearInterval(timer);
  }

  return onValue(ref(rtdb, `/metrics/${resourceId}`), (snapshot) => {
    const value = snapshot.val();
    callback(Array.isArray(value) ? value : metricSeries);
  });
}
