import {
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
} from "@aws-sdk/client-dynamodb";
import { nanoid } from 'nanoid';
import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';
import { APIGatewayProxyHandler } from "aws-lambda";

let { TABLE_USERS } = process.env;

let client = new DynamoDBClient({});

let handler: APIGatewayProxyHandler = async (event, context) => {
  console.log(JSON.stringify(event));
  console.log(JSON.stringify(context));
  try {
    let user = {
      id: nanoid(),
      name: uniqueNamesGenerator({ dictionaries: [adjectives, colors, animals] }),
    };
    let commandPutItem = new PutItemCommand({
      TableName: TABLE_USERS,
      Item: {
        id: {
          S: user.id,
        },
        name: {
          S: user.name,
        },
      },
    });
    await client.send(commandPutItem);

    let commandQueryCommand = new QueryCommand({
      TableName: TABLE_USERS,
      Select: "ALL_ATTRIBUTES",
      Limit: 1,
      KeyConditionExpression: "id = :id",
      ExpressionAttributeValues: {
        ":id": { S: user.id },
      },
    });
    let data = await client.send(commandQueryCommand);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ok: true, payload: data.Items }),
    };
  } catch (err) {
    let { message } = err as Error;
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ok: false, error: message }),
    };
  }
};

export { handler };
