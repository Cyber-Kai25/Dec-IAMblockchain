async function runStressTest() {
    const totalRequests = 5000;
    console.log(`Sending ${totalRequests} simultaneous requests...`);

    const startTime = Date.now();
    let promises = [];

    for (let i = 0; i < totalRequests; i++) {
        // Using native fetch instead of axios
        promises.push(
            fetch('http://192.168.8.103:8080/keyPair')
                .then(res => res.status)
                .catch(err => 500)
        );
    }

    const results = await Promise.all(promises);
    const timeTaken = Date.now() - startTime;

    const successes = results.filter(status => status === 200).length;

    console.log(`Test finished in ${timeTaken}ms.`);
    console.log(`Successful requests: ${successes} / ${totalRequests}`);
    console.log(`Requests per second: ${(totalRequests / (timeTaken / 1000)).toFixed(2)}`);
}

runStressTest();
