// 토큰 만료 시 리프레시
export async function refreshToken() {
    try {
        const response = await fetch("http://localhost:8080/api/reissue", {
                method: 'POST',
                credentials: 'include'
            });

        if (response.ok) {
            const refreshAccessToken = response.headers.get('Authorization') || '';
            localStorage.setItem("access", refreshAccessToken);
            return true; // 토큰 갱신 성공
        } else {
            // 토큰 갱신 실패 처리
            alert('재로그인이 필요합니다.');
            window.location.href = '../login/login.html';
            return false;
        }
        
    } catch (error) {
        console.error('토큰 갱신 중 에러 발생: ', error)
    }
}

// 로그아웃
export async function logout() {
    try {
        localStorage.removeItem('access');

        const response = await fetch('http://localhost:8080/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        if(response.ok) {
            console.log('로그아웃 성공');

            window.location.href = '../login/login.html';
        }
    } catch (error) {
        console.log(error);
    }
}

export async function verifyTokenAndRedirect() {
    const token = localStorage.getItem('access');
    
    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = '../login/login.html';
        return;
    }
}