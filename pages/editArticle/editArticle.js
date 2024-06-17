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

export async function getArticleDetails(articleId) {
    const token = localStorage.getItem('access');
    const response = await fetch(`http://localhost:8080/api/article/${articleId}`, {
        method: 'GET',
        headers: {
            'Authorization': `${token}`
        }
    });
    if (response.ok) {
        return response.json();
    } else {
        console.error('Failed to fetch article details');
        return null;
    }
}

export async function updateArticle(articleId, title, content) {
    const token = localStorage.getItem('access');
    try {
        const response = await fetch(`http://localhost:8080/api/article/${articleId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, content })
        });

        if (response.status === 401) {
            const isRefreshed = await refreshToken();
            if (isRefreshed) {
                return updateArticle(articleId, title, content);
            } else {
                return;
            }
        }

        if (response.ok) {
            alert('게시글이 성공적으로 수정되었습니다.');
            window.location.href = `../detailArticle/detailArticle.html?articleId=${articleId}`;
        } else {
            alert('게시글 수정에 실패했습니다.');
        }
    } catch (error) {
        console.error('Error updating article:', error);
        alert('게시글 수정 중 오류가 발생했습니다.');
    }
}

document.addEventListener('DOMContentLoaded', function () {
    init();
});

function init() {
    verifyTokenAndRedirect();
    displayUsername(username);
    document.getElementById('logoutButton').addEventListener('click', logout);
}