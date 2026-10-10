async function main() {
  const res = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: "Test Student", email: "student_test_" + Date.now() + "@gmail.com", password: "password123" })
  });
  console.log(res.status);
  console.log(await res.json());
}
main();
