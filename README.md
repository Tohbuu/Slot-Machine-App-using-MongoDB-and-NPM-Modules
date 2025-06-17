# Neon Spin - Futuristic Slot Machine Web App

Neon Spin is a futuristic slot machine web application built with Node.js, Express, MongoDB, and a modern frontend. Users can register, log in, play a 3D slot machine, compete on the leaderboard, customize their profile (including avatar and theme), and win jackpots!

---

## Features

- **User Authentication:** Register and log in securely with JWT-based authentication.
- **3D Slot Machine:** Play a visually engaging slot machine with animated reels and sound effects.
- **Jackpot System:** A progressive jackpot that grows with every bet and can be won randomly.
- **Leaderboard:** See the top players ranked by total wins and jackpots.
- **Profile Customization:** Upload avatars, change username/email, and select a visual theme.
- **Leveling & Experience:** Earn experience and level up as you play.
- **Bonus Rounds:** Win free spins and other bonuses.
- **Responsive Design:** Works on desktop and mobile devices.

---

## Project Structure

```
.env
.env.example
.gitignore
db.json
package.json
README.md
server.js
.qodo/
config/
  database.js
  multer.js
controllers/
  authController.js
  slotController.js
  userController.js
middleware/
  auth.js
models/
  Jackpot.js
  User.js
public/
  css/
    style.css
  images/
    avatars/
    symbols/
  js/
    auth.js
    leaderboard.js
    particles-config.js
    profile.js
    slot-machine.js
  sounds/
routes/
  auth.js
  slots.js
  user.js
  users.js
views/
  index.html
  leaderboard.html
  login.html
  profile.html
  register.html
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v16+ recommended)
- [npm](https://www.npmjs.com/)
- [MongoDB](https://www.mongodb.com/) (local or remote instance)

---

## Getting Started

### 1. Clone the Repository

```sh
git clone https://github.com/yourusername/neon-spin.git
cd neon-spin
```

### 2. Install Dependencies

```sh
npm install
```

### 3. Configure Environment Variables

- Copy `.env.example` to `.env` and fill in your values:

```
MONGODB_URI=mongodb://localhost:27017/slot-machine
JWT_SECRET=your_jwt_secret_here
PORT=3000
```

- Replace `your_jwt_secret_here` with a secure random string.
- **Important:** `.env` is now included in `.gitignore` so it will not be committed to the repository.

### 4. Start MongoDB

Make sure MongoDB is running locally or update `MONGODB_URI` to point to your remote database.

### 5. Run the Application

#### For development (with auto-reload):

```sh
npm run dev
```

#### For production:

```sh
npm start
```

The server will start on [http://localhost:3000](http://localhost:3000) by default.

---

## Usage

- Visit [http://localhost:3000](http://localhost:3000) in your browser.
- Register a new account or log in.
- Play the slot machine, manage your profile, and check the leaderboard!

---

## API Endpoints

### Authentication

- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Log in
- `GET /api/auth/me` — Get current user info

### User

- `GET /api/users/me` — Get current user info (requires JWT)
- `PUT /api/users` — Update profile (username/email)
- `PUT /api/users/theme` — Update theme
- `POST /api/users/avatar` — Upload avatar

### Slot Machine

- `POST /api/slot/spin` — Spin the slot machine (requires JWT)
- `GET /api/slots/leaderboard` — Get top players

---

## Customization

- **Avatars:** Upload your own avatar in the profile page.
- **Themes:** Choose from multiple color themes.
- **Symbols:** Add new symbols to `public/images/symbols/` and update the slot logic if needed.

---

## Development Notes

- All frontend assets are in the `public/` directory.
- Main backend logic is in [`server.js`](server.js) and the [`controllers/`](controllers/) folder.
- MongoDB models are in [`models/`](models/).
- Multer is used for avatar uploads, configured in [`config/multer.js`](config/multer.js).
- Session management uses `express-session` (for logout), but authentication is JWT-based.
- Environment variables are managed in `.env` (see `.env.example` for a template).

---

## Troubleshooting

- **MongoDB Connection Issues:** Ensure MongoDB is running and the URI in `.env` is correct.
- **Port in Use:** Change the `PORT` in `.env` if 3000 is occupied.
- **File Upload Errors:** Only JPEG, PNG, or GIF images up to 2MB are allowed for avatars.
- **Accidentally committed `.env`?**  
  Remove it from git tracking with:
  ```sh
  git rm --cached .env
  git commit -m "Remove .env from repository"
  git push
  ```

---

## License

This project is for educational and demonstration purposes.

---

## Credits

- UI inspired by neon/cyberpunk themes.
- Built with [Express](https://expressjs.com/), [MongoDB](https://www.mongodb.com/), and [Orbitron font](https://fonts.google.com/specimen/Orbitron).

---

## Screenshots

_Add screenshots of the slot machine, leaderboard, and profile page here!_

---

## Contact

For questions or suggestions, open an issue or contact [rin96tohsakaaa69@gmail.com](mailto:rin96tohsakaaa69@gmail.com).


## To generate 32 bit ascii key

'''
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
'''