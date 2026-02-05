# 🎯 TaskMaster - Gamified Task Management App

A modern, interactive task management app where you earn points, build streaks, and unlock achievements for completing tasks. Organize tasks into categories, use drag-and-drop functionality, and sync with Google Calendar!

## ✨ Features

### Dashboard
- **Points System**: Earn points based on task priority (Low: 1pt, Medium: 3pts, High: 5pts)
- **Streaks**: Build consecutive-day streaks for completing tasks
- **Achievements**: Unlock 6 different prizes as you progress
  - 🥉 Bronze (10 pts)
  - 🥈 Silver (25 pts)  
  - 🥇 Gold (50 pts)
  - 👑 Platinum (100 pts)
  - 🔥 On Fire (7-day streak)
  - 💎 Diamond (30-day streak)

### Tasks & Categories
- Create custom categories with custom colors
- Drag and drop tasks into categories to organize
- Add tasks with priority levels
- Delete tasks or remove from categories
- Categorize your workflow by project, priority, or any system

### Calendar
- Interactive calendar view of all tasks
- Click dates to see tasks scheduled for that day
- Visual indicators for days with events
- Navigate between months
- View task details including priority and points

### Google Calendar Integration
- Sign in with your Google Account
- Select any of your Google calendars
- One-click sync to push tasks to Google Calendar
- Keep your TaskMaster in sync with your Google Calendar

## 🚀 Getting Started

### Option 1: Run Locally
1. Open `index.html` in any web browser
2. Start adding tasks and earning points!
3. All data is saved automatically to your browser's local storage

### Option 2: Use with GitHub Pages (Recommended)
See deployment instructions below.

## 💾 Data Storage
- All data is stored in browser local storage
- No server required
- Data persists between sessions
- Export/backup: Open browser DevTools → Application → Local Storage → taskMasterData

## 🔐 Setting Up Google Calendar Sync

To enable Google Calendar integration:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the **Google Calendar API**
4. Create **OAuth 2.0 credentials** (Web application type):
   - Authorized JavaScript origins: `http://localhost:8000` (for local) or your GitHub Pages URL
   - Authorized redirect URIs: same as above
5. Copy your **Client ID** and **API Key**
6. Edit `script.js` and replace:
   ```javascript
   const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID_HERE';
   ```
   and
   ```javascript
   apiKey: 'YOUR_GOOGLE_API_KEY_HERE',
   ```

## 📦 Deployment to GitHub Pages

1. **Create a GitHub Repository**:
   - Go to [GitHub.com](https://github.com/)
   - Click "New Repository"
   - Name it `task-master` (or any name)
   - Choose "Public"
   - Don't initialize with README (we have one)
   - Click "Create Repository"

2. **Push Code to GitHub**:
   ```bash
   cd "path/to/Test code"
   git add .
   git commit -m "Initial commit: TaskMaster app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/task-master.git
   git push -u origin main
   ```

3. **Enable GitHub Pages**:
   - Go to your repository on GitHub
   - Click "Settings" → "Pages"
   - Under "Source", select "main" branch
   - Click Save
   - Your app will be live at: `https://YOUR_USERNAME.github.io/task-master/`

4. **Update Google Calendar Credentials** (if using sync):
   - Add your GitHub Pages URL to the authorized origins in Google Cloud Console

## 🎮 How to Use

### Adding Tasks
1. Go to Dashboard tab
2. Enter task description
3. Select priority level
4. Click "Add Task"

### Organizing with Categories
1. Go to Tasks & Categories tab
2. Create categories with custom colors
3. Add tasks and assign to categories
4. Drag tasks between categories to organize

### Viewing Calendar
1. Go to Calendar tab
2. Click on any date to see tasks for that day
3. Navigate months with Previous/Next buttons
4. Sync with Google Calendar (requires authentication)

### Earning Points
1. Complete a task by checking the checkbox
2. Earn points based on priority
3. Build daily streaks
4. Unlock achievements as you progress

## 📝 Files Structure
```
task-master/
├── index.html      # Main HTML structure
├── style.css       # Styling and responsive design
├── script.js       # Application logic and functionality
└── README.md       # This file
```

## 🛠️ Technologies Used
- **HTML5**: Semantic structure
- **CSS3**: Modern styling with gradients and animations
- **JavaScript**: Vanilla JS (no frameworks)
- **Google APIs**: Calendar API for sync integration
- **Local Storage**: Browser-based data persistence

## 💡 Tips & Tricks
- Use the color picker to organize categories by theme
- Check your streak daily to maintain consistency
- Drag and drop is faster than delete + recreate
- Reset Daily button removes completed tasks for a fresh start
- All data is local - no account needed
- Export data: Copy from `localStorage.taskMasterData`

## 🐛 Troubleshooting

**Tasks not saving?**
- Check if local storage is enabled in your browser
- Try clearing browser cache and refreshing

**Google Calendar sync not working?**
- Ensure correct API keys are set in script.js
- Check Google Cloud Console has Calendar API enabled
- Verify OAuth credentials are correct

**Drag and drop not working?**
- Ensure you're using a modern browser (Chrome, Firefox, Safari, Edge)
- Try refreshing the page

## 📄 License
This project is free to use and modify.

## 🤝 Contributing
Feel free to fork this project and add your own features!

### Suggested Features
- Dark mode
- Task subtasks
- Due dates with notifications
- Task history/analytics
- Mobile app version
- Export to PDF

---

**Made with ❤️ for productivity lovers!**
