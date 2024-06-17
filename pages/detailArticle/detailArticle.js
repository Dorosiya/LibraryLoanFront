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

// const paramArticleId = getQueryParam('articleId');
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

async function searchArticleDetail(articleId) {

    const token = localStorage.getItem('access');

    const response = await fetch(`http://localhost:8080/api/article/${articleId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Authorization': `${token}`,
            'Content-Type': 'application/json',
        }
    });

    if (response.status === 401) {
        const isRefreshed = await refreshToken();
        if (isRefreshed) {
            return searchArticleDetail(articleId);
        } else {
            return;
        }
    }

    const data = await response.json();
    const article = data.articleDto;
    const comment = data.commentDto;
    console.log(data);
    console.log(article);
    console.log(comment);

    // 페이지에 게시글 상세 정보 표시
    document.getElementById('articleTitle').textContent = article.title;
    document.getElementById('articleTime').textContent = article.createdDate;
    document.getElementById('username').textContent = article.username;
    document.getElementById("articleBody").innerHTML = article.content;
    document.getElementById('views').textContent = `조회수: ${article.views}`;

    displayComments(comment, username);

    addDeleteButtonIfUserIsAuthor(username, article.username, articleId);
    setupModifyButton(articleId);
}

// 게시글 수정 버튼 이벤트
function setupModifyButton(articleId) {
    const modifyButton = document.getElementById('modifyButton');
    if (modifyButton) {
        modifyButton.addEventListener('click', () => {
            window.location.href = `../editArticle/editArticle.html?articleId=${articleId}`;
        });
    }
}

async function deleteArticle(articleId) {
    try {
        const token = localStorage.getItem('access');
        const response = await fetch(`http://localhost:8080/api/article/${articleId}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Authorization': `${token}`
            }
        });

        if (response.status === 401) {
            const isRefreshed = await refreshToken();
            if (isRefreshed) {
                return deleteArticle(articleId);
            } else {
                return;
            }
        }

        if (response.ok) {
            const data = await response.json();
            console.log(data);
            window.location.href = "../board/board.html"
        }

    } catch (error) {
        console.log(error);
    }

}

async function addCommentRequest(articleId, content) {
    try {
        const token = localStorage.getItem('access');
        const response = await fetch('http://localhost:8080/api/comment', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Authorization': `${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                'articleId': articleId,
                'content': content
            })
        });

        if (response.status === 401) {
            const isRefreshed = await refreshToken();
            if (isRefreshed) {
                return addCommentRequest(articleId, content);
            } else {
                return;
            }
        }

        if (response.ok) {
            location.reload();
        } else {
            console.error('댓글 추가 중 오류');
        }

        const data = await response.json();

    } catch (error) {
        console.log(error);
    }

}

// 사용자의 username과 작성자의 username이 일치할 때 삭제 버튼 추가
function addDeleteButtonIfUserIsAuthor(currentUserUsername, postAuthorUsername, articleId) {
    let buttonSection = document.getElementById('buttonSection');

    const existingDeleteButton = document.getElementById('moveButton');

    let moveButton = document.createElement('button');
    moveButton.id = 'moveButton';
    moveButton.textContent = '목록으로';
    moveButton.className = 'btn btn-secondary';

    moveButton.addEventListener('click', function () {
        window.location.href = '../board/board.html';
    });

    buttonSection.appendChild(moveButton);

    // 사용자와 작성자가 일치하는 경우에만 삭제 버튼을 추가
    if (currentUserUsername === postAuthorUsername && !existingDeleteButton) {
        let modifyButton = document.createElement('button');
        modifyButton.id = 'modifyButton';
        modifyButton.textContent = '게시글 수정';
        modifyButton.className = 'btn btn-primary';

        buttonSection.appendChild(modifyButton);

        let deleteButton = document.createElement('button');
        deleteButton.id = 'deleteButton';
        deleteButton.textContent = '게시글 삭제';
        deleteButton.className = 'btn btn-danger';

        deleteButton.addEventListener('click', function () {
            deleteArticle(articleId);
        });

        buttonSection.appendChild(deleteButton);
    }
}

