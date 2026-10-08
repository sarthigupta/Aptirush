async function main() {
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'faculty@gmail.com', password: '123456' })
  });
  const { token } = await loginRes.json();

  console.log("Token acquired");

  const qRes = await fetch('http://localhost:5000/api/faculty/questions', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const modules = await qRes.json();
  const qId = modules[0].questions[0].id;

  console.log("Creating test with question ID:", qId);

  const tRes = await fetch('http://localhost:5000/api/faculty/tests', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ title: "API Test HTTP", questionIds: [qId] })
  });

  console.log("Status:", tRes.status);
  const data = await tRes.json();
  console.log("Response:", data);
}
main();
