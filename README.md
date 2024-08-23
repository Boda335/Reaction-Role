
# Reaction Role Bot

## Description

Reaction Role Bot allows you to manage reaction-based roles on your Discord server. With this bot, you can set up embedded messages, add reaction roles, and remove messages as needed. The bot supports slash commands to streamline the process of configuring and managing roles based on user reactions.

## Features

- **Setup Embed Message**: Create or update an embedded message in a specified channel with a title, description, images, and color.
- **Add Reaction Role**: Link an emoji to a role, allowing users to receive the role by reacting to the embedded message.
- **Unsetup**: Delete the embedded message and remove its associated data from the file.

## Requirements

- **Node.js**: Ensure you have Node.js installed.
- **Discord.js**: This bot uses the `discord.js` library. You can install it using npm.

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd reaction-role-bot
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following content:

   ```
   BOT_TOKEN=your-bot-token
   CLIENT_ID=your-client-id
   ```

   Replace `your-bot-token` with your bot's token and `your-client-id` with your Discord application's client ID.

4. Start the bot:

   ```bash
   node index.js
   ```

## Usage

### Commands

1. **/setup**

   Sets up or updates an embedded message in the specified channel.

   - `channel`: The channel where the embed will be sent.
   - `title`: The title of the embed.
   - `description`: The description of the embed.
     <div style="text-align: center;">
      <img src="https://b.top4top.io/p_3157urpn91.png" alt="setup">
       </div>
   - `thumbnail`: (Optional) The URL of the thumbnail image.
   - `image`: (Optional) The URL of the main image.
   - `color`: (Optional) The HEX color code for the embed.
   - `message_id`: (Optional) The ID of an existing message to update.
     <div style="text-align: center;">
      <img src="https://f.top4top.io/p_31251dsje9.jpg" alt="AstroMusic Illustration">
      </div>
*The embed message Example*
     <div style="text-align: center;">
      <img src="https://c.top4top.io/p_31578h6dr2.png" alt="embed message">
      </div>
2. **/addreactionrole**

   Adds a reaction role to an existing embed message.

   - `channel`: The channel where the embed message is located.
   - `message_id`: The ID of the embed message.
   - `role`: The role to be assigned.
   - `emoji`: The emoji that will trigger the role assignment.

3. **/unsetup**

   Deletes an embed message and removes its data from the file.

   - `channel`: The channel where the embed message is located.
   - `message_id`: The ID of the embed message to delete.

## File Structure

- `index.js`: Main bot file with command and event handling.
- `messages.json`: Data file storing message IDs and associated reaction roles.
- `.env`: Environment file for storing sensitive information.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [discord.js](https://discord.js.org/): The library used to interact with the Discord API.
