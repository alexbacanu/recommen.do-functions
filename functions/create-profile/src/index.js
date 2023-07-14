const { Client, Users, Databases, Permission, Role, Query } = require("node-appwrite");
const { Stripe } = require("stripe");
const crypto = require("node:crypto");

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

function generateIdentifier(email) {
  const hash = crypto.createHash("sha256");
  hash.update(email.toLowerCase().trim()); // Convert email to lowercase and remove leading/trailing spaces
  const identifier = hash.digest("hex");
  return identifier;
}

module.exports = async function (req, res) {
  const stripe = new Stripe(req.variables["STRIPE_SECRET_KEY"]);
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
    console.warn("Environment variables are not set. Function cannot use Appwrite SDK.");
  } else {
    client
      .setEndpoint(req.variables["APPWRITE_FUNCTION_ENDPOINT"])
      .setProject(req.variables["APPWRITE_FUNCTION_PROJECT_ID"])
      .setKey(req.variables["APPWRITE_FUNCTION_API_KEY"])
      .setSelfSigned(true);
  }

  try {
    // Get information about the user who triggered the function
    const payload = JSON.parse(req.variables["APPWRITE_FUNCTION_EVENT_DATA"]);

    // Get the user from appwrite
    const user = await users.get(payload.userId);

    // Check if user has profile
    const { documents } = await database.listDocuments("main", "profile", [Query.equal("userId", payload.userId)]);

    if (documents.length > 0) {
      if (user.email === documents[0].email) {
        return res.json({
          message: "User profile already exists and email matches",
          userId: payload.userId,
        });
      }

      // if not then update email
      await database.updateDocument("main", "profile", documents[0].$id, {
        email: user.email,
      });

      await stripe.customers.update(documents[0].stripeCustomerId, {
        email: user.email,
      });

      return res.json({
        message: "User profile already exists and email changed on appwrite and stripe",
        userId: payload.userId,
      });
    }

    // Generate the hashed identifier based on the user's email
    const hashedIdentifier = generateIdentifier(user.email);

    // Check if identifier exists
    const { total: totalIdentifiers } = await database.listDocuments("main", "identifier", [
      Query.equal("identifier", hashedIdentifier),
    ]);

    // If exists create a profile for the user without credits
    if (totalIdentifiers > 0) {
      const profileResponse = await database.createDocument(
        "main",
        "profile",
        "unique()",
        {
          userId: payload.userId, // unique

          credits: 0,

          email: user.email,
          name: user.name,

          stripeSubscriptionId: "none",
          termsAgreed: new Date(Date.now()),
        },
        [Permission.read(Role.user(payload.userId))]
      );

      return res.json({
        message: "User profile created with 0 credits",
        userId: profileResponse.$id,
      });
    } else {
      await database.createDocument("main", "identifier", "unique()", {
        identifier: hashedIdentifier,
      });

      const profileResponse = await database.createDocument(
        "main",
        "profile",
        "unique()",
        {
          userId: payload.userId, // unique

          email: user.email,
          name: user.name,

          stripeSubscriptionId: "none",
          termsAgreed: new Date(Date.now()),
        },
        [Permission.read(Role.user(payload.userId))]
      );

      return res.json({
        message: "User profile created with free credits",
        userId: profileResponse.$id,
      });
    }
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
