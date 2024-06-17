async function loginUser(username, password) {
  try {
    const response = await fetch('http://localhost:8080/login', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error('Authentication failed');
    }

    const accessToken = response.headers.get('Authorization') || '';

    if (accessToken) {
      localStorage.setItem('access', accessToken);
      window.location.href = '../main/main.html';
    } else {
      alert('로그인 실패: 토큰을 찾을 수 없습니다.');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('로그인 중 에러 발생');
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  await loginUser(username, password);
}

document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginform');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
});