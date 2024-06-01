document.addEventListener('DOMContentLoaded', function () {
    loadCollectionsForGameMode(); 
});

async function loadCollectionsForGameMode() {
    try {
        const token = getCookie('token'); 

        const userCollectionsPromise = fetchUserCollections(token);
        const recommendedCollectionsPromise = fetchRecommendedCollections();

        const [userCollections, recommendedCollections] = await Promise.all([userCollectionsPromise, recommendedCollectionsPromise]);
        const allCollections = [...userCollections, ...recommendedCollections];
        renderCollectionsForGameMode(allCollections);

        await loadUserRecords(token);
    } catch (error) {
        console.error('Error:', error.message);
    }
}


async function fetchUserCollections(token) {
    const userId = await fetchUserId(token); 
    const response = await fetch(`http://localhost:3000/users/${userId}/collections`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });

    if (response.ok) {
        return await response.json();
    } else {
        console.error('Failed to fetch user collections');
        return [];
    }
}

async function fetchRecommendedCollections() {
    const response = await fetch('http://localhost:3000/collections', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (response.ok) {
        const collections = await response.json();
        return collections.filter(collection => collection.isRecommended);
    } else {
        console.error('Failed to fetch recommended collections');
        return [];
    }
}

function renderCollectionsForGameMode(collections) {
    const collectionContainer = document.getElementById('game-mode-collections');
    collectionContainer.innerHTML = ''; 
    collections.forEach(collection => {
        const button = document.createElement('button');
        button.textContent = collection.name;
        button.addEventListener('click', () => startGame(collection._id)); 
        collectionContainer.appendChild(button);
    });
    collectionContainer.style.display = 'grid'; 
}

async function loadUserRecords(token) {
    try {
        const userId = await fetchUserId(token); 

        const response = await fetch(`http://localhost:3000/scores/user/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const userRecords = await response.json();
            for (const record of userRecords) {
                if (record.collectionId) { 
                    const collectionName = await fetchCollectionName(record.collectionId);
                    record.collectionName = collectionName;
                } else {
                    record.collectionName = "Unknown Collection";
                }
            }
            renderUserRecords(userRecords);
        } else {
            console.error('Failed to fetch user records');
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}


async function fetchCollectionName(collectionId) {
    try {
        const response = await fetch(`http://localhost:3000/collections/${collectionId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (response.ok) {
            const collection = await response.json();
            return collection.name;
        } else {
            console.error('Failed to fetch collection name');
            return 'Unknown Collection'; 
        }
    } catch (error) {
        console.error('Error fetching collection name:', error.message);
        return 'Unknown Collection'; 
    }
}


function renderUserRecords(records) {
    const recordsBody = document.getElementById('records-body');
    recordsBody.innerHTML = ''; 

    records.forEach(record => {
        const row = document.createElement('tr');
        const collectionCell = document.createElement('td');
        collectionCell.textContent = record.collectionName; 
        const scoreCell = document.createElement('td');
        scoreCell.textContent = record.score; 

        row.appendChild(collectionCell);
        row.appendChild(scoreCell);
        recordsBody.appendChild(row);
    });
}

document.addEventListener('DOMContentLoaded', function () {
    loadCollectionsForGameMode(); 

    const clearScoresButton = document.createElement('button');
    clearScoresButton.textContent = 'Clear Scores';
    clearScoresButton.addEventListener('click', clearUserScores);
    document.getElementById('clear-scores-container').appendChild(clearScoresButton);
});

async function clearUserScores() {
    try {
        const token = getCookie('token'); 

        const userId = await fetchUserId(token); 
        const response = await fetch(`http://localhost:3000/scores/user/${userId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            console.log('User scores cleared successfully');
            await loadUserRecords(token);
            const recordsBody = document.getElementById('records-body');
            recordsBody.innerHTML = '';
            document.body.classList.add('fade-out');
            setTimeout(() => {
                location.reload();
            }, 100); 
        } else {
            console.error('Failed to clear user scores');
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}




async function startGame(collectionId) {
    localStorage.setItem('selectedCollectionId', collectionId);
    try {
        const token = getCookie('token'); 
        document.getElementById('user-records').style.display = 'none';
        const response = await fetch(`http://localhost:3000/collections/${collectionId}/cards`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.ok) {
            const cards = await response.json();
            renderCardsForGame(cards);
            resetGame(); 
        } else {
            console.error('Failed to fetch cards for collection:', collectionId);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

function renderCardsForGame(cards) {
    const gameContainer = document.getElementById('game-container');
    const cardContainer = document.getElementById('card-container');
    const timerElement = document.createElement('div');
    timerElement.id = 'timer';
    cardContainer.after(timerElement); 
    gameContainer.appendChild(timerElement);

    let currentCardIndex = 0;
    let score = 0;
    let timeLeft = 15;
    let timer;

    function startTimer() {
        timeLeft = 15;
        timerElement.textContent = `time left: 0:${timeLeft}`;
        timer = setInterval(() => {
            timeLeft--;
            timerElement.textContent = `time left: 0:${timeLeft}`;
            if (timeLeft <= 0) {
                clearInterval(timer);
                loadNextCard();
            }
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timer);
    }

    function renderCard() {
        cardContainer.innerHTML = ''; 
        const card = cards[currentCardIndex];
        const frontContent = document.createElement('div');
        frontContent.classList.add('front-content');
        frontContent.textContent = card.question;
        cardContainer.appendChild(frontContent);
        
        const answerInput = document.getElementById('answer-input');
        answerInput.focus();
    
        answerInput.removeEventListener('keydown', handleAnswer);
        document.getElementById('apply-answer-button').removeEventListener('click', handleAnswer);
    
        answerInput.addEventListener('keydown', handleAnswer);
        document.getElementById('apply-answer-button').addEventListener('click', handleAnswer);
    
        startTimer();
    }

    function loadNextCard() {
        stopTimer();
        if (currentCardIndex < cards.length - 1) {
            currentCardIndex++;
            renderCard();
        } else {
            endGame();
        }
    }

    async function endGame() {
        const token = getCookie('token');
        const userId = await fetchUserId(token);
        const collectionId = localStorage.getItem('selectedCollectionId');
    
        const response = await fetch('http://localhost:3000/scores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                userId: userId,
                score: score,
                collectionId: collectionId
            })
        });
    
        if (response.ok) {
            console.log('User score saved successfully');
            await loadUserRecords(token);
        } else {
            console.error('Failed to save user score');
        }
    
        localStorage.removeItem('selectedCollectionId');
        document.getElementById('final-score').textContent = score;
        document.getElementById('end-game-modal').style.display = 'block';
        stopTimer();
    
        setTimeout(() => {
            location.reload();
        }, 1000);
    }
    
    
    function resetGame() {
        cardContainer.innerHTML = '';
        currentCardIndex = 0;
        score = 0;
        document.getElementById('score').textContent = score;
        renderCard();
    }

    function handleAnswer(event) {
        const currentAnswer = document.getElementById('answer-input').value.trim();
        const correctAnswer = cards[currentCardIndex].answer;
    
        if (event && event.type === 'click' || (event.type === 'keydown' && event.key === 'Enter')) {
            if (currentAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
                score++;
            }
    
            document.getElementById('score').textContent = score;
            loadNextCard();
            document.getElementById('answer-input').value = ''; 
        }
    }
    
    document.getElementById('apply-answer-button').removeEventListener('click', handleAnswer);
    document.getElementById('answer-input').removeEventListener('keydown', handleAnswer);
    
    document.getElementById('apply-answer-button').addEventListener('click', handleAnswer);
    document.getElementById('answer-input').addEventListener('keydown', handleAnswer);



    document.getElementById('back-to-main-button').addEventListener('click', function () {
        document.getElementById('end-game-modal').style.display = 'none';
        document.getElementById('game-container').style.display = 'none';
        document.getElementById('collection-selection').style.display = 'block'; 
        document.getElementById('user-records').style.display = 'block'; 
    });

    renderCard();

    document.getElementById('collection-selection').style.display = 'none';
    document.getElementById('user-records').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
}


function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

async function fetchUserId(token) {
    try {
        const decodedToken = decodeToken(token);
        const userId = decodedToken.userId;

        if (!isValidObjectId(userId)) {
            throw new Error('Invalid userId format');
        }

        const response = await fetch(`http://localhost:3000/users/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user ID: ' + response.statusText);
        }

        const data = await response.json();
        return data.userId;
    } catch (error) {
        console.error('Error fetching user ID:', error);
    }
}

function decodeToken(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Error decoding token:', error.message);
        return null;
    }
}

function isValidObjectId(id) {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    return objectIdRegex.test(id);
}