// k6 load test
import http from "k6/http";
import { check } from "k6";

export const options = {
  vus: 10,
  duration: "30s",
  thresholds: {
    http_req_duration: ["p(95)<200"],
    http_req_failed: ["rate<0.01"],
  },
};

export default function() {
  const res = http.get("http://localhost:9464/metrics");
  check(res, {
    "status 200": (r) => r.status === 200,
    "has ahsan_score": (r) => r.body.includes("ahsan_score"),
  });
}
