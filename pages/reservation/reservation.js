import { refreshToken, logout, verifyTokenAndRedirect } from '../../js/security.js';

const jwtToken = localStorage.getItem('access');

// jwt 토큰 파싱
function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    return JSON.parse(jsonPayload);
}

const username = parseJwt(jwtToken).username;

function displayUsername(username) {
    const userIdDisplayElement = document.querySelector('#dropdownUser strong');
    
    userIdDisplayElement.textContent = username;
}

async function getReservationBooks() {
    const token = localStorage.getItem('access');
    try {
        const response = await fetch('http://localhost:8080/api/reservation', {
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
                return getReservationBooks();
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

async function cancelReservationBooks(reservationId) {
    const token = localStorage.getItem('access');
    try {
        const response = await fetch(`http://localhost:8080/api/book/reservation/${reservationId}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Authorization': `${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.status === 401) {
            const isRefreshed = await refreshToken();
            if (isRefreshed) {
                return cancelReservationBooks(reservationId);
            } else {
                return;
            }
        }

        if (!response.ok) {
            throw new Error('예약 취소에 실패했습니다.');
        }

        alert('예약이 성공적으로 취소되었습니다.');
        getReservationBooks();

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
    findBooks.forEach((reservation) => {
        let row = tableBody.insertRow();

        row.className = 'text-center align-middle';

        row.insertCell(0).textContent = reservation.bookId;
        row.insertCell(1).textContent = reservation.title;
        row.insertCell(2).textContent = reservation.author;
        row.insertCell(3).textContent = reservation.publisher;
        row.insertCell(4).textContent = reservation.yearOfPublication;
        row.insertCell(5).textContent = reservation.reservationDate;
        row.insertCell(6).textContent = reservation.expireDate;
        let statusCell= row.insertCell(7);

        statusCell.textContent = reservation.status === 1 ? "예약 대기" : "대여 가능";
        let actionCell = row.insertCell(8);

        // 대출 및 예약 버튼 추가
        let reserveCancelButton = document.createElement('button');
        reserveCancelButton.textContent = '예약취소';
        reserveCancelButton.className = 'btn btn-primary btn-sm mx-1';
        reserveCancelButton.onclick = () => cancelReservationBooks(reservation.reservationId);

        actionCell.appendChild(reserveCancelButton);
    })
}

document.addEventListener('DOMContentLoaded', function() {
    init();
});

function init() {
    verifyTokenAndRedirect();
    getReservationBooks();
    displayUsername(username);
    document.getElementById('logoutButton').addEventListener('click', logout);
}
