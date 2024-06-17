import { refreshToken, logout, verifyTokenAndRedirect } from '../../js/security.js';

async function getComplexCount() {
    const token = localStorage.getItem('access');
    try {
        const response = await fetch('http://localhost:8080/api/basic', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `${token}`
            }
        });

        if (response.status === 401) {
            const isRefreshed = await refreshToken();
            if (isRefreshed) {
                return getComplexCount();
            } else {
                return;
            }
        }

        const data = await response.json();
        
        console.log(data);
        findComplex(data);

    } catch (error) {
        console.log("Error", error);
    }
}

function findComplex(data) {
    const loanCount = document.querySelector('#loanCount');
    const reservationCount = document.querySelector('#reservationCount');
    loanCount.textContent = data.loanCount;
    reservationCount.textContent = data.reservationCount;
}

function init() {
    verifyTokenAndRedirect();
    document.getElementById('logoutButton').addEventListener('click', logout);
}

document.addEventListener('DOMContentLoaded', function() {
    init();
    getComplexCount();
});
