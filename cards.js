document.addEventListener('DOMContentLoaded', () => {
    let deleteCardButton = document.getElementById('delete-card');
    if (!deleteCardButton) {
        deleteCardButton = document.createElement('button');
        deleteCardButton.id = 'delete-card';
        deleteCardButton.textContent = 'DELETE';
        document.querySelector('.card-options').appendChild(deleteCardButton);
    }

    let editCardButton = document.getElementById('edit-card');
    if (!editCardButton) {
        editCardButton = document.createElement('button');
        editCardButton.id = 'edit-card';
        editCardButton.textContent = 'EDIT';
        document.querySelector('.card-options').appendChild(editCardButton);
    }

    const modal = document.getElementById('flashcard-modal');
    let deletionMode = false;
    let editMode = false;

    const editCardModal = document.getElementById('edit-card-modal');
    const editCloseButton = editCardModal.querySelector('.close');
    const editApplyButton = document.getElementById('edit-card-apply');
    let currentEditCardId = null;

    const addCardButton = document.getElementById('add-card');
    const cardContainer = document.getElementById('my-card-container');
    let currentCollectionId = 'data-collection-id'; 

    addCardButton.addEventListener('click', () => {
        const existingTemplates = cardContainer.querySelectorAll('.custom-card.template');
        existingTemplates.forEach(template => template.remove());

        const newCard = document.createElement('div');
        newCard.classList.add('custom-card', 'template');

        const questionInput = document.createElement('input');
        questionInput.placeholder = 'Enter frontside';
        newCard.appendChild(questionInput);

        const answerInput = document.createElement('input');
        answerInput.placeholder = 'Enter backside';
        newCard.appendChild(answerInput);

        const addCardHandler = async () => {
            const question = questionInput.value.trim();
            const answer = answerInput.value.trim();

            if (question && answer) {
                await createCard(currentCollectionId, question, answer);
                questionInput.value = '';
                answerInput.value = '';

                await loadCardsForCurrentCollection();
                newCard.remove(); 
            } else {
                alert('Please enter both question and answer.');
            }
        };

        const handleKeyPress = (e) => {
            if (e.key === 'Enter') {
                addCardHandler();
            }
        };

        questionInput.addEventListener('keypress', handleKeyPress);
        answerInput.addEventListener('keypress', handleKeyPress);

        cardContainer.appendChild(newCard);
        questionInput.focus();
    });

    deleteCardButton.addEventListener('click', () => {
        deletionMode = !deletionMode;
        toggleDeletionMode(deletionMode);
    });

    editCardButton.addEventListener('click', () => {
        editMode = !editMode;
        toggleEditMode(editMode);
    });

    editCloseButton.addEventListener('click', () => {
        editCardModal.style.display = 'none';
    });

    editApplyButton.addEventListener('click', async () => {
        const questionInput = document.getElementById('edit-card-question');
        const answerInput = document.getElementById('edit-card-answer');

        const question = questionInput.value.trim();
        const answer = answerInput.value.trim();

        if (question && answer && currentEditCardId) {
            await updateCardInCurrentCollection(currentEditCardId, question, answer);

            editCardModal.style.display = 'none';
            questionInput.value = '';
            answerInput.value = '';

            await loadCardsForCurrentCollection();
            setCardClickHandler();

            editMode = false;
            toggleEditMode(editMode);
        } else {
            alert('Please enter both sides.');
        }
    });


    async function loadCardsForCurrentCollection() {
        try {
            console.log('Loading cards...');
            const response = await fetch(`http://localhost:3000/collections/${currentCollectionId}/cards`);
            if (response.ok) {
                console.log('Cards loaded successfully');
                const cards = await response.json();
                const cardContainer = document.getElementById('my-card-container');
                if (cardContainer) {
                    cardContainer.innerHTML = '';
                    cards.forEach(card => {
                        const cardElement = document.createElement('div');
                        cardElement.classList.add('custom-card');
                        cardElement.setAttribute('data-card-id', card._id);
                        const frontContent = document.createElement('div');
                        frontContent.classList.add('front-content');
                        frontContent.textContent = card.question;
                        const backContent = document.createElement('div');
                        backContent.classList.add('back-content');
                        backContent.textContent = card.answer;
                        cardElement.appendChild(frontContent);
                        cardElement.appendChild(backContent);
                        cardContainer.appendChild(cardElement);
                    });
    
                    setCardClickHandler();
                } else {
                    console.error('Card container not found');
                }
            } else {
                console.error('Failed to fetch cards for collection:', currentCollectionId);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    const setCollectionClickListener = (collection) => {
        const collectionId = collection.getAttribute('data-collection-id');

        collection.addEventListener('click', function (event) {
            const clickedElement = event.target;

            if (clickedElement.closest('.collection')) {
                currentCollectionId = this.getAttribute('data-collection-id');

                if (currentCollectionId) {
                    localStorage.setItem('currentCollectionId', currentCollectionId);

                    loadCardsForCurrentCollection();
                } else {
                    console.error('data-collection-id attribute is missing');
                }
            } else {
                console.error('Clicked element is not a collection:', clickedElement);
            }
        });
    };

    document.querySelectorAll('.collection').forEach(setCollectionClickListener);

    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.classList && node.classList.contains('collection')) {
                        setCollectionClickListener(node);
                    }
                });
            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    async function createCard(collectionId, question, answer) {
        try {
            const token = getCookie('token');
            if (!token) {
                console.error('No token found');
                return;
            }

            const response = await fetch(`http://localhost:3000/collections/${collectionId}/cards`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    question: question,
                    answer: answer
                })
            });

            if (response.ok) {
                const newCard = await response.json();
                await loadCardsForCurrentCollection();
            } else {
                console.error('Failed to create card');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

function setCardClickHandler() {
    const cardContainers = document.querySelectorAll('.custom-card');
    cardContainers.forEach(container => {
        container.addEventListener('click', (event) => {
            flipCardHandler(event); 
        });
    });
}


    function flipCardHandler(event) {
        const card = event.currentTarget;
        card.classList.toggle('flipped-card');
    }

    function deleteCardHandler(event) {
        event.stopPropagation();
        const frontContentElement = event.currentTarget.querySelector('.front-content');
        const cardId = event.currentTarget.getAttribute('data-card-id');
        const collectionId = currentCollectionId;
    
        if (collectionId !== null && cardId !== null) {
            deleteCard(collectionId, cardId);
        } else {
            console.error('wrong id or card');
        }
    }
    

    async function deleteCard(collectionId, cardId) {
        try {
            const token = getCookie('token');
            if (!token) {
                console.error('No token found');
                return;
            }

            const response = await fetch(`http://localhost:3000/collections/${collectionId}/cards/${cardId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                await loadCardsForCurrentCollection();
            } else {
                console.error('Failed to delete card');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    async function updateCardInCurrentCollection(cardId, question, answer) {
        try {
            const token = getCookie('token');
            if (!token) {
                console.error('No token found');
                return;
            }

            const response = await fetch(`http://localhost:3000/collections/${currentCollectionId}/cards/${cardId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ question, answer })
            });

            if (response.ok) {
                await loadCardsForCurrentCollection();
                setCardClickHandler(); 
            } else {
                console.error('Failed to update card');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    function toggleDeletionMode(enable) {
        const cardElements = document.querySelectorAll('.custom-card');
        cardElements.forEach(cardElement => {
            const frontContentElement = cardElement.querySelector('.front-content');
            if (enable) {
                frontContentElement.classList.add('deletion-mode');
                cardElement.removeEventListener('click', flipCardHandler);
                cardElement.addEventListener('click', deleteCardHandler);
            } else {
                frontContentElement.classList.remove('deletion-mode');
                cardElement.removeEventListener('click', deleteCardHandler);
                cardElement.addEventListener('click', flipCardHandler);
            }
        });
    }

    function toggleEditMode(enable) {
        const cardElements = document.querySelectorAll('.custom-card');
        cardElements.forEach(cardElement => {
            const frontContentElement = cardElement.querySelector('.front-content');
            if (enable) {
                frontContentElement.classList.add('edit-mode');
                cardElement.removeEventListener('click', flipCardHandler);
                cardElement.addEventListener('click', openEditCardModalHandler);
            } else {
                frontContentElement.classList.remove('edit-mode');
                cardElement.removeEventListener('click', openEditCardModalHandler);
                cardElement.addEventListener('click', flipCardHandler);
            }
        });
    }

    function openEditCardModalHandler(event) {
        const cardElement = event.currentTarget;
        openEditCardModal(cardElement);

        const editModalInputs = document.querySelectorAll('#edit-card-modal input');
        editModalInputs.forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const applyButton = document.getElementById('edit-card-apply');
                    applyButton.click(); 
                }
            });
        });
    }


    function openEditCardModal(cardElement) {
        const cardId = cardElement.getAttribute('data-card-id');
        const question = cardElement.querySelector('.front-content').textContent;
        const answer = cardElement.querySelector('.back-content').textContent;
    
        document.getElementById('edit-card-question').value = question;
        document.getElementById('edit-card-answer').value = answer;
        currentEditCardId = cardId;
    
        editCardModal.style.display = 'block';
    
        const editApplyButton = document.getElementById('edit-card-apply');
        editApplyButton.addEventListener('click', async () => {
            const questionInput = document.getElementById('edit-card-question');
            const answerInput = document.getElementById('edit-card-answer');
    
            const question = questionInput.value.trim();
            const answer = answerInput.value.trim();
    
            if (question && answer && currentEditCardId) {
                await updateCardInCurrentCollection(currentEditCardId, question, answer);
    
                editCardModal.style.display = 'none';
                questionInput.value = '';
                answerInput.value = '';
    
                await loadCardsForCurrentCollection();
    
                editMode = false;
                toggleEditMode(editMode);
                setCardClickHandler();
            } else {
                alert('Please enter both question and answer.');
            }
        });
    }
    
});
