requirejs.config({
    baseUrl: 'js', // Путь к вашим модулям JavaScript
    paths: {
        // Определите пути к модулям
        'express': './express',
        'body-parser': './body-parser',
        'mongoose': './mongoose',
        'cors': './cors'
        // Добавьте пути для других модулей, если необходимо
    }
});
