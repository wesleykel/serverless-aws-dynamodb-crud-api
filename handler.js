const AWS = require("aws-sdk");
const express = require("express");
const serverless = require("serverless-http");
//import Sc
const app = express();

const USERS_TABLE = process.env.USERS_TABLE;
const dynamoDbClient = new AWS.DynamoDB.DocumentClient();

app.use(express.json());

app.get("/allUsers", async function (req, res) {
  const params = {
    TableName: USERS_TABLE,

    ReturnConsumedCapacity: "TOTAL",
  };

  try {
    const Item = await dynamoDbClient.scan(params).promise();
    if (Item) {
      res.json(Item);
    } else {
      res.status(404).json({ error: "Could not find any users" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not retreive user" });
  }
});

app.get("/users/:userId", async function (req, res) {
  const params = {
    TableName: USERS_TABLE,
    Key: {
      userId: req.params.userId,
    },
  };

  try {
    const { Item } = await dynamoDbClient.get(params).promise();
    if (Item) {
      const { userId, name } = Item;
      res.json({ userId, name });
    } else {
      res
        .status(404)
        .json({ error: 'Could not find user with provided "userId"' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not retreive user" });
  }
});

app.post("/users", async function (req, res) {
  const { userId, name } = req.body;
  if (typeof userId !== "string") {
    res.status(400).json({ error: '"userId" must be a string' });
  } else if (typeof name !== "string") {
    res.status(400).json({ error: '"name" must be a string' });
  }

  const params = {
    TableName: USERS_TABLE,
    Item: {
      userId: userId,
      name: name,
    },

    ConditionExpression:"attribute_not_exists(userId)",
  };
  try {
    await dynamoDbClient.put(params).promise();
    res.json({ userId, name });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not create user" });
  }
});

app.delete("/users/:userId", async function (req, res) {

  const params = {
    TableName: USERS_TABLE,
    Key: {
      userId: req.params.userId, 
  
      //ReturnConsumedCapacity: "TOTAL",
    },   
     ConditionExpression:"attribute_exists(userId)",
  };

  try {
 await dynamoDbClient.delete(params).promise();

    res.status(200).json(`user ${req.params.userId} deleted`);
  } catch (error) {
    res.status(500).json({ error: `Could not delete user, does user ${req.params.userId} exists?` });
  }
});

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

module.exports.handler = serverless(app);
