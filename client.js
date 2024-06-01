
document.querySelector('.game-mode button').addEventListener('click', () => {
  window.location.href = 'gamemode.html'; 
});


async function fetchAndRenderCollections() {
  try {
    const token = getCookie('token'); 

    const fetchRecommendedCollections = async () => {
      const response = await fetch('http://localhost:3000/collections', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      if (response.ok) {
        const collections = await response.json();
        const collectionContainer = document.getElementById('collection-container');
        collections.forEach(collection => {
          if (collection.isRecommended) {
            renderCollection(collection, collectionContainer);
          }
        });
        collectionContainer.style.display = 'grid'; 
        setCollectionClickHandler(); 
      } else {
        console.error('Failed to fetch recommended collections');
      }
    };

    const fetchUserCollections = async () => {
      const userId = await fetchUserId(token); 
      const response = await fetch(`http://localhost:3000/users/${userId}/collections`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const collections = await response.json();
        const myCollectionsContainer = document.getElementById('my-collections-container');
        myCollectionsContainer.innerHTML = ''; 
        collections.forEach(collection => renderCollection(collection, myCollectionsContainer));

      myCollectionsContainer.addEventListener('mouseover', (event) => {
      const target = event.target;
      if (target.classList.contains('collection')) {
        target.querySelector('.collection-options').style.display = 'block';
      }
      });

      myCollectionsContainer.addEventListener('mouseout', (event) => {
      const target = event.target;
      if (target.classList.contains('collection')) {
        target.querySelector('.collection-options').style.display = 'none';
      }
      });
      } else {
        console.error('Failed to fetch user collections');
      }
      };

    const isActiveMyCollections = document.querySelector('.my-collections button').classList.contains('active');
    if (isActiveMyCollections) {
      await fetchUserCollections();
    } else {
      await fetchRecommendedCollections();
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}


window.addEventListener('DOMContentLoaded', () => {
  const token = getCookie('token');
  if (token) {
    fetchAndRenderCollections(); 
  } else {
    console.error('Token not found. User may not be authenticated.');
  }
});

function clickRecommendationsButton() {
  const token = getCookie('token');
  if (token) {
    const recsBtn = document.querySelector('.recs button');
    if (recsBtn) {
      recsBtn.click(); 
    } else {
      console.error('Recommendations button not found');
    }
  } else {
    console.log('User is not authenticated. Skipping recommendations button click.');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  clickRecommendationsButton(); 
});



function renderCollection(collection, container) {
  if (!container) {
    console.error('Container not found');
    return;
  }

  let collectionElement = container.querySelector(`.collection[data-collection-id="${collection._id}"]`);

  if (!collectionElement) {
    collectionElement = document.createElement('div');
    collectionElement.classList.add('collection');
    collectionElement.setAttribute('data-collection-id', collection._id);

    container.appendChild(collectionElement);
  }

  const collectionNameButton = document.createElement('button');
  collectionNameButton.textContent = collection.name;

  if (collectionElement.querySelector('button')) {
    collectionElement.replaceChild(collectionNameButton, collectionElement.querySelector('button'));
  } else {
    collectionElement.appendChild(collectionNameButton);
  }

  if (container.id === 'my-collections-container') {
    const optionsContainer = collectionElement.querySelector('.collection-options');

    if (!optionsContainer) {
      const optionsContainer = document.createElement('div');
      optionsContainer.classList.add('collection-options');
      optionsContainer.style.display = 'none';

      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'delete';
      deleteButton.addEventListener('click', async (event) => {
        event.stopPropagation();
        try {
          const response = await fetch(`http://localhost:3000/collections/${collection._id}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
          });
          if (response.ok) {
            container.removeChild(collectionElement);
          } else {
            console.error('Failed to delete collection');
          }
        } catch (error) {
          console.error('Error:', error.message);
        }
      });

      const renameButton = document.createElement('button');
      renameButton.textContent = 'rename';
      renameButton.addEventListener('click', (event) => {
        event.stopPropagation();
        
  const inputField = document.createElement('input');
  inputField.type = 'text';
  inputField.value = collection.name;
  inputField.setSelectionRange(inputField.value.length, inputField.value.length); 

  collectionElement.replaceChild(inputField, collectionNameButton);

  const finishEditing = async (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const newName = inputField.value.trim();
      if (newName !== '') {
        await updateCollectionName(collection._id, newName);
      }
    }
    renderCollection(collection, container);
  };

  inputField.addEventListener('keydown', finishEditing);
  inputField.focus(); 
});

      optionsContainer.appendChild(deleteButton);
      optionsContainer.appendChild(renameButton);

      collectionElement.appendChild(optionsContainer);

      collectionElement.addEventListener('mouseenter', () => {
        optionsContainer.style.display = 'block';
      });

      optionsContainer.addEventListener('mouseenter', () => {
        optionsContainer.style.display = 'block';
      });

      optionsContainer.addEventListener('mouseleave', () => {
        optionsContainer.style.display = 'none';
      });

      collectionElement.addEventListener('mouseleave', () => {
        optionsContainer.style.display = 'none';
      });
    }
  }

  if (collection.isActive) {
    collectionElement.setAttribute('data-active', 'true');
  }
}


async function updateCollectionName(collectionId, newName) {
  try {
    const response = await fetch(`http://localhost:3000/collections/${collectionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name: newName })
    });
    if (!response.ok) {
      console.error('Failed to update collection name');
    } else {
      const collectionElement = document.querySelector(`.collection[data-collection-id="${collectionId}"]`);
      if (collectionElement) {
        collectionElement.querySelector('button').textContent = newName.trim();
      }
      fetchAndRenderCollections(); 
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}


function setCardClickHandler() {
  const cardContainers = document.querySelectorAll('.custom-card');
  cardContainers.forEach(container => {
      container.addEventListener('click', () => {
          container.classList.toggle('flipped-card');
      });
  });
}



function setCollectionClickHandler() {
  const collectionContainers = document.querySelectorAll('.collection');
  collectionContainers.forEach(container => {
    container.addEventListener('click', async (event) => {
      event.stopPropagation(); 
      
      document.querySelectorAll('.collection').forEach(el => el.classList.remove('active'));

      container.classList.add('active');
      
      const collectionId = container.getAttribute('data-collection-id');
      const collectionContainer = document.getElementById('collection-container');
      const cardContainer = document.getElementById('card-container');
      const buttonsCardContainer = document.querySelector('.buttons-card');

      if (cardContainer && buttonsCardContainer) {
        cardContainer.innerHTML = ''; 
        buttonsCardContainer.style.display = 'flex'; 

        try {
          const response = await fetch(`http://localhost:3000/collections/${collectionId}/cards`);
          if (response.ok) {
            const cards = await response.json();
            cards.forEach(card => {
              const cardElement = document.createElement('div');
              cardElement.classList.add('custom-card'); 
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

            collectionContainer.style.display = 'none';
            cardContainer.style.display = 'grid';
            cardContainer.scrollIntoView({ behavior: "smooth", block: "start" });
            setCardClickHandler();
          } else {
            console.error('Failed to fetch cards for collection:', collectionId);
            console.error('Collection container or card container not found');
          }
        } catch (error) {
          console.error('Error:', error);
        }
      } else {
        console.error('Collection container or card container not found');
        console.error('Card container or buttons-card container not found');
      }
    });
  });
}


function setMyCollectionsContainerClickHandler() {
  const myCollectionsContainer = document.getElementById('my-collections-container');
  const token = getCookie('token'); 

  if (myCollectionsContainer) {
    myCollectionsContainer.addEventListener('click', async (event) => {
      const target = event.target.closest('.collection');
      if (target) {
        const cardContainer = document.getElementById('my-card-container');
        if (cardContainer && cardContainer.children.length > 0) {
          return; 
        }

        try {
          const collectionId = target.getAttribute('data-collection-id');
          if (!collectionId) {
            console.error('No collection ID found on the clicked collection');
            return;
          }

          const response = await fetch(`http://localhost:3000/collections/${collectionId}/cards`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const cards = await response.json();

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

              myCollectionsContainer.style.display = 'none';
              cardContainer.style.display = 'grid';
              setCardClickHandler();

              const buttonsCardContainer = document.getElementById('buttons-card');
              if (buttonsCardContainer) {
                buttonsCardContainer.style.display = 'flex';
              } else {
                console.error('Buttons card container not found inside my card container');
              }
            } else {
              console.error('Card container not found');
            }
          } else {
            console.error('Failed to fetch cards for collection:', collectionId);
          }
        } catch (error) {
          console.error('Error:', error);
        }
      }
    });
  } else {
    console.error('My collections container not found');
  }
}




document.addEventListener('DOMContentLoaded', () => {
  setMyCollectionsContainerClickHandler();
});

function showCreateCardButton(container) {
  if (container) {
    const createCardButton = document.createElement('button');
    createCardButton.textContent = 'Create Flashcard';
    createCardButton.id = 'create-card-button';
    createCardButton.addEventListener('click', () => {
    });
    container.appendChild(createCardButton);
  } else {
    console.error('Card container not found');
  }
}

setMyCollectionsContainerClickHandler();


function setReturnToMainPageButtonClickHandler() {
  const returnToMainPageButton = document.getElementById('return-to-main-page');
  if (returnToMainPageButton) {
    returnToMainPageButton.addEventListener('click', () => {
      const collectionContainer = document.getElementById('collection-container');
      const cardContainer = document.getElementById('card-container');
      if (collectionContainer && cardContainer) {
        collectionContainer.style.display = 'grid';
        cardContainer.style.display = 'none';
      }
    });
  }
}


document.addEventListener('DOMContentLoaded', () => {
  setMyCollectionsContainerClickHandler();

  setReturnToMainPageButtonClickHandler();
});

document.querySelector('.log-in button').addEventListener('click', login);

updateUI();


window.addEventListener('DOMContentLoaded', fetchAndRenderCollections);

window.addEventListener('DOMContentLoaded', () => {
  const addCollectionBtn = document.getElementById('add-collection');
  const collectionsContainer = document.getElementById('my-collections-container');

  addCollectionBtn.addEventListener('click', async () => {
    const newCollection = document.createElement('div');
    newCollection.className = 'collection';

    const collectionOptions = document.createElement('div');
    collectionOptions.className = 'collection-options';
    collectionOptions.innerHTML = '<button>delete</button><button>rename</button>';
    newCollection.appendChild(collectionOptions);

    const collectionNameInput = document.createElement('input');
    collectionNameInput.className = 'collection-name-input';
    collectionNameInput.placeholder = 'New Collection';
    newCollection.appendChild(collectionNameInput);

    collectionNameInput.addEventListener('keypress', async function (e) {
      if (e.key === 'Enter') {
        const collectionName = collectionNameInput.value;
        if (collectionName) {
          try {
            const token = getCookie('token'); 
            const userId = await fetchUserId(token); 
            const response = await fetch(`http://localhost:3000/users/${userId}/collections`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ name: collectionName })
            });
            if (response.ok) {
              collectionNameInput.remove(); 
              const collectionNameDiv = document.createElement('div');
              collectionNameDiv.className = 'collection-name';
              collectionNameDiv.textContent = collectionName;
              newCollection.appendChild(collectionNameDiv);

              collectionOptions.querySelector('button:nth-child(1)').addEventListener('click', () => {
                collectionsContainer.removeChild(newCollection);
              });
              collectionOptions.querySelector('button:nth-child(2)').addEventListener('click', () => {
                const currentName = collectionNameDiv.textContent;
                const renameInput = document.createElement('input');
                renameInput.className = 'collection-name-input';
                renameInput.value = currentName;
                collectionNameDiv.replaceWith(renameInput);
                renameInput.addEventListener('keypress', async function (e) {
                  if (e.key === 'Enter') {
                    const newName = renameInput.value;
                    if (newName) {
                      renameInput.replaceWith(collectionNameDiv);
                      collectionNameDiv.textContent = newName;
                    }
                  } 
                });
              });

              fetchAndRenderCollections();
              collectionsContainer.appendChild(newCollection);
            } else {
              console.error('Failed to create collection');
            }
          } catch (error) {
            console.error('Error:', error.message);
          }
        }
      }
    });

    collectionsContainer.appendChild(newCollection);
    collectionNameInput.focus(); 
  });
});



document.addEventListener('DOMContentLoaded', () => {
  const cardContainer = document.getElementById('card-container');
  const mycardContainer = document.getElementById('my-card-container');
const myCollectionsContainer = document.getElementById('my-collections-container');
const recommendedContainer = document.getElementById('collection-container'); 

const myCollectionsBtn = document.querySelector('.my-collections button');
const recsBtn = document.querySelector('.recs button');
const buttonsCardContainer = document.querySelector('.buttons-card');

myCollectionsBtn.addEventListener('click', () => {
  myCollectionsContainer.style.display = 'grid';
  mycardContainer.style.display = 'none';
  recommendedContainer.style.display = 'none';
  cardContainer.style.display = 'none';
  myCollectionsBtn.classList.add('active');
  recsBtn.classList.remove('active');

  setMyCollectionsContainerClickHandler();


    const cardButtons = document.querySelectorAll('.buttons-card button');
    cardButtons.forEach(button => {
      button.style.display = 'none';
    });

    const cardButton = document.querySelectorAll('.buttons-card');
    cardButton.forEach(button => {
      button.style.display = 'none';
    });
  const buttonsCardContainer = document.querySelector('.buttons-card');
  const buttons = buttonsCardContainer.querySelectorAll('button');
  buttons.forEach(button => {
    button.style.display = 'inline-block';
  });
});


recsBtn.addEventListener('click', () => {
  recommendedContainer.style.display = 'grid';
  myCollectionsContainer.style.display = 'none';
  mycardContainer.style.display = 'none';
  cardContainer.style.display = 'none';
  recsBtn.classList.add('active');
  myCollectionsBtn.classList.remove('active');

  const cardButtons = document.querySelectorAll('.buttons-card button');
  cardButtons.forEach(button => {
    button.style.display = 'none';
  });
  const cardButton = document.querySelectorAll('.buttons-card');
  cardButton.forEach(button => {
    button.style.display = 'none';
  });

  const returnToMainPageButton = document.getElementById('return-to-main-page');
  if (returnToMainPageButton) {
    returnToMainPageButton.style.display = 'inline-block';
  }
});

});

function saveActiveTab(tabName) {
  localStorage.setItem('activeTab', tabName);
}

function restoreActiveTab() {
  const activeTab = localStorage.getItem('activeTab');
  if (activeTab === 'myCollections') {
    const myCollectionsBtn = document.querySelector('.my-collections button');
    myCollectionsBtn.classList.add('active');
  }
}

document.getElementById('my-collections').addEventListener('click', () => {
  saveActiveTab('myCollections');
});

document.addEventListener('DOMContentLoaded', () => {
  restoreActiveTab();
});

 





