import { refreshToken, logout, verifyTokenAndRedirect } from '../../js/security.js';

// 전역 변수 모음
let selectedKey = 'title'; // 초기 선택 키를 전역 변수로 설정
let currentPage = 1; // 현재 페이지 초기값 설정
let pageSize = 10; // 페이지 크기 초기값 설정
let keyword = ''; // 미입력 후 클릭 시 디폴트 값
let totalPages = 0; // 초기 값
let currentPaginationGroup = 0;
let pagesPerGroup = 10;
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

// 드롭다운 버튼 선택 시 dropdownSelection 이벤트 실행
document.querySelectorAll('.dropdown-menu a').forEach(item => {
    item.addEventListener('click', dropdownSelection);
});

// key에 해당하는 text로 드롭다운 적용
function dropdownSelection() {
    selectedKey = this.getAttribute('data-key');
    document.getElementById('dropdownMenuButton').textContent = this.textContent;
}

// 서버로 GET요청 보낼 URL 만듬
function buildUrl() {
    keyword = document.getElementById('inputField').value;
    let url = `http://localhost:8080/api/book?page=${currentPage - 1}&size=${pageSize}`;
    if (keyword) {
        url += `&${selectedKey}=${keyword}`;
    }
    return url;
}

// 서버로 도서 조회 요청 보냄
async function searchBooks(url) {
    const token = localStorage.getItem('access');
    try {
        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `${token}`
            }
        })

        const data = await response.json();

        if (response.status === 401) {
            const isRefreshed = await refreshToken();
            if (isRefreshed) {
                return searchBooks(url);
            } else {
                return;
            }
        }

        buildTable(data.content);
        updatePagination(data.totalPages);

    } catch (error) {
        console.error('Error:', error);
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

        let bookIdCell = row.insertCell(0);
        let titleCell = row.insertCell(1);
        let authorCell = row.insertCell(2);
        let publisherCell = row.insertCell(3);
        let yearofpublisherCell = row.insertCell(4);
        let loanableCell = row.insertCell(5);
        let actionCell = row.insertCell(6);

        loanableCell.textContent = book.loanStatus === "true" ? "불가능" : "가능";

        // 대출 및 예약 버튼 추가
        let loanButton = document.createElement('button');
        loanButton.textContent = '대출하기';
        loanButton.className = 'btn btn-primary btn-sm mx-1';
        // loanButton.onclick = () => requestLoan(book.bookId);

        let reserveButton = document.createElement('button');
        reserveButton.textContent = '예약하기';
        reserveButton.className = 'btn btn-secondary btn-sm mx-1';
        // reserveButton.onclick = () => requestReserve(book.bookId);

        // 대출 상태에 따라 버튼 활성화/비활성화 조절
        if (book.loanStatus === "대출 중") {
            // 대출 중: 대출하기 비활성화, 예약하기 활성화
            loanButton.disabled = true;
            reserveButton.onclick = () => requestReserve(book.bookId);
        } else if (book.loanStatus === "예약 중") {
            loanButton.onclick = () => requestLoan(book.bookId);
            reserveButton.onclick = () => requestReserve(book.bookId);
        } else {
            // 대출 가능: 대출하기 활성화, 예약하기 비활성화
            loanButton.onclick = () => requestLoan(book.bookId);
            reserveButton.disabled = true;
        }

        actionCell.appendChild(loanButton);
        actionCell.appendChild(reserveButton);

        // 데이터 받은 것 넣어주기
        bookIdCell.textContent = book.bookId;
        titleCell.textContent = book.title;
        authorCell.textContent = book.author;
        publisherCell.textContent = book.publisher;
        yearofpublisherCell.textContent = book.yearOfPublication;
        loanableCell.textContent = book.loanStatus;
    })
}

// 페이지네이션 업데이트
function updatePagination(total) {
    totalPages = total;
    const pagination = document.querySelector('.pagination');
    pagination.innerHTML = '';

    let startPage = currentPaginationGroup * pagesPerGroup + 1;
    let endPage = Math.min(startPage + pagesPerGroup - 1, totalPages);

    if (currentPaginationGroup > 0) {
        pagination.innerHTML += `<li class="page-item">
                                     <a class="page-link" href="#" data-page="prevGroup">&laquo;</a>
                                 </li>`;
    }

    for (let i = startPage; i <= endPage; i++) {
        pagination.innerHTML += `<li class="page-item ${i === currentPage ? 'active' : ''}">
                                     <a class="page-link" href="#" data-page="${i}">${i}</a>
                                 </li>`;
    }

    if (endPage < totalPages) {
        pagination.innerHTML += `<li class="page-item">
                                     <a class="page-link" href="#" data-page="nextGroup">&raquo;</a>
                                 </li>`;
    }
}

function paginationClick(event) {
    const value = event.target.getAttribute('data-page');
    if (value === 'prevGroup') {
        currentPaginationGroup--;
        currentPage = currentPaginationGroup * pagesPerGroup + 1;
    } else if (value === 'nextGroup') {
        currentPaginationGroup++;
        currentPage = currentPaginationGroup * pagesPerGroup + 1;
    } else {
        currentPage = parseInt(value);
    }
    updatePagination(totalPages);
    let requestUrl = buildUrl();
    searchBooks(requestUrl);
}

async function requestLoan(bookId) {
    const selectedBooks = document.querySelector('input[name=bookCheckbox]:checked');

    const token = localStorage.getItem('access');
    try {
        const response = await fetch('http://localhost:8080/api/loan', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `${token}`
            },
            body: JSON.stringify({ bookId: bookId })
        });

        if (response.status === 401) {
            const isRefreshed = await refreshToken();
            if (isRefreshed) {
                return requestLoan(bookId);
            } else {
                return;
            }
        }

        if (response.ok) {
            const result = await response.json();
            console.log(result);
            alert('대출 신청이 완료되었습니다.');
            window.location.href = "../main/main.html"
        } else {
            alert('대출 신청에 실패했습니다.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('서버와의 통신에 문제가 발생했습니다.');
    }
}

async function requestReserve(bookId) {
    const token = localStorage.getItem('access');
    try {
        const response = await fetch('http://localhost:8080/api/reservation', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `${token}`
            },
            body: JSON.stringify({ bookId: bookId })
        });

        if (response.status === 401) {
            const isRefreshed = await refreshToken();
            if (isRefreshed) {
                return requestReserve(bookId);
            } else {
                return;
            }
        }

        if (response.ok) {
            const result = await response.json();
            console.log(result);
            alert('예약 신청이 완료되었습니다.');
            window.location.href = "../main/main.html"
        } else {
            alert('예약 신청에 실패했습니다.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('서버와의 통신에 문제가 발생했습니다.');
    }
}

function init() {
    verifyTokenAndRedirect();
    searchBooks(buildUrl());
    document.querySelector('.pagination').addEventListener('click', paginationClick);
    document.getElementById('logoutButton').addEventListener('click', logout);

    // 검색 버튼 클릭 시 key 추출 및 URL 만들고 서버로 요청 보냄
    document.getElementById('submitButton').addEventListener('click', function () {
        let requestUrl = buildUrl();
        searchBooks(requestUrl);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    init();
    const usernameElement = document.querySelector('#dropdownUser strong');
    usernameElement.textContent = username;
});