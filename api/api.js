// Import required packages
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');

// Create an Express application
const app = express();
const port = 3200;

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Route for serving your HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Serve the CSS file
app.get('/css/styles.css', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/css/styles.css'));
  res.setHeader('Content-Type', 'text/css');
});

// Serve the api.js file with the appropriate Content-Type from the "api" folder
app.get('/api.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'api/api.js'));
  res.setHeader('Content-Type', 'text/javascript');
});

// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors());

// Enable JSON Body Parser
app.use(bodyParser.json());

// Global variables to store data
let responseCreateInvitationGlobal = "";
let invitationBodyGlobal = "";
let connectionIdInvitationGlobal = "";
let outOfBandRecordIdGlobal = "";
let responseGetConnectionsGlobal = "";
let connectionIdGlobal = "";

// Define an endpoint to create an invitation
app.get("/create-invitation", async (req, res) => {
  try {
    // Step 1: Prepare the JSON object with the required information as the request data
    const data = JSON.stringify({
      handshake: true,
      handshakeProtocols: ["https://didcomm.org/didexchange/1.x"],
      multiUseInvitation: true,
      autoAcceptConnection: true
    });

    // Step 2: Configure an HTTP POST request to create an invitation
    const configCreateInvitation = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'http://127.0.0.1:3000/oob/create-invitation',
      headers: {
        'Content-Type': 'application/json',
      },
      data: data, // Updated to include the specified information
    };
    console.log("Invitation message", configCreateInvitation);

    // Step 3: Send the request to create an invitation
    responseCreateInvitationGlobal = await axios.request(configCreateInvitation);
    console.log("Invitation response", responseCreateInvitationGlobal.data);

    // Step 4: Extract the invitation from the response
    invitationBodyGlobal = responseCreateInvitationGlobal.data.invitationUrl;
    console.log("Invitation body", invitationBodyGlobal);

    // Step 5: Extract the invitation from the response
    outOfBandRecordIdGlobal = responseCreateInvitationGlobal.data.outOfBandRecord.id;
    console.log("OOB ID", outOfBandRecordIdGlobal);

    // Step 6: Return the response data
    res.json(responseCreateInvitationGlobal.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Define an endpoint to receive an invitation
app.get("/receive-invitation", async (req, res) => {
  try {
    // Step 1: Check if an invitation is available
    if (!invitationBodyGlobal) {
      // Handle the case where invitationBodyGlobal is not set
      res.status(500).json({ error: 'Invitation data is not available.' });
      return;
    }

    // Step 2: Prepare the data with the invitationUrl
    const postData = JSON.stringify({
      invitationUrl: invitationBodyGlobal
    });

    // Configure an HTTP POST request to receive the invitation
    const receiveInvitationConfig = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `http://127.0.0.1:3001/oob/receive-invitation-url`,
      headers: {
        'Content-Type': 'application/json',
      },
      data: postData, // Updated to use postData
    };

    // Step 3: Send the request to receive the invitation
    const receiveInvitationResponse = await axios.request(receiveInvitationConfig);
    console.log("Accept invitation response", receiveInvitationResponse.data);

    // Assuming receiveInvitationResponse.data contains the whole structure you provided
    const connectionId = receiveInvitationResponse.data.connectionRecord.id;
    console.log("Connection ID from invitation response", connectionId);

    // Set the connection ID globally
    connectionIdInvitationGlobal = connectionId;

    // Step 4: Return the response data
    res.json(receiveInvitationResponse.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Define an endpoint to retrieve the connection ID based on the OOB ID
app.get("/get-connections", async (req, res) => {
  try {
    const configGetConnections = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `http://127.0.0.1:3000/connections?outOfBandId=${outOfBandRecordIdGlobal}`,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    // Send the request to get connections
    const responseGetConnectionsGlobal = await axios.request(configGetConnections);
    
    // Check if the response contains data
    if (Array.isArray(responseGetConnectionsGlobal.data) && responseGetConnectionsGlobal.data.length > 0) {
      // Extract the connection ID from the first object in the response array
      const connectionId = responseGetConnectionsGlobal.data[0].id;
      console.log("Connection ID", connectionId);

      // Set the connection ID globally
      connectionIdGlobal = connectionId;

      // Return the connection ID in the response
      res.json({ connectionId });
    } else {
      // Handle case where response data is empty or not in the expected format
      console.error("Response data is empty or not in the expected format");
      res.status(500).json({ error: 'Internal server error: Response data is empty or not in the expected format' });
    }
  } catch (error) {
    // Handle Axios request error
    console.error("Error retrieving connections:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Define an endpoint to send a message
app.post("/send-message", async (req, res) => {
  try {
    // Step 1: Prepare the message content from the request body
    const messageContent = req.body.messageContent;

    if (!messageContent || messageContent.trim() === "") {
      return res.status(400).send('Message content cannot be blank.');
    }

    // Step 2: Check if connectionIdGlobal is set
    if (!connectionIdGlobal) {
      return res.status(400).send('Connection ID is not set.');
    }

    let data = JSON.stringify({
      content: messageContent,
    });
    console.log("Message content", data);

    // Step 3: Configure an HTTP POST request to send the message using connectionIdGlobal
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `http://127.0.0.1:3000/basic-messages/${connectionIdGlobal}`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: data
    };

    // Step 4: Send the message and handle the response
    const response = await axios.request(config);
    console.log("Send message response", response.data);

    // Step 5: Return the response data
    res.send(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

// Define an endpoint to retrieve a message using the connection ID
app.get("/get-latest-message", async (req, res) => {
  try {
    const connectionId = connectionIdInvitationGlobal; // Ensure this is accessible here
    const response = await axios.get(`http://127.0.0.1:3001/basic-messages/${connectionId}`);

    if (response.status === 200 && response.data && response.data.length > 0) {
      // Correctly access the content from the first message in the array
      const content = response.data[0].content;
      console.log("Message:", content);
      res.status(200).json({ messageContent: content });
    } else {
      res.status(404).send('Message not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

// Define an endpoint to return a response
app.post("/return-response", async (req, res) => {
  try {
    // Step 1: Prepare the message content from the request body
    const messageContent = req.body.messageContent;

    if (!messageContent || messageContent.trim() === "") {
      return res.status(400).send('Message content cannot be blank.');
    }

    // Step 2: Check if connectionIdGlobal is set
    if (!connectionIdGlobal) {
      return res.status(400).send('Connection ID is not set.');
    }

    let data = JSON.stringify({
      content: messageContent,
    });
    console.log("Message content", data);

    // Step 3: Configure an HTTP POST request to send the message using connectionIdInvitationGlobal
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `http://127.0.0.1:3001/basic-messages/${connectionIdInvitationGlobal}`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: data
    };

    // Step 4: Send the message and handle the response
    const response = await axios.request(config);
    console.log("Send message response", response.data);

    // Step 5: Return the response data
    res.send(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

app.get("/get-latest-response", async (req, res) => {
  try {
    const connectionId = connectionIdGlobal; // Use the correct variable name for your global connection ID
    const response = await axios.get(`http://127.0.0.1:3000/basic-messages/${connectionId}`);

    if (response.status === 200 && response.data && response.data.length > 0) {
      // Filter for messages with role "receiver" and sort them by createdAt in descending order
      const receivedMessages = response.data.filter(message => message.role === "receiver")
                                             .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      if (receivedMessages.length > 0) {
        // Get the content from the latest received message
        const latestReceivedContent = receivedMessages[0].content;
        console.log("Latest received message:", latestReceivedContent);
        res.status(200).json({ messageContent: latestReceivedContent });
      } else {
        res.status(404).send('Received message not found');
      }
    } else {
      res.status(404).send('Message not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

 app.listen(port, () => {
   console.log(`Server is running on http://127.0.0.1:${port}`);
 });
