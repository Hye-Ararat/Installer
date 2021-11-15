const { MongoClient } = require("mongodb");
const colors = require("colors/safe");
const cliProgress = require("cli-progress");
const bcrypt = require("bcrypt");
const prompts = require("prompts");
require("dotenv").config();

var task;
async function error(error) {
  console.log(colors.red(`An error occured while ${task}:`));
  console.log(error);
  process.exit(1);
}
async function run() {
  const data1 = await prompts([
    {
      type: "text",
      name: "mongodb_url",
      message: "What is your MongoDB URI",
    },
    {
      type: "text",
      name: "already_setup_db",
      message: "Do you already have an Ararat database? [Y/n]",
      validate: (value) =>
        value.toLowerCase() == "y" || value.toLowerCase() == "n"
          ? true
          : "Please enter Y or n",
    },
  ]);
  var already_setup_db;
  data1.already_setup_db.toLowerCase() == "y"
    ? (already_setup_db = true)
    : (already_setup_db = false
        ? (already_setup_db = true)
        : (already_setup_db = false));
  if (already_setup_db) {
    var data2 = await prompts([
      {
        type: "text",
        name: "db_name",
        message: "What is your database name?",
      },
    ]);
  } else {
    var data2 = await prompts([
      {
        type: "text",
        name: "db_name",
        message: "What would you like your database to be named?",
      },
    ]);
  }
  var data3 = await prompts([
    {
      type: "text",
      name: "new_account",
      message: "Do you want to create a new Ararat account? [Y/n]",
      validate: (value) =>
        value.toLowerCase() == "y" || value.toLowerCase() == "n"
          ? true
          : "Please enter Y or n",
    },
  ]);
  var new_account;
  data3.new_account.toLowerCase() == "y"
    ? (new_account = true)
    : (new_account = false);
  if (new_account) {
    var data4 = await prompts([
      {
        type: "text",
        name: "email",
        message: "What would you like the accounts email address to be?",
      },
      {
        type: "password",
        name: "password",
        message: "What would you like the accounts password to be?",
      },
      {
        type: "text",
        name: "first_name",
        message: "What would you like the first name on the account to be?",
      },
      {
        type: "text",
        name: "last_name",
        message: "What would you like the last name on the account to be?",
      },
      {
          type: "text",
          name: "admin",
          message: "Will this account be an admin? (this gives ALL admin permissions, if you want this account to have limited admin access enter n) [Y/n]",
          validate: (value) => value.toLowerCase() == "y" || value.toLowerCase() == "n" ? true : "Please enter Y or n",
      }
    ]);
  }
  const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  bar1.start(100, 0);
  if (!already_setup_db) {
    task = "creating the database";
    try {
      var db_data = await MongoClient.connect(`${data1.mongodb_url}/${data2.db_name}`);
    } catch (e) {
      error(e);
    }
    try {
      var db = db_data.db(data2.db_name);
    } catch (e) {
      error(e);
    }
    try {
      task = "creating collections";
      await db.createCollection("extensions");
      await db.createCollection("allocations");
      await db.createCollection("ip_pools");
      await db.createCollection("magma_cubes");
      await db.createCollection("nodes");
      await db.createCollection("servers");
      await db.createCollection("sessions");
      await db.createCollection("users");
    } catch {
      error(e);
    }
    new_account ? bar1.update(33) : bar1.update(100)
  }
  if (new_account) {
    task = "creating a new user";
    try {
        var salt = await bcrypt.genSalt(10);
        var hash = await bcrypt.hash(data4.password, salt);
    } catch (e) {
        error(e);
    }
    bar1.update(67);
    try {
        await db.collection("users").insertOne({
            first_name: data4.first_name,
            last_name: data4.last_name,
            email: data4.email,
            password: hash,
            admin: data4.admin.toLowerCase() == "y" ? true : false
        })
    } catch (e) {
        error(e);
    }
    bar1.update(100);
  }
}
run();
