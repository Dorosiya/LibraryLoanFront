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

async function getLoanBooks() {
    const token = localStorage.getItem('access');
    try {
        const response = await fetch('http://localhost:8080/api/loan', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Authorization': `${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.status === 401) {
            const isRefreshed = await refreshToken();
            if (isRefreshed) {
                return getLoanBooks();
            } else {
                return;
            }
        }

        if (!response.ok) {
            throw new Error('데이터를 불러오는 데 실패했습니다.');
        }

        const data = await response.json();
        buildTable(data);

    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
    }
}

// 테이블 생성
function buildTable(findBooks) {
    const tableBody = document.getElementById('resultTable').getElementsByTagName('tbody')[0];

    // 기존 검색 결과 초기화
    tableBody.innerHTML = '';

    // 셀 지정
    findBooks.forEach((book, index) => {
        let row = tableBody.insertRow();

        row.className = 'text-center align-middle';

        row.insertCell(0).textContent = book.bookId;
        row.insertCell(1).textContent = book.title;
        row.insertCell(2).textContent = book.author;
        row.insertCell(3).textContent = book.publisher;
        row.insertCell(4).textContent = book.yearOfPublication;
        row.insertCell(5).textContent = book.loanDate;
        row.insertCell(6).textContent = book.dueDate;
        let actionCell = row.insertCell(7);

        // 반납하기 버튼 추가
        let returnButton = document.createElement('button');
        returnButton.textContent = '반납하기';
        returnButton.className = 'btn btn-primary btn-sm mx-1';
        returnButton.onclick = () => returnBooks(book.bookId);

        actionCell.appendChild(returnButton);
    })
}

function setupReturnButton() {
    document.getElementById('returnButton').addEventListener('click', async function () {
        const checkedBoxes = document.querySelectorAll('input[name="returnCheckbox"]:checked');
        const bookIds = Array.from(checkedBoxes).map(checkbox => checkbox.value);

        try {
            await returnBooks(bookIds);
            alert('선택한 책들이 반납 처리되었습니다.');
            window.location.reload();

        } catch (error) {
            console.error('Error:', error);
            alert(error.message);
        }
    });
}

async function returnBooks(bookId) {
    try {
        const token = localStorage.getItem('access');
        const response = await fetch('http://localhost:8080/api/loan', {
            method: 'PATCH',
            credentials: 'include',
            headers: {
                'Authorization': `${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ bookId: bookId })
        });

        if (response.status === 401) {
            const isRefreshed = await refreshToken();
            if (isRefreshed) {
                return returnBooks(url);
            } else {
                return;
            }
        }

        if (!response.ok) {
            throw new Error('반납 처리에 실패했습니다.');
        }

        alert('책이 성공적으로 반납되었습니다.');
        getLoanBooks(); // 반납 후 책 목록 갱신

    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    init();
});

function init() {
    verifyTokenAndRedirect();
    getLoanBooks();
    displayUsername(username);
    document.getElementById('logoutButton').addEventListener('click', logout);
}
