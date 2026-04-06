const http = require('http');

const data = JSON.stringify({
  roll_no: '7376231CS120',
  completed_levels: '5',
  skill_completed: 'Java Level 1',
  allocated_points: 100,
  attendance_percentage: 85
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/student/update-details',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  res.on('data', (chunk) => {
    console.log(`Body: ${chunk}`);
  });
  
  res.on('end', () => {
    console.log('No more data in response.');
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(data);
req.end();
