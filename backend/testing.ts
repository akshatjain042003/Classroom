import http, { RefinedResponse, ResponseType } from 'k6/http';
import { check, sleep } from 'k6';
import { Options } from 'k6/options';

// Define strict types for your payload data
interface UserPayload {
  name: string;
  job: string;
}

// Define strict types for the expected JSON response body
interface UserResponse {
  job: string;
}

// Type-safe test configuration options
export const options: Options = {
  vus: 1000,
  duration: '10s',
};

export default function (): void {
  const url: string = 'http://localhost:4000/users/profile';

  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization:
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjExLCJ1c2VybmFtZSI6Im5vYm9keWRvZXNpdGJldHRlciIsImVtYWlsIjoiY29ybmh1YkBnbWFpbC5jb20iLCJpYXQiOjE3ODAxMjA0MzQsImV4cCI6MTc4MDIwNjgzNH0.lTcKiZecWU0BCg48U0ud5yfg3Z_NKh1zcWL7lLfO3rs',
    },
  };

  const payload: string = JSON.stringify({
    name: 'k6_user',
    job: 'performance_tester',
  } as UserPayload);

  // Execute the POST request
  const response: RefinedResponse<ResponseType> = http.get(url, params);
  // Safely parse the response using your custom interface
  const responseBody = response.json() as UserResponse | null;

  // Validate the response
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response body contains job': () =>
      responseBody !== null && responseBody.job === 'performance_tester',
  });

  sleep(1);
}
