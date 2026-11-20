# Control Flow Learning Game

A web-based educational board game that teaches Python control flow concepts (if-elif-else, for loops, while loops) through QR code-triggered quizzes.

## Tech Stack
- **Backend**: Express.js (Node.js)
- **Frontend**: Pug templates + CSS
- **Database**: MySQL

## Prerequisites
- Node.js (v14 or higher)
- MySQL Server (local or remote)

## Setup Instructions

1. **Install dependencies**:
   ```
   npm install
   ```

2. **Create the database**:
   Open MySQL and run the `database_setup.sql` file to create the `fwdd_game` database and all tables.

3. **Configure database connection**:
   Open `db.js` and update the MySQL credentials (host, user, password) to match your local MySQL setup.

4. **Start the server**:
   ```
   npm start
   ```
   Or:
   ```
   node app.js
   ```

5. **Open the website**:
   Go to `http://localhost:3000` in your browser.

## How to Play

1. Register a new account or login.
2. Create a room and share the 6-character room code with friends.
3. Friends join the room using the code.
4. Roll the dice on the room page and move your token on the physical game board.
5. When you land on a QR code space, scan it with your phone.
6. Answer the Python control flow question to earn points.
7. The player with the highest score at the end wins!

## Project Structure
- `app.js` - Main Express application
- `db.js` - MySQL connection and query helpers
- `database_setup.sql` - Database schema
- `routes/` - Route handlers (auth, room, game)
- `views/` - Pug templates
- `public/` - Static files (CSS, JS)
