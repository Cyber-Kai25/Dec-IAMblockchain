async function runStressTest() {
    const totalRequests = 500;
    console.log(`Sending ${totalRequests} simultaneous VERIFICATION requests...`);

    const startTime = Date.now();
    let promises = [];

    // PASTE YOUR REAL CAPTURED DATA HERE:
    const payload = {
        credDID: "did:cred:56d1094d6b5247f497dc01c4255005a12133b539",
        ownerDID: "did:ethr:0x4cee9428a556c6edeae71e428d39f86f737230bf",
        receiverDID: "did:ethr:0x91787F87d141bAdA645f63013caBf29b738C0179",
        hash: "4c69999e46f7b414d5f209248d2ec036b74fed184c434afa672f84c34031441b",
        sign: "f3e7757e42b451244ce281694949ec51f2485fe30a4d859eb07e6bab47e17e7a15c5d7b05e4833ec5ced680b05957023d4c849cedb3462553d22e67d8ace4a62"
    };

    for (let i = 0; i < totalRequests; i++) {
        promises.push(
            fetch('http://192.168.8.103:8080/getCredential', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
                .then(res => res.status)
                .catch(err => 500)
        );
    }

    const results = await Promise.all(promises);
    const timeTaken = Date.now() - startTime;

    const successes = results.filter(status => status === 200).length;
    const failures = results.filter(status => status !== 200).length;

    console.log(`Test finished in ${timeTaken}ms.`);
    console.log(`Successful verifications: ${successes} / ${totalRequests}`);
    console.log(`Failed verifications: ${failures} / ${totalRequests}`);
    console.log(`Requests per second: ${(totalRequests / (timeTaken / 1000)).toFixed(2)}`);
}

runStressTest();
