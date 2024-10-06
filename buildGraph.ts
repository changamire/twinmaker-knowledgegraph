import { parse } from "csv-parse/sync";
import * as fs from "fs";
import * as path from "path";

import {
  IoTTwinMakerClient,
  CreateEntityCommand,
  CreateComponentTypeCommand,
} from "@aws-sdk/client-iottwinmaker";

const client = new IoTTwinMakerClient();

interface EntityRelationship {
  from: string;
  to: string;
  type: string;
}

/**
 * Creates a component type in the TwinMaker workspace that
 * represents a relationship (that is not a parent child relationship)
 * between 2 entities in the TwinMaker Knowledge Graph
 *
 * @param workspaceId the id of the workspace to create the component type in
 */
const createRelationshipComponentType = async (workspaceId: string) => {
  const createComponentCommand = new CreateComponentTypeCommand({
    workspaceId: workspaceId,
    componentTypeId: "relationship",
    componentTypeName: "Relationship",
  });
  const createComponentResponse = await client.send(createComponentCommand);
  console.log(createComponentResponse);
};

/**
 * Processes a single record in the input CSV, creating the entities and relationships.
 *
 * @param workspaceId the workspace id
 * @param record a single line from the input CSV
 */
const createParentChild = async (
  workspaceId: string,
  record: EntityRelationship
) => {
  /** A 'root' entity */
  if (record.to === undefined || record.to == "") {
    const createEntityCommand = new CreateEntityCommand({
      workspaceId: workspaceId,
      entityId: record.from,
      entityName: record.from,
    });
    const createEntityResponse = await client.send(createEntityCommand);
    console.log(createEntityResponse);
  } else {
    /** A parent child relationship - we assume the parent entity has already been created by a previous record */
    if (record.type === "isChildOf") {
      const createEntityCommand = new CreateEntityCommand({
        workspaceId: workspaceId,
        entityId: record.from,
        parentEntityId: record.to,
        entityName: record.from,
      });
      const createEntityResponse = await client.send(createEntityCommand);
      console.log(createEntityResponse);
    } else {
      /** A 'custom' relationship. We assume the 'to' entity has already been created by a previous record */
      const relationshipType = record.type;
      const createEntityCommand = new CreateEntityCommand({
        workspaceId: workspaceId,
        entityName: record.from,
        components: {
          Relationship: {
            componentTypeId: "relationship",
            properties: {
              [relationshipType]: {
                definition: {
                  dataType: {
                    type: "LIST",
                    nestedType: {
                      type: "RELATIONSHIP",
                    },
                  },
                },
                value: {
                  listValue: [
                    {
                      relationshipValue: {
                        targetEntityId: record.to,
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      });
      const createEntityResponse = await client.send(createEntityCommand);
      console.log(createEntityResponse);
    }
  }
};

const buildGraph = async () => {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error("Please provide two arguments - the first is the name of the file to process and the second is the workspaceId");
    process.exit(1); // Exit with an error code
  }

  // Destructure to get both arguments
  const [filename, workspaceId] = args;
  const absolutePath = path.resolve(filename);
  const fileContent = fs.readFileSync(absolutePath, "utf-8");
  const records: EntityRelationship[] = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  createRelationshipComponentType(workspaceId);

  for (let i = 0; i < records.length; i++) {
    await createParentChild(workspaceId, records[i]);
  }
};

buildGraph();
