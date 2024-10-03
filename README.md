# rag-tutorials

This tutorial series will go through how to build a RAG enabled chatbot with multiple third party integrations.
Our chatbot Parato, is built with industry standard products:
- LlamaIndex - LLM Application framework
- OpenAI - LLM
- Pinecone - Vector Database
- Okta FGA - Authorization Model
- Third Party Data Platforms
  - Google Drive, Slack, Notion, Dropbox
- Paragon - Integrations
  - Includes workflow & webhook engine
  - Integrated UI for your application

## Part 1: RAG Data Ingestion with Multiple Third Party Integrations
This tutorial goes through how to start building a chatbot powered by LlamaIndex with data integrations for **Google Drive,
Slack, and Notion**. Parato can ingest data from these 3 data platforms, respond with context from data ingested, and stay 
up-to-date with new messages, files, and data coming from these integrations. In the codebase, you'll not only find the 
application code for Parato, but also Paragraph templates for building your Paragon workflows.

Link to tutorial: [Building an AI Knowledge Chatbot with Multiple Data Integrations](https://www.useparagon.com/learn/ai-knowledge-chatbot-chapter-1/)

## Part 2.0: Permission System for RAG Applications
This second tutorial extends Parato's functionality, layering a permissions system to Parato's ability to respond with 
context from third party integrations. In this part, Parato will ingest permissions from Google Drive and Dropbox, create 
an internal model of permissions from both of these integrations, only respond with context from files that the user has 
permissions to, and stay up-to-date on permissions in real time. Explore the codebase and paragraph templates to see how 
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

Link to tutorial: [Building Permissions that Scale with Third Party Integrations](https://www.useparagon.com/learn/building-permissions-and-access-control-that-scale-with-third-party-integrations/)