async function removeComment(articleId, commentId) {
    try {
        const token = localStorage.getItem('access');
        const response = await fetch(`http://localhost:8080/api/comment?articleId=${articleId}&commentId=${commentId}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Authorization': token
            },
        })

        if (response.status === 401) {
            const isRefreshed = await refreshToken();
            if (isRefreshed) {
                return removeComment(articleId, commentId);
            } else {
                return;
            }
        }

        if(response.ok) {
            location.reload();
        } else {
            console.error('댓글 삭제 중 오류');
        }

        const data = await response.json();
        
    } catch (error) {
        console.log(error);
    }
    
}

async function editCommentChanges(commentId, content) {
    try {
        const token = localStorage.getItem('access');
        const response = await fetch(`http://localhost:8080/api/comment/${commentId}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: {
                'Authorization': `${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                'commentId': commentId,
                'content': content
            })
        })

        if (response.status === 401) {
            const isRefreshed = await refreshToken();
            if (isRefreshed) {
                return editComment(articleId, commentId);
            } else {
                return;
            }
        }

        if(response.ok) {
            location.reload();
        } else {
            console.error('댓글 수정 중 오류');
        }

        const data = await response.json();
        
    } catch (error) {
        console.log(error);
    }
    
}

function displayComments(commentsData, username) {
    const commentsContainer = document.getElementById('comments');
    commentsContainer.innerHTML = '';

    commentsData.forEach(comment => {
        const commentElement = document.createElement('div');
        commentElement.className = 'card mb-3';
        commentElement.setAttribute('data-comment-id', comment.commentId);

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';

        const headerDiv = document.createElement('div');
        headerDiv.className = 'd-flex justify-content-between align-items-center';

        const userInfoDiv = document.createElement('div');
        const userNameSpan = document.createElement('span');
        userNameSpan.className = 'card-title mb-1 username';
        userNameSpan.style.fontWeight = 'bold';
        userNameSpan.textContent = comment.username;

        const dateSmall = document.createElement('small');
        dateSmall.className = 'text-muted';
        dateSmall.textContent = comment.lastModifiedDate;

        userInfoDiv.appendChild(userNameSpan);
        userInfoDiv.appendChild(dateSmall);

        const contentDiv = document.createElement('div');
        contentDiv.textContent = comment.content;
        contentDiv.className = 'card-text';

        // 버튼 컨테이너
        const buttonContainer = document.createElement('div');

        if (comment.username === username) {
            const deleteButton = document.createElement('button');
            deleteButton.className = 'btn btn-outline-danger btn-sm';
            deleteButton.textContent = '삭제';
            deleteButton.onclick = () => removeComment(comment.commentId);

            const editButton = document.createElement('button');
            editButton.className = 'btn btn-outline-primary btn-sm';
            editButton.textContent = '수정';
            editButton.onclick = () => toggleEditComment(comment, contentDiv);

            buttonContainer.appendChild(deleteButton);
            buttonContainer.appendChild(editButton);
        }

        headerDiv.appendChild(userInfoDiv);
        headerDiv.appendChild(buttonContainer);

        cardBody.appendChild(headerDiv);
        cardBody.appendChild(contentDiv);
        commentElement.appendChild(cardBody);
        commentsContainer.appendChild(commentElement);
    });
}

function toggleEditComment(comment, contentDiv) {
    // 이미 편집 모드인 경우 아무 동작도 하지 않음
    if (contentDiv.querySelector('textarea')) {
        return;
    }

    // 원래의 댓글 내용을 저장
    const originalContent = contentDiv.textContent;

    // 텍스트 입력 폼 생성
    const textarea = document.createElement('textarea');
    textarea.className = 'form-control';
    textarea.value = originalContent;

    // 입력 폼 및 버튼을 담을 임시 컨테이너 생성
    const tempContainer = document.createElement('div');

    // 저장 버튼 생성 및 이벤트 핸들러 설정
    const saveButton = document.createElement('button');
    saveButton.className = 'btn btn-success btn-sm';
    saveButton.textContent = '저장';
    saveButton.onclick = () => editCommentChanges(comment.commentId, textarea.value, contentDiv, originalContent);

    // 취소 버튼 생성 및 이벤트 핸들러 설정
    const cancelButton = document.createElement('button');
    cancelButton.className = 'btn btn-secondary btn-sm';
    cancelButton.textContent = '취소';
    cancelButton.onclick = () => {
        contentDiv.innerHTML = originalContent; // 원래 내용으로 복구
    };

    // 컨테이너에 텍스트 입력 폼과 버튼 추가
    tempContainer.appendChild(textarea);
    tempContainer.appendChild(saveButton);
    tempContainer.appendChild(cancelButton);

    // 기존 내용을 입력 폼으로 교체
    contentDiv.innerHTML = '';
    contentDiv.appendChild(tempContainer);
}

document.addEventListener('DOMContentLoaded', function () {
    init();
});

function init() {
    verifyTokenAndRedirect();
    const paramArticleId = getQueryParam('articleId');
    searchArticleDetail(paramArticleId);
    displayUsername(username);
    document.getElementById('logoutButton').addEventListener('click', logout);

    document.getElementById('submitComment').addEventListener('click', function () {
        const articleId = paramArticleId;
        const content = document.getElementById('commentInput').value;
        addCommentRequest(articleId, content);
    });

    document.getElementById('comments').addEventListener('click', function(event) {
        if (event.target.classList.contains('delete-comment-btn')) {
            const commentId = event.target.getAttribute('data-comment-id');
            removeComment(paramArticleId, commentId);
        }
    });
}