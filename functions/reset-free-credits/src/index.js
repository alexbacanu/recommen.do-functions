const { Client, Databases, Query } = require("node-appwrite");

/*
  'req' variable has:
    'headers' - object with request headers
    'payload' - request body data as a string
    'variables' - object with function variables

  'res' variable has:
    'send(text, status)' - function to return text response. Status code defaults to 200
    'json(obj, status)' - function to return JSON response. Status code defaults to 200

  If an error is thrown, a response with code 500 will be returned.
*/

module.exports = async function (req, res) {
  const client = new Client();

  // You can remove services you don't use
  // const account = new Account(client);
  // const avatars = new Avatars(client);
  const database = new Databases(client);
  // const functions = new Functions(client);
  // const health = new Health(client);
  // const locale = new Locale(client);
  // const storage = new Storage(client);
  // const teams = new Teams(client);
  // const users = new Users(client);

  if (
    !req.variables["APPWRITE_FUNCTION_ENDPOINT"] ||
    !req.variables["APPWRITE_FUNCTION_API_KEY"] ||
    !req.variables["APPWRITE_FUNCTION_PROJECT_ID"]
  ) {
    console.warn("Environment variables are not set. Function cannot use Appwrite SDK.");
  } else {
    client
      .setEndpoint(req.variables["APPWRITE_FUNCTION_ENDPOINT"])
      .setProject(req.variables["APPWRITE_FUNCTION_PROJECT_ID"])
      .setKey(req.variables["APPWRITE_FUNCTION_API_KEY"])
      .setSelfSigned(true);
  }

  const days = 30;
  const priorByDays = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  try {
    // Find profiles with expired credit
    const { documents, total } = await database.listDocuments("main", "profile", [
      Query.lessThanEqual("$createdAt", priorByDays),
      Query.lessThanEqual("credits", 10),
      Query.equal("stripeSubscriptionId", "none"),
    ]);

    if (total === 0) {
      return res.json({
        message: "No profiles found",
      });
    }

    // For each document, set credits attribute to 0
    for (const document of documents) {
      await database.updateDocument("main", "profile", document.$id, {
        credits: 0,
      });
    }

    return res.json({
      message: "User profiles updated",
    });
  } catch (error) {
    console.log(error);
    return res.json(
      {
        message: "Unexpected error",
        error: error,
      },
      500
    );
  }
};
