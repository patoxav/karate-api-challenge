package api;

import com.intuit.karate.junit5.Karate;

class FakeStoreRunner {

    @Karate.Test
    Karate testFakeStore() {
        return Karate.run("classpath:api/fakestore.feature");
    }
}