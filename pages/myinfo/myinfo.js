import { refreshToken, logout, verifyTokenAndRedirect } from '../../js/security.js';

const jwtToken = localStorage.getItem('access');

// jwt 토큰 파싱
function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

const username = parseJwt(jwtToken).username;

function displayUsername(username) {
    const userIdDisplayElement = document.querySelector('#dropdownUser strong');

    userIdDisplayElement.textContent = username;
}

async function requestUserInfo() {
    const token = localStorage.getItem('access');
    try {
        const response = await fetch("http://localhost:8080/api/member", {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Authorization': `${token}`
            }
        });
        
        if (response.status === 401) {
            const isRefreshed = await refreshToken();
            if (isRefreshed) {
                return requestUserInfo();
            } else {
                return;
            }
        }

        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }

        const data = await response.json();
        console.log("User Data:", data);

        document.getElementById('userName').textContent = data.username || 'N/A';
        document.getElementById('userAge').textContent = data.age || 'N/A';
        document.getElementById('userEmail').textContent = data.email || 'N/A';
        
    } catch (error) {
        console.error('Error:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    verifyTokenAndRedirect();
    requestUserInfo();
    displayUsername(username);
    document.getElementById('logoutButton').addEventListener('click', logout);
});
