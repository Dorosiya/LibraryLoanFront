document.getElementById('joinform').addEventListener('submit', function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const email = document.getElementById('email').value;
    const age = document.getElementById('age').value;

    joinUser(username, password, email, age);
});

async function joinUser(username, password, email, age) {
    try {
        const response = await fetch('http://localhost:8080/api/join', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password, email, age }),
        });
        
        const data = await response.json();

        if (response.ok) {
            console.log('Success:', data);
            window.location.href = '../login/login.html';
        } else {
            console.error('Error data:', data);
            
            let usernameError = data.errors.username ? '유저네임: ' + data.errors.username : '';
            let passwordError = data.errors.password ? '패스워드: ' + data.errors.password : '';

            let errorMessage = usernameError + (usernameError && passwordError ? '\n' : '') + passwordError;

            alert(errorMessage);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('회원가입 중 에러 발생');
    }
}