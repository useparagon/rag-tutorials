# rag-tutorials

This tutorial series will go through how to build a RAG enabled chatbot with multiple third party integrations.
Our chatbot Parato, is built with industry standard products:
- LlamaIndex - LLM Application framework
- OpenAI - LLM
- Pinecone - Vector Database
- Okta FGA - Authorization Model
- Third Party Data Platforms
  - Google Drive, Slack, Notion, Dropbox, Salesforce
- Paragon - Integrations
  - Includes workflow & webhook engine
  - Integrated UI for your application

## Part 1: RAG Data Ingestion with Multiple Third Party Integrations
This tutorial goes through how to start building a chatbot powered by LlamaIndex with data integrations for **Google Drive,
Slack, and Notion**. Parato can ingest data from these 3 data platforms, respond with context from data ingested, and stay 
up-to-date with new messages, files, and data coming from these integrations. 

In the codebase, you'll not only find the 
application code for Parato, but also Paragraph templates for building your Paragon workflows.

Link to tutorial: [Building an AI Knowledge Chatbot with Multiple Data Integrations](https://www.useparagon.com/learn/ai-knowledge-chatbot-chapter-1/)

## Part 2.0: Permission System for RAG Applications
This second tutorial extends Parato's functionality, layering a permissions system to Parato's ability to respond with 
context from third party integrations. In this part, Parato will ingest permissions from Google Drive and Dropbox, create 
an internal model of permissions from both of these integrations, only respond with context from files that the user has 
permissions to, and stay up-to-date on permissions in real time. 

Explore the codebase and paragraph templates to see how 
Parato takes advantage of Okta FGA and Paragon model and update permissions across integrations.

Link to tutorial: [Building a Permissions System For Your RAG Application](https://www.useparagon.com/learn/ai-knowledge-chatbot-with-permissions-chapter-2/)

## Part 2.5: Scaling Permissions with Third Party Integrations
This tutorial is an extension to Part 2.0.
In this tutorial, we are implementing a caching pattern inspired by the "write-through" cache
invalidation method to keep response time low and expanding our Okta FGA graph schema to accomodate different permissions structures
that new integrations introduce. The caching implementation speeds up permission checking on a
per-query basis, where we are only using our FGA graph to check permissions rather than going to the third party API. This
reduces the number of network hops we need to take per chat interaction. The extension in graph schema doesn't change performance,
but it does allow Parato to take on different integration types as we demonstrate data ingestion and permissions in our RAG
application using both Google Drive and Salesforce data - two integrations that have very different ways they structure permissions.

Go through the codebase in this chapter to see how our RAG application is still respecting third party permissions when using
third party data, with higher
performance and flexibility that scale as the **number** of integrations increase and the **type** of integrations increase.

Link to tutorial: [Building Permissions that Scale with Third Party Integrations](https://www.useparagon.com/learn/building-permissions-and-access-control-that-scale-with-third-party-integrations/)

## Part 3.0: Agentic Actions in Third Party Integrations
In part 3 of our RAG tutorial series, we'll be focusing on bringing a RAG enabled chatbot to becoming a RAG enabled AI assistant.
An AI assistant will be able to not only read data from external data sources for more relevant responses, but also write
data to third party platforms natively in the chat interface.

This tutorial walk through how to use Function Tools to define typescript functions your AI Agent can use to map information
from prompt to your desired schema and send POST requests to another service. Another key aspect of this tutorial is implementing 
a Human-in-the-Loop (HITL) system where every "write" action has a draft step that previews an action, and then a "create"
step that actually sends off the data to the third party system.

Link to tutorial: [Implementing Agentic Actions in Third Party Integrations](https://www.useparagon.com/learn/implementing-agentic-actions-with-third-party-integrations/)

## Running Locally
As mentioned in the introduction, we are using many industry standard technologies to power Parato. To run locally, you will
need to perform the following steps to provision and connect Parato's necessary components:
1) Create a [Pinecone](https://www.pinecone.io/) Vector database (if you don't currently have one or would like to 
connect a fresh database)
2) For the permissions tutorials, create an [Okta FGA](https://docs.fga.dev/) graph (dev account is free)
3) Login or signup for [Paragon](https://www.useparagon.com/) ([free trial](https://dashboard.useparagon.com/signup) available if not currently a user)
   1) Locate your Paragon Project ID and signing key ([docs](https://docs.useparagon.com/getting-started/installing-the-connect-sdk#setup))
4) To setup an authentication service, you will need a service that takes in username, email, and password credentials;
the service will return a JWT signed with your Paragon Signing key from step 3 ([Instructions on JWT specifications](https://docs.useparagon.com/getting-started/installing-the-connect-sdk#setup))
   1) Feel free to reach out to our team to schedule a demo and we can provide a built out authentication service we use for 
   [demos](https://www.useparagon.com/book-demo)
5) For the agentic actions tutorials, you will also need to have Paragon endpoints that trigger your Slack and Salesforce
"create" workflows
6) Using your credentials from Pinecone, Okta FGA, OpenAI, and authentication service, fill out the `.env` file found in 
the `application` directory of each tutorial
7) Last step: use a proxy like [ngrok](https://ngrok.com/) to provide a tunnel for your local application to be accessible
via the internet
   1) Use your reverse proxy URL to forward data from your Paragon workflows to your local application's API endpoints