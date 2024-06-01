// Определение модуля с функцией для обновления кнопок "Log In" и "Log Out"
module.exports.updateAuthButtons = function(req, res, next) {
    // Проверка аутентификации пользователя и обновление интерфейса соответственно
    if (req.session.isAuthenticated) {
      // Если пользователь аутентифицирован, скрываем кнопку "Log In" и отображаем кнопку "Log Out"
      res.locals.isAuthenticated = true;
    } else {
      // Если пользователь не аутентифицирован, отображаем кнопку "Log In" и скрываем кнопку "Log Out"
      res.locals.isAuthenticated = false;
    }
    next();
  };