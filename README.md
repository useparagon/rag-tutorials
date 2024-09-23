# rag-tutorials

This tutorial series will go through how to build a RAG enabled chatbot with multiple third party integrations.
Our chatbot Parato, is built with industry standard products:
- LlamaIndex - LLM Application framework
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
application code for Parato, but also Paragraph templates for building your Paragon workflows

## Part 2: Permission System for RAG Applications
This second tutorial extends Parato's functionality, layering a permissions system to Parato's ability to respond with 
context from third party integrations. In this part, Parato will ingest permissions from Google Drive and Dropbox, create 
an internal model of permissions from both of these integrations, only respond with context from files that the user has 
permissions to, and stay up-to-date on permissions in real time. Explore the codebase and paragraph templates to see how 
Parato takes advantage of Okta FGA and Paragon model and update permissions across integrations.

