async function updateUserState(currentCollectionId) {
    try {
      const token = getCookie('token'); 
      const response = await fetch('http://localhost:3000/users/state', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentCollectionId })
      });
      if (response.ok) {
        console.log('User state updated successfully');
      } else {
        console.error('Failed to update user state');
      }
    } catch (error) {
      console.error('Error updating user state:', error);
    }
  }
  
  document.addEventListener('DOMContentLoaded', async () => {
    const activeCollectionId = sessionStorage.getItem('activeCollectionId');
    if (activeCollectionId) {
      await updateUserState(activeCollectionId);
    }
  });
  