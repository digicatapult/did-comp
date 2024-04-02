# DID-Comp

## Decentralised & Privacy Preserving Querying

This repository hosts the implementation of a decentralised and privacy-preserving querying system. This approach enables secure and private communication for SQL query processing between different parties using decentralised identifiers (DIDs) & secure multi-party computation (MPC).

### Supported Platforms

- Linux

### Overview

The system comprises two main agents: Alice and Bob. Alice acts as the querier, initiating SQL queries via a web interface, while Bob serves as the query responder, processing these queries and returning results to Alice's web interface.  Additionally, there are two remote sites who hold data that can be queried.  Alice can be thought of as a 'client' querying a distributed network of data, and Bob a 'network node' that can query data sources.  The system leverages SMCQL for executing SQL queries across remote sites, employing secure MPC and differential privacy techniques to ensure the privacy of the data during processing.

Setup involves the remote sites agreeing on a database schema according to which they will store data.  This schema is published so that Alice and any other party knows what queries they can make.

When Bob receives a query from Alice, he compiles it into MPC protocol.  This privacy-preserving protocol is then run by the two remote sites, who return their outputs to Bob.  From these outputs, Bob can construct a response to Alice's query that looks as if he had queried a single unified database that he owns.  The privacy guarantee is that Bob learns nothing about how data is distributed between remote sites: he only learns the query response.  Additionally, the remote sites learn nothing about each other's data.  In this proof-of-concept work, the remote sites trust Bob to compile a protocol that respects privacy of data they hold.  Trust relationships are described further in the [smcql-experiment](https://github.com/digicatapult/smcql-experiment) repository.

Communication between Alice and Bob is facilitated using DIDComm, ensuring that SQL queries and responses are exchanged securely and privately. 

This approach enables the system to compute results over private data, allowing multiple parties to collaborate on data analysis or query execution without revealing their individual datasets to each other, thus maintaining data privacy and security throughout the process.

![alt text](/readme-assets/diagram.png?raw=true)

### Self-Sovereign Identity (SSI) Framework

The DIDComm protocol used in this project utilises the Self-Sovereign Identity (SSI) framework implemented in [veritable-cloudagent](https://github.com/digicatapult/veritable-cloudagent). This framework provides the foundational elements for secure and private communication using decentralised identifiers.

### Submodules:

This project utilises the `veritable-cloudagent` repository as a submodule. You can find the repository here: [veritable-cloudagent](https://github.com/digicatapult/veritable-cloudagent).

Additionally, this project utilises the `smcql-experiment` repository as a submodule, a modified version of [smcql](https://github.com/smcql/smcql). You can find the repository here: [smcql-experiment](https://github.com/CDECatapult/smcql-experiment/).

### Web Interfaces

The system includes a web interface for the end user acting as Alice, enabling easy interaction with the application.

- **Alice's Web Interface**: You can access Alice's web interface by navigating to [http://localhost:3200](http://localhost:3200) in your web browser. This interface allows you to interact with Alice, initiate SQL queries, and observe the results.

### Getting Started

Ensure to clone this repository with the ```--recursive``` option to clone all the relevant submodules.
```bash
git clone --recursive https://github.com/digicatapult/did-comp.git
```

To get started with this system, you can use the provided scripts to start and stop the application.

#### Starting the Application
```bash
./scripts/start.sh
```

#### Stopping the Application
```bash
./scripts/stop.sh
```

### Flow
Alice (Querier): Initiates SQL queries via the web interface and sends them to Bob using DIDComm for secure and private communication.

Bob (Query Responder): Receives SQL queries from Alice, processes them using SMCQL, and sends back the results via DIDComm, displayed on Alice's web interface.
