async function login() {
    try {
      const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: 'example_user', password: 'example_password' })
      });
      const data = await response.json();
      const token = data.token;
      if (!token) {
        console.error('Token not found in login response');
        return;
      }
      
      // Получаем айди пользователя
      const userId = await fetchUserId(token);
      
      // Получаем данные о пользователе по его айди
      fetchUserState(userId);
  
      // Теперь у вас есть данные о пользователе в переменной userData
      console.log('User data:', userData);
  
      // Далее можно выполнить необходимые действия с данными о пользователе
      // Например, обновить интерфейс или выполнить другие операции
    } catch (error) {
      console.error('Error:', error);
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
  
  // Функция для извлечения токена из куки
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }
  
  // Получение токена из куки
  const token = getCookie('token');
  if (token) {
    // Функция для обработки получения userId
    const handleUserId = async (token) => {
      try {
        // Выполнение запроса на получение идентификатора пользователя
        const userId = await fetchUserId(token);
        console.log('User ID:', userId);
  
        // Добавьте здесь код, который должен выполниться после успешного получения userId
  
      } catch (error) {
        console.error('Error fetching user ID:', error);
      }
    };
  
    // Вызываем функцию для обработки userId
    handleUserId(token);
  } else {
    // Редирект на страницу входа или другие действия для неаутентифицированных пользователей
  }
  
  
  async function fetchUserId(token) {
    try {
      console.log('Token:', token); // Добавляем эту строку для отладки
      // Декодируем токен, чтобы получить информацию о пользователе
      const decodedToken = decodeToken(token);
      console.log('Decoded token:', decodedToken); // Добавляем эту строку для отладки
      const userId = decodedToken.userId;
  
      // Проверяем формат userId в запросе
      if (!isValidObjectId(userId)) {
        throw new Error('Invalid userId format');
      }
  
      const response = await fetch(`http://localhost:3000/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Передаем токен в заголовке запроса
        }
      });
  
      // Добавляем эту строку для отладки
      console.log('Request headers:', response.headers);
  
      if (!response.ok) {
        throw new Error('Failed to fetch user ID: ' + response.statusText);
      }
      
      const data = await response.json();
      const fetchedUserId = data.userId;
      return fetchedUserId;
    } catch (error) {
      console.error('Error fetching user ID:', error);
    }
  }
  
  
  // Функция для проверки формата ObjectId
  function isValidObjectId(id) {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    return objectIdRegex.test(id);
  }
  
  
  
  
  document.getElementById('log-out').addEventListener('click', logout);
  function logout() {
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    updateUI();
    location.reload();

    // clickRecommendationsButton(); // Программно переключаем вкладку на "Recommendations"
  }

  function showWelcomeContainer() {
    const token = getCookie('token');
    if (!token) {
      // Создаем контейнер
      const welcomeContainer = document.createElement('div');
      welcomeContainer.id = 'welcome-container';
      
      // Добавляем текст и кнопки
      welcomeContainer.innerHTML = `
      <div id="icons-container">
      <div class="icon"></div>
      <div class="icon"></div>
      <div class="icon"></div>
      <div class="icon"></div>
      <div class="icon"></div>
    </div>
      <h2>Welcome to CardFlip</h2> 
      <h1>THIS APPLICATION ALLOWS YOU TO:</h1>
      <ul>
        <li>• Create and manage your card collections</li>
        <li>• Explore new topics</li>
        <li>• Memorize important facts</li>
      </ul>
      <div class="button-container">
      <button id="log-in"><a href="login.html">Log In</a></button>
      <button id="register"><a href="register.html">Register</a></button>
    </div>
    `;
    
      
      // Добавляем контейнер в тело страницы
      document.body.appendChild(welcomeContainer);
    }
  }
  
  // Вызываем функцию для отображения контейнера при загрузке страницы
  window.addEventListener('DOMContentLoaded', () => {
    showWelcomeContainer();
    updateUI(); // Вызываем функцию для обновления интерфейса

  });
  
  
  function updateUI() {
    const token = getCookie('token');
    const recs = document.getElementById('recs');
    const loginBtn = document.getElementById('log-in');
    const logoutBtn = document.getElementById('log-out');
    const game = document.getElementById('game-mode');
    const newCollectionBtn = document.getElementById('add-collection');
    const collectionsContainer = document.getElementById('collection-container');
    const myCollectionsBtn = document.querySelector('.my-collections button');
    const collectionsBtn = document.querySelector('.collection button');

  
    if (token) {
      recs.style.display = 'inline-block';
      loginBtn.style.display = 'none';
      logoutBtn.style.display = 'inline-block';
      game.style.display = 'inline-block';
      newCollectionBtn.style.display = 'inline-block'; // Показываем кнопку "New Collection"
      collectionsContainer.style.display = 'grid'; // Показываем контейнер кнопки "My Collections"
      myCollectionsBtn.style.display = 'inline-block'; // Показываем кнопку "My Collections"
    } else {
      // loginBtn.style.display = 'none';
      recs.style.display = 'none';
      loginBtn.style.display = 'inline-block';
      logoutBtn.style.display = 'none';
      game.style.display = 'none';
      newCollectionBtn.style.display = 'none'; // Скрываем кнопку "New Collection"
      collectionsContainer.style.display = 'none'; // Скрываем контейнер кнопки "My Collections"
      myCollectionsBtn.style.display = 'none'; // Скрываем кнопку "My Collections"
      collectionsBtn.style.display = 'none';
    }
  }

  // function showWelcomeContainer() {
  //   const token = getCookie('token');
  //   if (!token) {
  //     // Создаем контейнер
  //     const welcomeContainer = document.createElement('div');
  //     welcomeContainer.id = 'welcome-container';
      
  //     // Добавляем текст и кнопки
  //     welcomeContainer.innerHTML = `
  //     <h2>Welcome to Cardify!</h2> 
  //     <h1>THIS APPLICATION ALLOWS YOU TO:</h1>
  //     <ul>
  //       <li>• Create and manage your card collections</li>
  //       <li>• Explore new topics</li>
  //       <li>• Memorize important facts</li>
  //     </ul>
  //     <div class="button-container">
  //     <button id="log-in"><a href="login.html">Log In</a></button>
  //     <button id="register"><a href="register.html">Register</a></button>
  //   </div>
  //   `;
    
      
  //     // Добавляем контейнер в тело страницы
  //     document.body.appendChild(welcomeContainer);
  //   }
  // }
