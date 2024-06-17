import { refreshToken, logout, verifyTokenAndRedirect } from '../../js/security.js';

let selectedKey = 'title'; // 초기 선택 키를 전역 변수로 설정
let keyword = ''; // 미입력 후 클릭 시 디폴트 값
let currentPage = 1; // 현재 페이지 초기값 설정
let pageSize = 10; // 페이지 크기 초기값 설정
let totalPages = 0; // 초기 값
let currentPaginationGroup = 0;
let pagesPerGroup = 10;

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

// 서버로 GET요청 보낼 URL 만듬
function buildUrl() {
    keyword = document.getElementById('inputField').value;
    let url = `http://localhost:8080/api/article?page=${currentPage - 1}&size=${pageSize}`;
    if (keyword) {
        url += `&${selectedKey}=${keyword}`;
    }
    return url;
}

async function getArticles(url) {
    const token = localStorage.getItem('access');
    try {
        const response = await fetch(url, {
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
                return getArticles();
            } else {
                return;
            }
        }

        if (!response.ok) {
            throw new Error('데이터를 불러오는 데 실패했습니다.');
        }

        const data = await response.json();
        buildTable(data.content);
        updatePagination(data.totalPages);

    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
    }
}

// 테이블 생성
function buildTable(findArticles) {
    const tableBody = document.getElementById('resultTable').getElementsByTagName('tbody')[0];

    // 기존 검색 결과 초기화
    tableBody.innerHTML = '';

    // 셀 지정
    findArticles.forEach((article, index) => {
        let row = tableBody.insertRow();

        row.className = 'text-center align-middle';

        row.insertCell(0).textContent = article.title;
        row.insertCell(1).textContent = article.username;
        row.insertCell(2).textContent = article.createdDate;
        row.insertCell(3).textContent = article.views;

        row.addEventListener("click", function() {
            window.location.href = `../detailArticle/detailArticle.html?articleId=${article.articleId}`;
        });
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
    getArticles(requestUrl);
}

// 권한에 따라 버튼 표시 조정
function displayWriteButton() {
    const jwtToken = localStorage.getItem('access');
    const userInfo = parseJwt(jwtToken);
    
    if (userInfo.role && userInfo.role === "ROLE_ADMIN") {
        const buttonContainer = document.getElementById('createArticleButton');
        const writeButton = document.createElement('button');
        writeButton.className = 'btn btn-primary';
        writeButton.textContent = '글 쓰기';
        writeButton.onclick = function() {
            window.location.href = '../createArticle/createArticle.html';  // 적절한 글 작성 페이지 URL로 이동
        };
        buttonContainer.appendChild(writeButton);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    init();
});

function init() {
    verifyTokenAndRedirect();
    document.querySelector('.pagination').addEventListener('click', paginationClick);
    displayWriteButton();
    getArticles(buildUrl());
    displayUsername(username);
    document.getElementById('logoutButton').addEventListener('click', logout);

    // 검색 버튼 클릭 시 key 추출 및 URL 만들고 서버로 요청 보냄
    document.getElementById('submitButton').addEventListener('click', function () {
        let requestUrl = buildUrl();
        getArticles(requestUrl);
    });
}
