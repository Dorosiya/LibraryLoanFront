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

export async function requestCreateArticle(title, content) {
    const token = localStorage.getItem('access');
    try {
        const response = await fetch('http://localhost:8080/api/article', {
            method: 'POST',
            headers: {
                'Authorization': `${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title: title, content: content })
        });

        if (response.status === 401) {
            const isRefreshed = await refreshToken();
            if (isRefreshed) {
                return requestCreateArticle(title, content);
            } else {
                return;
            }
        }

        const data = await response.json();
        alert('게시글이 성공적으로 등록되었습니다.');
        window.location.href = '../board/board.html';
    } catch (error) {
        console.error('Error:', error);
        alert('게시글 등록에 실패했습니다.');
    }
}

export function FormSubmit(title, content) {
    console.log('제목:', title);
    console.log('내용:', content);

    requestCreateArticle(title, content);
}

document.addEventListener('DOMContentLoaded', function () {
    init();
});

function init() {
    verifyTokenAndRedirect();
    displayUsername(username);
    document.getElementById('logoutButton').addEventListener('click', logout);
}