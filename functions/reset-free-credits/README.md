# create-profile

An appwrite function that resets the credits after 30 days since account creation.

## 🤖 Documentation

Simple function that does the following:

- Finds all documents in the `main` database and `profile` collection based on $createdAt < 30 days, credits = 10, stripeSubscriptionId = none
- Sets the credits to 0

_Example input:_

This function expects no input

_Example output:_

```json
{
  message: "Response message",
  error?: "Error message"
}
```

## 📝 Trigger

Function gets triggered every day at midnight:

- **schedule** - "0 0 \* \* \*"

## 📝 Environment Variables

List of environment variables used by this cloud function:

- **APPWRITE_FUNCTION_ENDPOINT** - Endpoint of Appwrite project
- **APPWRITE_FUNCTION_PROJECT_ID** - Appwrite Project ID Key
- **APPWRITE_FUNCTION_API_KEY** - Appwrite API Key

## 📝 Database requirements

List of database requrements by this cloud function:

_Attributes:_
Database `main` collection `profile`:

- credits: number(9999)
- stripeSubscriptionId: string(128)

_Indexes:_
Database `main` collection `profile`:

- Compound: $createdAt, credits, stripeSubscriptionId : ASC, ASC, ASC

_Settings:_

- Document security: ON

## 🚀 Deployment

There are two ways of deploying the Appwrite function, both having the same results, but each using a different process. We highly recommend using CLI deployment to achieve the best experience.

### Using CLI

Make sure you have [Appwrite CLI](https://appwrite.io/docs/command-line#installation) installed, and you have successfully logged into your Appwrite server. To make sure Appwrite CLI is ready, you can use the command `appwrite client --debug` and it should respond with green text `✓ Success`.

Make sure you are in the same folder as your `appwrite.json` file and run `appwrite deploy function` to deploy your function. You will be prompted to select which functions you want to deploy.

### Manual using tar.gz

Manual deployment has no requirements and uses Appwrite Console to deploy the tag. First, enter the folder of your function. Then, create a tarball of the whole folder and gzip it. After creating `.tar.gz` file, visit Appwrite Console, click on the `Deploy Tag` button and switch to the `Manual` tab. There, set the `entrypoint` to `src/index.js`, and upload the file we just generated.
