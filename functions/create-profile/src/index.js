const { Client, Users, Databases, Permission, Role } = require("node-appwrite");

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
  const users = new Users(client);

  if (
    !req.variables["APPWRITE_FUNCTION_ENDPOINT"] ||
    !req.variables["APPWRITE_FUNCTION_API_KEY"] ||
    !req.variables["APPWRITE_FUNCTION_PROJECT_ID"]
  ) {
    res.send(`Environment variables are not set. Function cannot use Appwrite SDK.`);
  }

  client
    .setEndpoint(req.variables["APPWRITE_FUNCTION_ENDPOINT"])
    .setProject(req.variables["APPWRITE_FUNCTION_PROJECT_ID"])
    .setKey(req.variables["APPWRITE_FUNCTION_API_KEY"])
    .setSelfSigned(true);

  try {
    // Get information about the user who triggered the function
    const payload = JSON.parse(req.variables["APPWRITE_FUNCTION_EVENT_DATA"]);
    const { name, email, emailVerification, phone, phoneVerification } = await users.get(payload.userId);

    // Check if user is verified
    const isUserVerified = emailVerification || (emailVerification && phoneVerification);

    // Create a profile for the user
    isUserVerified &&
      (await database.createDocument(
        "main",
        "profile",
        "unique()",
        {
          userId: payload.userId, // unique

          email: email,
          name: name,
        },
        [Permission.read(Role.user(payload.userId))]
      ));

    res.send(`Function executed successfully`);
  } catch (error) {
    res.send(`Unexpected error: ${error}`);
  }
};
