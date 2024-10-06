# twinmaker-knowledgegraph
Simple script to create a knowledge graph in AWS IoT TwinMaker from a CSV input file that contains parent child and other relationships. You will need NodeJS installed and and valid AWS credentials (with permissions to TwinMaker to create entities and components) set in your environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY and AWS_SESSION_TOKEN)

To run the script:-

Firstly install the dependencies

`npm ci`

Followed by this command to compile the Typescript

`./node_modules/typescript/bin/tsc buildGraph.ts`

And finally this command to execute the loader

`node buildGraph.js parentChild.csv <workspaceId>`

More details [here](https://medium.com/@greg.biegel/building-a-knowledge-graph-in-aws-iot-twinmaker-a6fb34e1c47c) 