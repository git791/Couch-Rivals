import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
export const ddbDocClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

export const getTableName = () => process.env.TABLE_NAME;

export const putItem = async (item) => {
  return ddbDocClient.send(new PutCommand({
    TableName: getTableName(),
    Item: item,
  }));
};

export const getItem = async (key) => {
  const result = await ddbDocClient.send(new GetCommand({
    TableName: getTableName(),
    Key: key,
  }));
  return result.Item;
};

export const deleteItem = async (key) => {
  return ddbDocClient.send(new DeleteCommand({
    TableName: getTableName(),
    Key: key,
  }));
};

export const queryItems = async (params) => {
  params.TableName = getTableName();
  const result = await ddbDocClient.send(new QueryCommand(params));
  return result.Items;
};
