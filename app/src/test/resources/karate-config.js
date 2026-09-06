function fn() {
    var config = {
        baseUrl: 'https://fakestoreapi.com'
    };

    karate.configure('logPrettyRequest', true);
    karate.configure('logPrettyResponse', true);

    return config;
}