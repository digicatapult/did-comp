const axios = require('axios');
const { exec } = require('child_process');
const fs = require('fs');
const util = require('util');
const execPromise = util.promisify(exec);
const express = require('express');

// Create an Express application
const app = express();
const port = 3300;

app.get('/', (req, res) => {
    res.send('Broker.js Server is running');
});
  
app.listen(port, () => {
    console.log(`Broker.js server listening at http://127.0.0.1:${port}`);
});

let lastProcessedMessage = ''; // Track the last processed message

const isSqlQuery = (message) => {
    // Simple check for SQL query based on the presence of common SQL keywords
    // This is a very basic check and might need to be extended based on your specific requirements
    const sqlKeywords = ["SELECT", "INSERT", "UPDATE", "DELETE", "CREATE", "DROP", "ALTER"];
    return sqlKeywords.some(keyword => message.toUpperCase().includes(keyword));
};

const sanitizeAndExtractQueryResult = (response) => {
    // Attempt to isolate the "Output:" section more accurately
    const outputStartMarker = "Output:";
    const outputStart = response.indexOf(outputStartMarker);
    if (outputStart !== -1) {
        // Find the end of the "Output:" section if it's specifically marked or use the end of response
        const outputEnd = response.indexOf("\n\n", outputStart); // Adjust if your output structure has a specific end marker
        let queryResult = response.substring(outputStart + outputStartMarker.length, outputEnd !== -1 ? outputEnd : undefined).trim();

        // Remove non-printable characters and unnecessary whitespace
        queryResult = queryResult.replace(/[\u0000-\u001F\u007F-\u009F]/g, ""); // Regex to remove control characters
        queryResult = queryResult.replace(/\n+/g, "\n").trim(); // Replace multiple newlines with a single one and trim

        return queryResult;
    }
    return ''; // Return an empty string if "Output:" section is not found to indicate no valid output was extracted
};

const executeDockerCommands = async (message) => {
    console.log("Processing latest message:", message); // Log the latest message being processed

    const filePath = './broker/received.sql';
    fs.writeFileSync(filePath, message); // Writing directly to the /broker folder

    await execPromise('docker cp ./broker/received.sql smcql_broker:/home/smcql/smcql/received.sql');
    const { stdout } = await execPromise('docker exec smcql_broker /bin/bash -c "./build_and_execute.sh ./received.sql testDB1 testDB2" > ./broker/response.txt');
    
    console.log("Returning response:");
    const response = fs.readFileSync('./broker/response.txt', 'utf8'); // Reading response from the /broker folder
    console.log(response);

    return response;
};

const main = async () => {
    const maxAttempts = 10; // Maximum number of attempts before giving up
    let attempt = 0; // Current attempt counter
    let delay = 2000; // Initial delay in milliseconds

    while (attempt < maxAttempts) {
        try {
            const response = await axios.get('http://127.0.0.1:3200/get-latest-message');
            if (response && response.data && response.data.messageContent && isSqlQuery(response.data.messageContent)) {
                if (response.data.messageContent !== lastProcessedMessage) {
                    console.log('Latest SQL query received:', response.data.messageContent);
                    const dockerResponse = await executeDockerCommands(response.data.messageContent);
                    // Optionally process dockerResponse if needed
                    lastProcessedMessage = response.data.messageContent; // Update lastProcessedMessage
                    // After executing Docker commands and getting the response, send it using sendMessage
                    await sendMessage(dockerResponse);
                } else {
                    console.log('No new SQL query received. Waiting for new messages...');
                }
            } else {
                console.log('Received message is not an SQL query. Ignoring...');
            }
            attempt = 0; // Reset attempt counter after successful processing or if the same message is received
        } catch (error) {
            // ...error handling...
        }
        await new Promise(resolve => setTimeout(resolve, delay)); // Wait before the next polling attempt
    }
};

const sendMessage = async (response) => {
    console.log("Attempting to send message to /return-response endpoint");
    const sanitizedResponse = sanitizeAndExtractQueryResult(response); // Sanitize the response
    try {
        const res = await axios.post('http://127.0.0.1:3200/return-response', {
            messageContent: sanitizedResponse // Use sanitized response
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log('Message sent successfully:', res.data);
    } catch (error) {
        console.error('Failed to send message. Error:', error.response ? error.response.data : error.message);
    }
};

main().catch(error => {
    // Handle any errors that occur during the fetching of the latest message
    console.error('An error occurred:', error);
});
