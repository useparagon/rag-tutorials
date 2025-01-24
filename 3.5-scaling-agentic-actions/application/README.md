# parato-3.5
Repository for tutorial 3.5 on scaling agentic actions for Parato

## Integrations
- Google Drive - RAG
- Any Integration supported by ActionKit
    - Salesforce
    - Slack
    - Jira
    - ...

## Getting Started

First, install the dependencies:

```
npm install
```

Then, run the development server:

```
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Using Docker

1. Build an image for the Next.js app:

```
docker build -t <your_app_image_name> .
```

2. Start the app:

```
docker run --rm -v $(pwd)/.env:/app/.env -v $(pwd)/config:/app/config -v $(pwd)/cache:/app/cache -p 3000:3000 parato-demo
```

## Learn More

To learn more about LlamaIndex, take a look at the following resources:

- [LlamaIndex Documentation](https://docs.llamaindex.ai) - learn about LlamaIndex (Python features).
- [LlamaIndexTS Documentation](https://ts.llamaindex.ai) - learn about LlamaIndex (Typescript features).

You can check out [the LlamaIndexTS GitHub repository](https://github.com/run-llama/LlamaIndexTS) - your feedback and contributions are welcome!

